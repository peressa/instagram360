/* Optimistic, field-level updates with a durable offline outbox. */
function sharedDiff(before,after,path=[]) {
  if(JSON.stringify(before)===JSON.stringify(after))return [];
  const object=v=>v!==null&&typeof v==='object';
  if(object(before)&&object(after)&&Array.isArray(before)===Array.isArray(after)&&(!Array.isArray(before)||before.length===after.length)) {
    return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(key=>
      !(key in after)?[{path:[...path,key],remove:true}]:sharedDiff(before[key],after[key],[...path,key]));
  }
  return [{path,value:structuredClone(after)}];
}
function sharedApply(document,ops) {
  for(const op of ops){let target=document;for(const part of op.path.slice(0,-1)){if(!target[part]||typeof target[part]!=='object')target[part]={};target=target[part]}
    const key=op.path.at(-1);if(op.remove)delete target[key];else target[key]=structuredClone(op.value);}
  return document;
}
function createSharedPersistence({onStatus,onRemote}) {
  const endpoint='/api/shared/hilton-mendoza',client=crypto.randomUUID();
  let base={state:{},assets:{}},cache=structuredClone(base),revision=-1,queue=[],working=false,failed=false,lastSaved=null,db=null,socket=null,retryTimer=null;
  let view={key:'view',data:{device:matchMedia('(max-width:700px)').matches?'android':'desktop',theme:'light',audience:'visitor',width:'auto',mobileLayoutVersion:1}};
  const waiters=new Map(),uploaded=new Map();
  const status=()=>onStatus({pending:queue.length,failed,lastSaved});
  function disk(mode,fn){return new Promise(resolve=>{if(!db)return resolve(null);try{const tx=db.transaction('cache',mode),req=fn(tx.objectStore('cache'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>resolve(null)}catch{resolve(null)}})}
  const checkpoint=()=>disk('readwrite',store=>store.put({base,revision,queue},'project'));
  function rebuild(notify=false){cache=structuredClone(base);for(const item of queue)sharedApply(cache,item.ops);if(notify)onRemote(structuredClone(cache));status()}
  async function accept(snapshot,notify){if(snapshot.revision>=revision){base=snapshot.document;revision=snapshot.revision;rebuild(notify);await checkpoint()}}
  async function refresh(notify=true){const response=await fetch(endpoint+'/document',{cache:'no-store'});if(!response.ok)throw new Error('No se pudo conectar con la propuesta');await accept(await response.json(),notify)}
  async function normalize(value) {
    if(typeof value==='string'&&/^data:image\//.test(value)) {
      if(uploaded.has(value))return uploaded.get(value);
      const promise=(async()=>{const blob=await (await fetch(value)).blob();
        const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('');
        const response=await fetch(endpoint+'/media/'+hash,{method:'PUT',headers:{'Content-Type':blob.type},body:blob});
        if(!response.ok)throw new Error('No se pudo subir la imagen');return (await response.json()).url;})();
      uploaded.set(value,promise);try{return await promise}catch(error){uploaded.delete(value);throw error}
    }
    if(Array.isArray(value)){const result=[];for(const entry of value)result.push(await normalize(entry));return result}
    if(value&&typeof value==='object'){const result={};for(const [key,entry] of Object.entries(value))result[key]=await normalize(entry);return result}
    return value;
  }
  async function drain(){
    if(working||!queue.length)return;working=true;clearTimeout(retryTimer);
    try{
      while(queue.length){
        const item=queue[0],ops=await normalize(item.ops);
        const response=await fetch(endpoint+'/document',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({client,ops})});
        if(!response.ok)throw new Error('No se pudo guardar en la nube');
        const snapshot=await response.json();queue.shift();failed=false;lastSaved=new Date();
        await accept(snapshot,true);waiters.get(item.id)?.(true);waiters.delete(item.id);
      }
    }catch(error){failed=true;status();retryTimer=setTimeout(drain,4000)}
    finally{working=false;status()}
  }
  function connect(){
    socket=new WebSocket(location.origin.replace(/^http/,'ws')+endpoint+'/socket');
    socket.onopen=()=>{failed=false;status();drain()};
    socket.onmessage=event=>{if(event.data==='pong')return;let data;try{data=JSON.parse(event.data)}catch{return}
      if(data.revision>revision)refresh(data.client!==client).catch(()=>{failed=true;status()});};
    socket.onclose=()=>{failed=true;status();setTimeout(async()=>{try{await refresh();connect()}catch{connect()}},2500)};
    socket.onerror=()=>socket.close();
  }
  const ready=(async()=>{
    try{db=await new Promise(resolve=>{const req=indexedDB.open('ig360_shared_hilton',1);req.onupgradeneeded=()=>req.result.createObjectStore('cache');req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)});
      const stored=await disk('readonly',store=>store.get('project'));if(stored){base=stored.base;revision=stored.revision;queue=stored.queue||[];rebuild()}
      await refresh(false);connect();drain();
    }catch(error){failed=true;status();if(revision<0)throw error;setTimeout(()=>{refresh().then(connect).then(drain).catch(()=>{failed=true;status()})},2500)}
  })();
  window.addEventListener('online',()=>{refresh().then(drain).catch(()=>{failed=true;status()})});
  return {ready,
    all:async store=>{await ready;return store==='state'?[...Object.values(structuredClone(cache.state)),structuredClone(view)]:Object.values(structuredClone(cache.assets))},
    put(store,record){
      if(store==='state'&&record.key==='view'){view=structuredClone(record);return Promise.resolve(true)}
      const key=store==='state'?record.key:record.id;
      const ops=sharedDiff(cache[store][key],record,[store,key]);if(!ops.length)return Promise.resolve(true);
      const item={id:crypto.randomUUID(),ops};queue.push(item);rebuild();
      const result=new Promise(resolve=>waiters.set(item.id,resolve));checkpoint().then(drain);return result;
    },
    remove(store,key){const item={id:crypto.randomUUID(),ops:[{path:[store,key],remove:true}]};queue.push(item);rebuild();const result=new Promise(resolve=>waiters.set(item.id,resolve));checkpoint().then(drain);return result},
    drafts:()=>[],recover:async()=>0,markError(){failed=true;status()},resetError(){failed=false;status();drain()},
    async settled(){while(queue.length){drain();await new Promise(resolve=>setTimeout(resolve,100))}},
    get unsaved(){return queue.length>0||failed},retry:drain,
  };
}

async function sharedPortableBackup(data){
  const urls=new Map();
  async function visit(value){
    if(typeof value==='string'&&/^\/(?:p\/hilton-mendoza\/media|api\/shared\/hilton-mendoza\/media)\//.test(value)){
      if(!urls.has(value))urls.set(value,(async()=>{const response=await fetch(value);if(!response.ok)throw new Error('No se pudo descargar una foto');const blob=await response.blob();return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob)})})());return urls.get(value);
    }
    if(Array.isArray(value))return Promise.all(value.map(visit));
    if(value&&typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([key,item])=>[key,await visit(item)])));return value;
  }
  return visit(data);
}

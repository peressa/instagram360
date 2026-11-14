const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync('worker/shared-client.js','utf8');
const base=process.env.IG360_TEST_URL||'http://127.0.0.1:8767';
async function client(){
 const ctx={offline:false,crypto:crypto.webcrypto,structuredClone,console,setTimeout,clearTimeout,fetch:(url,init)=>ctx.offline?Promise.reject(new Error('Offline')):fetch(new URL(url,base),init),
  location:{origin:base},matchMedia:()=>({matches:false}),WebSocket,window:{addEventListener(){}},indexedDB:{open(){const request={};queueMicrotask(()=>request.onerror());return request}}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 ctx.status={};ctx.latest=null;
 const store=vm.runInContext('createSharedPersistence({onStatus(value){status=value},onRemote(value){latest=value}})',ctx);
 await store.ready;return {ctx,store};
}
const wait=async check=>{for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,50))}throw new Error('Timed out waiting for remote edit')};
(async()=>{
 const url=base+'/api/shared/hilton-mendoza/document';
 const original=(await (await fetch(url)).json()).document;
 assert.equal(Object.keys(original.assets).length,39);
 assert.equal(original.state.layout.tiles.filter(Boolean).length,18);
 assert.equal(original.state.profile.data.highlights.length,5);
 const a=await client(),b=await client();
 const profileA=(await a.store.all('state')).find(s=>s.key==='profile');
 const profileB=(await b.store.all('state')).find(s=>s.key==='profile');
 profileA.data.name='Hilton · prueba simultánea';profileB.data.followers='30001';
 await Promise.all([a.store.put('state',profileA),b.store.put('state',profileB)]);
 await wait(()=>a.ctx.latest?.state.profile.data.followers==='30001'&&b.ctx.latest?.state.profile.data.name==='Hilton · prueba simultánea');
 let current=(await (await fetch(url)).json()).document;
 assert.equal(current.state.profile.data.name,'Hilton · prueba simultánea');assert.equal(current.state.profile.data.followers,'30001');
 // A newly opened client needs no browser-local profile or previous import.
 const c=await client();assert.equal((await c.store.all('state')).find(s=>s.key==='profile').data.name,'Hilton · prueba simultánea');
 const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
 await a.store.put('assets',{id:'shared-upload-test',name:'test.png',src:pixel,w:1,h:1});
 await wait(()=>!!b.ctx.latest?.assets['shared-upload-test']);
 current=(await (await fetch(url)).json()).document;
 const asset=current.assets['shared-upload-test'];assert.match(asset.src,/^\/api\/shared\/hilton-mendoza\/media\/[a-f0-9]{64}$/);
 const image=await fetch(base+asset.src);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.equal((await image.arrayBuffer()).byteLength,68);
 // Keep the unsaved indicator and retry an edit after the connection returns.
 a.ctx.offline=true;
 const offlineProfile=(await a.store.all('state')).find(s=>s.key==='profile');offlineProfile.data.bio='Cambio pendiente de conexión';
 const pending=a.store.put('state',offlineProfile);await wait(()=>a.ctx.status.failed);assert.equal(a.store.unsaved,true);
 a.ctx.offline=false;a.store.retry();assert.equal(await pending,true);
 await wait(()=>b.ctx.latest?.state.profile.data.bio==='Cambio pendiente de conexión');
 const forbidden=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ops:[{path:['state','__proto__','polluted'],value:true}]})});assert.equal(forbidden.status,400);
 const crossOrigin=await fetch(url,{headers:{Origin:'https://example.invalid'}});assert.equal(crossOrigin.status,403);
 // Restore all editorial content after the integration checks.
 const restored=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:'test-cleanup',ops:[{path:['state','profile'],value:original.state.profile},{path:['assets','shared-upload-test'],remove:true}]})});assert.equal(restored.status,200);
 console.log('PASS: 3 independent clients, live edits, concurrent fields, cloud images, fresh load, offline retry, validation, cleanup.');
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});

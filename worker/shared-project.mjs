/* Shared project storage. The regular, browser-local studio remains unchanged. */
import { DurableObject } from 'cloudflare:workers';
const PROJECT = 'hilton-mendoza';
const PREFIX = '/api/shared/' + PROJECT;
function applyOps(document, operations) {
  if (!Array.isArray(operations) || operations.length > 2000) throw new Error('Invalid changes');
  for (const op of operations) {
    const path = op.path;
    if (!Array.isArray(path) || path.length < 2 || path.length > 30 ||
        !['state','assets'].includes(path[0]) ||
        path.some(p => !['string','number'].includes(typeof p) || ['__proto__','constructor','prototype'].includes(String(p)))) throw new Error('Invalid path');
    if (path[0] === 'state' && !['layout','profile'].includes(path[1])) throw new Error('Invalid state');
    let target = document;
    for (const key of path.slice(0,-1)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      target = target[key];
    }
    const key = path.at(-1);
    if (op.remove) delete target[key]; else target[key] = structuredClone(op.value);
  }
  return document;
}
const json = (value,status=200) => Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function validDocument(document) {
  const layout=document.state?.layout,profile=document.state?.profile?.data,assets=Object.values(document.assets||{});
  if(!layout||![3,6,9].includes(layout.rows)||!Array.isArray(layout.tiles)||layout.tiles.length!==layout.rows*3||
     ![[3,4],[4,5],[1,1]].some(([w,h])=>w===layout.RW&&h===layout.RH)||
     !profile||!['handle','name','bio','followers','following'].every(key=>typeof profile[key]==='string')||
     !Array.isArray(profile.highlights)||profile.highlights.length>50||assets.length>1000)return false;
  const image=src=>typeof src==='string'&&(/^\/p\/hilton-mendoza\/media\/[a-f0-9]{64}\.(jpg|png|webp)$/.test(src)||/^\/api\/shared\/hilton-mendoza\/media\/[a-f0-9]{64}$/.test(src));
  const validImages=value=>!value||typeof value!=='object'||Object.entries(value).every(([key,entry])=>key==='src'?image(entry):validImages(entry));
  return assets.every(a=>typeof a.id==='string'&&image(a.src)&&a.w>0&&a.h>0)&&validImages(profile);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIX)) return env.ASSETS.fetch(request);
    if (url.pathname !== PREFIX && !url.pathname.startsWith(PREFIX+'/')) return new Response('Not found',{status:404});
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return new Response('Forbidden',{status:403});
    const stub = env.SHARED_PROJECTS.get(env.SHARED_PROJECTS.idFromName(PROJECT));
    return stub.fetch(request);
  }
};

export class SharedProject extends DurableObject {
  constructor(ctx, env) {
    super(ctx,env);
    this.ctx=ctx;this.env=env;this.document=null;this.revision=0;
    this.ready=ctx.blockConcurrencyWhile(async()=>{
      const stored=await ctx.storage.get('document');
      if(stored){this.document=stored.document;this.revision=stored.revision;}
      else {
        const response=await env.ASSETS.fetch(new Request('https://ig360.peressa.dev/p/'+PROJECT+'/seed.json'));
        if(!response.ok)throw new Error('Project seed unavailable');
        const seed=await response.json();
        this.document={assets:Object.fromEntries(seed.assets.map(a=>[a.id,a])),state:{layout:{key:'layout',...seed.layout},profile:{key:'profile',data:seed.profile}}};
        await ctx.storage.put('document',{document:this.document,revision:0});
      }
    });
  }
  snapshot(){return {document:this.document,revision:this.revision};}
  broadcast(message) {
    const text=JSON.stringify(message);
    for(const socket of this.ctx.getWebSockets())try{socket.send(text)}catch{}
  }
  async fetch(request) {
    await this.ready;
    const url=new URL(request.url), suffix=url.pathname.slice(PREFIX.length);
    if(suffix==='/socket' && request.headers.get('Upgrade')?.toLowerCase()==='websocket') {
      const pair=new WebSocketPair();this.ctx.acceptWebSocket(pair[1]);
      pair[1].send(JSON.stringify({type:'hello',revision:this.revision}));
      return new Response(null,{status:101,webSocket:pair[0]});
    }
    if(suffix==='/document' && request.method==='GET')return json(this.snapshot());
    if(suffix==='/document' && request.method==='PATCH') {
      if(Number(request.headers.get('Content-Length'))>1500000)return json({error:'Change too large'},413);
      let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
      if(JSON.stringify(body).length>1500000)return json({error:'Change too large'},413);
      return this.ctx.blockConcurrencyWhile(async()=>{
        try {
          const next=applyOps(structuredClone(this.document),body.ops);
          if(!validDocument(next))return json({error:'Invalid project data'},400);
          if(JSON.stringify(next).length>1800000)return json({error:'Project metadata limit reached'},413);
          const revision=this.revision+1;
          await this.ctx.storage.put('document',{document:next,revision});
          this.document=next;this.revision=revision;
          this.broadcast({type:'changed',revision,client:body.client});
          return json(this.snapshot());
        } catch{return json({error:'Invalid changes'},400)}
      });
    }
    const media=suffix.match(/^\/media\/([a-f0-9]{64})$/);
    if(media) {
      const key='media:'+media[1];
      if(request.method==='PUT') {
        const type=request.headers.get('Content-Type')||'';
        if(!/^image\/(jpeg|png|webp|gif|avif|bmp)$/.test(type))return json({error:'Unsupported image'},415);
        if(Number(request.headers.get('Content-Length'))>20000000)return json({error:'Image too large'},413);
        const bytes=new Uint8Array(await request.arrayBuffer());
        if(bytes.length>20000000)return json({error:'Image too large'},413);
        const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
        if(hash!==media[1])return json({error:'Image checksum mismatch'},400);
        if(!(await this.ctx.storage.get(key))) {
          await this.ctx.storage.transaction(async tx=>{
            let chunks=0;
            for(let at=0;at<bytes.length;at+=100000)await tx.put(key+':'+chunks++,bytes.slice(at,at+100000));
            await tx.put(key,{type,chunks,length:bytes.length});
          });
        }
        return json({url:PREFIX+'/media/'+media[1]});
      }
      if(request.method==='GET'||request.method==='HEAD') {
        const meta=await this.ctx.storage.get(key);if(!meta)return new Response('Not found',{status:404});
        const keys=Array.from({length:meta.chunks},(_,i)=>key+':'+i),chunks=await this.ctx.storage.get(keys);
        return new Response(request.method==='HEAD'?null:new Blob(keys.map(k=>chunks.get(k)),{type:meta.type}),{headers:{'Content-Type':meta.type,'Content-Length':String(meta.length),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
      }
    }
    return json({error:'Not found'},404);
  }
  webSocketMessage(socket,message){if(message==='ping')socket.send('pong');}
  webSocketClose(socket,code){try{socket.close([1005,1006,1015].includes(code)?1000:code,'')}catch{}}
  webSocketError(socket){try{socket.close(1011,'Connection interrupted')}catch{}}
}

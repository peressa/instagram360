import Model from '../dist/shared-model.js';

const MAX_JSON=8*1024*1024,MAX_MEDIA=25*1024*1024,MAX_ROOM_MEDIA=200*1024*1024;
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
async function boundedBody(request,max){const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw Object.assign(Error('El archivo o proyecto supera el tamaño admitido.'),{status:413})}chunks.push(value)}const result=new Uint8Array(size);let at=0;for(const part of chunks){result.set(part,at);at+=part.length}return result}
const bodyJson=async request=>JSON.parse(new TextDecoder().decode(await boundedBody(request,MAX_JSON)));
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin}

export default {
 async fetch(request,env){
  const url=new URL(request.url),page=url.pathname.match(/^\/p\/([a-z0-9-]+)\/?$/);
  if(page){if(!Model.validSlug(page[1]))return json({error:'Dirección inválida.'},404);if(!url.pathname.endsWith('/'))return Response.redirect(url.origin+url.pathname+'/',308);const asset=await env.ASSETS.fetch(new Request(new URL('/',url),request));const response=new Response(asset.body,asset);response.headers.set('X-Robots-Tag','noindex, nofollow');response.headers.set('Referrer-Policy','same-origin');return response}
  const route=url.pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/);if(!route)return env.ASSETS.fetch(request);
  if(!Model.validSlug(route[1]))return json({error:'Dirección inválida.'},400);
  if(!sameOrigin(request))return json({error:'Origen no permitido.'},403);
  try{
   if(request.method==='POST'&&!route[2]){const key=await digest(new TextEncoder().encode(request.headers.get('CF-Connecting-IP')||'local'));const rate=await env.PROJECTS.getByName('__creation_limits').fetch('https://internal/rate?key='+key);if(!rate.ok)return rate}
   return env.PROJECTS.getByName(route[1]).fetch(request);
  }catch{return json({error:'No se pudo conectar con el proyecto. Reintentá en unos segundos.'},503)}
 }
};

export class ProjectRoom {
 constructor(ctx){
  this.ctx=ctx;this.sql=ctx.storage.sql;
  this.sql.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS fields (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS media (hash TEXT PRIMARY KEY, mime TEXT NOT NULL, size INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS chunks (hash TEXT, part INTEGER, bytes BLOB, PRIMARY KEY(hash,part))');
  this.sql.exec('CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, revision INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS rates (key TEXT PRIMARY KEY, n INTEGER NOT NULL, expires INTEGER NOT NULL)');
 }
 meta(key){return this.sql.exec('SELECT value FROM meta WHERE key=?',key).toArray()[0]?.value}
 setMeta(key,value){this.sql.exec('INSERT OR REPLACE INTO meta VALUES (?,?)',key,String(value))}
 values(){return Object.fromEntries(this.sql.exec('SELECT key,value FROM fields').toArray().map(r=>[r.key,JSON.parse(r.value)]))}
 snapshot(){return {version:1,revision:Number(this.meta('revision')||0),values:this.values(),media:this.sql.exec('SELECT hash FROM media').toArray().map(r=>r.hash)}}
 broadcast(data){const message=JSON.stringify(data);for(const ws of this.ctx.getWebSockets())try{ws.send(message)}catch{}}
 presence(){this.broadcast({type:'presence',online:this.ctx.getWebSockets().filter(ws=>ws.readyState===1).length})}
 validate(values){Model.validate(values);if(Object.values(values).some(v=>JSON.stringify(v).length>65536))throw Error('Un campo del proyecto es demasiado extenso.')}
 patch(message){
  if(!message||typeof message.id!=='string'||message.id.length>120||!Array.isArray(message.ops)||!message.ops.length||message.ops.length>30000||message.ops.some(op=>!op||typeof op.key!=='string'||!Model.validKey(op.key)||typeof op.remove!=='boolean'||typeof op.missing!=='boolean'))throw Error('Edición inválida.');
  const receipt=this.sql.exec('SELECT revision FROM receipts WHERE id=?',message.id).toArray()[0];if(receipt)return {type:'ack',id:message.id,revision:receipt.revision};
  const merged=Model.mergePatch(this.values(),message.ops);if(merged.conflicts.length)return {type:'conflict',id:message.id,conflicts:merged.conflicts,...this.snapshot()};
  this.validate(merged.values);const available=new Set(this.sql.exec('SELECT hash FROM media').toArray().map(r=>r.hash));if(Model.mediaRefs(merged.values).some(hash=>!available.has(hash)))throw Error('Falta cargar una imagen del proyecto.');
  const revision=Number(this.meta('revision'))+(merged.ops.length?1:0);
  this.ctx.storage.transactionSync(()=>{for(const op of merged.ops){if(op.remove)this.sql.exec('DELETE FROM fields WHERE key=?',op.key);else this.sql.exec('INSERT OR REPLACE INTO fields VALUES (?,?)',op.key,JSON.stringify(op.value))}this.setMeta('revision',revision);this.sql.exec('INSERT INTO receipts VALUES (?,?)',message.id,revision);this.sql.exec('DELETE FROM receipts WHERE rowid NOT IN (SELECT rowid FROM receipts ORDER BY rowid DESC LIMIT 1000)')});
  if(merged.ops.length)this.broadcast({type:'patch',id:message.id,revision,ops:merged.ops});return {type:'ack',id:message.id,revision};
 }
 async fetch(request){
  const url=new URL(request.url);
  try{
   if(url.pathname==='/rate'){const key=url.searchParams.get('key'),bucket=Math.floor(Date.now()/3600000),id=key+':'+bucket,row=this.sql.exec('SELECT n FROM rates WHERE key=?',id).toArray()[0];if((row?.n||0)>=([10,30,600].includes(Number(url.searchParams.get('limit')))?Number(url.searchParams.get('limit')):10))return json({error:'Se alcanzó el límite de creación de enlaces de esta hora. Reintentá más tarde.'},429);this.sql.exec('INSERT OR REPLACE INTO rates VALUES (?,?,?)',id,(row?.n||0)+1,(bucket+1)*3600000);this.sql.exec('DELETE FROM rates WHERE expires<?',Date.now());return json({ok:true})}
   const route=url.pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/);if(!route)return json({error:'Ruta inválida.'},404);const path=route[2]||'';
   if(!path&&request.method==='POST'){
    const key=request.headers.get('X-IG360-Create-Key');if(!key||key.length<32||key.length>200)return json({error:'Solicitud de creación inválida.'},400);const keyHash=await digest(new TextEncoder().encode(key));
    if(this.meta('revision'))return this.meta('creation')===keyHash?json(this.snapshot()):json({error:'Esta dirección ya está en uso. Elegí otra para tu proyecto.'},409);
    const data=await bodyJson(request);this.validate(data.values);
    this.ctx.storage.transactionSync(()=>{if(this.meta('revision'))throw Object.assign(Error('Esta dirección ya está en uso.'),{status:409});for(const [k,v] of Object.entries(data.values))this.sql.exec('INSERT INTO fields VALUES (?,?)',k,JSON.stringify(v));this.setMeta('revision',1);this.setMeta('creation',keyHash)});return json(this.snapshot(),201);
   }
   if(!this.meta('revision'))return json({error:'Este proyecto compartido no existe.'},404);
   if(!path&&request.method==='GET')return json(this.snapshot());
   if(path==='patch'&&request.method==='POST')return json(this.patch(await bodyJson(request)));
   const media=path.match(/^media\/([a-f0-9]{64})$/);
   if(media){
    const hash=media[1],stored=this.sql.exec('SELECT mime,size FROM media WHERE hash=?',hash).toArray()[0];
    if(request.method==='PUT'){
     if(stored)return json({ok:true});const mime=(request.headers.get('Content-Type')||'').split(';')[0];if(!/^image\/(png|jpeg|webp|gif|avif|bmp|svg\+xml)$/.test(mime))return json({error:'Formato de imagen no admitido.'},415);
     const bytes=await boundedBody(request,MAX_MEDIA);if(await digest(bytes)!==hash)return json({error:'La imagen no llegó completa. Reintentá.'},400);
     this.ctx.storage.transactionSync(()=>{if(this.sql.exec('SELECT hash FROM media WHERE hash=?',hash).toArray().length)return;const used=this.sql.exec('SELECT coalesce(sum(size),0) AS bytes,count(*) AS n FROM media').one();if(used.bytes+bytes.byteLength>MAX_ROOM_MEDIA||used.n>=500)throw Object.assign(Error('El proyecto alcanzó su capacidad de imágenes compartidas (200 MB).'),{status:413});for(let at=0,part=0;at<bytes.length;at+=256*1024,part++)this.sql.exec('INSERT INTO chunks VALUES (?,?,?)',hash,part,bytes.slice(at,at+256*1024).buffer);this.sql.exec('INSERT INTO media VALUES (?,?,?)',hash,mime,bytes.byteLength)});return json({ok:true});
    }
    if(!stored)return json({error:'La imagen no está disponible.'},404);
    if(request.method==='GET'||request.method==='HEAD'){
     const responseHeaders={'Content-Type':stored.mime,'Content-Length':String(stored.size),'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'"};
     if(request.method==='HEAD')return new Response(null,{headers:responseHeaders});const cursor=this.sql.exec('SELECT bytes FROM chunks WHERE hash=? ORDER BY part',hash)[Symbol.iterator]();const body=new ReadableStream({pull(controller){const next=cursor.next();if(next.done)controller.close();else controller.enqueue(new Uint8Array(next.value.bytes))}});return new Response(body,{headers:responseHeaders});
    }
   }
   if(path==='live'&&request.headers.get('Upgrade')?.toLowerCase()==='websocket'){
    if(this.ctx.getWebSockets().length>=50)return json({error:'Este proyecto tiene demasiadas conexiones abiertas.'},429);
    const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);server.serializeAttachment({bucket:Date.now(),messages:0});server.send(JSON.stringify({type:'snapshot',...this.snapshot()}));this.presence();return new Response(null,{status:101,webSocket:client});
   }
   return json({error:'Ruta o método no disponible.'},405);
  }catch(error){return json({error:error.message||'No se pudo guardar el proyecto.'},error.status||400)}
 }
 async webSocketMessage(ws,message){
  try{if(typeof message!=='string'||message.length>MAX_JSON)throw Error('Edición demasiado grande.');const rate=ws.deserializeAttachment()||{bucket:Date.now(),messages:0};if(Date.now()-rate.bucket>1000){rate.bucket=Date.now();rate.messages=0}if(++rate.messages>20)throw Error('Demasiadas ediciones. Reintentá en un momento.');ws.serializeAttachment(rate);const data=JSON.parse(message);if(data.type==='ping'){ws.send('{"type":"pong"}');return}if(data.type!=='patch')throw Error('Mensaje inválido.');ws.send(JSON.stringify(this.patch(data)))}catch(error){ws.send(JSON.stringify({type:'error',error:error.message}))}
 }
 webSocketClose(ws,code,reason){try{ws.close([1005,1006,1015].includes(code)?1000:code,reason)}catch{}this.presence()}
 webSocketError(ws){try{ws.close(1011,'Reconectando')}catch{}this.presence()}
}

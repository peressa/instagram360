import Model from '../dist/instagram-model.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function bounded(response,max){const reader=response.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks=[];for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw Error('La respuesta de Instagram supera el tamaño admitido.')}chunks.push(part.value)}const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}return bytes}
async function rate(request,env,scope,limit){const key=scope+':'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request.headers.get('CF-Connecting-IP')||'local'))),b=>b.toString(16).padStart(2,'0')).join('');return env.PROJECTS.getByName('__instagram_import_limits').fetch('https://internal/rate?limit='+limit+'&key='+encodeURIComponent(key))}
export async function page(url){
 const original=new URL(url),signal=AbortSignal.timeout(15000);for(let redirects=0;redirects<=2;redirects++){
  const response=await fetch(url,{redirect:'manual',headers:{Accept:'text/html','Accept-Language':'en-US,en;q=0.9','User-Agent':'Instagram360/0.2 (+https://ig360.peressa.dev)'},signal});
  if([301,302,303,307,308].includes(response.status)){await response.body?.cancel();const next=new URL(response.headers.get('Location')||'',url);if(next.protocol!=='https:'||!['www.instagram.com','instagram.com'].includes(next.hostname)||next.port||next.username||next.password||next.pathname.replace(/\/$/,'')!==original.pathname.replace(/\/$/,''))throw Error('Instagram solicita acceso fuera del perfil público.');url=next.href;continue}
  if(!response.ok)throw Error('Instagram no permite leer este perfil ahora. Probá más tarde o revisá que sea público.');return new TextDecoder().decode(await bounded(response,4*1024*1024));
 }throw Error('Instagram redirigió demasiadas veces el perfil público.');
}
export async function instagramImport(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Origen no permitido.'},403);
 try{
  if(url.pathname==='/api/instagram/preview'&&request.method==='POST'){
   const body=JSON.parse(new TextDecoder().decode(await bounded(request,4096))),handle=Model.username(body.profileURL),allowed=await rate(request,env,'preview',30);if(!allowed.ok)return json({error:'Se alcanzó el límite de consultas de esta hora. Reintentá más tarde.'},429);
   const cacheKey=new Request(url.origin+'/api/instagram/cache/v4/'+handle);let cache=null;try{cache=caches.default;const hit=await cache.match(cacheKey);if(hit)return hit}catch{}
   const results=await Promise.allSettled([page('https://www.instagram.com/'+handle+'/'),page('https://www.instagram.com/'+handle+'/embed/')]);
   if(results.every(r=>r.status==='rejected'))return json({error:'Instagram bloqueó la lectura o el perfil no está disponible. No se importó ningún dato. Reintentá más tarde.'},502);
   const data=Model.parse(handle,results[0].status==='fulfilled'?results[0].value:'',results[1].status==='fulfilled'?results[1].value:'');
   const response=json(data);if(cache)try{const cached=new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':'public,max-age=300'}});await cache.put(cacheKey,cached)}catch{}return response;
  }
  if(url.pathname==='/api/instagram/media'&&request.method==='GET'){
   const image=Model.imageURL(url.searchParams.get('url'));if(!image)return json({error:'Dirección de imagen no permitida.'},400);const allowed=await rate(request,env,'media',600);if(!allowed.ok)return json({error:'Se alcanzó el límite de imágenes de esta hora.'},429);
   const response=await fetch(image,{redirect:'manual',signal:AbortSignal.timeout(20000)});if(!response.ok)return json({error:'Instagram no entregó esta imagen. Volvé a buscar el perfil para renovar sus enlaces.'},502);
   const mime=(response.headers.get('Content-Type')||'').split(';')[0];if(!/^image\/(jpeg|png|webp|avif|gif|bmp)$/.test(mime))return json({error:'El enlace no devolvió una imagen admitida.'},415);
   return new Response(await bounded(response,12*1024*1024),{headers:{'Content-Type':mime,'Cache-Control':'private,max-age=600','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
  }
  return json({error:'Ruta o método no disponible.'},405);
 }catch(error){return json({error:error.message||'No se pudo leer el perfil de Instagram.'},400)}
}

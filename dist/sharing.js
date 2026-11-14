/* Public editable project links. Local drafts and preview preferences never leave this browser. */
const sharedRoute=location.pathname.match(/^\/p\/([a-z0-9-]+)\/?$/)?.[1]||null;
let liveProject=null,sharingReady=false;
function identifySharedPosts(){const seen=new Set();for(const t of tiles){if(!t)continue;if(!t._sharedId||seen.has(t._sharedId))t._sharedId=crypto.randomUUID();seen.add(t._sharedId)}for(const h of profile.highlights)for(const s of h.stories||[])if(!s.id)s.id=crypto.randomUUID()}
function sharedLocalChanged(store,record){if(liveProject&&sharingReady&&activeProfile==='shared:'+sharedRoute&&(store==='assets'||store==='state'&&['layout','profile'].includes(record?.key)))liveProject.note()}
function sharedDestination(id){const entry=profileCatalog.find(p=>p.id===id);return entry?.sharedSlug?'/p/'+entry.sharedSlug+'/':'/'}
function initializeSharedCatalog(){
 if(sharedRoute){activeProfile='shared:'+sharedRoute;if(!profileCatalog.some(p=>p.id===activeProfile))profileCatalog.push({id:activeProfile,name:sharedRoute,sharedSlug:sharedRoute})}
 else if(profileCatalog.find(p=>p.id===activeProfile)?.sharedSlug){activeProfile=profileCatalog.find(p=>!p.sharedSlug)?.id||'default';if(!profileCatalog.some(p=>p.id===activeProfile))profileCatalog.push({id:activeProfile,name:'Mi perfil'})}
}
const sharedImages=new Map(),sharedSources=new Map();
const imageData=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('No se pudo leer una imagen.'));r.readAsDataURL(blob)});
async function rememberSharedImage(src){
 if(!src)return src;if(sharedSources.has(src))return sharedSources.get(src);
 if(!/^data:image\//.test(src))throw Error('Esta imagen no puede compartirse. Volvé a cargarla desde un archivo.');
 const blob=await (await fetch(src)).blob();if(blob.size>25*1024*1024)throw Error('Una imagen supera los 25 MB admitidos por el enlace compartido.');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join(''),ref='ig360-media:'+hash;
 sharedSources.set(src,ref);sharedImages.set(hash,{src,blob});return ref;
}
async function sharedValues(data){
 const sources=new Set(data.assets.map(a=>a.src));if(data.profile.avatar)sources.add(normAvatar(data.profile.avatar).src);for(const h of data.profile.highlights){if(h.cover)sources.add(normCover(h.cover).src);for(const s of h.stories||[])sources.add(s.src)}
 // Serial hashing bounds peak memory for large libraries.
 for(const src of sources)await rememberSharedImage(src);
 const values=SharedProjectModel.flatten(data,src=>src?sharedSources.get(src):src);SharedProjectModel.validate(values);return values;
}
async function sharedRequest(url,options){const response=await fetch(url,options);if(!response.headers.get('Content-Type')?.includes('application/json'))throw Object.assign(Error('Este servidor no admite enlaces compartidos.'),{status:405});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'No se pudo conectar.'),{status:response.status});return data}
async function hydrateShared(values,slug){
 SharedProjectModel.validate(values);
 for(const hash of SharedProjectModel.mediaRefs(values)){
  if(sharedImages.has(hash))continue;
  const url='/api/projects/'+slug+'/media/'+hash;let cache=null,response=null;
  try{cache=await caches.open('ig360-shared-media-v1');response=await cache.match(url)}catch{}
  if(!response){response=await fetch(url);if(!response.ok)throw Error('No se pudo cargar una imagen compartida.');if(cache)try{await cache.put(url,response.clone())}catch{}}
  const blob=await response.blob(),actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');if(actual!==hash)throw Error('Una imagen compartida no llegó completa.');
  const src=await imageData(blob);sharedImages.set(hash,{src,blob});sharedSources.set(src,'ig360-media:'+hash);
 }
 const drafts=new Map(tiles.filter(Boolean).map(t=>[t._sharedId,t.commentDraft]));return SharedProjectModel.expand(values,ref=>sharedImages.get(ref.slice(12))?.src||ref,drafts);
}
async function uploadSharedImages(slug,values,known=new Set()){
 for(const hash of SharedProjectModel.mediaRefs(values)){if(known.has(hash))continue;const image=sharedImages.get(hash);if(!image)throw Error('No se encontró una imagen pendiente. Guardá una copia del proyecto antes de continuar.');await sharedRequest('/api/projects/'+slug+'/media/'+hash,{method:'PUT',headers:{'Content-Type':image.blob.type},body:image.blob});known.add(hash)}
}
function sharedDialog(title){const d=dom('dialog','sharing-dialog'),heading=dom('h2','',title),close=action('×',()=>d.close());close.className='sharing-close';close.setAttribute('aria-label','Cerrar');d.append(close,heading);document.body.append(d);d.addEventListener('close',()=>d.remove(),{once:true});return d}
function sharedMessage(d,text){let el=d.querySelector('.sharing-message');if(!el){el=dom('p','sharing-message');el.setAttribute('role','status');d.append(el)}el.textContent=text}
async function openShareDialog(){
 const d=sharedDialog(sharedRoute?'Enlace del proyecto':'Compartir proyecto');
 d.append(dom('p','','Cualquier persona con el enlace puede ver y editar este proyecto. Los cambios se sincronizan en vivo. No requiere una cuenta.'));
 if(sharedRoute){const link=dom('input');link.readOnly=true;link.value=location.origin+'/p/'+sharedRoute+'/';link.setAttribute('aria-label','Enlace compartido');const copy=action('Copiar enlace',async()=>{try{await navigator.clipboard.writeText(link.value);sharedMessage(d,'Enlace copiado.')}catch{link.select();sharedMessage(d,'Seleccioná y copiá el enlace.')}});d.append(link,copy);d.showModal();return}
 const label=dom('label','','Dirección del proyecto'),slug=dom('input');slug.value=SharedProjectModel.slugify(profileCatalog.find(p=>p.id===activeProfile)?.name||profile.handle);slug.maxLength=80;slug.autocomplete='off';slug.setAttribute('aria-label','Dirección del proyecto');label.append(slug);const example=dom('small','sharing-url');const preview=()=>example.textContent=location.origin+'/p/'+slug.value+'/';slug.addEventListener('input',preview);preview();
 d.append(label,example,dom('p','sharing-note','Se compartirá el perfil, las fotos, las publicaciones y los destacados. Los borradores de comentarios y los mensajes simulados quedan en este navegador. Tu proyecto local se conserva como copia privada.'));
 const create=action('Crear enlace',async()=>{
  if(!SharedProjectModel.validSlug(slug.value)){sharedMessage(d,'Usá letras minúsculas, números y guiones, sin espacios.');return}
  create.disabled=true;slug.disabled=true;d.dataset.busy='true';d.querySelector('.sharing-close').disabled=true;d.addEventListener('cancel',blockWhileSharing);sharedMessage(d,'Preparando y subiendo el proyecto…');
  try{
   identifySharedPosts();await flushProfile();const values=await sharedValues(backupData());const tokenKey='ig360_create_'+activeProfile+'_'+slug.value;let token=localStorage.getItem(tokenKey);if(!token){token=crypto.randomUUID();localStorage.setItem(tokenKey,token)}
   const snapshot=await sharedRequest('/api/projects/'+slug.value,{method:'POST',headers:{'Content-Type':'application/json','X-IG360-Create-Key':token},body:JSON.stringify({values})});
   await uploadSharedImages(slug.value,values,new Set(snapshot.media));
   const changes=SharedProjectModel.diff(snapshot.values,values);if(changes.length){const result=await sharedRequest('/api/projects/'+slug.value+'/patch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),ops:changes})});if(result.type!=='ack')throw Error('El proyecto cambió durante la carga. Elegí otra dirección para conservar esta copia.')}
   const id='shared:'+slug.value;if(!profileCatalog.some(p=>p.id===id))profileCatalog.push({id,name:values.name,sharedSlug:slug.value});storeCatalog();sessionStorage.setItem('ig360_new_share',slug.value);location.assign('/p/'+slug.value+'/');
  }catch(error){sharedMessage(d,error.status===404||error.status===405?'Este alojamiento solo admite proyectos locales. Para crear enlaces usá ig360.peressa.dev o desplegá el servidor de Cloudflare.':error.message);create.disabled=false;slug.disabled=false;d.dataset.busy='false';d.querySelector('.sharing-close').disabled=false}
 });d.append(create);d.showModal();
}
function blockWhileSharing(e){if(e.currentTarget.dataset.busy==='true')e.preventDefault()}
function initSharingUI(){
 const button=action('Compartir',()=>openShareDialog());button.id='shareProject';document.querySelector('.canvas-tools').prepend(button);
 if(liveProject){const status=action('Conectando…',()=>liveProject.openStatus());status.id='liveStatus';status.className='live-status';status.setAttribute('aria-live','polite');document.querySelector('.canvas-toolbar').append(status);liveProject.status();sharingReady=true;liveProject.start();if(sessionStorage.getItem('ig360_new_share')===sharedRoute){sessionStorage.removeItem('ig360_new_share');openShareDialog()}}
}
class SharedProjectClient {
 constructor(slug,state){
  this.assetRecords=new Map(lib.map(a=>[a.id,{...a}]));this.slug=slug;this.known=new Set();this.generation=0;this.applying=false;this.queued=false;this.working=Promise.resolve();this.online=1;this.ready=false;this.error='';this.retry=1000;
  this.sync=new LiveProjectSync({state,clientId:crypto.randomUUID(),persist:state=>persistence.put('state',{key:'share',data:state}),onChange:()=>this.schedule(),onState:()=>{this.status();if(sharingReady)updateHistUI()},send:message=>this.send(message)});
 }
 async capture(){identifySharedPosts();let generation=this.generation;const values=await sharedValues(backupData());if(generation!==this.generation)return this.capture();this.sync.capture(values);return generation}
 note(){if(this.applying)return;this.generation++;this.schedule()}
 schedule(){if(!this.ready||this.queued)return;this.queued=true;setTimeout(()=>{this.queued=false;this.working=this.working.then(()=>this.reconcile()).catch(error=>{this.error=error.message;this.status()})},80)}
 blocked(){const active=document.activeElement;return this.gesture||this.composing||!!document.querySelector('dialog[open]')||active?.matches('input,textarea,[contenteditable]:not([data-f])')}
 async reconcile(){
  const generation=await this.capture();if(this.blocked())return;
  const values=this.sync.effective();if(!SharedProjectModel.diff(this.sync.baseline,values).length)return;
  const data=await hydrateShared(values,this.slug);if(generation!==this.generation||this.blocked()){this.schedule();return}
  this.apply(data,true);this.sync.setBaseline(values);await this.persistModel();
 }
 apply(data,renderUI){
  this.applying=true;try{const previousSources=new Map(lib.map(a=>[a.id,a.src]));const editing=document.activeElement?.matches('[data-f]')?document.activeElement:null,selection=window.getSelection();let caret=null;if(editing&&selection?.rangeCount&&editing.contains(selection.anchorNode)){const range=selection.getRangeAt(0).cloneRange();range.selectNodeContents(editing);range.setEnd(selection.anchorNode,selection.anchorOffset);caret=range.toString().length}const oldText=editing?.textContent;const messages=profile.simMessages,previousPost=simCurrentPost!==null?tiles[simCurrentPost]?._sharedId:null,slide=simCurrentSlide,previousStory=simStory?{id:simStory.id,position:simStory.position,story:storyItems(profile.highlights.find(h=>h.id===simStory.id))[simStory.position]?.id,paused:simStory.paused,elapsed:Number(simStory.animation?.currentTime)||0}:null;
  const priorPost=previousPost?tiles.find(t=>t?._sharedId===previousPost):null,oldStory=previousStory?JSON.stringify(profile.highlights.find(h=>h.id===previousStory.id)):null;
  profile=data.profile;profile.simMessages=messages||[];tiles=data.layout.tiles;rows=data.layout.rows;total=rows*3;RW=data.layout.RW;RH=data.layout.RH;lib=data.assets;const keep=new Set(lib.map(a=>a.id));for(const id of previousSources.keys())if(!keep.has(id))revokeBlobURL(id);lib.forEach(a=>{if(previousSources.get(a.id)!==a.src||!blobCache[a.id])cacheDisplayBlob(a.id,a.src)});
  const entry=profileCatalog.find(p=>p.id===activeProfile);entry.name=data.name;storeCatalog();
  if(renderUI){restore(data.layout);renderTray();applyProfile();if(editing?.isConnected){const f=editing.dataset.f,text=PROFILE_COUNT_FIELDS.has(f)?profileFieldForEditing(f,f==='posts'&&profile.autoPosts?filled().length:profile[f]):profile[f];if(text!==oldText){editing.textContent=text;if(caret!==null){let prefix=0;while(prefix<oldText.length&&prefix<text.length&&oldText[prefix]===text[prefix])prefix++;const offset=Math.min(text.length,Math.max(0,caret>prefix?caret+text.length-oldText.length:caret));const range=document.createRange();if(editing.firstChild){range.setStart(editing.firstChild,offset);range.collapse(true);selection.removeAllRanges();selection.addRange(range)}}}}syncEditor();renderProfiles();updateHistUI();
   if(previousPost){const index=tiles.findIndex(t=>t?._sharedId===previousPost);if(index<0)closeSimScreen(false);else if(index!==simCurrentPost||!SharedProjectModel.equal(priorPost,tiles[index]))showSimPost(index,false,slide)}
   else if(previousStory){const h=profile.highlights.find(h=>h.id===previousStory.id);if(!h)closeSimScreen(false);else if(oldStory!==JSON.stringify(h)){const position=previousStory.story?h.stories.findIndex(s=>s.id===previousStory.story):previousStory.position;showSimStory(h.id,Math.max(0,position),previousStory.paused,previousStory.elapsed)}}
  }}finally{this.applying=false}
 }
 async persistModel(){for(const a of lib){const old=this.assetRecords.get(a.id);if(!old||['src','name','w','h'].some(k=>old[k]!==a[k])){if(await persistence.put('assets',a))this.assetRecords.set(a.id,{...a})}}const current=new Set(lib.map(a=>a.id));for(const id of this.assetRecords.keys())if(!current.has(id)){await del('assets',id);this.assetRecords.delete(id)}await persistence.put('state',{key:'profile',data:profile});await persistence.put('state',{key:'layout',...snap()})}
 async load(){
  const cached=!!Object.keys(this.sync.remote).length;
  if(cached)await this.capture();
  try{const snapshot=await sharedRequest('/api/projects/'+this.slug);this.known=new Set(snapshot.media);this.sync.snapshot(snapshot);const values=this.sync.effective(),data=await hydrateShared(values,this.slug);this.apply(data,false);this.sync.setBaseline(values);await this.persistModel()}
  catch(error){if(!cached)throw error;this.error='Sin conexión. Mostrando la copia de este navegador.'}
  this.ready=true;
 }
 start(){
  const release=()=>{this.gesture=false;this.schedule()};document.addEventListener('pointerdown',e=>{if(e.target.closest('.cell,[data-circle-crop],.sim-inline-photo,.hl'))this.gesture=true},true);document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);document.addEventListener('dragend',release);document.addEventListener('drop',release);document.addEventListener('compositionstart',()=>this.composing=true);document.addEventListener('compositionend',()=>{this.composing=false;this.note()});document.addEventListener('focusout',()=>this.schedule());document.addEventListener('close',()=>this.schedule(),true);window.addEventListener('online',()=>{this.retry=1000;this.connect()});window.addEventListener('offline',()=>{this.ws?.close();this.sync.close()});
  this.connect();this.schedule();
 }
 connect(){
  clearTimeout(this.reconnect);if(this.ws&&this.ws.readyState<2)return;const ws=this.ws=new WebSocket(location.origin.replace(/^http/,'ws')+'/api/projects/'+this.slug+'/live');
  ws.onmessage=e=>{if(ws!==this.ws)return;try{const message=JSON.parse(e.data);if(message.type==='presence'){this.online=message.online;this.status();return}if(message.media)this.known=new Set(message.media);if(message.type==='patch')for(const op of message.ops||[])if(!op.remove&&op.key.endsWith('/src')&&SharedProjectModel.mediaPattern.test(op.value))this.known.add(op.value.slice(12));if(message.type==='error'){this.error=message.error;this.sync.close();this.status();return}this.retry=1000;this.error='';const action=this.sync.receive(message);if(action==='resync')ws.close()}catch(error){this.error=error.message;this.status()}};
  ws.onclose=()=>{if(ws!==this.ws)return;this.sync.close();this.reconnect=setTimeout(()=>this.connect(),this.retry);this.retry=Math.min(this.retry*2,15000)};ws.onerror=()=>ws.close();
 }
 send(message){const ws=this.ws;if(!ws||ws.readyState!==1)return false;const task=async()=>{try{await uploadSharedImages(this.slug,SharedProjectModel.apply(this.sync.remote,message.ops),this.known);if(ws===this.ws&&ws.readyState===1&&this.sync.flight?.id===message.id)ws.send(JSON.stringify(message))}catch(error){this.error=error.message;this.status();ws.close()}};task();return true}
 status(){const el=$('liveStatus');if(!el)return;let text=this.error?'Revisar sincronización':this.sync.conflicts.length?'Hay ediciones en conflicto':!this.sync.connected?'Sin conexión · cambios locales':this.sync.pending.size?'Sincronizando…':'En vivo · '+this.online+(this.online===1?' persona':' personas');el.textContent=text;el.dataset.state=this.error||this.sync.conflicts.length?'warning':!this.sync.connected?'offline':'live'}
 openStatus(){
  const d=sharedDialog('Edición compartida');d.append(dom('p','',this.error||'Quien tenga el enlace puede editar. Los cambios en campos diferentes se combinan automáticamente.'));
  if(this.sync.pending.size)d.append(dom('p','',this.sync.pending.size+(this.sync.pending.size===1?' campo pendiente.':' campos pendientes.')+' La edición local se conserva en este navegador.'));
  if(this.sync.conflicts.length||this.error){d.append(dom('p','','Si dos personas cambian el mismo campo, elegí qué edición conservar. Podés descargar una copia antes de resolver.'));d.append(action('Guardar copia',()=>$('backupProfile').click()),action('Aplicar mis cambios',()=>{try{SharedProjectModel.validate(this.sync.effective());this.error='';this.sync.connected=this.ws?.readyState===1;this.sync.retryMine();d.close()}catch(error){sharedMessage(d,error.message+' Guardá una copia o usá la versión compartida.')}}),action('Usar versión compartida',()=>{this.error='';this.sync.acceptRemote();this.sync.connected=this.ws?.readyState===1;this.schedule();d.close()}))}
  else d.append(dom('p','',this.sync.connected?'Los cambios están sincronizados por WebSocket.':'Se intentará reconectar automáticamente. No borres los datos del navegador mientras haya cambios pendientes.'));
  d.showModal();
 }
 async flush(){await this.capture();await persistence.settled()}
}
async function prepareSharedProject(){
 if(!sharedRoute)return true;const loading=dom('div','sharing-loading','Cargando proyecto compartido…');document.body.append(loading);
 try{const state=(await all('state')).find(s=>s.key==='share')?.data;liveProject=new SharedProjectClient(sharedRoute,state);await liveProject.load();loading.remove();return true}
 catch(error){loading.replaceChildren(dom('strong','',error.message),action('Reintentar',()=>location.reload()),action('Ir a mis proyectos locales',()=>location.assign('/')));return false}
}

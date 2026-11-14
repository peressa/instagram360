const DEFAULT_AVATAR='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#dbdbdb"/><circle cx="50" cy="35" r="18" fill="#fff"/><path d="M16 92v-8a34 27 0 0 1 68 0v8" fill="#fff"/></svg>');
/* Instagram 360 profile editor. Account data stays in this browser. */
let currentProfileTab='posts',highlightDragId=null,storyPosition=0,storyHighlightId=null,editingPostIndex=null;
const svgLine=paths=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="24" height="24">'+paths+'</svg>';
function igIcon(name){
 const fallback={back:svgLine('<path d="m15 3-9 9 9 9"/>'),lock:svgLine('<rect x="5" y="10" width="14" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>'),pin:svgLine('<path d="m16 3 5 5-5 1-3 7-3-3-7 8 6-9-3-3 7-3z"/>'),carousel:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h12a3 3 0 0 1 3 3v12h-2V5a1 1 0 0 0-1-1H7z"/><rect x="2" y="6" width="16" height="16" rx="3"/></svg>',Reposts:svgLine('<path d="M4 12V7h15m-4-4 4 4-4 4M20 12v5H5m4 4-4-4 4-4"/>'),menu:svgLine('<path d="M3 5h18M3 12h18M3 19h18"/>'),plus:svgLine('<path d="M12 3v18M3 12h18"/>'),wifi:'<svg viewBox="0 0 16 12" fill="currentColor"><path d="M0 3a12 12 0 0 1 16 0l-2 2A9 9 0 0 0 2 5zm3 3a7.5 7.5 0 0 1 10 0l-2 2a4.5 4.5 0 0 0-6 0zm3 3a3 3 0 0 1 4 0l-2 3z"/></svg>',signal:'<svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".7"/><rect x="5" y="5" width="3" height="7" rx=".7"/><rect x="10" y="2" width="3" height="10" rx=".7"/><rect x="15" y="0" width="3" height="12" rx=".7"/></svg>',battery:'<svg viewBox="0 0 26 12" fill="none" stroke="currentColor"><rect x=".5" y=".5" width="22" height="11" rx="2.5" opacity=".4"/><rect x="2.5" y="2.5" width="18" height="7" rx="1" fill="currentColor" stroke="none"/><path d="M24 4v4" stroke-width="2"/></svg>'};
 return IG_ICONS[name]||fallback[name]||IG_ICONS.Instagram;
}
function dom(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
function action(label,fn){const b=dom('button','btn',label);b.type='button';b.addEventListener('click',fn);return b;}
function avatarSource(){return normAvatar(profile.avatar)?.src||'';}
function setSafeAvatar(img){img.src=avatarSource()||DEFAULT_AVATAR;img.hidden=false}
function renderProfileExtras(){
 syncProfileCountLabels();
 const phone=document.querySelector('.phone');phone.dataset.ring=profile.storyRing||'none';phone.dataset.private=String(!!profile.private);
 phone.querySelectorAll('[data-handle]').forEach(e=>e.textContent=profile.handle);
 phone.querySelectorAll('.verified-badge').forEach(e=>{e.innerHTML=profile.verified?igIcon('Verificado'):'';e.hidden=!profile.verified});
 const fill=(selector,value)=>{const e=phone.querySelector(selector);if(e)e.textContent=value||''};
 fill('.prof-pronouns',profile.pronouns);fill('.prof-category',profile.category);fill('.prof-address',profile.address);fill('.prof-mutual',profile.mutual);
 fill('.link-more',profile.extraLinks?.length?' y '+profile.extraLinks.length+' más':'');
 fill('.ig-follow',profile.simFollowing?'Siguiendo':profile.followLabel||'Seguir');fill('.ig-message',profile.messageLabel||'Mensaje');fill('.owner-edit',profile.ownerEditLabel||'Editar perfil');fill('.owner-share',phone.classList.contains('web-layout')?(profile.ownerWebSecondaryLabel||'Ver archivo'):(profile.ownerShareLabel||'Compartir perfil'));
 phone.querySelector('.ig-follow').classList.toggle('following',!!profile.simFollowing);
 phone.querySelector('.ig-similar').innerHTML=igIcon('Cuentas similares');phone.querySelector('.ig-back').innerHTML=igIcon('back');phone.querySelector('.link-icon').innerHTML=igIcon('Ícono de enlace');
 const own=phone.dataset.audience==='owner';phone.querySelector('.profile-options').innerHTML=own&&['ios','android'].includes(phone.dataset.device)?igIcon('plus')+igIcon('menu'):own?igIcon('OwnerOptions'):igIcon('Opciones');
 const contact=phone.querySelector('.ig-contact-actions');contact.replaceChildren();(profile.contacts||[]).filter(Boolean).forEach(t=>contact.append(dom('span','',t)));
 const tabs=[['posts','Publicaciones',true],['reels','Reels',true],['video','Video largo',profile.showVideo!==false],['reposts','Reposts',profile.showReposts!==false],['tagged','Etiquetas',profile.showTagged!==false]];
 if(!tabs.some(([id,,yes])=>id===currentProfileTab&&yes))currentProfileTab='posts';
 const bar=phone.querySelector('.tabbar');bar.replaceChildren();tabs.filter(t=>t[2]).forEach(([id,label])=>{const b=dom('button','tab'+(id===currentProfileTab?' active':''));b.type='button';b.title=label;b.setAttribute('aria-label',label);b.setAttribute('role','tab');b.setAttribute('aria-selected',String(id===currentProfileTab));b.innerHTML=igIcon(label);b.addEventListener('click',()=>{currentProfileTab=id;renderProfileExtras();render()});bar.append(b)});
 phone.querySelectorAll('.nav-avatar').forEach(setSafeAvatar);filterProfileGrid();
}
function buildNavigation(){
 const phone=document.querySelector('.phone'),nav=phone.querySelector('.ig-desktop-nav');nav.replaceChildren();
 const item=(name,cls='')=>{const span=dom('button','sim-nav '+cls);span.type='button';span.title=name;span.setAttribute('aria-label',name);span.innerHTML=igIcon(name);span.addEventListener('click',()=>simNavigate(name));return span};
 nav.append(item('Instagram','nav-logo'));
 ['Inicio','Reels','Mensajes','Buscar','Notificaciones','Nueva publicación'].forEach(name=>nav.append(item(name)));
 const avatar=dom('img','nav-avatar');avatar.alt='Perfil';const profileNav=item('Perfil');profileNav.replaceChildren(avatar);nav.append(profileNav);
 const secondary=dom('div','nav-secondary');secondary.append(item('Configuración'),item('También de Meta'));nav.append(secondary);
 const bottom=phone.querySelector('.ig-bottom');bottom.replaceChildren();
 const order=phone.dataset.webMobile==='true'?['Inicio','Buscar','Reels','Nueva publicación','Mensajes']:['Inicio','Reels','Mensajes','Buscar','Nueva publicación'];
 order.forEach(name=>bottom.append(item(name)));const wrap=item('Perfil');wrap.replaceChildren();const av=dom('img','nav-avatar');av.alt='Perfil';wrap.append(av);bottom.append(wrap);
 phone.querySelector('.status-icons').innerHTML=igIcon('signal')+igIcon('wifi')+igIcon('battery');
}
function filterProfileGrid(){
 const phone=document.querySelector('.phone'),previewing=isBrowsing();
 const locked=previewing&&profile.private&&phone.dataset.audience==='visitor';
 phone.querySelector('.grid-wrap').hidden=!!locked;const privateEl=phone.querySelector('.private-state');privateEl.hidden=!locked;
 if(locked){privateEl.innerHTML=igIcon('lock');privateEl.append(dom('strong','','Esta cuenta es privada'),dom('p','','Sigue a esta cuenta para ver sus fotos y videos.'))}
 let visible=0;[...grid.children].forEach((cell,i)=>{const t=tiles[i];let yes=currentProfileTab==='posts'||currentProfileTab==='reels'&&t?.kind==='reel'||currentProfileTab==='video'&&t?.kind==='video'||currentProfileTab==='reposts'&&t?.kind==='repost'||currentProfileTab==='tagged'&&t?.kind==='tagged';cell.hidden=!yes;if(t&&yes)visible++});
 const empty=phone.querySelector('.empty-state');empty.hidden=locked||!previewing||visible>0;
 if(!empty.hidden){empty.innerHTML=igIcon(currentProfileTab==='posts'?'Instagram':'Reels');empty.append(dom('strong','',currentProfileTab==='posts'?'Aún no hay publicaciones':'Aún no hay contenido'),dom('p','','El contenido de este perfil aparecerá aquí.'))}
}
function decorateGrid(){
 [...grid.children].forEach((cell,i)=>{const t=tiles[i];if(!t)return;let badge=t.pinned?'pin':postMediaIds(t).length>1||t.kind==='carousel'?'carousel':t.kind==='reel'?'Reels':t.kind==='video'?'Video largo':null;
  if(badge){const el=dom('span','ig-media-badge');el.innerHTML=igIcon(badge);cell.append(el)}
  if(currentProfileTab==='reels'){const views=dom('span','reel-views');views.innerHTML=svgLine('<path d="m7 3 14 9-14 9z"/>');views.append(document.createTextNode(t.views||'0'));cell.append(views)}

 });filterProfileGrid();renderPostsEditor();
 syncProfileCountLabels();
 const count=document.querySelector('[data-f=posts]');if(count&&document.activeElement!==count)count.textContent=profileFieldDisplay('posts');
}
function syncEditor(){
 document.querySelectorAll('[data-edit]').forEach(el=>{if(document.activeElement===el)return;const field=el.dataset.edit;let value=profile[field];if(field==='contacts')value=(value||[]).join(', ');if(field==='extraLinks')value=(value||[]).join('\n');if(el.type==='checkbox')el.checked=!!value;else el.value=value??''});
}
function makeEditorField(field,label,kind='text',options){
 const wrap=dom('label','edit-field'),title=dom('span','',label);wrap.append(title);let input;
 if(kind==='select'){input=dom('select');options.forEach(([value,text])=>input.add(new Option(text,value)))}else if(kind==='textarea'){input=dom('textarea');input.rows=3}else{input=dom('input');input.type=kind;input.autocomplete='off'}
 input.dataset.edit=field;input.id='edit-'+field;input.setAttribute('aria-label',label);if(kind==='text')input.maxLength=field==='bio'?2200:200;if(kind==='textarea')input.maxLength=2200;
 input.addEventListener(kind==='checkbox'||kind==='select'?'change':'input',()=>{
  let value=input.type==='checkbox'?input.checked:input.value;
  if(field==='contacts')value=value.split(',').map(t=>t.trim()).filter(Boolean).slice(0,4);
  if(field==='extraLinks')value=value.split('\n').map(t=>t.trim()).filter(Boolean).slice(0,5);
  profile[field]=value;if(field==='posts')profile.autoPosts=false;applyProfile();saveProfile();if(field==='autoPosts'||field==='posts')syncEditor();
 });wrap.append(input);return wrap;
}
function buildProfileEditor(){
 const host=$('profileEditor');host.replaceChildren();host.append(dom('h2','','Perfil'));
 const section=(title,open=false)=>{const d=dom('details');d.open=open;d.append(dom('summary','',title));const f=dom('div','editor-fields');d.append(f);host.append(d);return f};
 let block=section('Identidad y verificación',true);
 [['handle','Usuario'],['name','Nombre'],['pronouns','Pronombres'],['category','Categoría']].forEach(([f,l])=>block.append(makeEditorField(f,l)));
 block.append(makeEditorField('verified','Perfil verificado','checkbox'));const av=dom('div','editor-row');av.append(action('Cambiar avatar',()=>$('avatarInput').click()),action('Recortar',()=>openCircleEditor('avatar')),action('Quitar avatar',()=>{profile.avatar=null;applyProfile();saveProfile()}));block.append(av);
 block=section('Cifras del perfil');[['posts','Publicaciones'],['followers','Seguidores'],['following','Seguidos']].forEach(([f,l])=>block.append(makeEditorField(f,l)));block.append(makeEditorField('autoPosts','Contar publicaciones de la grilla automáticamente','checkbox'));
 block=section('Biografía, enlaces y contacto');block.append(makeEditorField('bio','Biografía','textarea'));[['link','Enlace visible'],['address','Dirección o ubicación'],['mutual','Texto de seguidores en común']].forEach(([f,l])=>block.append(makeEditorField(f,l)));block.append(makeEditorField('extraLinks','Enlaces adicionales (uno por línea)','textarea'),makeEditorField('contacts','Botones de contacto (separados por coma)'));
 block=section('Apariencia y botones');block.append(makeEditorField('private','Cuenta privada','checkbox'),makeEditorField('storyRing','Anillo de historias','select',[['none','Sin historias'],['unseen','Historia nueva · degradado'],['seen','Historia vista · gris'],['close','Mejores amigos · verde']]));[['followLabel','Botón de seguimiento'],['messageLabel','Botón de mensaje'],['ownerEditLabel','Botón editar perfil'],['ownerShareLabel','Botón compartir · app'],['ownerWebSecondaryLabel','Segundo botón · web propietario']].forEach(([f,l])=>block.append(makeEditorField(f,l)));[['showVideo','Mostrar pestaña de videos'],['showReposts','Mostrar pestaña de reposts'],['showTagged','Mostrar pestaña de etiquetas']].forEach(([f,l])=>block.append(makeEditorField(f,l,'checkbox')));
 block=section('Publicaciones');const posts=dom('div');posts.id='postsEditor';block.append(posts,dom('p','editor-note','Cambiá tipo, portada, texto, ubicación, fecha, Me gusta y comentarios de cada publicación.'));
 block=section('Historias destacadas');block.append(makeEditorField('hlOpen','Mostrar historias destacadas','checkbox'));const list=dom('div');list.id='highlightsEditor';block.append(list,action('+ Agregar destacado',addHighlight));block.append(dom('p','editor-note','Podés cambiar nombre, portada, recorte, orden y las historias que contiene cada destacado. El botón de reproducción de cada portada abre sus historias.'));
 const note=dom('p','editor-note','Guardado automático. Usá Compartir para trabajar por enlace o descargá un respaldo desde Proyecto y ajustes.');host.append(note);syncEditor();renderHighlightsEditor();renderPostsEditor();
}
function addHighlight(){profile.hlOpen=true;profile.highlights.push({id:crypto.randomUUID(),label:'Nuevo',cover:null,stories:[]});applyHighlights();renderHighlightsEditor();syncEditor();saveProfile()}
function moveHighlight(id,offset){const index=profile.highlights.findIndex(h=>h.id===id),next=index+offset;if(index<0||next<0||next>=profile.highlights.length)return;[profile.highlights[index],profile.highlights[next]]=[profile.highlights[next],profile.highlights[index]];applyHighlights();renderHighlightsEditor();saveProfile()}
function removeHighlight(id){profile.highlights=profile.highlights.filter(h=>h.id!==id);applyHighlights();renderHighlightsEditor();saveProfile()}
async function profileImageFromFile(file){
 if(!file.type.startsWith('image/'))throw new Error('Elegí un archivo de imagen.');
 if(file.size>50*1024*1024)throw new Error('La imagen supera los 50 MB.');
 const data=await readImageFile(file);if(!data)throw new Error('No se pudo abrir esa imagen.');return {src:data.src,z:1,panX:0,panY:0};
}
function renderHighlights(){
 const row=$('hlRow'),toggle=$('hlToggle');row.replaceChildren();row.hidden=!profile.hlOpen;toggle.textContent=profile.hlOpen?'Ocultar destacados':'Mostrar destacados';if(!profile.hlOpen)return;
 profile.highlights.forEach((h,index)=>{
  const el=dom('div','hl');el.draggable=true;el.dataset.highlight=h.id;
  el.addEventListener('dragstart',e=>{if(e.target.closest('[contenteditable],button')){e.preventDefault();return}highlightDragId=h.id});el.addEventListener('dragend',()=>highlightDragId=null);el.addEventListener('dragover',e=>e.preventDefault());el.addEventListener('drop',e=>{e.preventDefault();const from=profile.highlights.findIndex(x=>x.id===highlightDragId),to=profile.highlights.findIndex(x=>x.id===h.id);if(from<0||to<0||from===to)return;profile.highlights.splice(to,0,profile.highlights.splice(from,1)[0]);highlightDragId=null;applyHighlights();renderHighlightsEditor();saveProfile()});
  const coverWrap=dom('div','hl-cover-wrap'),circle=dom('div','hl-circle'),cover=normCover(h.cover);circle.title='Arrastrá para encuadrar. Tocá para cambiar la portada. Pellizcá o usá + y − para acercar.';circle.setAttribute('role','button');circle.tabIndex=0;circle.setAttribute('aria-label','Cambiar portada del destacado '+(index+1));
  if(cover){const img=dom('img');img.alt='Portada de '+h.label;img.src=cover.src;const apply=()=>applyCircleImg(img,normCover(h.cover),circle.clientWidth||56);img.onload=apply;circle.append(img);requestAnimationFrame(()=>{if(img.complete)apply()})}else circle.innerHTML=igIcon('Instagram');
  wireCircleCrop(circle,()=>normCover(h.cover),patch=>{h.cover={...normCover(h.cover),...patch};applyCircleImg(circle.querySelector('img'),h.cover,circle.clientWidth)},saveProfile);
  let storyContextAt=0;const replace=()=>{if(Date.now()-storyContextAt<700)return;circle.focus({preventScroll:true});hlTarget=h.id;$('hlInput').click()};circle.addEventListener('contextmenu',e=>{e.preventDefault();storyContextAt=Date.now();openStoryViewer(h.id)});circle.addEventListener('click',replace);circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();replace()}});
  const stories=simButton('Ver historias de '+(h.label||'destacado '+(index+1)),()=>openStoryViewer(h.id),svgLine('<path d="m9 5 10 7-10 7Z"/>'));stories.className='hl-story-button';coverWrap.append(circle,stories);
  const label=dom('div','hl-label',h.label||'');label.contentEditable='plaintext-only';label.spellcheck=false;label.tabIndex=0;label.setAttribute('role','textbox');label.setAttribute('aria-label','Nombre del destacado '+(index+1));label.setAttribute('aria-multiline','false');label.setAttribute('enterkeyhint','done');label.dataset.placeholder='Nombre';label.title='Tocá y escribí el nombre';let initial=h.label,cancelled=false;
  const persist=()=>{h.label=normalizeInlineProfileValue('highlight',label.innerText??label.textContent).slice(0,80);stories.setAttribute('aria-label','Ver historias de '+(h.label||'destacado '+(index+1)));saveProfile()};
  label.addEventListener('focus',()=>{initial=h.label;cancelled=false;closeWorkspace()});label.addEventListener('input',e=>{if(!e.isComposing)persist()});label.addEventListener('compositionend',persist);
  label.addEventListener('blur',()=>{if(!cancelled)persist();cancelled=false;label.textContent=h.label;stories.setAttribute('aria-label','Ver historias de '+(h.label||'destacado '+(index+1)));renderHighlightsEditor()});
  label.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Enter'){e.preventDefault();label.blur()}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelled=true;h.label=initial;label.textContent=initial;saveProfile();label.blur()}});
  label.addEventListener('beforeinput',e=>{if(['insertParagraph','insertLineBreak'].includes(e.inputType)){e.preventDefault();label.blur()}});label.addEventListener('paste',e=>{e.preventDefault();insertInlinePlainText(label,normalizeInlineProfileValue('highlight',e.clipboardData?.getData('text/plain')||'').slice(0,80))});
  const del=action('×',()=>removeHighlight(h.id));del.className='hl-del';del.setAttribute('aria-label','Quitar destacado '+h.label);el.append(coverWrap,label,del);row.append(el);
 });
 const add=dom('div','hl hl-add'),button=dom('button','hl-circle','+');button.type='button';button.setAttribute('aria-label','Agregar destacado');button.addEventListener('click',addHighlight);add.append(button,dom('div','hl-label','Nuevo'));row.append(add);
}
function renderHighlightsEditor(){
 const host=$('highlightsEditor');if(!host)return;host.replaceChildren();profile.highlights.forEach((h,index)=>{
  const row=dom('div','hl-editor'),top=dom('div','hl-editor-top');const img=dom('img','hl-editor-thumb');img.alt='Portada';if(h.cover)img.src=normCover(h.cover).src;else img.hidden=true;
  const name=dom('input');name.value=h.label;name.maxLength=80;name.setAttribute('aria-label','Nombre del destacado '+(index+1));name.addEventListener('input',()=>{h.label=name.value;applyHighlights();saveProfile()});top.append(img,name);row.append(top);
  const buttons=dom('div','editor-row');const up=action('↑',()=>moveHighlight(h.id,-1));up.disabled=index===0;up.setAttribute('aria-label','Subir destacado '+(index+1));const down=action('↓',()=>moveHighlight(h.id,1));down.disabled=index===profile.highlights.length-1;down.setAttribute('aria-label','Bajar destacado '+(index+1));
  buttons.append(up,down,action('Portada',()=>{hlTarget=h.id;$('hlInput').click()}),action('Recortar',()=>openCircleEditor('highlight',h.id)),action('Historias ('+(h.stories?.length||0)+')',()=>openStoriesEditor(h.id)),action('Quitar',()=>removeHighlight(h.id)));row.append(buttons);host.append(row);
 });
}
function openDialog(title){const dialog=dom('dialog','studio-dialog');dialog.append(dom('h2','',title));document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();return dialog;}
function dialogClose(dialog,label='Listo'){const wrap=dom('div','actions');wrap.append(action(label,()=>dialog.close()));dialog.append(wrap)}
function openCircleEditor(type,id){
 const h=type==='highlight'?profile.highlights.find(h=>h.id===id):null;const state=normAvatar(h?h.cover:profile.avatar);if(!state){if(type==='highlight'){hlTarget=id;$('hlInput').click()}else $('avatarInput').click();return}
 if(h)h.cover=state;else profile.avatar=state;const dialog=openDialog('Recortar '+(h?'portada':'avatar')),preview=dom('div','circle-preview');preview.style.cssText='position:relative;width:220px;height:220px;border-radius:50%;overflow:hidden;background:#000;margin:0 auto 20px';const img=dom('img');img.src=state.src;img.style.cssText='position:absolute;max-width:none';preview.append(img);dialog.append(preview);
 const apply=()=>{applyCircleImg(img,state,220);applyAvatarImg();applyHighlights();saveProfile()};img.onload=apply;
 [['z','Zoom',1,4,.01],['panX','Posición horizontal',-.5,.5,.005],['panY','Posición vertical',-.5,.5,.005]].forEach(([key,title,min,max,step])=>{const label=dom('label','edit-field',title),input=dom('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=state[key];input.setAttribute('aria-label',title);input.addEventListener('input',()=>{state[key]=Number(input.value);apply()});label.append(input);dialog.append(label)});dialogClose(dialog);
}
function openStoriesEditor(id){
 const h=profile.highlights.find(h=>h.id===id);if(!h)return;if(!Array.isArray(h.stories))h.stories=h.cover?[{id:crypto.randomUUID(),src:normCover(h.cover).src}]:[];const dialog=openDialog('Historias · '+h.label),list=dom('div');dialog.append(list);const input=dom('input');input.type='file';input.accept='image/*';input.multiple=true;input.hidden=true;
 const redraw=()=>{list.replaceChildren();h.stories.forEach((story,index)=>{const row=dom('div','hl-editor'),top=dom('div','hl-editor-top'),img=dom('img','hl-editor-thumb');img.src=story.src;img.alt='Historia '+(index+1);top.append(img,dom('span','','Historia '+(index+1)));const controls=dom('div','editor-row');[-1,1].forEach(offset=>{const button=action(offset<0?'↑':'↓',()=>{const next=index+offset;if(next<0||next>=h.stories.length)return;[h.stories[index],h.stories[next]]=[h.stories[next],h.stories[index]];redraw();saveProfile()});button.disabled=index+offset<0||index+offset>=h.stories.length;controls.append(button)});controls.append(action('Usar de portada',()=>{h.cover={src:story.src,z:1,panX:0,panY:0};applyHighlights();renderHighlightsEditor();saveProfile()}),action('Quitar',()=>{h.stories.splice(index,1);redraw();renderHighlightsEditor();saveProfile()}));row.append(top,controls);list.append(row)})};
 input.addEventListener('change',async()=>{const files=[...input.files];input.value='';for(const file of files){if(h.stories.length>=100)break;if(!file.type.startsWith('image/')||file.size>50*1024*1024)continue;const data=await readImageFile(file);if(!data)continue;h.stories.push({id:crypto.randomUUID(),src:data.src});saveProfile()}redraw();renderHighlightsEditor()});dialog.append(input,action('+ Subir historias',()=>input.click()),dom('p','editor-note','Imágenes para previsualizar la secuencia de historias. Ordenalas con las flechas.'));redraw();dialogClose(dialog);return dialog;
}
async function readImageFile(file){const source=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});const image=await downscale(source,2400,file.type);return image.w&&image.h?image:null}
function openStoryViewer(id){showSimStory(id,0);}
function openPostEditor(index){
 const tile=tiles[index];if(!tile)return;editingPostIndex=index;const asset=lib.find(a=>a.id===tile.imgId);const dialog=openDialog('Editar publicación '+(index+1));const img=dom('img','metadata-preview');img.src=displaySrc(asset);img.alt=asset.name;dialog.append(img);buildPostMediaEditor(dialog,tile,img);const form=dom('div','metadata-form');dialog.append(form);
 const pinStatus=dom('p','pin-error');pinStatus.setAttribute('role','status');
 const field=(key,label,type='text',choices)=>{const wrap=dom('label','',label);let input;if(type==='select'){input=dom('select');choices.forEach(([v,l])=>input.add(new Option(l,v)))}else if(type==='textarea'){input=dom('textarea');input.rows=4}else{input=dom('input');input.type=type}if(type==='checkbox'){input.checked=!!tile[key];wrap.className='check-label'}else input.value=tile[key]|| (key==='kind'?'photo':'');input.setAttribute('aria-label',label);input.addEventListener('input',()=>{if(key==='pinned'){
 const result=changedPostPin(tiles,index,input.checked);if(!result.changed){input.checked=!!tile.pinned;pinStatus.textContent=result.error==='limit'?'Podés fijar hasta 3 publicaciones. Desfijá una para elegir otra.':'';return}
 const previous=index;Object.assign(tile,result.tiles[result.index]);if(!input.checked)delete tile.pinPosition;result.tiles[result.index]=tile;tiles=result.tiles;index=result.index;editingPostIndex=index;
 if(simCurrentPost===previous)simCurrentPost=index;if(directOrderingPost===previous)directOrderingPost=index;if(libraryTargetPost===previous)libraryTargetPost=index;
 sel.clear();normalizeBanners();render();updateExportUI();commit();dialog.querySelector('h2').textContent='Editar publicación '+(index+1);dialog.querySelectorAll('[data-post-move]').forEach(b=>{const target=index+Number(b.dataset.postMove);b.disabled=target<0||target>=total});pinStatus.textContent='';return
 }tile[key]=type==='checkbox'?input.checked:input.value;if(key==='kind'&&postMediaIds(tile).length>1){tile.kind='carousel';input.value='carousel'}save();render()});wrap.append(input);form.append(wrap)};
 field('kind','Tipo','select',[['photo','Foto'],['carousel','Carrusel'],['reel','Reel · portada'],['video','Video · portada'],['repost','Repost'],['tagged','Etiquetada']]);field('pinned','Publicación fijada','checkbox');field('caption','Texto de la publicación','textarea');field('likes','Me gusta');field('views','Reproducciones');field('comments','Comentarios');field('date','Fecha visible');field('location','Ubicación');form.append(pinStatus);
 const replace=dom('input');replace.type='file';replace.accept='image/*';replace.hidden=true;replace.addEventListener('change',()=>{const file=replace.files[0];if(file){addFileToCell(file,index,()=>{if(dialog.isConnected)dialog.close()})}});dialog.append(replace,action('Reemplazar imagen',()=>replace.click()),action('Restablecer encuadre',()=>{tile.z=1;tile.panX=0;tile.panY=0;delete tile.banner;delete tile.bz;normalizeBanners();render();commit()}));const order=dom('div','editor-row');[-1,1].forEach(offset=>{const b=action(offset<0?'Mover antes':'Mover después',()=>{const next=index+offset;if(next>=0&&next<total){[tiles[index],tiles[next]]=[tiles[next],tiles[index]];normalizeBanners();render();commit();dialog.close();showSimPost(next)}});b.dataset.postMove=offset;b.disabled=index+offset<0||index+offset>=total;order.append(b)});dialog.append(order);const composition=dom('details','post-composition');composition.append(dom('summary','','Composición'));composition.append(action('Usar como panorama de una fila',()=>{spanRow(Math.floor(index/3),tile.imgId);dialog.close();closeSimScreen()}));dialog.append(composition);dialogClose(dialog);return dialog;
}
function openPostViewer(index){showSimPost(index);}
function validSimEntries(entries,comment=false){return entries===undefined||Array.isArray(entries)&&entries.length<=2000&&entries.every(e=>e&&typeof e.id==='string'&&e.id.length<=100&&typeof e.text==='string'&&e.text.length<=2200&&(!comment||typeof e.author==='string'&&e.author.length<=200)&&(e.createdAt===undefined||Number.isFinite(e.createdAt)));}
function validSimTile(t){return (t.commentDraft===undefined||typeof t.commentDraft==='string'&&t.commentDraft.length<=2200)&&validPostMedia(t)&&['simLiked','simSaved'].every(k=>t[k]===undefined||typeof t[k]==='boolean')&&validSimEntries(t.commentEntries,true);}
function validExtendedProfile(p){
 if(!validSimEntries(p.simMessages)||p.simFollowing!==undefined&&typeof p.simFollowing!=='boolean')return false;
 for(const key of ['verified','autoPosts','private','showVideo','showReposts','showTagged'])if(p[key]!==undefined&&typeof p[key]!=='boolean')return false;
 for(const key of ['category','pronouns','address','mutual','storyRing','followLabel','messageLabel','ownerEditLabel','ownerShareLabel','ownerWebSecondaryLabel'])if(p[key]!==undefined&&typeof p[key]!=='string')return false;
 for(const key of ['contacts','extraLinks'])if(p[key]!==undefined&&(!Array.isArray(p[key])||p[key].length>20||!p[key].every(v=>typeof v==='string')))return false;
 for(const h of p.highlights){if(h.stories!==undefined&&(!Array.isArray(h.stories)||h.stories.length>100||!h.stories.every(s=>typeof s.id==='string'&&typeof s.src==='string'&&/^data:image\/(png|jpeg|webp|gif|avif|bmp|svg\+xml);base64,/.test(s.src))))return false}return true;
}
function currentViewSettings(){return {device:$('deviceView').value,theme:$('themeView').value,audience:$('audienceView').value,width:$('canvasWidth').value,mobileLayoutVersion:1};}
function normalizeSavedView(view){if(!view)return null;return view.device==='mobileweb'&&Number(view.mobileLayoutVersion||0)<1?{...view,device:'ios',width:'auto',mobileLayoutVersion:1}:{...view,mobileLayoutVersion:1};}
function saveViewSettings(){if(ok)put('state',{key:'view',data:currentViewSettings()});buildNavigation();applyProfile()}
async function captureProfile(){
 const button=$('exportScreen');button.disabled=true;button.textContent='Generando…';
 try{const c=await renderProfileCanvas();downloadProfileCanvas(c)}catch(e){alert('No se pudo generar la captura. '+e.message)}finally{button.disabled=false;button.textContent='↓ Capturar perfil'}
}
async function initStudio(){
 buildProfileEditor();buildNavigation();$('canvasWidth').addEventListener('change',()=>{render();applyProfile();saveViewSettings()});$('exportScreen').addEventListener('click',captureProfile);

 const view=normalizeSavedView((await all('state')).find(s=>s.key==='view')?.data);if(view){for(const [id,key] of [['deviceView','device'],['themeView','theme'],['audienceView','audience'],['canvasWidth','width']]){if([...$(id).options].some(o=>o.value===view[key]))$(id).value=view[key]}const p=document.querySelector('.phone');p.dataset.device=$('deviceView').value;p.dataset.theme=$('themeView').value;p.dataset.audience=$('audienceView').value}
 render();applyProfile();buildNavigation();renderProfileExtras();
 if(ok)await put('state',{key:'view',data:currentViewSettings()});
 ['deviceView','themeView','audienceView','previewToggle'].forEach(id=>$(id).disabled=false);
}

function renderPostsEditor(){
 const host=$('postsEditor');if(!host)return;host.replaceChildren();
 tiles.forEach((tile,index)=>{if(!tile)return;const asset=lib.find(a=>a.id===tile.imgId);if(!asset)return;const row=dom('div','hl-editor'),top=dom('div','hl-editor-top'),img=dom('img','hl-editor-thumb');img.src=displaySrc(asset);img.alt='Publicación '+(index+1);top.append(img,dom('span','','Publicación '+(index+1)));const controls=dom('div','editor-row');controls.append(action('Editar publicación '+(index+1),()=>openPostEditor(index)));[-1,1].forEach(offset=>{const button=action(offset<0?'←':'→',()=>{const next=index+offset;if(next<0||next>=total)return;[tiles[index],tiles[next]]=[tiles[next],tiles[index]];normalizeBanners();render();commit()});button.disabled=index+offset<0||index+offset>=total;button.setAttribute('aria-label',(offset<0?'Adelantar':'Atrasar')+' publicación '+(index+1));controls.append(button)});controls.append(action('Quitar',()=>{tiles[index]=null;sel.delete(index);render();updateExportUI();commit()}));row.append(top,controls);host.append(row)});
 if(!host.children.length)host.append(dom('p','editor-note','Agregá fotos a la grilla para editar sus publicaciones.'));
}

function previewTileHeightRatio(){if(currentProfileTab!=='reels')return RH/RW;return ['desktop','tablet','mobileweb'].includes(document.querySelector('.phone').dataset.device)?1.5566:16/9}

/* The mockup is the workspace; tools appear only when needed. */
let workspaceSaveState=null;
function isBrowsing(){return true;}
function initWorkspace(){
 document.body.dataset.canvas='profile';document.body.dataset.panel='feed';document.body.classList.add('canvas-expanded','direct-workspace');
 const sidebar=document.querySelector('.sidebar'),stage=document.querySelector('.stage');sidebar.id='studioPanel';sidebar.setAttribute('aria-label','Herramientas de la propuesta');
 const top=dom('div','studio-sidebar-top'),brand=dom('div','studio-brand');brand.innerHTML='<b>RIO360<span>.</span></b><small>instagram studio</small>';top.append(brand,$('profileSelect'));sidebar.prepend(top);
 const close=action('×',closeWorkspace);close.className='close-panel';close.setAttribute('aria-label','Cerrar herramientas');top.prepend(close);
 const upload=action('+ Subir fotos',()=>fileInput.click());upload.id='uploadPhotos';top.append(upload);
 const title=dom('div','library-heading');title.innerHTML='<strong>Tus fotos<span class="photo-count"></span></strong><span>Tocá para agregar o arrastrá al perfil.</span>';top.after(title);
 const settings=dom('details','project-settings');settings.append(dom('summary','','Proyecto y ajustes'));const content=dom('div','settings-content');settings.append(content);
 const addGroup=(title,nodes)=>{const group=dom('div','settings-group');group.append(dom('strong','',title),...nodes);content.append(group)};
 document.querySelector('.header').append($('exportScreen'));
 addGroup('Apariencia',[document.querySelector('.viewbar')]);
 addGroup('Grilla',[$('ratioSeg'),$('rowsSeg'),$('undoBtn'),$('redoBtn'),$('randomBtn'),$('clearBtn')]);
 addGroup('Propuestas y respaldos',['newProfile','duplicateProfile','renameProfile','backupProfile','importProfile'].map(id=>$(id)));
 content.append(dom('p','editor-note','Simulación local. Tus fotos, comentarios e historias se guardan en este navegador.'));sidebar.append(settings);
 const toolbar=dom('div','canvas-toolbar'),devices=dom('div','device-switch'),device=$('deviceView');device.setAttribute('aria-label','Dispositivo de vista previa');device.removeAttribute('disabled');const deviceNames={ios:'iPhone',android:'Android',mobileweb:'Web móvil',desktop:'PC',tablet:'Tablet'};[...device.options].forEach(o=>o.textContent=deviceNames[o.value]||o.textContent);const originalDeviceLabel=device.closest('label');devices.append(device);originalDeviceLabel?.remove();
 const tools=dom('div','canvas-tools'),photos=action('Fotos',()=>switchWorkspace('library'));photos.id='openPhotos';photos.setAttribute('aria-controls','studioPanel');photos.setAttribute('aria-expanded','false');tools.append(photos,$('exportBtn'));toolbar.append(devices,tools);stage.before(toolbar);
 stage.addEventListener('dragenter',e=>{if([...e.dataTransfer.types].includes('Files'))document.body.classList.add('moving-photo')});stage.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault()});stage.addEventListener('dragleave',e=>{if(!stage.contains(e.relatedTarget))document.body.classList.remove('moving-photo')});stage.addEventListener('drop',e=>{document.body.classList.remove('moving-photo');if(e.target.closest('.cell'))return;const files=[...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'));if(files.length){e.preventDefault();files.forEach(addFile)}});
 const wrap=dom('div','canvas-column');toolbar.before(wrap);wrap.append(toolbar,stage);
 device.addEventListener('change',()=>{const p=document.querySelector('.phone');p.dataset.device=device.value;$('canvasWidth').value='auto';closeSimScreen();render();saveViewSettings()});
 const notice=dom('div','save-notice');notice.id='saveNotice';notice.hidden=true;notice.setAttribute('role','status');const copy=dom('span');copy.id='saveNoticeText';notice.append(copy,action('Reintentar',retrySave),action('Guardar respaldo',()=>$('backupProfile').click()));document.querySelector('.shell').before(notice);
 const saved=$('saved');saved.classList.add('canvas-save');document.querySelector('.canvas-column').append(saved);saved.setAttribute('role','status');saved.setAttribute('aria-live','polite');if(workspaceSaveState)showSaveStatus(workspaceSaveState);
 document.addEventListener('pointerdown',e=>{if(document.body.dataset.panel!=='feed'&&!sidebar.contains(e.target)&&!e.target.closest('#openPhotos'))closeWorkspace()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.dataset.panel!=='feed'&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();closeWorkspace();photos.focus()}});
 initSimulator();initDirectEditing();
}
function closeWorkspace(){document.body.dataset.panel='feed';document.body.classList.remove('placing-photo');const b=$('openPhotos');if(b)b.setAttribute('aria-expanded','false');}
function syncDeviceSwitch(){}
function initDirectEditing(){
 const phone=document.querySelector('.phone');
 const bind=(el,section,field,label)=>{if(!el)return;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',label);el.title=label;el.dataset.directEdit='true';const open=e=>{e.preventDefault();e.stopImmediatePropagation();openProfileContext(section,field)};el.addEventListener('click',open,true);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')open(e)})};
 const labels={handle:'Usuario',name:'Nombre',bio:'Biografía',link:'Enlace',posts:'Publicaciones',followers:'Seguidores',following:'Seguidos'};
 Object.entries(labels).forEach(([field,label])=>phone.querySelectorAll('[data-f="'+field+'"]').forEach(el=>{
  el.dataset.inlineEdit=field;el.dataset.placeholder=['posts','followers','following'].includes(field)?'0':label;el.contentEditable='plaintext-only';el.tabIndex=0;el.setAttribute('role','textbox');el.setAttribute('aria-label',label);el.setAttribute('aria-multiline',String(field==='bio'));el.setAttribute('enterkeyhint',field==='bio'?'enter':'done');el.spellcheck=['name','bio'].includes(field);el.title='Tocá y escribí. Se guarda automáticamente.';
  if(['posts','followers','following'].includes(field)){el.setAttribute('inputmode','decimal');const stat=el.closest('.stat');stat?.addEventListener('click',e=>{if(!el.contains(e.target))el.focus()})}
 }));
 phone.querySelectorAll('.prof-address,.prof-mutual').forEach(el=>bind(el,2,'address','Cambiar ubicación y enlaces'));
 bind(phone.querySelector('.profile-options'),-1,null,'Opciones del perfil y proyecto');
 const avatar=$('avatar');wireCircleCrop(avatar,()=>normAvatar(profile.avatar),patch=>{profile.avatar={...normAvatar(profile.avatar),...patch};applyAvatarImg()},saveProfile);avatar.tabIndex=0;avatar.setAttribute('role','button');avatar.setAttribute('aria-label','Cambiar foto del perfil');avatar.title='Arrastrá para encuadrar. Tocá para cambiar la foto. Pellizcá o usá + y − para acercar.';avatar.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeWorkspace();$('avatarInput').click()},true);avatar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('avatarInput').click()}});
}
function normalizeInlineProfileValue(field,value){
 const text=String(value??'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ');
 return (field==='bio'?text:text.replace(/\n+/g,' ')).slice(0,field==='bio'?2200:200);
}
function readInlineProfileField(el){return normalizeInlineProfileValue(el.dataset.f,el.innerText??el.textContent);}
function insertInlinePlainText(el,text){
 const selection=window.getSelection();if(!selection?.rangeCount)return;const range=selection.getRangeAt(0);if(!el.contains(range.commonAncestorContainer))return;
 range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);el.dispatchEvent(new Event('input',{bubbles:true}));
}
function openProfileContext(section=0,field){
 document.body.dataset.panel='profile';$('openPhotos').setAttribute('aria-expanded','false');
 const project=document.querySelector('.project-settings');if(project)project.open=section===-1;
 const sections=[...$('profileEditor').children].filter(el=>el.tagName==='DETAILS');sections.forEach((d,i)=>d.open=i===section);
 if(section===-1)requestAnimationFrame(()=>project?.scrollIntoView({block:'nearest'}));
 if(field)requestAnimationFrame(()=>{const input=field==='avatar'?$('profileEditor').querySelector('.editor-row .btn'):$('edit-'+field);input?.focus({preventScroll:true});input?.scrollIntoView({block:'nearest'})});
}
async function retrySave() {
  const results=await Promise.all([...lib.map(asset=>put('assets',asset)),save(),saveProfile(),put('state',{key:'view',data:currentViewSettings()})]);
  if(results.every(Boolean))persistence.resetError();
}
function switchWorkspace(panel){
 if(panel==='profile'){openProfileContext();return}
 document.body.dataset.panel=panel==='feed'||document.body.dataset.panel===panel?'feed':panel;
 $('openPhotos')?.setAttribute('aria-expanded',String(document.body.dataset.panel==='library'));
}
function updateWorkspaceCount() {const el=document.querySelector('.photo-count');if(el)el.textContent=String(lib.length);}
function showSaveStatus({pending,failed,lastSaved}) {
  workspaceSaveState={pending,failed,lastSaved};
  storageFailed=failed;
  const el=$('saved');if(!el)return;
  el.style.opacity='1';el.dataset.state=failed?'error':pending?'pending':'saved';
  el.textContent=failed?'No se pudo guardar':pending?'Guardando…':'Guardado';el.title=lastSaved?'Guardado en este navegador · '+lastSaved.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):'Guardado en este navegador';
  const notice=$('saveNotice');if(notice){notice.hidden=!failed;$('saveNoticeText').textContent='No se pudo guardar en este navegador. Reintentá o descargá un respaldo antes de salir.';}
}

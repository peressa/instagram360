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
 ['handle','name'].forEach(f=>phone.querySelectorAll('[data-f="'+f+'"]').forEach(el=>bind(el,0,f,'Cambiar '+(f==='handle'?'usuario':'nombre'))));
 phone.querySelectorAll('[data-f="bio"],[data-f="link"],.prof-address,.prof-mutual').forEach(el=>bind(el,2,el.dataset.f||'bio','Cambiar biografía y enlaces'));
 ['posts','followers','following'].forEach(f=>phone.querySelectorAll('[data-f="'+f+'"]').forEach(el=>bind(el.closest('.stat')||el,1,f,'Cambiar cifras del perfil')));
 bind(phone.querySelector('.profile-options'),-1,null,'Opciones del perfil y proyecto');
 bind($('avatar'),0,'avatar','Cambiar foto del perfil');
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

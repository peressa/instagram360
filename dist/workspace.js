/* A full-size Instagram canvas with editing tools beside it, without a page header. */
let workspaceSaveState=null;
function isBrowsing(){return true;}
function initWorkspace(){
 document.body.dataset.canvas='profile';document.body.dataset.panel='feed';
 const sidebar=document.querySelector('.sidebar'),stage=document.querySelector('.stage');sidebar.id='studioPanel';
 const top=dom('div','studio-sidebar-top'),brand=dom('div','studio-brand');brand.innerHTML='<b>RIO360<span>.</span></b><small>instagram studio</small>';
 top.append(brand,$('profileSelect'));sidebar.prepend(top);
 const tabs=dom('div','sidebar-tabs');
 [['library','Fotos'],['profile','Perfil']].forEach(([id,label])=>{const b=action(label,()=>switchWorkspace(id));b.dataset.workspacePanel=id;b.setAttribute('aria-pressed',String(id==='library'));tabs.append(b)});top.append(tabs);
 const upload=action('+ Subir fotos',()=>fileInput.click());upload.id='uploadPhotos';top.append(upload);
 const title=dom('div','library-heading');title.innerHTML='<strong>Tus fotos<span class="photo-count"></span></strong><span>Arrastrá al perfil. En celular, mantené apretada la foto para moverla.</span>';top.after(title);
 const close=action('Listo',()=>switchWorkspace('feed'));close.classList.add('close-panel');sidebar.prepend(close);
 const bottom=dom('div','sidebar-bottom'),settings=dom('details','simple-settings');settings.append(dom('summary','','Más opciones'));
 const content=dom('div','settings-content');settings.append(content);
 const addGroup=(title,nodes)=>{const group=dom('div','settings-group');group.append(dom('strong','',title),...nodes);content.append(group)};
 addGroup('Apariencia',[document.querySelector('.viewbar')]);
 addGroup('Grilla',[$('ratioSeg'),$('rowsSeg'),$('undoBtn'),$('redoBtn')]);
 addGroup('Propuestas y respaldos',['newProfile','duplicateProfile','renameProfile','backupProfile','importProfile'].map(id=>$(id)));
 const hint=dom('p','editor-note','Simulación local: los Me gusta, comentarios y mensajes se guardan en esta propuesta.');content.append(hint);
 bottom.append($('exportBtn'),settings);sidebar.append(bottom);
 const toolbar=dom('div','canvas-toolbar'),devices=dom('div','device-switch');devices.setAttribute('role','group');devices.setAttribute('aria-label','Dispositivo de vista previa');
 [['ios','iPhone'],['android','Android'],['tablet','Tablet'],['desktop','PC']].forEach(([id,label])=>{const b=action(label,()=>{$('deviceView').value=id;$('canvasWidth').value='auto';const p=document.querySelector('.phone');p.dataset.device=id;closeSimScreen();render();document.querySelector('.ig-main').scrollTop=0;saveViewSettings();syncDeviceSwitch()});b.dataset.deviceChoice=id;devices.append(b)});
 const tools=dom('div','canvas-tools');const expand=action('Ocultar panel',()=>setCanvasExpanded(!document.body.classList.contains('canvas-expanded')));expand.id='canvasExpand';expand.setAttribute('aria-controls','studioPanel');tools.append(expand);const photos=action('Fotos',()=>switchWorkspace('library'));photos.classList.add('mobile-photos');tools.append(photos);const edit=action('Editar perfil',()=>switchWorkspace('profile'));tools.append(edit);const exp=action('Exportar',()=>$('exportBtn').click());exp.classList.add('mobile-export');tools.append(exp);
 toolbar.append(devices,tools);stage.before(toolbar);
 const wrap=dom('div','canvas-column');toolbar.before(wrap);wrap.append(toolbar,stage);
 $('deviceView').addEventListener('change',syncDeviceSwitch);syncDeviceSwitch();
 const notice=dom('div','save-notice');notice.id='saveNotice';notice.hidden=true;notice.setAttribute('role','status');const copy=dom('span');copy.id='saveNoticeText';notice.append(copy,action('Reintentar',retrySave),action('Guardar respaldo',()=>$('backupProfile').click()));document.querySelector('.shell').before(notice);
 $('saved').setAttribute('role','status');$('saved').setAttribute('aria-live','polite');if(workspaceSaveState)showSaveStatus(workspaceSaveState);
 document.addEventListener('click',e=>{if(!settings.contains(e.target))settings.open=false});
 try{setCanvasExpanded(localStorage.getItem('rio360-canvas-expanded')==='true',false)}catch(_){setCanvasExpanded(false,false)}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('canvas-expanded')&&!simScreen&&!document.querySelector('dialog[open]')){setCanvasExpanded(false);$('canvasExpand').focus()}});
 initSimulator();
}
function setCanvasExpanded(expanded,redraw=true){
 document.body.classList.toggle('canvas-expanded',expanded);
 if(!expanded&&redraw&&innerWidth<=700&&document.body.dataset.panel==='feed')document.body.dataset.panel='library';
 const button=$('canvasExpand');if(button){button.textContent=expanded?'Mostrar panel':'Ocultar panel';button.setAttribute('aria-expanded',String(!expanded));button.title=expanded?'Volver al editor · Esc':'Ampliar la vista previa';}
 try{localStorage.setItem('rio360-canvas-expanded',String(expanded))}catch(_){}
 if(redraw){render();applyProfile();}
}
function syncDeviceSwitch(){document.querySelectorAll('[data-device-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.deviceChoice===$('deviceView').value)))}
async function retrySave() {
  const results=await Promise.all([...lib.map(asset=>put('assets',asset)),save(),saveProfile(),put('state',{key:'view',data:currentViewSettings()})]);
  if(results.every(Boolean))persistence.resetError();
}
function switchWorkspace(panel) {
  if(panel!=='feed'&&document.body.classList.contains('canvas-expanded'))setCanvasExpanded(false,false);
  document.body.classList.remove('client-preview');
  document.body.dataset.canvas='profile';
  document.body.dataset.panel=panel==='feed'?'feed':document.body.dataset.panel===panel?'feed':panel;
  document.querySelectorAll('[data-workspace-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspacePanel===(document.body.dataset.panel==='profile'?'profile':'library'))));
  render();applyProfile();
}
function updateWorkspaceCount() {const el=document.querySelector('.photo-count');if(el)el.textContent=String(lib.length);}
function showSaveStatus({pending,failed,lastSaved}) {
  workspaceSaveState={pending,failed,lastSaved};
  storageFailed=failed;
  const el=$('saved');if(!el)return;
  el.style.opacity='1';el.dataset.state=failed?'error':pending?'pending':'saved';
  el.textContent=failed?'No se pudo guardar':pending?'Guardando…':lastSaved?'Guardado · '+lastSaved.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):'Guardado en este navegador';
  const notice=$('saveNotice');if(notice){notice.hidden=!failed;$('saveNoticeText').textContent='No se pudo guardar en este navegador. Reintentá o descargá un respaldo antes de salir.';}
}

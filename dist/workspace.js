/* The Instagram mockup stays visible while every editing tool opens alongside it. */
let workspaceSaveState=null;
function initWorkspace(){
  document.body.dataset.canvas='profile';document.body.dataset.panel='feed';
  const header=document.querySelector('.header'),controls=header.querySelector('.controls'),sidebar=document.querySelector('.sidebar');
  const project=document.createElement('div');project.className='project-picker';project.append($('profileSelect'));header.insertBefore(project,controls);
  const upload=action('Subir fotos',()=>fileInput.click());upload.id='uploadPhotos';
  const edit=action('Editar perfil',()=>switchWorkspace('profile'));edit.dataset.workspacePanel='profile';edit.setAttribute('aria-pressed','false');
  const photos=action('Mis fotos',()=>switchWorkspace('library'));photos.dataset.workspacePanel='library';photos.setAttribute('aria-pressed','false');photos.classList.add('photos-toggle');
  controls.prepend(upload,edit);$('previewToggle').hidden=true;
  const settings=document.createElement('details');settings.className='simple-settings';
  const summary=document.createElement('summary');summary.textContent='Más opciones';settings.append(summary);
  const content=document.createElement('div');content.className='settings-content';settings.append(content);
  const addGroup=(title,nodes)=>{const group=document.createElement('div');group.className='settings-group';const label=document.createElement('strong');label.textContent=title;group.append(label,...nodes);content.append(group);};
  addGroup('Vista del perfil',[document.querySelector('.viewbar')]);
  addGroup('Fotos de la grilla',[$('ratioSeg'),$('rowsSeg'),$('zoomBlock'),$('undoBtn'),$('redoBtn'),$('randomBtn'),$('clearBtn')]);
  addGroup('Propuestas y respaldos',['newProfile','duplicateProfile','renameProfile','backupProfile','importProfile'].map(id=>$(id)));
  const help=document.querySelector('.rail-help');help.classList.add('help-panel');const guide=document.createElement('details');const guideTitle=document.createElement('summary');guideTitle.textContent='Cómo usarlo';guide.append(guideTitle,help);content.append(guide);
  controls.append(settings);
  const title=document.createElement('div');title.className='library-heading';title.innerHTML='<span class=library-kicker>LA SELECCIÓN</span><strong>Tus fotos<span class=photo-count></span></strong><span>Todo lo que necesitás para tu próximo feed.</span>';sidebar.prepend(title);
  const close=action('Listo',()=>{document.body.dataset.panel='feed';document.querySelectorAll('[data-workspace-panel]').forEach(b=>b.setAttribute('aria-pressed','false'));render();});close.classList.add('close-panel');sidebar.prepend(close);
  const tip=document.createElement('section');tip.className='workspace-intro';
  const heading=document.createElement('div');heading.innerHTML='<span class="intro-kicker">TU ESPACIO CREATIVO</span><h1>Un feed con tu <em>mirada.</em></h1><p>Elegí tus fotos. Encontrá el orden. Visualizá tu próximo perfil.</p>';
  const preview=document.createElement('span');preview.className='live-preview';preview.textContent='Vista previa en vivo';
  const introActions=document.createElement('div');introActions.className='intro-actions';introActions.append(preview,photos);tip.append(heading,introActions);document.querySelector('.shell').before(tip);
  const stageLabel=document.createElement('span');stageLabel.className='stage-label';stageLabel.textContent='TU PERFIL · INSTAGRAM';stageLabel.setAttribute('aria-hidden','true');document.querySelector('.stage').prepend(stageLabel);
  const dropzone=document.querySelector('.dropzone');dropzone.querySelector('strong').textContent='Subí tus fotos';dropzone.querySelector('span').textContent='o arrastralas hasta acá';
  const logo=document.querySelector('.logo');logo.innerHTML='<b>RIO<span>360</span><i aria-hidden="true"></i></b><small>instagram studio</small>';

  const notice=document.createElement('div');notice.id='saveNotice';notice.className='save-notice';notice.hidden=true;notice.setAttribute('role','status');const copy=document.createElement('span');copy.id='saveNoticeText';notice.append(copy,action('Reintentar',retrySave),action('Guardar respaldo',()=> $('backupProfile').click()));document.querySelector('.shell').before(notice);
  $('saved').setAttribute('role','status');$('saved').setAttribute('aria-live','polite');if(workspaceSaveState)showSaveStatus(workspaceSaveState);
  document.addEventListener('click',e=>{if(!settings.contains(e.target))settings.open=false;});
}
async function retrySave() {
  const results=await Promise.all([...lib.map(asset=>put('assets',asset)),save(),saveProfile(),put('state',{key:'view',data:currentViewSettings()})]);
  if(results.every(Boolean))persistence.resetError();
}
function switchWorkspace(panel) {
  document.body.classList.remove('client-preview');
  document.body.dataset.canvas='profile';
  document.body.dataset.panel=document.body.dataset.panel===panel?'feed':panel;
  document.querySelectorAll('[data-workspace-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspacePanel===document.body.dataset.panel)));
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

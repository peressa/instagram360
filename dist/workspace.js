/* Editor navigation is independent of the Instagram presentation settings. */
let workspaceSaveState = null;
function initWorkspace() {
  document.body.dataset.canvas = 'feed';
  document.body.dataset.panel = 'feed';
  const nav = document.createElement('nav'); nav.className = 'workspace-nav'; nav.setAttribute('aria-label', 'Espacio de trabajo');
  for (const [id, label] of [['feed','Feed'], ['library','Biblioteca'], ['profile','Perfil'], ['help','Ayuda']]) {
    const button = action(label, () => switchWorkspace(id));
    button.dataset.panel = id; button.setAttribute('aria-pressed', String(id === 'feed')); nav.append(button);
  }
  document.querySelector('.projectbar').append(nav);
  const actions = document.createElement('details'); actions.className = 'project-menu';
  const summary = document.createElement('summary'); summary.textContent = 'Propuesta ···'; actions.append(summary);
  const projectContent=document.createElement('div');projectContent.className='menu-content';actions.append(projectContent);
  for (const id of ['newProfile','duplicateProfile','renameProfile','backupProfile','importProfile']) projectContent.append($(id));
  document.querySelector('.profile-actions').append(actions);
  const toolbar = document.createElement('div'); toolbar.className = 'feed-tools';
  for (const [id,label] of [['ratioSeg','Formato'],['rowsSeg','Grilla']]) {
    const group = document.createElement('div'); group.className='tool-group';
    const title=document.createElement('span');title.textContent=label;group.append(title,$(id));toolbar.append(group);
  }
  toolbar.append($('zoomBlock'));
  const more=document.createElement('details');more.className='grid-menu';
  const moreTitle=document.createElement('summary');moreTitle.textContent='Más opciones';const gridContent=document.createElement('div');gridContent.className='menu-content';gridContent.append($('randomBtn'),$('clearBtn'));more.append(moreTitle,gridContent);toolbar.append(more);
  document.querySelector('.shell').before(toolbar);
  const sidebar=document.querySelector('.sidebar');
  const title=document.createElement('div');title.className='library-heading';title.innerHTML='<strong>Tu biblioteca</strong><span>Subí fotos y arrastralas al feed.</span>';sidebar.prepend(title);
  const help=document.querySelector('.rail-help');help.classList.add('help-panel');sidebar.append(help);
  const heading=document.createElement('div');heading.className='canvas-heading';heading.innerHTML='<div><span class="eyebrow">TU COMPOSICIÓN</span><h1>Diseñá tu próximo feed</h1></div><span class="canvas-count"></span>';
  document.querySelector('.stage').prepend(heading);
  const notice=document.createElement('div');notice.id='saveNotice';notice.className='save-notice';notice.hidden=true;notice.setAttribute('role','status');
  const copy=document.createElement('span');copy.id='saveNoticeText';notice.append(copy,action('Reintentar',retrySave),action('Guardar respaldo',()=> $('backupProfile').click()));
  document.querySelector('.shell').before(notice);
  $('saved').setAttribute('role','status');$('saved').setAttribute('aria-live','polite');
  if(workspaceSaveState)showSaveStatus(workspaceSaveState);
  $('previewToggle').classList.remove('btn-accent');
  document.querySelector('.projectbar h1').textContent='Instagram Studio';
  $('clearBtn').addEventListener('click',()=>{more.open=false;});
  document.addEventListener('click',e=>{for(const menu of [actions,more])if(!menu.contains(e.target))menu.open=false;});
}
async function retrySave() {
  const results=await Promise.all([...lib.map(asset=>put('assets',asset)),save(),saveProfile(),put('state',{key:'view',data:currentViewSettings()})]);
  if(results.every(Boolean))persistence.resetError();
}
function switchWorkspace(panel) {
  document.body.classList.remove('client-preview');
  $('previewToggle').textContent='Ver como Instagram';
  document.body.dataset.panel=panel;
  document.body.dataset.canvas=panel==='profile'?'profile':'feed';
  currentProfileTab='posts';
  document.querySelectorAll('.workspace-nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.panel===panel)));
  document.querySelector('.stage').scrollTop=0;
  render();applyProfile();
}
function updateWorkspaceCount() {
  const label=document.querySelector('.canvas-count');
  if(label)label.textContent=filled().length+' de '+total+' espacios';
}
function showSaveStatus({pending,failed,lastSaved}) {
  workspaceSaveState={pending,failed,lastSaved};
  storageFailed=failed;
  const el=$('saved');if(!el)return;
  el.style.opacity='1';el.dataset.state=failed?'error':pending?'pending':'saved';
  el.textContent=failed?'No se pudo guardar':pending?'Guardando…':lastSaved?'Guardado · '+lastSaved.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):'Guardado en este navegador';
  const notice=$('saveNotice');if(notice){notice.hidden=!failed;$('saveNoticeText').textContent='No se pudo guardar en este navegador. Reintentá o descargá un respaldo antes de salir.';}
}

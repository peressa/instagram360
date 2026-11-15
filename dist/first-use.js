/* Contextual guidance shared by local, collaborative and legacy editors. */
function renderProfileStart(empty){
 const description=empty.querySelector('p');description.classList.add('start-description');description.textContent='Subí fotos o importá un perfil para empezar.';
 const actions=dom('div','profile-start'),upload=action(lib.length?'Usar mis fotos':'Subir primeras fotos',()=>lib.length?openPhotoLibrary():fileInput.click()),importProfile=action('Importar Instagram',openInstagramImporter);
 upload.classList.add('start-primary');actions.append(upload,importProfile);empty.append(actions);
}
function projectNames(projectName,profileName){
 const project=String(projectName||'').trim(),instagram=String(profileName||'').trim();
 if(!project||project.length>80)throw Error('Escribí un nombre de proyecto de hasta 80 caracteres.');
 if(!instagram||instagram.length>200)throw Error('Escribí el nombre visible del perfil, de hasta 200 caracteres.');
 return {project,instagram};
}
function blankProjectData(projectName,profileName){
 const names=projectNames(projectName,profileName),next=structuredClone(NEW_PROFILE_DEFAULTS);next.name=names.instagram;
 return {format:'instagram360',version:1,name:names.project,profile:next,assets:[],layout:{rows:3,RW:3,RH:4,tiles:Array(9).fill(null)}};
}
function shouldWelcomeProject(firstVisit,hasContent,shared,seen){return firstVisit&&!hasContent&&!shared&&!seen}
function readWelcomeSeen(){try{return localStorage.getItem('ig360_welcome_seen')==='1'}catch{return false}}
function markWelcomeSeen(){try{localStorage.setItem('ig360_welcome_seen','1')}catch{}}
async function createNamedProject(projectName,profileName,firstVisit=false){
 const data=blankProjectData(projectName,profileName);
 const reuse=firstVisit&&profileCatalog.length===1&&activeProfile==='default'&&profileCatalog[0].id==='default'&&!lib.length&&!tiles.some(Boolean);
 if(!reuse){await addSavedProfile(data.name,data);return}
 await flushProfile();const item=profileCatalog[0],previousName=item.name,previousProfile=profile;
 if(!await put('state',{key:'profile',data:data.profile})||storageFailed)throw Error('No se pudo guardar el proyecto. Volvé a intentarlo.');
 try{item.name=data.name;storeCatalog()}catch(error){item.name=previousName;await put('state',{key:'profile',data:previousProfile});throw error}
 profile=data.profile;renderProfiles();render();applyProfile();
}
function editingGuideContent(){
 const guide=dom('dl','editing-guide');
 for(const [title,text] of [['Textos','Tocá el nombre, la bio o las cifras y escribí. Se guardan automáticamente.'],['Fotos','Tocá el avatar o una portada para cambiarlos. Arrastrá dentro del círculo para encuadrar.'],['Destacados','Tocá su nombre para editarlo. El botón ▶ abre las historias.']])guide.append(dom('dt','',title),dom('dd','',text));
 return guide;
}
function showEditableTargets(){
 document.body.classList.add('edit-guide-visible');
 const clear=()=>{document.body.classList.remove('edit-guide-visible');document.removeEventListener('pointerdown',clear,true);document.removeEventListener('keydown',clear,true)};
 document.addEventListener('pointerdown',clear,{capture:true,once:true});document.addEventListener('keydown',clear,{capture:true,once:true});
}
function openEditingGuide(){
 const dialog=dom('dialog','studio-dialog editing-help'),close=action('×',()=>dialog.close());close.className='save-details-close';close.setAttribute('aria-label','Cerrar guía de edición');dialog.setAttribute('aria-label','Qué podés editar');
 dialog.append(close,dom('h2','','Editá sobre el perfil'),editingGuideContent());const actions=dom('div','actions');actions.append(action('Entendido',()=>dialog.close()),action('Mostrar en el perfil',()=>{dialog.close();closeWorkspace();showEditableTargets()}));dialog.append(actions);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();close.focus();
}
function openProjectStart(firstVisit=false){
 if(document.querySelector('dialog.project-start'))return;
 const dialog=dom('dialog','studio-dialog project-start'),close=action('×',()=>dialog.close()),heading=dom('h2','',firstVisit?'Empezá tu primer proyecto':'Nuevo proyecto');close.className='save-details-close';close.setAttribute('aria-label','Cerrar creación de proyecto');dialog.setAttribute('aria-labelledby','projectStartTitle');heading.id='projectStartTitle';
 dialog.append(close,dom('p','project-start-brand','Instagram 360'),heading,dom('p','project-start-intro','Organizá tu propuesta y diseñá un perfil de Instagram editable. No se publica en Instagram.'));
 const form=dom('form','project-start-form'),field=(labelText,id,placeholder,hint,max)=>{const group=dom('div','project-start-field'),label=dom('label','',labelText),input=dom('input'),help=dom('small','',hint);label.htmlFor=id;input.id=id;input.name=id;input.required=true;input.maxLength=max;input.placeholder=placeholder;input.autocomplete='off';help.id=id+'Hint';input.setAttribute('aria-describedby',help.id);group.append(label,input,help);form.append(group);return input};
 const projectInput=field('Nombre del proyecto','projectStartName','Ej.: Campaña de verano','Sólo para organizar tus propuestas; no aparece en el perfil.',80),profileInput=field('Nombre del perfil en Instagram','projectStartProfile','Ej.: Mi marca','Es el nombre visible en el mockup. Después podés tocarlo y cambiarlo.',200);
 form.append(dom('p','project-start-tip','Después, tocá los textos para escribir y las fotos para cambiarlas. Usá ▶ para ver los destacados.'));
 const error=dom('p','project-start-error');error.setAttribute('role','alert');error.hidden=true;const submit=action('Crear proyecto',()=>{});submit.type='submit';submit.classList.add('btn-accent');form.append(error,submit);dialog.append(form);
 const alternate=dom('div','project-start-import');alternate.append(action('Importar un perfil existente',()=>{dialog.close();openInstagramImporter()}),dom('small','','La importación por enlace puede ser parcial. Revisarás los datos antes de crear el proyecto.'));dialog.append(alternate);
 let busy=false;form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;try{projectNames(projectInput.value,profileInput.value)}catch(e){error.hidden=false;error.textContent=e.message;return}busy=true;error.hidden=true;const controls=[...dialog.querySelectorAll('button,input')];controls.forEach(el=>el.disabled=true);submit.textContent='Creando proyecto…';try{await createNamedProject(projectInput.value,profileInput.value,firstVisit);markWelcomeSeen();dialog.close()}catch(e){error.hidden=false;error.textContent=e.message||'No se pudo crear el proyecto. Volvé a intentarlo.'}finally{busy=false;controls.forEach(el=>el.disabled=false);submit.textContent='Crear proyecto'}});
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});dialog.addEventListener('close',()=>{if(firstVisit)markWelcomeSeen();dialog.remove()},{once:true});document.body.append(dialog);dialog.showModal();projectInput.focus();
}
function initProjectGuidance(firstVisit=false){
 const select=$('profileSelect'),label=document.querySelector('label[for=profileSelect]');if(label){label.className='project-select-label';label.textContent='Proyecto';select.before(label)}select.setAttribute('aria-label','Proyecto guardado');select.title='El nombre del proyecto organiza tu trabajo. El nombre de Instagram se edita en el perfil.';
 const settings=document.querySelector('.project-settings .settings-content');settings?.append(action('Cómo editar el perfil',openEditingGuide));
 if(ok&&shouldWelcomeProject(firstVisit,!!lib.length||tiles.some(Boolean),typeof liveProject!=='undefined'&&!!liveProject,readWelcomeSeen()))openProjectStart(true);
}
function initSaveIndicator(){
 const label=$('saved'),button=action('',openSaveDetails);button.id='saveDetails';button.className='canvas-save';button.setAttribute('aria-haspopup','dialog');button.title='Ver dónde se guarda y descargar un respaldo';button.replaceChildren(label);document.querySelector('.canvas-column').append(button);label.setAttribute('role','status');label.setAttribute('aria-live','polite');
}
function paintSaveStatus({pending,failed,lastSaved},cloud=false){
 const label=$('saved');if(!label)return;
 const state=failed?'error':pending?'pending':'saved',where=cloud?'en la nube':'en este navegador';
 label.style.opacity='1';label.dataset.state=state;label.textContent=failed?'Hay cambios sin guardar':pending?(cloud?'Sincronizando…':'Guardando en este navegador…'):'Guardado '+where;
 label.title=(lastSaved?'Último guardado '+where+' · '+lastSaved.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):'Guardado '+where);const button=$('saveDetails');if(button){button.dataset.state=state;button.setAttribute('aria-label',label.textContent)}
}
function openSaveDetails(){
 const legacy=typeof createSharedPersistence==='function',shared=legacy||(typeof liveProject!=='undefined'&&!!liveProject),dialog=dom('dialog','studio-dialog save-details'),close=action('×',()=>dialog.close());close.className='save-details-close';close.setAttribute('aria-label','Cerrar información de guardado');
 dialog.setAttribute('aria-label','Guardado del proyecto');dialog.append(close,dom('h2','','Guardado del proyecto'));
 const current=profileCatalog.find(item=>item.id===activeProfile);if(current)dialog.append(dom('p','save-project-name','Proyecto: '+current.name));
 if(workspaceSaveState?.failed)dialog.append(dom('p','save-details-warning','Hay cambios pendientes. Descargá un respaldo antes de salir.'));
 dialog.append(dom('p','',legacy?'Este proyecto se guarda en la nube. Quien tenga el enlace puede ver y editar los cambios.':'Tus cambios se guardan automáticamente en este navegador y en este dispositivo.'));
 dialog.append(dom('p','',shared?(legacy?'Si perdés la conexión, los cambios quedan pendientes en este dispositivo hasta reconectar.':'Este proyecto también tiene un enlace compartido. El indicador de conexión muestra si los cambios están sincronizados en la nube.'):'Para continuar en otro dispositivo, usá Compartir o llevá un respaldo. Borrar los datos del navegador puede eliminar la copia local.'));
 const actions=dom('div','actions');actions.append(action('Volver',()=>dialog.close()),action('Descargar respaldo',()=>{$('backupProfile').click();dialog.close()}));dialog.append(actions);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();close.focus();
}
function createLibraryCarousel(){
 if(libraryTargetPost!==null||libraryTargetStory!==null)return false;
 const ids=[...librarySelection],available=new Set(lib.map(a=>a.id));
 if(ids.length<2){libraryMessage('Seleccioná al menos dos fotos para crear un carrusel.');return false}
 const result=appendPostMedia(null,ids,available);if(!result.changed){libraryMessage(result.error==='limit'?'El carrusel admite hasta 100 fotos.':'Alguna foto ya no está disponible. Volvé a seleccionarlas.');return false}
 let index=tiles.findIndex(t=>!t),nextRows=rows;
 if(index<0){if(rows>=9){libraryMessage('La grilla está llena. Quitá una publicación antes de crear otro carrusel.');return false}index=tiles.length;nextRows=rows+3}
 closeSimScreen(false);currentProfileTab='posts';rows=nextRows;total=rows*3;tiles=[...tiles];while(tiles.length<total)tiles.push(null);tiles[index]=result.tile;sel.clear();active=null;
 normalizeBanners();render();renderProfileExtras();renderTray();updateExportUI();syncZoom();commit();$('rowsSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('active',Number(b.dataset.rows)===rows));
 const created=tiles.indexOf(result.tile);clearLibrarySelection();closeWorkspace();directOrderingPost=created;showSimPost(created);
 libraryMessage('Carrusel creado con '+ids.length+' fotos. Tus publicaciones anteriores se conservan.');return true;
}

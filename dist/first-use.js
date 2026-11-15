/* Contextual guidance shared by local, collaborative and legacy editors. */
function renderProfileStart(empty){
 const description=empty.querySelector('p');description.classList.add('start-description');description.textContent='Subí fotos o importá un perfil para empezar.';
 const actions=dom('div','profile-start'),upload=action(lib.length?'Usar mis fotos':'Subir primeras fotos',()=>lib.length?openPhotoLibrary():fileInput.click()),importProfile=action('Importar Instagram',openInstagramImporter);
 upload.classList.add('start-primary');actions.append(upload,importProfile);empty.append(actions);
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

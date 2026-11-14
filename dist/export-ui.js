/* Shared by the current editor and the existing Hilton route. */
let exportBusy=false;
function exportPhotoPlan(){
 const indices=selList().filter(i=>tiles[i]),carousel=indices.some(i=>postMediaIds(tiles[i]).length>1),zip=indices.length>1||carousel;
 const format=selectedFmt().toUpperCase(),n=indices.length;
 return {indices,zip,label:!n?'Elegí una publicación':zip?(n===1?'Descargar carrusel · ZIP':`Descargar ${n} publicaciones · ZIP`):`Descargar foto · ${format}`};
}
function syncExportDescription(){
 const device=$('deviceView'),theme=$('themeView');
 $('captureContext').textContent=(device.selectedOptions[0]?.textContent||'Perfil')+' · '+(theme.value==='dark'?'Modo oscuro':'Modo claro')+' · Imagen PNG';
 const plan=exportPhotoPlan(),n=plan.indices.length;
 $('exportSelectionCount').textContent=n+' '+(n===1?'publicación seleccionada':'publicaciones seleccionadas');
 $('exportContents').textContent=plan.zip?'El ZIP incluye las fotos seleccionadas, los carruseles completos, el avatar y las portadas de destacados.':'Una imagen lista para publicar, con el recorte que elegiste.';
 if(!exportBusy){$('exportGo').textContent=plan.label;$('exportGo').disabled=!n}
}
function showExportError(message){const el=$('exportError');el.textContent=message||'';el.hidden=!message;if(message)el.scrollIntoView?.({block:'nearest'})}
async function runExportTask(task,button){
 if(exportBusy)return;exportBusy=true;showExportError('');
 const controls=[...exportModal.querySelectorAll('button,input')],disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);button.textContent='Preparando descarga…';exportModal.setAttribute('aria-busy','true');
 let success=false;
 try{await task();success=true}catch(error){console.error('Instagram 360: export failed',error);showExportError('No se pudo generar la descarga. Volvé a intentarlo. '+(error.message||''))}
 finally{exportBusy=false;controls.forEach((el,i)=>el.disabled=disabled[i]);$('feedGo').textContent='Guardar captura';exportModal.removeAttribute('aria-busy');syncExportDescription();if(success)closeExport()}
}
function syncThemeToggle(){
 const button=$('themeToggle');if(!button)return;const dark=$('themeView').value==='dark';button.setAttribute('aria-pressed',String(dark));button.title=dark?'Cambiar Instagram a modo claro':'Cambiar Instagram a modo oscuro';
 button.innerHTML=(dark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/></svg>');
}
function initExportExperience(){
 const button=action('',()=>{const select=$('themeView');select.value=select.value==='dark'?'light':'dark';select.dispatchEvent(new Event('change',{bubbles:true}))});button.id='themeToggle';button.className='btn theme-toggle';button.setAttribute('aria-label','Modo oscuro de Instagram');document.querySelector('.device-switch').append(button);$('themeView').addEventListener('change',syncThemeToggle);syncThemeToggle();
 $('closeExport').addEventListener('click',closeExport);exportModal.setAttribute('aria-labelledby','exportTitle');
 document.querySelectorAll('input[name=fmt]').forEach(el=>el.addEventListener('change',syncExportDescription));
}

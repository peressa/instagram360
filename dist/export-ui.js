/* Shared by the current editor and the existing Hilton route. */
let exportBusy=false;
const CAPTURE_AREAS={
 full:{label:'Perfil completo',selector:'.phone',file:'perfil',description:'El perfil y todas las publicaciones de la pestaña visible, en una sola imagen.'},
 profile:{label:'Encabezado del perfil',selector:'.profile-head',file:'perfil_encabezado',description:'Foto de perfil, nombre, bio, cifras y botones, sin la grilla ni los destacados.'},
 highlights:{label:'Portadas de destacados',selector:'.hl-wrap',file:'destacados',description:'Los círculos y nombres de los destacados visibles en el perfil.'},
 feed:{label:'Feed · grilla de publicaciones',selector:'.ig-feed',file:'feed',description:'La pestaña y su grilla completa, sin el encabezado del perfil.'},
 post:{label:'Publicación abierta',selector:'.sim-post-card',file:'publicacion',description:'La publicación que abriste, con la foto actual del carrusel y su información.'},
 story:{label:'Historia destacada abierta',selector:'.sim-story-frame',file:'historia',description:'La historia que estás viendo, con su nombre y progreso. La reproducción se pausa mientras elegís.'}
};
function captureAreaAvailable(target){
 if(target==='post')return !!document.querySelector('.phone:not(.capture-copy) .sim-post-card');
 if(target==='story')return !!document.querySelector('.phone:not(.capture-copy) .sim-story-image');
 if(target==='highlights')return !!document.querySelector('.phone:not(.capture-copy) .hl-row .hl');
 return !!CAPTURE_AREAS[target];
}
function prepareCaptureChoice(){
 const select=$('captureTarget');
 for(const option of select.options){option.disabled=!captureAreaAvailable(option.value);option.textContent=CAPTURE_AREAS[option.value].label+(option.disabled?option.value==='highlights'?' · sin destacados':' · abrila en el perfil':'')}
 select.value=captureAreaAvailable('story')?'story':captureAreaAvailable('post')?'post':'full';
 syncCaptureChoice();
}
function syncCaptureChoice(){
 const target=$('captureTarget').value,area=CAPTURE_AREAS[target]||CAPTURE_AREAS.full;
 $('captureDescription').textContent=area.description;
 $('captureOrderOptions').hidden=target!=='full'&&target!=='feed';
}
function appendCaptureAction(container){
 const button=simButton('Guardar captura',()=>openExport(),svgLine('<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>'));
 button.classList.add('capture-action');container.append(button);
}
/* Work on an inert copy: exporting never resizes, scrolls or re-renders the editor. */
async function captureSelectedCanvas(target,showOrder){
 const area=CAPTURE_AREAS[target];if(!area||!captureAreaAvailable(target))throw Error('Abrí primero la publicación o historia que querés capturar.');
 const source=document.querySelector('.phone:not(.capture-copy)'),copy=source.cloneNode(true),host=document.createElement('div');
 host.className='capture-host';host.dataset.area=target;host.inert=true;host.setAttribute('aria-hidden','true');
 host.style.setProperty('--capture-width',source.offsetWidth+'px');host.style.setProperty('--capture-height',source.offsetHeight+'px');
 copy.classList.add('capture-copy');host.append(copy);
 if(target==='post'||target==='story'){
  host.classList.add('capture-viewer');
  const track=copy.querySelector('.sim-carousel-track');if(track){[...track.children].forEach((image,i)=>{if(i!==simCurrentSlide)image.remove()});track.scrollLeft=0}
  const fills=source.querySelectorAll('.sim-story-progress i');copy.querySelectorAll('.sim-story-progress i').forEach((fill,i)=>{fill.style.transform=getComputedStyle(fills[i]).transform});
 }else copy.querySelectorAll('.sim-screen').forEach(el=>el.remove());
 if(target==='profile')copy.querySelector('.hl-wrap')?.remove();
 copy.querySelectorAll('.cell:not(.has),.profile-start,.capture-action,.sim-inline-media,.sim-inline-toggle,.hl-add,.hl-toggle,.hl-del,.hl-story-button,.avatar-plus,.tools,.grip,.check,.plus,.row-grips').forEach(el=>el.remove());
 copy.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
 copy.querySelectorAll('input').forEach(el=>{if(el.type==='file')el.remove();else if(el.closest('.sim-comment-form'))el.value=''});
 copy.querySelectorAll('.start-description').forEach(el=>{el.textContent='El contenido de este perfil aparecerá aquí.'});
 document.body.append(host);
 try{
  const element=target==='full'?copy:copy.querySelector(area.selector);
  if(!element)throw Error('No hay contenido disponible en esta zona.');
  await document.fonts?.ready;
  await Promise.all([...element.querySelectorAll('img')].filter(i=>i.getAttribute('src')).map(i=>i.decode().catch(()=>{})));
  const width=Math.ceil(element.getBoundingClientRect().width),height=Math.ceil(target==='post'&&copy.classList.contains('mobile-layout')?element.scrollHeight:element.getBoundingClientRect().height);
  if(!width||!height)throw Error('Esta zona está oculta. Mostrala en el perfil antes de capturarla.');
  return await html2canvas(element,{width,height,scale:2,backgroundColor:getComputedStyle(element).getPropertyValue('--ig-bg').trim()||'#fff',logging:false,useCORS:false,onclone:doc=>{
   const clone=doc.querySelector('.capture-copy');
   if(showOrder&&(target==='full'||target==='feed'))decorateExportOrder({querySelectorAll:s=>clone.querySelectorAll(s),createElement:tag=>doc.createElement(tag)},true);
  }});
 }finally{host.remove()}
}
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
 const controls=[...exportModal.querySelectorAll('button,input,select')],disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);button.textContent='Preparando descarga…';exportModal.setAttribute('aria-busy','true');
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
 $('captureTarget').addEventListener('change',()=>{syncCaptureChoice();showFeedPreview()});
}

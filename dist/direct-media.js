/* Selection belongs to the library UI; post changes remain one undoable operation. */
const librarySelection=new Set();
let libraryAnchor=null,libraryTargetPost=null,directOrderingPost=null;

function libraryMessage(text){
 if(typeof document==='undefined')return;
 const copy=document.querySelector('.library-selection-copy');if(copy)copy.textContent=text;
 let live=document.getElementById('directMediaStatus');if(!live){live=dom('div','direct-media-status');live.id='directMediaStatus';live.setAttribute('role','status');document.body.append(live)}live.textContent=text;
}
function syncLibrarySelection(){
 if(typeof document==='undefined'||!document.querySelectorAll)return;
 const assets=new Set(lib.map(a=>a.id));for(const id of librarySelection)if(!assets.has(id))librarySelection.delete(id);
 const ids=[...librarySelection];document.querySelectorAll('.chip[data-asset-id]').forEach(card=>{const i=ids.indexOf(card.dataset.assetId),button=card.querySelector('.library-select');card.classList.toggle('library-selected',i>=0);if(button){button.setAttribute('aria-pressed',String(i>=0));button.textContent=i>=0?String(i+1):''}});
 const clear=document.querySelector('.library-selection-clear'),add=document.querySelector('.library-selection-add');if(clear)clear.hidden=!ids.length;if(add){add.hidden=!ids.length||(libraryTargetPost===null&&libraryTargetStory===null);add.textContent=libraryTargetStory!==null?'Agregar a este destacado':'Agregar a esta publicación'}
 const create=document.querySelector('.library-selection-create');if(create)create.hidden=ids.length<2||libraryTargetPost!==null||libraryTargetStory!==null;
 const copy=document.querySelector('.library-selection-copy');if(copy)copy.textContent=ids.length>=2&&libraryTargetPost===null&&libraryTargetStory===null?ids.length+' fotos seleccionadas. Tus publicaciones actuales se conservan.':ids.length?ids.length+(ids.length===1?' seleccionada · Arrastrala a una publicación o destacado.':' seleccionadas · Arrastralas a una publicación o destacado.'):'Seleccioná varias con el círculo y arrastralas juntas.';
}
function toggleLibraryPhoto(id,range=false){
 const ids=lib.map(a=>a.id),start=ids.indexOf(libraryAnchor),end=ids.indexOf(id);
 if(range&&start>=0&&end>=0)ids.slice(Math.min(start,end),Math.max(start,end)+1).forEach(x=>librarySelection.add(x));
 else{if(librarySelection.has(id))librarySelection.delete(id);else librarySelection.add(id);libraryAnchor=id}
 syncLibrarySelection();
}
function clearLibrarySelection(){librarySelection.clear();libraryAnchor=null;syncLibrarySelection()}
function addLibrarySelectionUI(title){
 title.querySelector(':scope > span')?.setAttribute('hidden','');
 const bar=dom('div','library-selection-bar'),copy=dom('span','library-selection-copy'),clear=action('Quitar selección',clearLibrarySelection),add=action('Agregar a esta publicación',()=>{if(libraryTargetStory!==null?applyHighlightDrop(libraryTargetStory,[...librarySelection]):libraryTargetPost!==null&&applyLibraryDrop(libraryTargetPost,[...librarySelection]))closeWorkspace()});
 clear.classList.add('library-selection-clear');add.classList.add('library-selection-add');const create=action('Crear carrusel',createLibraryCarousel);create.classList.add('library-selection-create');create.hidden=true;clear.hidden=add.hidden=true;bar.append(copy,create,add,clear);document.querySelector('.studio-sidebar-top').append(bar);syncLibrarySelection();
}
function wireLibrarySelection(card,asset){
 card.dataset.assetId=asset.id;const button=dom('button','library-select');button.type='button';button.setAttribute('aria-label','Seleccionar '+asset.name);button.setAttribute('aria-pressed',String(librarySelection.has(asset.id)));button.title='Seleccionar foto · Shift para seleccionar un rango';button.addEventListener('click',e=>{e.stopPropagation();toggleLibraryPhoto(asset.id,e.shiftKey)});card.append(button);
}
function openPhotoLibrary(){
 libraryTargetPost=simCurrentPost;libraryTargetStory=simStory?.id||null;switchWorkspace('library');syncLibrarySelection();syncStoryPlayback();
}
function closeDirectMedia(){directOrderingPost=null;libraryTargetPost=null;directOrderingStory=null;libraryTargetStory=null;syncLibrarySelection()}
function libraryDragData(data){return data.kind==='tray'?{...data,imgIds:librarySelection.has(data.imgId)?[...librarySelection]:[data.imgId]}:{...data};}

function applyLibraryDrop(index,ids,beforeId=null){
 if(index<0||index>=total)return false;
 const result=appendPostMedia(tiles[index],ids,new Set(lib.map(a=>a.id)),beforeId);
 if(!result.changed){libraryMessage(result.error==='limit'?'No se agregó ninguna foto: el carrusel admite hasta 100.':result.error==='duplicate'?'Estas fotos ya están en la publicación.':'Las fotos ya no están disponibles.');return false}
 tiles[index]=result.tile;normalizeBanners();sel.delete(index);render();renderTray();updateExportUI();commit();
 const selected=postMediaIds(result.tile).indexOf(result.added[0]);refreshDirectPost(index,selected);clearLibrarySelection();libraryMessage(result.added.length+(result.added.length===1?' foto agregada a la publicación.':' fotos agregadas a la publicación.'));return true;
}
function refreshDirectPost(index,slide=0){
 if(simCurrentPost!==index)return;
 const draft=simScreen.querySelector('[aria-label="Comentario"]')?.value||'';showSimPost(index,false,slide);
 if(draft){const input=simScreen.querySelector('[aria-label="Comentario"]');input.value=draft;input.dispatchEvent(new Event('input'))}
}
function reorderDirectPhoto(index,id,beforeId){
 const tile=tiles[index],ids=postMediaIds(tile),from=ids.indexOf(id),to=ids.indexOf(beforeId);if(from<0||to<0||from===to)return false;
 movePostMedia(tile,from,to);normalizeBanners();render();commit();refreshDirectPost(index,to);libraryMessage('Orden guardado. La primera foto es la portada.');return true;
}
function buildInlinePostMedia(media,tile,index){
 const ids=postMediaIds(tile),toggle=simButton('Ordenar fotos de la publicación',()=>{directOrderingPost=directOrderingPost===index?null:index;strip.hidden=directOrderingPost!==index;toggle.setAttribute('aria-expanded',String(!strip.hidden))},'Fotos · '+ids.length),strip=dom('div','sim-inline-media'),list=dom('div','sim-inline-list');toggle.classList.add('sim-inline-toggle');toggle.setAttribute('aria-expanded',String(directOrderingPost===index));strip.hidden=directOrderingPost!==index;list.setAttribute('aria-label','Orden de las fotos');
 ids.forEach((id,i)=>{const asset=lib.find(a=>a.id===id);if(!asset)return;const select=()=>{if(Date.now()<studioSuppressClick)return;media.showSlide?.(i)},card=dom('div','sim-inline-photo'),image=dom('img'),pick=simButton('Ver foto '+(i+1)+' · '+asset.name,e=>{e.stopPropagation();select()}),remove=simButton('Quitar foto '+(i+1)+' del carrusel',()=>{const next=Math.max(0,i-1);detachPostAsset(tile,id);normalizeBanners();render();commit();refreshDirectPost(index,next)},'×');card.addEventListener('click',e=>{if(!e.target.closest('.sim-inline-remove'))select()});
 card.dataset.photoId=id;card.dataset.postIndex=index;pick.classList.add('sim-inline-select');pick.title='Arrastrá para ordenar · Alt + ←/→ para mover';image.src=displaySrc(asset);image.alt='';image.draggable=false;pick.replaceChildren(image,dom('span','',i===0?'Portada':String(i+1)));remove.classList.add('sim-inline-remove');remove.disabled=ids.length===1;remove.hidden=ids.length===1;
 pick.addEventListener('keydown',e=>{if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();const target=i+(e.key==='ArrowRight'?1:-1);if(target>=0&&target<ids.length&&reorderDirectPhoto(index,id,ids[target]))requestAnimationFrame(()=>simScreen?.querySelectorAll('.sim-inline-select')[target]?.focus({preventScroll:true}))}});card.append(pick,remove);wireStudioDrag(card,{kind:'post-photo',postIndex:index,imgId:id});list.append(card);
 });
 const add=simButton('Agregar fotos de la biblioteca',()=>{libraryTargetPost=index;libraryTargetStory=null;if(document.body.dataset.panel!=='library')switchWorkspace('library');syncLibrarySelection()},'+');add.classList.add('sim-inline-add');list.append(add);strip.append(list,dom('small','','Arrastrá para ordenar · La primera es la portada'));media.append(toggle,strip);syncInlineMedia(index,simCurrentSlide);
}
function syncInlineMedia(index,slide){
 if(typeof document==='undefined')return;const screen=document.querySelector('.sim-post-screen[data-post-index="'+index+'"]');screen?.querySelectorAll('.sim-inline-select').forEach((b,i)=>{b.setAttribute('aria-current',String(i===slide))});
}
function studioDropTargetAt(x,y){
 const hit=document.elementFromPoint(x,y),photo=hit?.closest('.sim-inline-photo'),story=hit?.closest('.sim-inline-story');
 if(studioDrag?.kind==='story-photo')return story?{kind:'story-photo',id:story.dataset.highlightId,storyId:story.dataset.storyId}:-1;
 if(studioDrag?.kind==='tray'){const frame=hit?.closest('.sim-story-frame'),highlight=hit?.closest('.hl[data-highlight]');if(frame)return {kind:'highlight',id:frame.closest('.sim-story').dataset.highlightId,beforeId:story?.dataset.storyId||null};if(highlight)return {kind:'highlight',id:highlight.dataset.highlight}}
 if(studioDrag?.kind==='post-photo')return photo?{kind:'photo',index:Number(photo.dataset.postIndex),id:photo.dataset.photoId}:-1;
 if(studioDrag?.kind==='tray'){const media=hit?.closest('.sim-post-media'),screen=media?.closest('.sim-post-screen');if(screen)return {kind:'post',index:Number(screen.dataset.postIndex),beforeId:photo?.dataset.photoId||null}}
 return cellAt(x,y);
}
function clearStudioDrop(){clearDrop();if(typeof document!=='undefined')document.querySelectorAll?.('.library-drop-target').forEach(el=>{el.classList.remove('library-drop-target');delete el.dataset.dropLabel})}
function hintStudioDrop(target){
 clearStudioDrop();if(typeof document==='undefined')return;
 let node;if(target?.kind==='highlight')node=[...document.querySelectorAll('.sim-story')].find(el=>el.dataset.highlightId===target.id)?.querySelector('.sim-story-frame')||[...document.querySelectorAll('.hl[data-highlight]')].find(el=>el.dataset.highlight===target.id);else if(target?.kind==='story-photo')node=[...document.querySelectorAll('.sim-inline-story')].find(el=>el.dataset.storyId===target.storyId);else if(typeof target==='number'){if(target<0)return;node=grid.children[target]}else if(target?.kind==='photo'){node=[...document.querySelectorAll('.sim-inline-photo')].find(el=>el.dataset.photoId===target.id)}else if(target?.kind==='post')node=document.querySelector('.sim-post-screen .sim-post-media');
 if(!node)return;node.classList.add('library-drop-target');const count=studioDrag?.imgIds?.length||1;node.dataset.dropLabel=['post-photo','story-photo'].includes(studioDrag?.kind)?'Mover aquí':(typeof target==='number'&&!tiles[target]?'Crear carrusel':'Agregar')+' · '+count+(count===1?' foto':' fotos');
}
function showStudioDrag(data){
 const asset=lib.find(a=>a.id===(data.imgId||tiles[data.src]?.imgId));if(data.storySrc)showGhost(data.storySrc);else if(asset)showGhost(displaySrc(asset));ghost.dataset.count=(data.imgIds?.length||1)>1?String(data.imgIds.length):'';
}
function autoScrollStudioDrag(x,y){
 const strip=document.querySelector('.sim-inline-list');if(strip){const r=strip.getBoundingClientRect();if(y>=r.top&&y<=r.bottom){if(x<r.left+30)strip.scrollLeft-=16;else if(x>r.right-30)strip.scrollLeft+=16}}
 if(simScreen)return;const main=document.querySelector('.ig-main'),r=main.getBoundingClientRect();if(y<r.top+40)main.scrollTop-=15;else if(y>r.bottom-40)main.scrollTop+=15;
}

/* Stories embed their source so removing a library asset cannot break a highlight. */
let libraryTargetStory=null,directOrderingStory=null;
function editableStories(h){return storyItems(h).map((s,i)=>({...s,id:s.id||'legacy-story-'+i}))}
function appendHighlightMedia(h,assets,beforeId=null){
 if(!h||!assets.length||assets.some(a=>!a?.src))return {changed:false,error:'missing'};
 const current=editableStories(h),sources=new Set(current.map(s=>s.src)),added=[];
 for(const a of assets)if(!sources.has(a.src)){sources.add(a.src);added.push({id:crypto.randomUUID(),src:a.src})}
 if(!added.length)return {changed:false,error:'duplicate'};
 if(current.length+added.length>100)return {changed:false,error:'limit'};
 const at=beforeId===null?current.length:current.findIndex(s=>s.id===beforeId),next=[...current];next.splice(at<0?next.length:at,0,...added);h.stories=next;
 if(!h.cover)h.cover={src:next[0].src,z:1,panX:0,panY:0};return {changed:true,added};
}
function moveHighlightStory(h,id,targetId){
 const next=editableStories(h),from=next.findIndex(s=>s.id===id),to=next.findIndex(s=>s.id===targetId);
 if(from<0||to<0||from===to)return -1;next.splice(to,0,next.splice(from,1)[0]);h.stories=next;return to;
}
function saveDirectStories(id,position=0){
 applyHighlights();renderHighlightsEditor();saveProfile();
 if(simStory?.id===id)showSimStory(id,position,simStory.paused);
}
function applyHighlightDrop(id,ids,beforeId=null){
 const h=profile.highlights.find(h=>h.id===id),assets=ids.map(id=>lib.find(a=>a.id===id)),result=appendHighlightMedia(h,assets,beforeId);
 if(!result.changed){libraryMessage(result.error==='limit'?'No se agregó ninguna foto: el destacado admite hasta 100 historias.':result.error==='duplicate'?'Estas fotos ya están en el destacado.':'Las fotos o el destacado ya no están disponibles.');return false}
 saveDirectStories(id,h.stories.findIndex(s=>s.id===result.added[0].id));clearLibrarySelection();libraryMessage(result.added.length+(result.added.length===1?' historia agregada.':' historias agregadas.'));return true;
}
function reorderDirectStory(id,storyId,targetId){
 const h=profile.highlights.find(h=>h.id===id);if(!h)return false;const position=moveHighlightStory(h,storyId,targetId);if(position<0)return false;
 saveDirectStories(id,position);libraryMessage('Orden de historias guardado.');return true;
}
function openHighlightLibrary(id){libraryTargetPost=null;libraryTargetStory=id;switchWorkspace('library');syncLibrarySelection();syncStoryPlayback()}
function buildInlineStoryMedia(frame,h,position){
 const items=editableStories(h),strip=dom('div','sim-inline-media sim-inline-stories'),list=dom('div','sim-inline-list'),toggle=simButton('Ordenar historias del destacado',()=>{directOrderingStory=directOrderingStory===h.id?null:h.id;strip.hidden=directOrderingStory!==h.id;toggle.setAttribute('aria-expanded',String(!strip.hidden));syncStoryPlayback()},'Historias · '+items.length);
 toggle.classList.add('sim-inline-toggle','sim-story-inline-toggle');toggle.setAttribute('aria-expanded',String(directOrderingStory===h.id));strip.hidden=directOrderingStory!==h.id;list.setAttribute('aria-label','Orden de las historias');
 items.forEach((story,i)=>{
  const card=dom('div','sim-inline-photo sim-inline-story'),image=dom('img'),select=()=>{if(Date.now()<studioSuppressClick)return;showSimStory(h.id,i,simStory?.paused||false)},pick=simButton('Ver historia '+(i+1)+' de '+h.label,e=>{e.stopPropagation();select()}),remove=simButton('Quitar historia '+(i+1)+' del destacado',()=>{h.stories=editableStories(h).filter(s=>s.id!==story.id);saveDirectStories(h.id,Math.max(0,i-1))},'×');
  card.dataset.storyId=story.id;card.dataset.highlightId=h.id;pick.classList.add('sim-inline-select');pick.setAttribute('aria-current',String(i===position));pick.title='Arrastrá para ordenar · Alt + ←/→ para mover';image.src=story.src;image.alt='';image.draggable=false;pick.replaceChildren(image,dom('span','',String(i+1)));remove.classList.add('sim-inline-remove');card.addEventListener('click',e=>{if(!e.target.closest('.sim-inline-remove'))select()});
  pick.addEventListener('keydown',e=>{if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();const target=i+(e.key==='ArrowRight'?1:-1);if(target>=0&&target<items.length&&reorderDirectStory(h.id,story.id,items[target].id))requestAnimationFrame(()=>simScreen?.querySelectorAll('.sim-inline-select')[target]?.focus({preventScroll:true}))}});
  card.append(pick,remove);wireStudioDrag(card,{kind:'story-photo',highlightId:h.id,storyId:story.id,storySrc:story.src});list.append(card);
 });
 const add=simButton('Agregar fotos de la biblioteca al destacado',()=>openHighlightLibrary(h.id),'+');add.classList.add('sim-inline-add');list.append(add);strip.append(list,dom('small','','Arrastrá para ordenar las historias'));frame.append(toggle,strip);syncStoryPlayback();
}

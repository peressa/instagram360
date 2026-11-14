/* Highlight playback: keep one animation alive while pausing/resuming it. */
function storyItems(h){return Array.isArray(h?.stories)?h.stories:h?.cover?[{src:normCover(h.cover).src}]:[];}
function storyTarget(highlights,id,position,delta){
 if(delta!==1&&delta!==-1)return null;
 const group=highlights.findIndex(h=>h.id===id);if(group<0)return null;const items=storyItems(highlights[group]),next=position+delta;
 if(next>=0&&next<items.length)return {id,position:next};
 for(let i=group+delta;i>=0&&i<highlights.length;i+=delta){const n=storyItems(highlights[i]).length;if(n)return {id:highlights[i].id,position:delta<0?n-1:0}}
 return null;
}
function syncStoryPlayback(){const s=simStory;if(!s)return;const stopped=s.paused||document.hidden||(typeof directOrderingStory!=='undefined'&&directOrderingStory===s.id)||(typeof libraryTargetStory!=='undefined'&&libraryTargetStory===s.id);s.screen.dataset.paused=String(stopped);if(s.animation){if(stopped)s.animation.pause();else s.animation.play()}s.pause.setAttribute('aria-label',s.paused?'Reanudar historia':'Pausar historia');s.pause.title=s.pause.getAttribute('aria-label');s.pause.innerHTML=svgLine(s.paused?'<path d="m9 5 10 7-10 7Z"/>':'<path d="M8 5v14M16 5v14"/>');}
function setStoryPaused(paused){if(simStory){simStory.paused=paused;syncStoryPlayback()}}
function showSimStory(id,position=0,paused=false,elapsed=0){
 const h=profile.highlights.find(h=>h.id===id);if(!h)return;const items=storyItems(h);position=Math.max(0,Math.min(position,items.length-1));
 const {screen,head,content}=createSimScreen(h.label),desktop=document.querySelector('.phone').classList.contains('web-layout');screen.classList.add('sim-story');screen.dataset.highlightId=id;screen.dataset.storyIndex=position;screen.tabIndex=-1;screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');screen.setAttribute('aria-label','Historias de '+h.label);
 const frame=dom('div','sim-story-frame');screen.replaceChildren(frame);frame.append(content);const progress=dom('div','sim-story-progress');progress.setAttribute('aria-label','Historia '+(items.length?position+1:0)+' de '+items.length);let current=null;
 items.forEach((_,i)=>{const segment=dom('span',i<position?'seen':''),fill=dom('i');segment.append(fill);if(i===position)current=fill;progress.append(segment)});frame.append(progress,head);
 const close=simButton('Cerrar historias',closeSimScreen,svgLine('<path d="m6 6 12 12M18 6 6 18"/>')),avatar=dom('img'),identity=dom('div','sim-story-identity');setSafeAvatar(avatar);avatar.alt='';identity.append(dom('b','',profile.handle),dom('small','',h.label));const pause=simButton('Pausar historia',()=>setStoryPaused(!simStory.paused)),options=simButton('Editar historias',()=>editSimStories(id),igIcon('Opciones'));head.replaceChildren(avatar,identity,pause,options);if(!desktop)head.append(close);else screen.append(close);close.classList.add('sim-story-close');
 pause.disabled=!items.length;const scene={id,position,paused,screen,pause,animation:null};simStory=scene;syncStoryPlayback();
 if(items.length){const img=dom('img','sim-story-image');img.alt=h.label+' · historia '+(position+1);img.draggable=false;let started=false;const start=()=>{if(started||simStory!==scene||!screen.isConnected)return;started=true;scene.animation=current.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:6000,fill:'forwards'});scene.animation.currentTime=Math.max(0,Math.min(5999,elapsed));scene.animation.onfinish=()=>{if(simStory===scene)advanceSimStory(1)};syncStoryPlayback()};img.onload=start;img.onerror=()=>{content.append(dom('p','sim-story-error','No se pudo cargar esta historia.'));start()};img.src=items[position].src;content.append(img);requestAnimationFrame(()=>{if(img.complete&&img.naturalWidth)start()})}
 else content.append(dom('p','sim-empty-note','Este destacado todavía no tiene historias.'),simButton('Agregar historias',()=>openHighlightLibrary(id)));
 const controls=dom('div','sim-story-controls'),previous=simButton('Historia anterior',()=>advanceSimStory(-1),'‹'),next=simButton('Historia siguiente',()=>advanceSimStory(1),'›');previous.disabled=!storyTarget(profile.highlights,id,position,-1);previous.classList.add('sim-story-zone');next.classList.add('sim-story-zone');controls.append(previous,next);if(items.length)frame.append(controls);
 if(desktop&&items.length){previous.setAttribute('aria-label','Retroceder tocando la imagen');next.setAttribute('aria-label','Avanzar tocando la imagen');const before=simButton('Historia anterior',()=>advanceSimStory(-1),'‹'),after=simButton('Historia siguiente',()=>advanceSimStory(1),'›');before.classList.add('sim-story-arrow','previous');after.classList.add('sim-story-arrow','next');before.disabled=previous.disabled;screen.append(before,after)}
 buildInlineStoryMedia(frame,h,position);
 if(desktop)screen.addEventListener('click',e=>{if(e.target===screen)closeSimScreen()});
 let down=null;
 frame.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.sim-inline-media,.sim-topbar,button:not(.sim-story-zone)'))return;down={x:e.clientX,y:e.clientY,time:Date.now(),paused:scene.paused};setStoryPaused(true)});
 frame.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>12){e.preventDefault();frame.setPointerCapture(e.pointerId)}});
 const finish=e=>{if(!down)return;const start=down;down=null;const dx=e.clientX-start.x,dy=e.clientY-start.y,gesture=Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2,held=Date.now()-start.time>200;if(gesture||held||e.type==='pointercancel'){simGestureUntil=Date.now()+350;e.preventDefault()}if(simStory===scene)setStoryPaused(start.paused);if(e.type!=='pointercancel'&&gesture)advanceSimStory(dx<0?1:-1)};frame.addEventListener('pointerup',finish);frame.addEventListener('pointercancel',finish);
 requestAnimationFrame(()=>{if(screen.isConnected)screen.focus({preventScroll:true})});
}
function advanceSimStory(delta){if(!simStory)return;const {id,position,paused}=simStory,target=storyTarget(profile.highlights,id,position,delta);if(target)showSimStory(target.id,target.position,paused);else if(delta>0)closeSimScreen();}

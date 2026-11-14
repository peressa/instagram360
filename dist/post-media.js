/* A post owns an ordered list of library asset IDs; the first is its grid cover. */
function postMediaIds(tile){return tile?[...new Set([tile.imgId,...(Array.isArray(tile.carouselIds)?tile.carouselIds:[])].filter(Boolean))]:[];}
function setPostMedia(tile,ids){
 const ordered=[...new Set(ids)];if(!ordered.length)return false;
 if(tile.imgId!==ordered[0]){tile.z=1;tile.panX=0;tile.panY=0;delete tile.banner;delete tile.bz}
 tile.imgId=ordered[0];if(ordered.length>1){tile.carouselIds=ordered;tile.kind='carousel'}else{delete tile.carouselIds;if(tile.kind==='carousel')tile.kind='photo'}return true;
}
function movePostMedia(tile,from,to){const ids=postMediaIds(tile);if(from<0||to<0||from>=ids.length||to>=ids.length)return false;ids.splice(to,0,ids.splice(from,1)[0]);return setPostMedia(tile,ids);}
function detachPostAsset(tile,id){return setPostMedia(tile,postMediaIds(tile).filter(item=>item!==id));}
function validPostMedia(tile,assetIds){return tile.carouselIds===undefined||Array.isArray(tile.carouselIds)&&tile.carouselIds.length>=1&&tile.carouselIds.length<=100&&tile.carouselIds[0]===tile.imgId&&new Set(tile.carouselIds).size===tile.carouselIds.length&&tile.carouselIds.every(id=>typeof id==='string'&&(!assetIds||assetIds.has(id)));}

function buildPostMedia(media,tile,asset,index,start=0){
 const items=postMediaIds(tile).map(id=>lib.find(a=>a.id===id)).filter(Boolean);
 const like=()=>{if(!tile.simLiked){tile.simLiked=true;save();showSimPost(index)}};
 if(items.length<2){const img=dom('img','sim-post-image');img.src=displaySrc(asset);img.alt=tile.caption||asset.name;img.draggable=false;img.addEventListener('dblclick',like);media.append(img);simCurrentSlide=0;return}
 media.classList.add('sim-carousel');const track=dom('div','sim-carousel-track');track.setAttribute('aria-label','Fotos de la publicación');track.setAttribute('role','group');
 items.forEach((a,i)=>{const img=dom('img','sim-post-image');img.src=displaySrc(a);img.alt='Foto '+(i+1)+' de '+items.length+' · '+a.name;img.draggable=false;img.addEventListener('dblclick',like);track.append(img)});
 const counter=dom('span','sim-carousel-count'),dots=dom('div','sim-carousel-dots');counter.setAttribute('aria-live','polite');
 const show=i=>{simCurrentSlide=Math.max(0,Math.min(items.length-1,i));track.scrollTo({left:track.clientWidth*simCurrentSlide,behavior:'smooth'});sync()};
 const previous=simButton('Foto anterior',()=>show(simCurrentSlide-1),igIcon('back')),next=simButton('Foto siguiente',()=>show(simCurrentSlide+1),svgLine('<path d="m9 5 7 7-7 7"/>'));previous.classList.add('sim-carousel-prev');next.classList.add('sim-carousel-next');
 items.forEach((_,i)=>{const dot=simButton('Ir a la foto '+(i+1),()=>show(i));dot.textContent='';dots.append(dot)});
 function sync(){counter.textContent=(simCurrentSlide+1)+' / '+items.length;previous.hidden=simCurrentSlide===0;next.hidden=simCurrentSlide===items.length-1;[...dots.children].forEach((dot,i)=>{dot.classList.toggle('active',i===simCurrentSlide);dot.setAttribute('aria-current',String(i===simCurrentSlide))});media.dataset.slideIndex=simCurrentSlide}
 simCurrentSlide=Math.max(0,Math.min(items.length-1,start));media.append(track,counter,previous,next,dots);sync();
 track.addEventListener('scroll',()=>{if(!track.isConnected||simCurrentPost!==index)return;const i=Math.round(track.scrollLeft/track.clientWidth);if(Number.isFinite(i)){simCurrentSlide=Math.max(0,Math.min(items.length-1,i));sync()}},{passive:true});
 media.changeSlide=delta=>show(simCurrentSlide+delta);
 requestAnimationFrame(()=>{if(track.isConnected){track.scrollLeft=track.clientWidth*simCurrentSlide;sync()}});
}

function buildPostMediaEditor(dialog,tile,preview){
 const section=dom('section','post-media-editor'),list=dom('div','post-media-list'),status=dom('p','editor-note');status.setAttribute('role','status');section.append(dom('h3','','Fotos de la publicación'),list);let dragging=null,busy=false;
 const changed=()=>{const cover=lib.find(a=>a.id===tile.imgId);preview.src=displaySrc(cover);preview.alt=cover.name;const kind=dialog.querySelector('[aria-label="Tipo"]');if(kind)kind.value=tile.kind||'photo';render();renderTray();commit();redraw();if(busy)dialog.querySelectorAll('button').forEach(b=>b.disabled=true)};
 const redraw=()=>{list.replaceChildren();const ids=postMediaIds(tile);ids.forEach((id,i)=>{const a=lib.find(x=>x.id===id);if(!a)return;const card=dom('div','post-media-item'),img=dom('img');img.src=displaySrc(a);img.alt='Foto '+(i+1)+' · '+a.name;img.draggable=false;card.draggable=true;card.append(img,dom('small','',i===0?'1 · Portada':String(i+1)));card.addEventListener('dragstart',e=>{dragging=i;e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move'});card.addEventListener('dragover',e=>{e.preventDefault()});card.addEventListener('drop',e=>{e.preventDefault();if(dragging!==null){movePostMedia(tile,dragging,i);dragging=null;changed()}});const controls=dom('div','post-media-controls');[-1,1].forEach(delta=>{const b=simButton((delta<0?'Mover antes foto ':'Mover después foto ')+(i+1),()=>{movePostMedia(tile,i,i+delta);changed()},delta<0?'←':'→');b.disabled=i+delta<0||i+delta>=ids.length;controls.append(b)});const remove=simButton('Quitar foto '+(i+1),()=>{detachPostAsset(tile,id);changed()},'×');remove.disabled=ids.length===1;controls.append(remove);card.append(controls);list.append(card)})};
 const input=dom('input');input.type='file';input.accept='image/*';input.multiple=true;input.hidden=true;
 const upload=action('+ Agregar fotos',()=>input.click());input.addEventListener('change',async()=>{const files=[...input.files];input.value='';if(!files.length)return;busy=true;const locked=[...dialog.querySelectorAll('button')].map(b=>[b,b.disabled]);locked.forEach(([b])=>b.disabled=true);let added=0,failed=0;try{for(const file of files){if(postMediaIds(tile).length>=100){failed+=files.length-added-failed;break}if(!file.type.startsWith('image/')||file.size>50*1024*1024){failed++;continue}try{const image=await readImageFile(file);if(!image){failed++;continue}const a={...image,id:crypto.randomUUID(),name:file.name};if(!await put('assets',a)){failed++;continue}lib.push(a);cacheDisplayBlob(a.id,a.src);setPostMedia(tile,[...postMediaIds(tile),a.id]);added++;changed();status.textContent='Agregadas '+added+' de '+files.length+' fotos.'}catch{failed++}}}finally{busy=false;locked.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled});redraw();status.textContent=added+' fotos agregadas.'+(failed?' '+failed+' no se pudieron agregar (imagen inválida, más de 50 MB o límite de 100 fotos).':'')}});
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});section.append(input,upload,status,dom('p','editor-note','Arrastrá para ordenar. La primera foto es la portada. Quitar una foto del carrusel la conserva en tu biblioteca.'));dialog.append(section);redraw();
}

async function renderCarouselBlob(asset,fmt){const {W,H}=exportSize(),image=await loadImg(displaySrc(asset)),c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d'),scale=Math.min(W/image.naturalWidth,H/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.drawImage(image,(W-w)/2,(H-h)/2,w,h);return new Promise(resolve=>c.toBlob(resolve,fmt==='jpg'?'image/jpeg':'image/png',.92));}

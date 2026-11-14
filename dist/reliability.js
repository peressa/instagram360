/* Small state operations shared by the editor, persistence and exports. */
function normalizedPinnedTiles(items,limit=3){
 let kept=0;const next=items.map(t=>{if(!t?.pinned)return t;if(kept++<limit)return t;const copy={...t,pinned:false};delete copy.pinPosition;return copy});
 const result=[...next.filter(t=>t?.pinned),...next.filter(t=>!t?.pinned)];
 return result.some((t,i)=>t!==items[i])?result:items;
}
function changedPostPin(items,index,pinned){
 const current=items[index];if(!current)return {changed:false,error:'missing'};
 if(!!current.pinned===pinned)return {changed:false,index,tiles:items};
 if(pinned&&items.filter(t=>t?.pinned).length>=3)return {changed:false,error:'limit'};
 const tile={...current,pinned},rest=items.filter((_,i)=>i!==index),pins=rest.filter(t=>t?.pinned),others=rest.filter(t=>!t?.pinned);
 if(pinned){tile.pinPosition=index;return {changed:true,tiles:[tile,...pins,...others],index:0}}
 const at=Math.max(0,Math.min(others.length,(current.pinPosition??pins.length)-pins.length));delete tile.pinPosition;others.splice(at,0,tile);
 return {changed:true,tiles:[...pins,...others],index:pins.length+at};
}
function decorateExportOrder(doc,enabled){
 if(!enabled)return;const cells=[...doc.querySelectorAll('.phone .cell.has')].filter(e=>!e.hidden);
 cells.reverse().forEach((cell,i)=>{const badge=doc.createElement('span');badge.className='export-order';badge.textContent=String(i+1);cell.append(badge)});
}
function showPhotoError(file,reason){
 let notice=document.getElementById('photoNotice');if(!notice){notice=dom('div','photo-notice');notice.id='photoNotice';notice.setAttribute('role','alert');document.body.append(notice)}
 const text=dom('span','',(file?.name?file.name+': ':'')+reason),close=action('×',()=>notice.remove());close.setAttribute('aria-label','Cerrar aviso de imagen');notice.replaceChildren(text,close);
}
async function importLibraryAsset(file){
 try{
  if(!file?.type?.startsWith('image/'))throw Error('Elegí un archivo de imagen.');
  if(file.size>50*1024*1024)throw Error('La imagen supera los 50 MB. Reducí su tamaño.');
  const image=await readImageFile(file);if(!image)throw Error('No se pudo abrir la imagen. Probá otro archivo.');
  const asset={...image,id:crypto.randomUUID(),name:file.name};if(!await put('assets',asset))throw Error('No se pudo guardar la imagen. Reintentá o guardá un respaldo.');
  lib.push(asset);cacheDisplayBlob(asset.id,file);return asset;
 }catch(error){showPhotoError(file,error.message||'No se pudo leer la imagen.');return null}
}

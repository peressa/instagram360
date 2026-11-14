/* Wire format: small independently versioned fields; image bytes travel separately. */
const SharedProjectModel=(()=>{
 const PROFILE=['handle','name','bio','link','posts','followers','following','verified','autoPosts','category','pronouns','address','extraLinks','mutual','private','storyRing','followLabel','messageLabel','ownerEditLabel','ownerShareLabel','ownerWebSecondaryLabel','contacts','showVideo','showReposts','showTagged','hlOpen','simFollowing'];
 const POST=['imgId','z','panX','panY','banner','bz','kind','pinned','pinPosition','caption','likes','views','comments','date','location','simLiked','simSaved','carouselIds'];
 const COPY=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const id=s=>encodeURIComponent(s),mediaPattern=/^ig360-media:([a-f0-9]{64})$/;
 const slugify=s=>String(s||'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70).replace(/-$/,'')||'proyecto';
 const validSlug=s=>typeof s==='string'&&s.length<=80&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
 function flatten(data,imageRef=s=>s){
  const out=Object.create(null),put=(k,v)=>{if(v!==undefined)out[k]=COPY(v)},cover=(prefix,v)=>{if(!v)return;const c=typeof v==='string'?{src:v}:v;for(const k of ['src','z','panX','panY','cropVersion'])put(prefix+'/'+k,k==='src'?imageRef(c[k]):c[k])};
  put('name',String(data.name||data.profile.name||'Proyecto'));for(const k of PROFILE)put('profile/'+k,data.profile[k]);cover('avatar',data.profile.avatar);
  put('highlightOrder',data.profile.highlights.map(h=>h.id));
  for(const h of data.profile.highlights){const prefix='highlight/'+id(h.id);put(prefix+'/label',h.label);cover(prefix+'/cover',h.cover);const stories=h.stories||[];put(prefix+'/storyOrder',stories.map((s,i)=>s.id||'legacy-'+i));for(const [i,s] of stories.entries())put('story/'+id(h.id)+'/'+id(s.id||'legacy-'+i)+'/src',imageRef(s.src))}
  for(const k of ['rows','RW','RH'])put('layout/'+k,data.layout[k]);
  data.layout.tiles.forEach((t,i)=>{put('slot/'+i,t?t._sharedId:null);if(!t)return;if(!t._sharedId)throw Error('Falta identificar una publicación.');const prefix='post/'+id(t._sharedId);for(const k of POST)put(prefix+'/'+k,t[k]);for(const c of t.commentEntries||[])for(const k of ['text','author','createdAt'])put('comment/'+id(t._sharedId)+'/'+id(c.id)+'/'+k,c[k])});
  for(const a of data.assets)for(const k of ['name','w','h','src'])put('asset/'+id(a.id)+'/'+k,k==='src'?imageRef(a[k]):a[k]);
  return out;
 }
 function expand(flat,image=s=>s,drafts=new Map()){
  const get=(k,fallback)=>flat[k]===undefined?fallback:COPY(flat[k]),cover=prefix=>flat[prefix+'/src']===undefined?null:Object.fromEntries(['src','z','panX','panY','cropVersion'].filter(k=>flat[prefix+'/'+k]!==undefined).map(k=>[k,k==='src'?image(flat[prefix+'/'+k]):get(prefix+'/'+k)]));
  const profile=Object.create(null);for(const k of PROFILE)if(flat['profile/'+k]!==undefined)profile[k]=get('profile/'+k);profile.avatar=cover('avatar');profile.highlights=get('highlightOrder',[]).map(hid=>{const p='highlight/'+id(hid);return {id:hid,label:get(p+'/label',''),cover:cover(p+'/cover'),stories:get(p+'/storyOrder',[]).map(sid=>({id:sid,src:image(get('story/'+id(hid)+'/'+id(sid)+'/src',''))}))}});
  const layout={rows:get('layout/rows',3),RW:get('layout/RW',3),RH:get('layout/RH',4),tiles:[]};
  for(let i=0;i<layout.rows*3;i++){const pid=get('slot/'+i,null);if(!pid){layout.tiles.push(null);continue}const p='post/'+id(pid),tile={_sharedId:pid};for(const k of POST)if(flat[p+'/'+k]!==undefined)tile[k]=get(p+'/'+k);const comments=new Map();for(const key of Object.keys(flat)){const bits=key.split('/');if(bits[0]==='comment'&&bits[1]===id(pid)){const cid=decodeURIComponent(bits[2]);if(!comments.has(cid))comments.set(cid,{id:cid});comments.get(cid)[bits[3]]=get(key)}}if(comments.size)tile.commentEntries=[...comments.values()].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||a.id.localeCompare(b.id));if(drafts.has(pid))tile.commentDraft=drafts.get(pid);layout.tiles.push(tile)}
  const assets=[],assetIds=new Set(Object.keys(flat).filter(k=>k.startsWith('asset/')).map(k=>k.split('/')[1]));for(const aid of assetIds){const p='asset/'+aid;assets.push({id:decodeURIComponent(aid),name:get(p+'/name','foto'),w:get(p+'/w',1),h:get(p+'/h',1),src:image(get(p+'/src',''))})}
  return {format:'instagram360',version:1,name:get('name','Proyecto'),profile,layout,assets};
 }
 function diff(before,after){return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>!equal(before[k],after[k])).map(key=>({key,before:before[key]??null,value:after[key]??null,remove:after[key]===undefined,missing:before[key]===undefined}))}
 function apply(values,ops){const next={...values};for(const op of ops)if(op.remove)delete next[op.key];else next[op.key]=COPY(op.value);return next}
 function mergePatch(values,ops){
  const conflicts=[],effective=[];
  for(const incoming of ops){const op=COPY(incoming),current=values[op.key],before=op.missing?undefined:op.before,after=op.remove?undefined:op.value;if(equal(current,after))continue;
   if(!equal(current,before)){
    const appendable=op.key==='highlightOrder'||/\/(storyOrder|carouselIds)$/.test(op.key);
    if(appendable&&Array.isArray(before)&&Array.isArray(current)&&Array.isArray(after)&&equal(current.slice(0,before.length),before)&&equal(after.slice(0,before.length),before)){op.value=[...new Set([...current,...after.slice(before.length)])]}
    else{conflicts.push(op.key);continue}
   }effective.push(op);
  }
  return conflicts.length?{conflicts}:{conflicts:[],ops:effective,values:apply(values,effective)};
 }
 function validKey(key){
  const p=key.split('/'),safe=s=>s&&s.length<=300&&!['__proto__','prototype','constructor'].includes(s);
  if(key==='name'||key==='highlightOrder')return true;
  if(p[0]==='profile'&&p.length===2)return PROFILE.includes(p[1]);
  if(p[0]==='layout'&&p.length===2)return ['rows','RW','RH'].includes(p[1]);
  if(p[0]==='slot'&&p.length===2)return /^(?:[0-9]|1[0-9]|2[0-6])$/.test(p[1]);
  if(p[0]==='post'&&p.length===3)return safe(p[1])&&POST.includes(p[2]);
  if(p[0]==='asset'&&p.length===3)return safe(p[1])&&['name','w','h','src'].includes(p[2]);
  if(p[0]==='avatar'&&p.length===2)return ['src','z','panX','panY','cropVersion'].includes(p[1]);
  if(p[0]==='highlight'&&safe(p[1]))return p.length===3&&['label','storyOrder'].includes(p[2])||p.length===4&&p[2]==='cover'&&['src','z','panX','panY','cropVersion'].includes(p[3]);
  if(p[0]==='story'&&p.length===4)return safe(p[1])&&safe(p[2])&&p[3]==='src';
  return p[0]==='comment'&&p.length===4&&safe(p[1])&&safe(p[2])&&['text','author','createdAt'].includes(p[3]);
 }
 function validate(values){
  if(!values||Array.isArray(values)||Object.keys(values).length>30000||JSON.stringify(values).length>8*1024*1024||Object.keys(values).some(k=>!validKey(k)))throw Error('El proyecto supera el tamaño admitido o tiene campos inválidos.');
  const d=expand(values),p=d.profile,l=d.layout,src=s=>typeof s==='string'&&mediaPattern.test(s),text=(s,n=2200)=>typeof s==='string'&&s.length<=n,unique=a=>new Set(a).size===a.length;
  if(!text(d.name,120)||!['handle','name','bio','link','posts','followers','following'].every(k=>text(p[k]))||![3,6,9].includes(l.rows)||![[3,4],[4,5],[1,1]].some(([w,h])=>w===l.RW&&h===l.RH))throw Error('Perfil o grilla inválidos.');
  if(['verified','autoPosts','private','showVideo','showReposts','showTagged','hlOpen','simFollowing'].some(k=>p[k]!==undefined&&typeof p[k]!=='boolean')||['category','pronouns','address','mutual','storyRing','followLabel','messageLabel','ownerEditLabel','ownerShareLabel','ownerWebSecondaryLabel'].some(k=>p[k]!==undefined&&!text(p[k]))||['contacts','extraLinks'].some(k=>p[k]!==undefined&&(!Array.isArray(p[k])||p[k].length>20||p[k].some(v=>!text(v)))))throw Error('Campos del perfil inválidos.');
  const cover=c=>!c||src(c.src)&&['z','panX','panY'].every(k=>c[k]===undefined||Number.isFinite(c[k]));
  if(!cover(p.avatar)||p.highlights.length>50||!unique(p.highlights.map(h=>h.id))||p.highlights.some(h=>!text(h.id,100)||!text(h.label,80)||!cover(h.cover)||h.stories.length>100||!unique(h.stories.map(s=>s.id))||h.stories.some(s=>!text(s.id,100)||!src(s.src))))throw Error('Destacados inválidos.');
  if(d.assets.length>500||!unique(d.assets.map(a=>a.id))||d.assets.some(a=>!text(a.id,100)||!text(a.name,200)||!src(a.src)||!Number.isFinite(a.w)||a.w<=0||!Number.isFinite(a.h)||a.h<=0))throw Error('Biblioteca inválida.');
  const assets=new Set(d.assets.map(a=>a.id)),posts=l.tiles.filter(Boolean);if(!unique(posts.map(t=>t._sharedId))||posts.filter(t=>t.pinned).length>3)throw Error('Publicaciones duplicadas o demasiados fijados.');
  if(posts.some(t=>!text(t._sharedId,100)||!assets.has(t.imgId)||['z','panX','panY'].some(k=>!Number.isFinite(t[k]))||t.carouselIds!==undefined&&(!Array.isArray(t.carouselIds)||t.carouselIds.length>100||t.carouselIds[0]!==t.imgId||!unique(t.carouselIds)||t.carouselIds.some(id=>!assets.has(id)))||t.caption!==undefined&&!text(t.caption)||(t.commentEntries||[]).some(c=>!text(c.id,100)||!text(c.author,200)||!text(c.text))))throw Error('Publicación inválida.');
  if(posts.some(t=>['likes','views','comments','date','location'].some(k=>t[k]!==undefined&&!text(t[k]))||['pinned','simLiked','simSaved'].some(k=>t[k]!==undefined&&typeof t[k]!=='boolean')||(t.commentEntries||[]).length>2000||(t.commentEntries||[]).some(c=>c.createdAt!==undefined&&!Number.isFinite(c.createdAt))))throw Error('Metadatos de publicación inválidos.');
  return d;
 }
 const mediaRefs=values=>[...new Set(Object.entries(values).filter(([k,v])=>k.endsWith('/src')&&typeof v==='string'&&mediaPattern.test(v)).map(([,v])=>v.slice(12)))];
 return {PROFILE,POST,slugify,validSlug,flatten,expand,diff,apply,mergePatch,validate,validKey,mediaRefs,mediaPattern,equal};
})();
if(typeof module!=='undefined')module.exports=SharedProjectModel;

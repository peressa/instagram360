/* Counts stay exact in storage; only their presentation is abbreviated. */
const PROFILE_COUNT_FIELDS=new Set(['posts','followers','following']);
function parseProfileCount(value){
 let text=String(value??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s\u00a0\u202f]/g,'');
 if(!text)return 0;if(/^-[\d.,]+(?:k|m|mil|millones?)?$/.test(text))return 0;
 const suffix=text.match(/(millones|millon|miles|mil|k|m)$/);let factor=1;
 if(suffix){factor=['m','millon','millones'].includes(suffix[1])?1000000:1000;text=text.slice(0,-suffix[1].length)}
 if(!/^\d+(?:[.,]\d+)*$/.test(text))return null;
 const separators=(text.match(/[.,]/g)||[]).length;
 if(!suffix&&/^\d{1,3}([.,]\d{3})+$/.test(text)||separators>1&&/^\d{1,3}([.,]\d{3})+$/.test(text))text=text.replace(/[.,]/g,'');
 else if(separators){const last=Math.max(text.lastIndexOf(','),text.lastIndexOf('.'));text=text.slice(0,last).replace(/[.,]/g,'')+'.'+text.slice(last+1)}
 const count=Math.round(Number(text)*factor);return Number.isSafeInteger(count)&&count>=0?count:null;
}
/* Verified Instagram web Spanish samples are in references/counts/.
   Android video evidence only covers zero counts; native abbreviation parity is pending.
   See references/counts/REVISION-ANDROID.md. All device variants currently share this web-derived formatter.
   9653 is exact and 10101 is compact; the 10000 boundary is inferred, not a published Meta contract.
   Counts beyond the observed follower range keep exact digits instead of invented units. */
function formatProfileCount(value){
 const n=parseProfileCount(value);if(n===null)return String(value??'');
 if(n<10000||n>=1000000000)return String(n);
 const nf=new Intl.NumberFormat('es-AR',{maximumFractionDigits:1,useGrouping:false});
 if(n<1000000)return nf.format(n<100000?Math.floor(n/100)/10:Math.floor(n/1000))+'\u00a0mil';
 return nf.format(n<100000000?Math.floor(n/100000)/10:Math.floor(n/1000000))+'\u00a0M';
}
function formatExactProfileCount(value,field){const n=parseProfileCount(value);if(n===null)return String(value??'');return field==='posts'&&n>=10000?new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(n):String(n);}
function canonicalProfileCount(field,value){if(!PROFILE_COUNT_FIELDS.has(field))return value;const n=parseProfileCount(value);return n===null?value:String(n);}
function profileFieldDisplay(field){const value=field==='posts'&&profile.autoPosts?filled().length:profile[field]??'';return field==='followers'?formatProfileCount(value):PROFILE_COUNT_FIELDS.has(field)?formatExactProfileCount(value,field):value;}
function profileFieldForEditing(field,value){return PROFILE_COUNT_FIELDS.has(field)?canonicalProfileCount(field,value):value;}

function profileCountLabel(field,value){const words={posts:['publicación','publicaciones'],followers:['seguidor','seguidores'],following:['seguido','seguidos']};return words[field][parseProfileCount(value)===1?0:1]}
function syncProfileCountLabels(){
 for(const field of PROFILE_COUNT_FIELDS){const value=field==='posts'&&profile.autoPosts?filled().length:profile[field];document.querySelectorAll('[data-f="'+field+'"]').forEach(el=>{const label=el.closest('.stat')?.querySelector('span');if(label)label.textContent=profileCountLabel(field,value)})}
}

const assert=require('node:assert/strict'),fs=require('node:fs'),{DatabaseSync}=require('node:sqlite');
const Model=global.SharedProjectModel=require('../dist/shared-model.js'),Sync=require('../dist/live-sync.js');
const example=JSON.parse(fs.readFileSync('examples/studio360.json','utf8'));
const hashes=new Map(),blobs=new Map();
const hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const encode=src=>{if(!src)return src;if(!hashes.has(src)){const mime=src.slice(5,src.indexOf(';')),bytes=Buffer.from(src.slice(src.indexOf(',')+1),'base64'),h=hash(bytes);hashes.set(src,'ig360-media:'+h);blobs.set(h,{mime,bytes})}return hashes.get(src)};
example.layout.tiles.forEach((t,i)=>{if(t)t._sharedId='post-'+i});
example.layout.tiles[0].commentDraft='PRIVATE DRAFT';example.profile.simMessages=['PRIVATE MESSAGE'];
const values=Model.flatten(example,encode);Model.validate(values);assert.ok(!JSON.stringify(values).includes('PRIVATE'));
const roundtrip=Model.expand(values,ref=>[...hashes].find(([,v])=>v===ref)?.[0]);assert.equal(roundtrip.assets[0].src,example.assets[0].src);assert.equal(roundtrip.layout.tiles[0]._sharedId,'post-0');assert.equal(roundtrip.layout.tiles[0].commentDraft,undefined);
assert.throws(()=>Model.validate({...values,'profile/__proto__':'bad'}));assert.throws(()=>Model.validate({...values,'layout/rows':10}));assert.throws(()=>Model.validate({...values,'asset/new/src':'https://external.invalid'}));assert.throws(()=>Model.flatten({...example,layout:{...example.layout,tiles:[{...example.layout.tiles[0],_sharedId:null}]}},encode));
const change=(before,key,value)=>Model.diff(before,{...before,[key]:value});
const disjoint=Model.mergePatch({...values,'profile/bio':'Other'},change(values,'profile/name','Mine'));assert.equal(disjoint.values['profile/bio'],'Other');assert.equal(disjoint.values['profile/name'],'Mine');
assert.deepEqual(Model.mergePatch({...values,'profile/name':'Other'},change(values,'profile/name','Mine')).conflicts,['profile/name']);
const order={'highlightOrder':['a']};assert.deepEqual(Model.mergePatch({'highlightOrder':['a','b']},change(order,'highlightOrder',['a','c'])).values.highlightOrder,['a','b','c']);
// Two independent editors with a deterministic transport, including dropped acknowledgements.
let remote={...values},revision=1,queue=[],saved;
const clients=[];function client(state){const c=new Sync({clientId:'client-'+clients.length,state,persist:s=>saved=structuredClone(s),send:m=>{queue.push([c,m]);return true}});clients.push(c);c.open({values:remote,revision});if(!state)c.setBaseline(remote);return c}
function drain(){while(queue.length){const [sender,m]=queue.shift(),merged=Model.mergePatch(remote,m.ops);if(merged.conflicts.length){sender.receive({type:'conflict',id:m.id,values:remote,revision});continue}remote=merged.values;revision++;for(const c of clients)c.receive({type:'patch',id:m.id,ops:merged.ops,revision});sender.receive({type:'ack',id:m.id,revision})}}
const a=client(),b=client();a.capture({...a.baseline,'profile/name':'Alice'});b.capture({...b.baseline,'profile/bio':'Bob'});drain();assert.equal(remote['profile/name'],'Alice');assert.equal(remote['profile/bio'],'Bob');assert.equal(a.pending.size,0);assert.equal(b.pending.size,0);
a.setBaseline(a.effective());b.setBaseline(b.effective());a.capture({...a.baseline,'profile/name':'A'});b.capture({...b.baseline,'profile/name':'B'});drain();assert.deepEqual(b.conflicts,['profile/name']);assert.equal(b.effective()['profile/name'],'B');b.retryMine();drain();assert.equal(remote['profile/name'],'B');
a.setBaseline(a.effective());a.capture({...a.baseline,'profile/bio':'one'});a.capture({...a.baseline,'profile/bio':'two'});drain();assert.equal(remote['profile/bio'],'two');assert.equal(a.pending.size,0);
a.setBaseline(a.effective());a.close();a.capture({...a.baseline,'profile/bio':'offline'});const restored=client(a.state());drain();assert.equal(remote['profile/bio'],'offline');assert.equal(restored.pending.size,0);
// Undo affects the author's field only, leaving another editor's unrelated changes.
b.setBaseline(b.effective());b.capture({...b.baseline,'profile/link':'changed.dev'});drain();assert.equal(b.undo(),true);drain();assert.equal(remote['profile/bio'],'offline');assert.equal(remote['profile/link'],values['profile/link']);


// A persisted flight whose ack was lost must not revert later edits on reconnect.
let oldFlight;const lost=new Sync({clientId:'lost',send:m=>{oldFlight=m;return true}});lost.open({values,revision:1});lost.setBaseline(values);lost.capture({...values,'profile/name':'Delivered'});
const delivered={...values,'profile/name':'Delivered','profile/bio':'Later remote edit'};let retry;
const resumed=new Sync({clientId:'resumed',state:lost.state(),send:m=>{retry=m;return true}});resumed.open({values:delivered,revision:3});assert.equal(retry.id,oldFlight.id);resumed.receive({type:'ack',id:retry.id,revision:2});assert.equal(resumed.pending.size,0);assert.equal(resumed.effective()['profile/bio'],'Later remote edit');assert.equal(resumed.effective()['profile/name'],'Delivered');
// Offline concurrent appends can merge without forcing a false same-field conflict.
const append=new Sync({clientId:'append',send:()=>true});append.snapshot({values:{highlightOrder:['a']},revision:1});append.setBaseline(append.remote);append.capture({highlightOrder:['a','c']});append.open({values:{highlightOrder:['a','b']},revision:2});assert.equal(append.conflicts.length,0);assert.deepEqual(append.effective().highlightOrder,['a','b','c']);

(async()=>{
 const {ProjectRoom,default:router}=await import('../server/worker.mjs');
 const database=new DatabaseSync(':memory:');const sql={exec(query,...args){const stmt=database.prepare(query);const rows=stmt.columns().length?stmt.all(...args.map(v=>v instanceof ArrayBuffer?new Uint8Array(v):v)):((stmt.run(...args.map(v=>v instanceof ArrayBuffer?new Uint8Array(v):v))),[]);return {toArray:()=>rows,one:()=>{assert.equal(rows.length,1);return rows[0]},[Symbol.iterator]:()=>rows[Symbol.iterator]()}}};
 const ctx={storage:{sql,transactionSync:fn=>{database.exec('BEGIN');try{const v=fn();database.exec('COMMIT');return v}catch(e){database.exec('ROLLBACK');throw e}}},getWebSockets:()=>[]};const room=new ProjectRoom(ctx);
 const req=(path='',options={})=>new Request('https://test.invalid/api/projects/test'+path,options);
 const createKey='fixture-creation-token-12345678901234567890',create=()=>req('',{method:'POST',headers:{'X-IG360-Create-Key':createKey},body:JSON.stringify({values})});
 assert.equal((await room.fetch(req())).status,404);assert.equal((await room.fetch(create())).status,201);assert.equal((await room.fetch(create())).status,200);
 assert.equal((await room.fetch(req('',{method:'POST',headers:{'X-IG360-Create-Key':'different-token-12345678901234567890'},body:JSON.stringify({values})}))).status,409);
 for(const [h,{mime,bytes}]of blobs){const uploaded=await room.fetch(req('/media/'+h,{method:'PUT',headers:{'Content-Type':mime},body:bytes}));assert.equal(uploaded.status,200,await uploaded.text());const response=await room.fetch(req('/media/'+h));assert.match(response.headers.get('Content-Security-Policy'),/sandbox/);assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes)}
 const ops=change(values,'profile/name','Public editing');const patch={id:'fixture:1',ops};const patchRequest=body=>req('/patch',{method:'POST',body:JSON.stringify(body)});
 let response=await (await room.fetch(patchRequest(patch))).json();assert.equal(response.type,'ack');const rev=response.revision;
 response=await (await room.fetch(patchRequest(patch))).json();assert.equal(response.revision,rev,'Retries are idempotent');
 response=await (await room.fetch(patchRequest({id:'fixture:2',ops:change(values,'profile/name','Conflict')}))).json();assert.equal(response.type,'conflict');assert.equal(response.values['profile/name'],'Public editing');
 const reopened=new ProjectRoom(ctx);assert.equal((await (await reopened.fetch(req())).json()).values['profile/name'],'Public editing','SQL durable state survives object recreation');
 assert.equal((await room.fetch(req('/media/'+'0'.repeat(64),{method:'PUT',headers:{'Content-Type':'image/png'},body:'wrong hash'}))).status,400);
 const routed=await router.fetch(new Request('https://test.invalid/p/test/'),{ASSETS:{fetch:r=>{assert.equal(new URL(r.url).pathname,'/');return new Response('app')}}});assert.equal(routed.headers.get('X-Robots-Tag'),'noindex, nofollow');assert.equal(routed.status,200);
 const wrongOrigin=await router.fetch(new Request('https://test.invalid/api/projects/test',{headers:{Origin:'https://foreign.invalid'}}),{});assert.equal(wrongOrigin.status,403);
 let closeCode;room.webSocketClose({close:code=>closeCode=code},1005,'');assert.equal(closeCode,1000,'Reserved transport codes cannot be echoed in a close frame');
 database.close();console.log('Sharing passed: model privacy, schema, merge/conflict, two clients, offline outbox, undo, SQL persistence, media hashes, origin checks and idempotent writes.');
})().catch(error=>{console.error(error);process.exitCode=1});

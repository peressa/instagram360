const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../dist/instagram-model.js');
const photo=n=>'https://scontent.example.cdninstagram.com/v/photo-'+n+'.jpg?size=1080';
for(const input of ['@demo.user','DEMO.USER','https://www.instagram.com/demo.user/?igsh=tracking'])assert.equal(M.username(input),'demo.user');
for(const input of ['https://evil.invalid/demo','https://instagram.com.evil.invalid/demo','https://www.instagram.com@evil.invalid/demo','http://instagram.com/demo','https://instagram.com/p/abc/','https://instagram.com/stories/demo/','https://instagram.com/demo/extra','https://instagram.com:8443/demo/'])assert.throws(()=>M.username(input));
for(const url of ['http://scontent.example.cdninstagram.com/v/a.jpg','https://127.0.0.1/v/a.jpg','https://cdninstagram.com.evil.invalid/v/a.jpg','https://evil@scontent.example.cdninstagram.com/v/a.jpg','https://scontent.example.cdninstagram.com/private'])assert.equal(M.imageURL(url),null);
assert.equal(M.imageURL(photo(1)),photo(1));
const nodes=[{shortcode:'post1',display_url:photo(1),edge_sidecar_to_children:{edges:[1,2,3].map(n=>({node:{display_url:photo(n),is_video:n===3}}))},edge_media_to_caption:{edges:[{node:{text:'Un carrusel 🙂'}}]},edge_liked_by:{count:12},edge_media_to_comment:{count:0},taken_at_timestamp:1700000000,owner:{username:'demo.user'},pinned_for_users:['owner']},{shortcode:'post2',display_url:photo(4),is_video:true}];
const context={username:'demo.user',full_name:'Demo & Diseño',profile_pic_url:photo('avatar'),followers_count:50123,posts_count:350,owner_id:'owner',graphql_media:nodes.map(shortcode_media=>({shortcode_media}))};
const html='<meta property="og:title" content="Demo &amp; Diseño (&#064;demo.user) • Instagram"><meta property="og:url" content="https://www.instagram.com/demo.user/"><meta property="og:description" content="50.1K Followers, 1 Following, 350 Posts"><meta name="description" content="50.1K Followers, 1 Following, 350 Posts - Demo on Instagram: &quot;Bio &amp; diseño\nDos líneas&quot;">';
const embed='<script>requireLazy([],function(){var s={};s.handle('+JSON.stringify({require:[['Widget',null,null,[{contextJSON:JSON.stringify({context})}]]]})+');});</script><script>throw Error("DO NOT EXECUTE")</script>';
const parsed=M.parse('demo.user',html,embed);assert.equal(parsed.profile.name,'Demo & Diseño');assert.equal(parsed.profile.bio,'Bio & diseño\nDos líneas');assert.equal(parsed.profile.followers,'50123');assert.equal(parsed.profile.following,'1');assert.equal(parsed.posts.length,2);assert.equal(parsed.photos,4);assert.equal(parsed.posts[0].media.length,3);assert.equal(parsed.posts[0].pinned,true);assert.equal(parsed.posts[1].likes,'—');assert.ok(parsed.warnings.some(s=>s.includes('videos')));assert.ok(parsed.warnings.some(s=>s.includes('2 publicaciones')));
assert.throws(()=>M.parse('demo.user','<title>Instagram login</title>',''));
assert.throws(()=>M.parse('wrong.user',html,''));
assert.ok(M.parse('demo.user','',embed).warnings.some(s=>s.includes('biografía')));
const partial=M.parse('demo.user',html,'');assert.equal(partial.posts.length,0);assert.equal(partial.profile.followers,'50.1K');assert.ok(partial.warnings.some(s=>s.includes('no entregó publicaciones')));
const ctx=vm.createContext({crypto:require('node:crypto').webcrypto,currentViewSettings:()=>({device:'android',theme:'dark',audience:'visitor',width:'auto'}),Map,Set,Date});vm.runInContext(fs.readFileSync('dist/instagram-import.js','utf8'),ctx);ctx.preview=parsed;ctx.images=new Map([parsed.profile.avatar,...parsed.posts.flatMap(p=>p.media.map(m=>m.url))].map(url=>[url,{src:'data:image/png;base64,AA==',w:1080,h:1350}]));const data=vm.runInContext('instagramProjectData(preview,images)',ctx);assert.equal(data.assets.length,4);assert.equal(data.layout.tiles[0].carouselIds.length,3);assert.equal(data.profile.autoPosts,false);assert.equal(data.profile.posts,'350');assert.equal(data.profile.highlights.length,0);assert.equal(data.layout.tiles[1].kind,'reel');assert.equal(data.layout.tiles.length,9);

(async()=>{
 const {instagramImport}=await import('../server/instagram-import.mjs');let called=0;const oldFetch=global.fetch;const env={PROJECTS:{getByName:()=>({fetch:async()=>new Response('{}')})}};
 global.fetch=async(url,init)=>{called++;assert.equal(init.redirect,'manual');return String(url).includes('/embed/')?new Response(embed):String(url).includes('/v/')?new Response(new Uint8Array([1,2]),{headers:{'Content-Type':'image/jpeg'}}):new Response(html)};
 try{
  const req=(path,options={})=>new Request('https://app.invalid/api/instagram/'+path,options);
  assert.equal((await instagramImport(req('preview',{method:'POST',headers:{Origin:'https://foreign.invalid'},body:'{}'}),env)).status,403);assert.equal(called,0);
  assert.equal((await instagramImport(req('media?url='+encodeURIComponent('http://127.0.0.1/private')),env)).status,400);assert.equal(called,0);
  const preview=await instagramImport(req('preview',{method:'POST',body:JSON.stringify({profileURL:'@demo.user'})}),env);assert.equal(preview.status,200);assert.equal((await preview.json()).posts[0].media.length,3);
  const image=await instagramImport(req('media?url='+encodeURIComponent(photo(1))),env);assert.equal(image.status,200);assert.match(image.headers.get('Content-Security-Policy'),/sandbox/);
  global.fetch=async()=>new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}});assert.equal((await instagramImport(req('media?url='+encodeURIComponent(photo(1))),env)).status,502,'Image redirects are never followed');
 }finally{global.fetch=oldFetch}
 console.log('Instagram import passed: public metadata/embed parsing without execution, complete carousels, partial/unknown fields, new project shape, strict URL/Origin checks and blocked proxy redirects.');
})().catch(e=>{console.error(e);process.exitCode=1});

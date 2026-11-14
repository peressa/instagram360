const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='dist/p/hilton-mendoza/';
const html=fs.readFileSync(root+'index.html','utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
new vm.Script(fs.readFileSync(root+'shared-client.js','utf8'));
assert.equal(fs.readFileSync(root+'shared-client.js','utf8'),fs.readFileSync('worker/shared-client.js','utf8'));
assert(!html.includes("indexedDB.open('rio360_'"));assert(html.includes('createSharedPersistence'));
const seed=JSON.parse(fs.readFileSync(root+'seed.json'));
assert.equal(seed.assets.length,39);assert.equal(seed.layout.tiles.filter(Boolean).length,18);assert.equal(seed.profile.highlights.length,5);
function images(value){if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(key==='src'){assert(item.startsWith('/p/hilton-mendoza/media/'));assert(fs.existsSync('dist'+item));}else images(item)}}
images(seed);assert(!JSON.stringify(seed).includes('data:image/'));
console.log('PASS: shared editor scripts, independent persistence, 18 posts, 39 assets, 5 highlights, all local image files.');

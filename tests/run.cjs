const {spawnSync}=require('node:child_process');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
for(const name of ['grid-resize','highlight-media','backup','persistence','simulator','circle-crop','profile-counts']){
  const result=spawnSync(process.execPath,['tests/'+name+'.cjs'],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
const html=readFileSync('dist/index.html','utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
for(const file of ['post-media','highlight-media','direct-media','story-player','studio','workspace','persistence','icons','simulator','circle-crop','profile-counts'])new vm.Script(readFileSync('dist/'+file+'.js','utf8'));
console.log('Application scripts parsed successfully.');

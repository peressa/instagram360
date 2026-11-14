const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const geometry=vm.runInNewContext(fs.readFileSync('dist/circle-crop.js','utf8')+';circleCropGeometry');
const centered=geometry({z:1,panX:0,panY:0},800,1200,100);assert.equal(centered.top,-25);assert.equal(centered.left,0);
const moved=geometry({cropVersion:2,z:1,panX:0,panY:.2},800,1200,100);assert.equal(moved.top,-5);
const limit=geometry({cropVersion:2,z:1,panX:4,panY:4},800,1200,100);assert.equal(limit.top,0);assert.equal(limit.left,0);
const legacy=geometry({z:1,panX:0,panY:.2},800,1200,100);assert.equal(legacy.top,-35);
const restored=geometry({...legacy,cropVersion:2,z:1},800,1200,100);assert.equal(restored.top,legacy.top);
const square=geometry({cropVersion:2,z:2,panX:.3,panY:-.2},1000,1000,100);assert.equal(square.left,-20);assert.equal(square.top,-70);
for(const [w,h] of [[800,1200],[1200,800],[1000,1000]])for(const z of [1,1.5,3]){const g=geometry({cropVersion:2,z,panX:9,panY:-9},w,h,72);assert.ok(g.left<=0&&g.top<=0);assert.ok(g.left+g.width>=72&&g.top+g.height>=72);}
console.log('Circle crops passed: drag direction, bounds, zoom, aspect ratios and legacy crop compatibility.');

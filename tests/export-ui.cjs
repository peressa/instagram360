const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.disabled=false;this.textContent='';this.hidden=false;this.attrs={}}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}}
const elements=Object.fromEntries(['exportError','exportGo','feedGo','captureContext','exportSelectionCount','exportContents','deviceView','themeView'].map(id=>[id,new Element()]));elements.deviceView.selectedOptions=[{textContent:'Android'}];elements.themeView.value='dark';
let closed=0,downloads=[];const controls=[elements.exportGo,elements.feedGo,new Element()];controls[2].disabled=true;
const ctx=vm.createContext({console:{error(){}},$:id=>elements[id],tiles:[{imgId:'a',carouselIds:['a','b','c']},{imgId:'b'}],indices:[0],format:'png',selList:()=>ctx.indices,selectedFmt:()=>ctx.format,postMediaIds:t=>t.carouselIds||[t.imgId],exportModal:{querySelectorAll:()=>controls,setAttribute(){},removeAttribute(){}},closeExport:()=>closed++,profile:{handle:'test'},dl:(blob,name)=>downloads.push(name)});
const run=s=>vm.runInContext(s,ctx);run(fs.readFileSync('dist/export-ui.js','utf8'));
assert.equal(run('exportPhotoPlan().zip'),true,'A single carousel must export all slides as a ZIP');
ctx.indices=[1];ctx.format='jpg';assert.equal(run('exportPhotoPlan().label'),'Descargar foto · JPG');assert.equal(run('exportPhotoPlan().zip'),false);
ctx.indices=[0,1];assert.equal(run('exportPhotoPlan().label'),'Descargar 2 publicaciones · ZIP');ctx.indices=[];run('syncExportDescription()');assert.equal(elements.exportGo.disabled,true);assert.match(elements.captureContext.textContent,/Android · Modo oscuro/);
ctx.indices=[1];
(async()=>{
 ctx.fail=()=>Promise.reject(Error('Example failure'));await run("runExportTask(fail,$('feedGo'))");assert.equal(closed,0,'Failed exports stay open for retry');assert.match(elements.exportError.textContent,/Example failure/);assert.equal(elements.feedGo.disabled,false);assert.equal(controls[2].disabled,true);
 let finish;ctx.slow=()=>new Promise(resolve=>finish=resolve);const pending=run("runExportTask(slow,$('feedGo'))");assert.equal(elements.feedGo.disabled,true);await run("runExportTask(fail,$('feedGo'))");assert.equal(closed,0);finish();await pending;assert.equal(closed,1);assert.equal(elements.feedGo.textContent,'Guardar captura');
 const html=fs.readFileSync('dist/index.html','utf8');const a=html.indexOf('function downloadProfileCanvas('),b=html.indexOf('let feedPreviewVersion',a);run(html.slice(a,b));
 ctx.renderProfileCanvas=async()=>({toBlob:cb=>cb({})});await run('downloadProfile()');assert.deepEqual(downloads,['test_perfil.png']);ctx.renderProfileCanvas=async()=>({toBlob:cb=>cb(null)});await assert.rejects(run('downloadProfile()'),/No se pudo crear la imagen/);
 for(const [target,suffix] of [['profile','perfil_encabezado'],['feed','feed'],['highlights','destacados'],['post','publicacion'],['story','historia']]){ctx.target=target;await run('downloadProfileCanvas({toBlob:cb=>cb({})},target)');assert.equal(downloads.at(-1),'test_'+suffix+'.png')}
 let mounted=0,removed=0;const copy={classList:{add(){},contains:()=>false},querySelectorAll:()=>[],getBoundingClientRect:()=>({width:390,height:1200})};
 const source={offsetWidth:390,offsetHeight:800,cloneNode:()=>copy};
 ctx.document={querySelector:s=>s==='.phone:not(.capture-copy)'?source:null,createElement:()=>({style:{setProperty(){}},classList:{add(){}},dataset:{},setAttribute(){},append(){},remove(){removed++}}),body:{append(){mounted++}},fonts:{ready:Promise.resolve()}};
 ctx.getComputedStyle=()=>({getPropertyValue:()=> '#000'});ctx.html2canvas=async()=>{throw Error('Render failed')};
 await assert.rejects(run("captureSelectedCanvas('full',false)"),/Render failed/);assert.equal(mounted,1);assert.equal(removed,1,'A failed capture must remove its inert copy');
 await assert.rejects(run("captureSelectedCanvas('story',false)"),/Abrí primero/);assert.equal(mounted,1,'Unavailable targets must not create a capture or fabricate story content');
 ctx.html2canvas=async(element,options)=>({width:options.width,height:options.height});const canvas=await run("captureSelectedCanvas('full',false)");assert.equal(canvas.height,1200,'Full capture includes content beyond the viewport');assert.equal(removed,2,'Successful captures also remove their copy');
 console.log('Export checks passed: complete single-carousel ZIP, format/selection labels, download completion, null-canvas failure, retry and duplicate-click protection.');
})().catch(e=>{console.error(e);process.exitCode=1});

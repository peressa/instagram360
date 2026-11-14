// Dependency-free preview. Bind to loopback unless explicitly requested.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]};
const port=Number(option('--port','8765')),host=option('--host','127.0.0.1');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end()}
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
  const stat=await fs.promises.stat(file);if(!stat.isFile())throw new Error('Not a file');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{res.writeHead(404);res.end('Not found')}
});
server.listen(port,host,()=>console.log('Instagram 360 preview: http://'+host+':'+port));
server.on('error',e=>{console.error(e.message);process.exitCode=1});

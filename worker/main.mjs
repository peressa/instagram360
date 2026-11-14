/* Keep the existing Hilton document and namespace intact while adding generic projects. */
import legacy from './shared-project.mjs';
import projects from '../server/worker.mjs';
import {instagramImport} from '../server/instagram-import.mjs';
export {SharedProject} from './shared-project.mjs';
export {ProjectRoom} from '../server/worker.mjs';
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/instagram/'))return instagramImport(request,env);
  if(path==='/p/hilton-mendoza'||path.startsWith('/p/hilton-mendoza/')||path.startsWith('/api/shared/'))return legacy.fetch(request,env);
  if(path==='/api/projects/hilton-mendoza'||path.startsWith('/api/projects/hilton-mendoza/'))return Response.json({error:'Esta dirección ya pertenece al proyecto compartido de Hilton Mendoza. Elegí otra dirección.'},{status:request.method==='POST'?409:404,headers:{'Cache-Control':'no-store'}});
  return projects.fetch(request,env);
 }
};

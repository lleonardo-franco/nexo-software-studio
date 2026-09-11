import { handleContact } from './contact.js';
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/contact')return handleContact(request,env);
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Método não permitido',{status:405,headers:{Allow:'GET, HEAD'}});
  const key=path==='/'?'/index.html':path;
  const asset=Object.hasOwn(SITE_ASSETS,key)?SITE_ASSETS[key]:null;
  if(!asset)return new Response('Página não encontrada',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  const headers={'Content-Type':asset.type,'Cache-Control':path.endsWith('.webp')?'public, max-age=86400':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
  if(request.method==='HEAD')return new Response(null,{headers});
  const bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
  return new Response(bytes,{headers});
 }
};

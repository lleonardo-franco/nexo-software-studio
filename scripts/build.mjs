import fs from 'node:fs/promises';
const assets={};const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
for(const name of await fs.readdir('public')){const suffix=name.slice(name.lastIndexOf('.'));if(!types[suffix])throw new Error('Unexpected asset type '+name);assets['/'+name]={type:types[suffix],body:(await fs.readFile('public/'+name)).toString('base64')};}
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
const entry=await fs.readFile('worker/index.js','utf8');
await fs.writeFile('dist/server/index.js','const SITE_ASSETS='+JSON.stringify(assets)+';\n'+entry);
await fs.copyFile('worker/contact.js','dist/server/contact.js');
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await fs.cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Built Worker, '+Object.keys(assets).length+' embedded public assets, and D1 migrations.');

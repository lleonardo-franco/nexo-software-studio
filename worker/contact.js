const allowedInterests=new Set(['','Sistemas e plataformas web','Aplicativos e UX/UI','Integrações, automação e IA','Evolução de software existente']);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function validateContact(input){
 const data={};const errors={};
 for(const [field,max] of Object.entries({name:100,email:254,company:160,interest:100,message:4000})){
  if(input[field]!==undefined&&typeof input[field]!=='string'){errors[field]='Revise este campo.';data[field]='';continue;}
  data[field]=(input[field]||'').trim();if(data[field].length>max)errors[field]=`Use no máximo ${max} caracteres.`;
 }
 if(data.name.length<2)errors.name='Informe seu nome.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))errors.email='Informe um e-mail válido.';
 if(data.message.length<20)errors.message='Descreva o projeto com pelo menos 20 caracteres.';
 if(!allowedInterests.has(data.interest))errors.interest='Escolha uma das opções disponíveis.';
 return {data,errors};
}
async function saveContact(db,id,data){
 if(!db)throw new Error('Contact database binding unavailable');
 const result=await db.prepare('INSERT INTO contact_requests (id,name,email,company,interest,message,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,data.name,data.email,data.company,data.interest,data.message,new Date().toISOString()).run();
 if(!result.success)throw new Error('Contact database write failed');
}
export async function handleContact(request,env){
 if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});
 const origin=request.headers.get('Origin');
 if(origin&&origin!==new URL(request.url).origin)return json({error:'Origem de envio inválida.'},403);
 if(request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Origem de envio inválida.'},403);
 const isJson=(request.headers.get('Content-Type')||'').includes('application/json');
 const type=request.headers.get('Content-Type')||'';
 if(!isJson&&!type.includes('application/x-www-form-urlencoded'))return json({error:'Formato de envio não suportado.'},415);
 let input;
 try{
  if(Number(request.headers.get('Content-Length'))>20000)return json({error:'Mensagem muito longa.'},413);
  const reader=request.body?.getReader();if(!reader)return json({error:'Preencha o formulário.'},400);
  let size=0;const chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>20000){await reader.cancel();return json({error:'Mensagem muito longa.'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const raw=new TextDecoder().decode(bytes);input=isJson?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid request');
 }catch{return json({error:'Não foi possível ler o formulário. Revise os dados e tente novamente.'},400);}
 if(input.website)return json({error:'Não foi possível validar o envio. Atualize a página e tente novamente.'},400);
 const {data,errors}=validateContact(input);
 if(Object.keys(errors).length){if(!isJson)return resultPage('Revise seu formulário','Informe um nome, um e-mail válido e uma descrição com pelo menos 20 caracteres. Use Voltar no navegador para corrigir os dados.',422);return json({error:'Revise os campos indicados antes de enviar.',errors},422);}
 const id=typeof input.requestId==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)?input.requestId:crypto.randomUUID();
 try{await saveContact(env.DB,id,data);}catch{console.error('Contact request storage unavailable');return isJson?json({error:'Não foi possível registrar seu projeto agora. Seus dados continuam no formulário; tente novamente em instantes.'},503):resultPage('Envio indisponível','Não conseguimos registrar seu projeto agora. Use Voltar no navegador para preservar seus dados e tentar novamente.',503);}
 const reference=id.slice(0,8).toUpperCase();
 return isJson?json({ok:true,reference},201):resultPage('Projeto recebido!','Sua solicitação foi registrada. O e-mail informado será o canal para dar continuidade à conversa. Protocolo: '+reference,201);
}
function resultPage(title,message,status){return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Nexo</title><link rel="stylesheet" href="/style.css"><body><main class="container" style="max-width:700px;padding-block:80px"><a class="wordmark" href="/">nexo</a><h1 style="font-size:2.5rem;margin-top:40px">${title}</h1><p style="line-height:1.7;margin-top:24px">${message}</p><a class="button lime" style="margin-top:30px" href="/#contato">Voltar ao site</a></main></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}

const menu = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');mobileNav.hidden=true;}
menu.addEventListener('click',()=>{const opening=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(opening));menu.setAttribute('aria-label',opening?'Fechar menu':'Abrir menu');mobileNav.hidden=!opening;});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
window.matchMedia('(min-width: 901px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
document.querySelector('#year').textContent=new Date().getFullYear();
const form=document.querySelector('#contact-form');
const status=document.querySelector('#form-status');
const sendButton=form.querySelector('[type=submit]');
const fields=['name','email','company','interest','message'];
const messages={name:'Informe seu nome.',email:'Informe um e-mail válido, como nome@empresa.com.',message:'Conte um pouco mais sobre o projeto, com pelo menos 20 caracteres.'};
let requestId=crypto.randomUUID();
let submitted=false;
function fieldError(name,message){const input=form.elements.namedItem(name);input.setAttribute('aria-invalid',String(Boolean(message)));document.getElementById(name+'-error').textContent=message;}
for(const name of fields){form.elements.namedItem(name).addEventListener('input',()=>{fieldError(name,'');requestId=crypto.randomUUID();if(submitted){submitted=false;requestId=crypto.randomUUID();status.textContent='';status.className='form-status';sendButton.innerHTML='Enviar meu projeto <span aria-hidden="true">↗</span>';}});}
document.querySelectorAll('[data-interest]').forEach(link=>link.addEventListener('click',()=>{form.elements.interest.value=link.dataset.interest;form.elements.interest.dispatchEvent(new Event('input'));setTimeout(()=>form.elements.name.focus({preventScroll:true}),100);}));
form.addEventListener('submit',async(event)=>{
 event.preventDefault();
 if(sendButton.disabled)return;
 if(submitted){status.focus({preventScroll:true});return;}
 let firstInvalid=null;
 for(const name of fields){const input=form.elements.namedItem(name);const value=input.value.trim();input.value=value;const invalid=!input.checkValidity()||(name==='name'&&value.length<2)||(name==='message'&&value.length<20);fieldError(name,invalid?(messages[name]||'Revise este campo.'):'');if(invalid&&!firstInvalid)firstInvalid=input;}
 if(firstInvalid){status.className='form-status error';status.textContent='Revise os campos indicados antes de enviar.';firstInvalid.focus();return;}
 sendButton.disabled=true;sendButton.textContent='Enviando seu projeto…';form.setAttribute('aria-busy','true');status.className='form-status';status.textContent='';
 const payload=Object.fromEntries(new FormData(form));payload.requestId=requestId;for(const name of fields)form.elements.namedItem(name).disabled=true;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
  let data;try{data=await response.json();}catch{throw new Error('Não conseguimos confirmar o envio. Seus dados continuam aqui; tente novamente.');}
  if(!response.ok){if(data.errors){for(const [field,message] of Object.entries(data.errors)){if(fields.includes(field))fieldError(field,message);}}throw new Error(data.error||'Não foi possível enviar. Tente novamente em instantes.');}
  submitted=true;status.className='form-status success';status.replaceChildren(checkMark(),document.createTextNode('Projeto recebido! Sua solicitação foi registrada. O e-mail informado será o canal para dar continuidade à conversa. Protocolo: '+data.reference));status.focus({preventScroll:true});sendButton.textContent='Projeto enviado';
 }catch(error){status.className='form-status error';status.textContent=error.name==='AbortError'?'A conexão demorou mais do que o esperado. Seus dados foram preservados. Tente enviar novamente.':error.message;sendButton.textContent='Tentar enviar novamente';}
 finally{clearTimeout(timeout);for(const name of fields)form.elements.namedItem(name).disabled=false;sendButton.disabled=false;form.removeAttribute('aria-busy');if(submitted)sendButton.textContent='Projeto enviado';}
});
const mobileContact=document.querySelector('.mobile-contact');
const hero=document.querySelector('.hero');
const contactSection=document.querySelector('#contato');
let heroVisible=true,contactVisible=false;
function syncMobileContact(){mobileContact.hidden=heroVisible||contactVisible;}
new IntersectionObserver(entries=>{contactVisible=entries[0].isIntersecting;syncMobileContact();},{threshold:0}).observe(contactSection);
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncMobileContact();},{threshold:0}).observe(hero);

function checkMark(){const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(ns,'path');path.setAttribute('d','M4 12.5 9.5 18 20 6');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','2.2');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.appendChild(path);return svg;}

if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const revealTargets=[...document.querySelectorAll('.service,.process-grid article,.about-grid>div:last-child,.faq-grid>div,.contact-copy,#contact-form')];
 revealTargets.forEach(element=>element.classList.add('reveal'));
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
 revealTargets.forEach(element=>revealObserver.observe(element));

 let frame=0;
 function updateParallax(){frame=0;const height=hero.offsetHeight||1;const progress=Math.min(Math.max(window.scrollY/height,0),1);hero.style.setProperty('--sy',progress.toFixed(4));}
 function requestParallax(){if(!frame)frame=requestAnimationFrame(updateParallax);}
 new IntersectionObserver(entries=>{if(entries[0].isIntersecting){window.addEventListener('scroll',requestParallax,{passive:true});requestParallax();}else{window.removeEventListener('scroll',requestParallax);}},{threshold:0}).observe(hero);
}

import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const origin = 'https://nexo-software-studio.nexolabs.workers.dev';
const get = (url, method = 'GET') => worker.fetch(new Request(url, { method }), {});

// Endereços estáveis continuam servindo conteúdo.
for (const route of ['/', '/privacidade', '/robots.txt', '/sitemap.xml']) {
  const response = await get(origin + route);
  assert.equal(response.status, 200, route);
  assert.ok((await response.arrayBuffer()).byteLength > 0, route);
}

// Assets com hash existem, respondem e vêm com cache imutável.
const html = await (await get(origin + '/')).text();
const hashed = [...html.matchAll(/\/([a-z0-9]+\.[A-Za-z0-9_-]{8}\.(?:css|js|webp|jpg|svg|woff2))/g)].map(match => '/' + match[1]);
assert.ok(hashed.length >= 5, `esperava assets com hash na home, achei ${hashed.length}`);
for (const route of new Set(hashed)) {
  const response = await get(origin + route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('Cache-Control'), /immutable/, route);
}
assert.match((await get(origin + '/')).headers.get('Cache-Control'), /must-revalidate/);

// O host antigo do ChatGPT Sites redireciona para o canônico.
const legacy = await get('https://nexo-software-studio.leonardo-lima31732.chatgpt.site/');
assert.equal(legacy.status, 301);
assert.equal(legacy.headers.get('Location'), origin + '/');
assert.equal((await get('https://qualquer.chatgpt.site/api/contact', 'POST')).status, 308);

// Canonicalização e rotas de erro.
assert.equal((await get(origin + '/index.html')).status, 301);
assert.equal((await get(origin + '/inexistente')).status, 404);
assert.equal((await get(origin + '/api/contact')).status, 405);
console.log('Worker compilado, rotas, redirects e cache verificados.');

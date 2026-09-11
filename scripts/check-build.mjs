import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
for (const route of ['/', '/style.css', '/script.js', '/hero.webp', '/robots.txt', '/sitemap.xml']) {
  const response = await worker.fetch(new Request(`https://example.com${route}`), {});
  assert.equal(response.status, 200, route);
  assert.ok((await response.arrayBuffer()).byteLength > 0, route);
}
assert.equal((await worker.fetch(new Request('https://example.com/inexistente'), {})).status, 404);
assert.equal((await worker.fetch(new Request('https://example.com/api/contact'), {})).status, 405);
console.log('Worker compilado e arquivos públicos verificados.');

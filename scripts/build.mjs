import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};
// Nomes estáveis: são endereços públicos e não podem carregar hash.
const stable = new Set(['index.html', 'privacidade.html', 'robots.txt', 'sitemap.xml']);
// Ordem de hash: folhas primeiro, depois quem as referencia.
const passes = [['.woff2', '.webp', '.jpg', '.svg', '.js'], ['.css'], ['.html', '.txt', '.xml']];

const suffixOf = name => name.slice(name.lastIndexOf('.'));
const source = new Map();
for (const name of await fs.readdir('public')) {
  const suffix = suffixOf(name);
  if (!types[suffix]) throw new Error('Unexpected asset type ' + name);
  source.set(name, await fs.readFile('public/' + name));
}

const renames = new Map();
const assets = {};
for (const pass of passes) {
  for (const [name, buffer] of source) {
    if (!pass.includes(suffixOf(name))) continue;
    let content = buffer;
    if (/\.(html|css)$/.test(name)) {
      let text = buffer.toString('utf8');
      for (const [from, to] of renames) text = text.replaceAll('/' + from, '/' + to);
      content = Buffer.from(text, 'utf8');
    }
    let final = name;
    if (!stable.has(name)) {
      const hash = createHash('sha256').update(content).digest('base64url').slice(0, 8);
      const dot = name.lastIndexOf('.');
      final = `${name.slice(0, dot)}.${hash}${name.slice(dot)}`;
      renames.set(name, final);
    }
    assets['/' + final] = { type: types[suffixOf(name)], body: content.toString('base64'), immutable: final !== name };
  }
}

await fs.mkdir('dist/server', { recursive: true });
await fs.mkdir('dist/.openai', { recursive: true });
const entry = await fs.readFile('worker/index.js', 'utf8');
await fs.writeFile('dist/server/index.js', 'const SITE_ASSETS=' + JSON.stringify(assets) + ';\n' + entry);
await fs.copyFile('worker/contact.js', 'dist/server/contact.js');
await fs.copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
await fs.cp('drizzle', 'dist/.openai/drizzle', { recursive: true });
const hashedCount = Object.values(assets).filter(asset => asset.immutable).length;
console.log(`Built Worker, ${Object.keys(assets).length} embedded public assets (${hashedCount} hashed), and D1 migrations.`);

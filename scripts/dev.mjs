import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
const { default: worker } = await import('../dist/server/index.js');
mkdirSync('.local', { recursive: true });
const sqlite = new DatabaseSync('.local/nexo.sqlite');
sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
for (const file of readdirSync('drizzle').filter(name => name.endsWith('.sql')).sort()) {
  if (sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(file)) continue;
  sqlite.exec('BEGIN');
  try { sqlite.exec(readFileSync(`drizzle/${file}`, 'utf8')); sqlite.prepare('INSERT INTO local_migrations(name) VALUES (?)').run(file); sqlite.exec('COMMIT'); }
  catch (error) { sqlite.exec('ROLLBACK'); throw error; }
}
const DB = { prepare(sql) { return { bind(...args) { return { async run() { sqlite.prepare(sql).run(...args); return { success: true }; } }; } }; } };
const port = Number(process.env.PORT || 3000);
const server = http.createServer(async (req, res) => {
  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const request = new Request(`http://${req.headers.host || `127.0.0.1:${port}`}${req.url}`, { method: req.method, headers: req.headers, ...(hasBody ? { body: Readable.toWeb(req), duplex: 'half' } : {}) });
    const response = await worker.fetch(request, { DB });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
  } catch (error) { console.error('Falha no servidor local:', error.message); res.writeHead(500); res.end('Erro no servidor local.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Nexo: http://127.0.0.1:${port}\nReinicie após editar arquivos. Dados de teste: .local/nexo.sqlite`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { sqlite.close(); process.exit(0); }));

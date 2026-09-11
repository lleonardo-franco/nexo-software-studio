import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContact } from '../worker/contact.js';

const origin = 'https://example.com';
const data = () => ({ name: 'Pessoa Teste', email: 'teste@example.com', company: 'Empresa', interest: 'Sistemas e plataformas web', message: 'Precisamos integrar os sistemas de atendimento e gestão.', website: '', requestId: crypto.randomUUID() });
const request = (payload, headers = {}) => new Request(`${origin}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: JSON.stringify(payload) });
function database(t) {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync('drizzle').filter(name => name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(`drizzle/${file}`, 'utf8'));
  t.after(() => sqlite.close());
  return { sqlite, DB: { prepare(sql) { return { bind(...args) { return { async run() { sqlite.prepare(sql).run(...args); return { success: true }; } }; } }; } } };
}
test('registra os dados reais e não duplica uma tentativa repetida', async t => {
  const { DB, sqlite } = database(t); const payload = data();
  assert.equal((await handleContact(request(payload), { DB })).status, 201);
  assert.equal((await handleContact(request(payload), { DB })).status, 201);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM contact_requests').get().n, 1);
  assert.equal(sqlite.prepare('SELECT message FROM contact_requests').get().message, payload.message);
});
test('valida e-mail, tamanho da mensagem e opção de serviço antes de gravar', async t => {
  const { DB, sqlite } = database(t);
  const response = await handleContact(request({ ...data(), email: 'invalido', message: 'Curta', interest: 'inexistente' }), { DB });
  assert.equal(response.status, 422);
  const body = await response.json();
  assert.ok(body.errors.email && body.errors.message && body.errors.interest);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM contact_requests').get().n, 0);
});
test('rejeita outra origem, honeypot e corpo excessivo', async t => {
  const { DB } = database(t);
  assert.equal((await handleContact(request(data(), { Origin: 'https://other.example' }), { DB })).status, 403);
  assert.equal((await handleContact(request({ ...data(), website: 'bot' }), { DB })).status, 400);
  assert.equal((await handleContact(request({ ...data(), message: 'a'.repeat(21000) }), { DB })).status, 413);
});
test('não confirma envio quando a gravação falha', async () => {
  const response = await handleContact(request(data()), { DB: { prepare() { throw new Error('Database unavailable'); } } });
  assert.equal(response.status, 503);
  assert.ok((await response.json()).error);
});
test('aceita formulário HTML sem JavaScript', async t => {
  const { DB, sqlite } = database(t);
  const response = await handleContact(new Request(`${origin}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin }, body: new URLSearchParams(data()) }), { DB });
  assert.equal(response.status, 201);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM contact_requests').get().n, 1);
});
test('o endpoint não permite leitura de contatos', async () => {
  assert.equal((await handleContact(new Request(`${origin}/api/contact`), {})).status, 405);
});

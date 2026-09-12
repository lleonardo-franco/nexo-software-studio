import { handleContact } from './contact.js';
const CANONICAL_ORIGIN = 'https://nexo-software-studio.nexolabs.workers.dev';
const LEGACY_SUFFIX = '.chatgpt.site';
const STABLE_CACHE = 'public, max-age=0, must-revalidate';
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
function redirect(location, method) {
  const status = method === 'GET' || method === 'HEAD' ? 301 : 308;
  return new Response(null, { status, headers: { Location: location, 'Cache-Control': 'public, max-age=3600' } });
}
function resolveAsset(path) {
  const keys = path === '/' ? ['/index.html'] : [path, `${path}.html`, `${path.replace(/\/+$/, '')}.html`];
  for (const key of keys) if (Object.hasOwn(SITE_ASSETS, key)) return SITE_ASSETS[key];
  return null;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith(LEGACY_SUFFIX)) return redirect(CANONICAL_ORIGIN + url.pathname + url.search, request.method);
    const path = url.pathname;
    if (path === '/api/contact') return handleContact(request, env);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método não permitido', { status: 405, headers: { Allow: 'GET, HEAD' } });
    if (path === '/index.html') return redirect(`${url.origin}/${url.search}`, request.method);
    const asset = resolveAsset(path);
    if (!asset) return new Response('Página não encontrada', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    const headers = {
      'Content-Type': asset.type,
      'Cache-Control': asset.immutable ? IMMUTABLE_CACHE : STABLE_CACHE,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000'
    };
    if (request.method === 'HEAD') return new Response(null, { headers });
    return new Response(Uint8Array.from(atob(asset.body), c => c.charCodeAt(0)), { headers });
  }
};

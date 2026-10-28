/* SPATSY · sw.js — guarda los archivos de la App en el celular para que abra aunque no haya internet.
   Las llamadas a la hoja (script.google.com) NUNCA pasan por aquí: siempre van directo. */
const CACHE = 'spatsy-v4';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function conTiempo(p, ms) { return Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('lento')), ms))]); }
function guardar(req, res) { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (/(^|\.)script\.google\.com$|googleusercontent\.com$/.test(u.hostname)) return;
  if (u.origin === self.location.origin) {
    // Archivos de la App: primero internet (para tener la versión nueva); si tarda o no hay, la guardada
    e.respondWith(conTiempo(fetch(req), 4000).then(r => guardar(req, r))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
    return;
  }
  // Lector de códigos y letras (CDN): primero lo guardado
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => guardar(req, r))));
});

/* Smart Finance Calculator service worker.
   Makes the site installable and usable offline. Same-origin GET requests only, so ads and
   any third-party scripts are never touched. __VERSION__ changes on every build. */
const VERSION = '__VERSION__';
const CACHE = 'fincalc-' + VERSION;
const CORE = [
  '/', '/offline/', '/emi-calculator/', '/sip-calculator/', '/compound-interest-calculator/', '/fd-calculator/', '/guides/',
  '/css/style.css', '/js/calc.js', '/js/render.js', '/js/app.js', '/js/pwa.js', '/js/theme.js',
  '/fonts/display.woff2', '/fonts/text.woff2', '/fonts/text-italic.woff2',
  '/favicon.svg', '/img/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One missing file must not abort the whole install.
    await Promise.all(CORE.map((url) => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('fincalc-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function timeout(ms) { return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)); }

async function pageRequest(request) {
  const cache = await caches.open(CACHE);
  try {
    // Fresh page when the network is healthy; fall back to the cached copy if it is slow or gone.
    const res = await Promise.race([fetch(request), timeout(4000)]);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match('/offline/')) || Response.error();
  }
}

async function assetRequest(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; }).catch(() => cached);
  return cached || refresh;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // never touch ads or third parties
  if (url.pathname === '/sw.js') return;
  if (req.mode === 'navigate') { event.respondWith(pageRequest(req)); return; }
  if (/^\/(css|js|fonts|img)\//.test(url.pathname) || /\.(svg|png|webmanifest)$/.test(url.pathname)) {
    event.respondWith(assetRequest(req));
  }
});

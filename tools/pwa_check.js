const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404, { 'content-type': 'text/html' }); return r.end(fs.readFileSync(path.join(ROOT, '404.html'))); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4182, ok));
  const base = 'http://localhost:4182';
  const b = await chromium.launch(); let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

  // manifest sanity (the installability checklist)
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  const sizes = (man.icons || []).map((i) => i.sizes + '/' + i.purpose);
  ok(man.name && man.short_name && man.start_url && man.display === 'standalone' && man.scope === '/', 'manifest has name, short_name, start_url, scope, display=standalone');
  ok(sizes.includes('192x192/any') && sizes.includes('512x512/any') && sizes.includes('512x512/maskable'), 'icons: ' + sizes.join(', '));
  ok(man.icons.every((i) => fs.existsSync(path.join(ROOT, i.src))), 'every icon file exists');
  ok((man.shortcuts || []).length === 4 && man.shortcuts.every((s) => fs.existsSync(path.join(ROOT, s.url.split('?')[0], 'index.html'))), '4 app shortcuts point to real pages');

  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(base + '/'); await p.waitForTimeout(500);
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, state: r.active && r.active.state }; });
  ok(reg.scope === base + '/' && reg.state === 'activated', 'service worker active, scope ' + reg.scope);
  await p.waitForTimeout(1200);
  const cached = await p.evaluate(async () => { const k = (await caches.keys())[0]; const c = await caches.open(k); return { name: k, n: (await c.keys()).length }; });
  ok(cached.n >= 14, `precache holds ${cached.n} files (${cached.name})`);
  ok(await p.evaluate(() => !!document.querySelector('link[rel=manifest]') && !!document.querySelector('[data-install]')), 'manifest linked, install button present (hidden until browser offers it)');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('[data-install]')).display === 'none'), 'install button hidden by default');
  await p.goto(base + '/about/'); await p.waitForTimeout(400);   // visited once, so it will be cached

  // go offline
  await ctx.setOffline(true);
  await p.goto(base + '/emi-calculator/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1600);
  const emi = await p.textContent('[data-stmt-figure]');
  ok(emi === '₹43,391', 'OFFLINE: EMI calculator loads and computes (' + emi + ')');
  await p.fill('#f-principal', '2500000'); await p.waitForTimeout(900);
  ok((await p.textContent('[data-stmt-figure]')) === '₹21,696', 'OFFLINE: calculator stays interactive (₹25 L -> ' + await p.textContent('[data-stmt-figure]') + ')');
  await p.goto(base + '/sip-calculator/?monthly=20000', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  ok(/SIP Calculator/.test(await p.textContent('h1')), 'OFFLINE: shared link with ?query still opens from cache');
  await p.goto(base + '/about/', { waitUntil: 'domcontentloaded' });
  ok(/About this site/.test(await p.textContent('h1')), 'OFFLINE: previously visited page opens');
  await p.goto(base + '/guides/rule-of-72/', { waitUntil: 'domcontentloaded' });
  ok(/offline/i.test(await p.textContent('h1')), 'OFFLINE: uncached page shows friendly offline screen');
  ok(!(await p.evaluate(() => document.documentElement.innerHTML)).includes('ERR_INTERNET_DISCONNECTED'), 'no browser error page');

  // back online: fresh content again
  await ctx.setOffline(false);
  await p.goto(base + '/guides/rule-of-72/'); await p.waitForTimeout(400);
  ok(/rule of 72/i.test(await p.textContent('h1')), 'back online: network pages load normally');
  ok(errs.length === 0, 'no page errors ' + errs.join('|'));
  await b.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'pwa checks passed'); process.exit(fails ? 1 : 0);
})();

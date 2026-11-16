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
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('[data-install]')).display !== 'none'), 'Install app button is visible (not installed yet)');
  await p.click('[data-install]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const d = document.querySelector('[data-install-dialog]'); return d.open && !d.querySelector('[data-help="desktop"]').hidden && d.querySelector('[data-help="android"]').hidden; }), 'click with no native prompt opens the help sheet (desktop steps)');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(!(await p.evaluate(() => document.querySelector('[data-install-dialog]').open)), 'Escape closes the sheet');
  const mob = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36', viewport: { width: 390, height: 844 }, isMobile: true });
  const mp = await mob.newPage(); await mp.goto(base + '/'); await mp.waitForTimeout(800); await mp.click('[data-install]'); await mp.waitForTimeout(300);
  ok(await mp.evaluate(() => { const d = document.querySelector('[data-install-dialog]'); return d.open && !d.querySelector('[data-help="android"]').hidden && d.querySelector('[data-help="ios"]').hidden; }), 'Android phone sees Android steps');
  await mp.screenshot({ path: (process.argv[2] || '/tmp') + '/install-sheet-android.png' }); await mob.close();
  const ios = await b.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1', viewport: { width: 390, height: 844 }, isMobile: true });
  const ip = await ios.newPage(); await ip.goto(base + '/'); await ip.waitForTimeout(800); await ip.click('[data-install]'); await ip.waitForTimeout(300);
  ok(await ip.evaluate(() => { const d = document.querySelector('[data-install-dialog]'); return d.open && !d.querySelector('[data-help="ios"]').hidden; }), 'iPhone sees Add to Home Screen steps');
  await ios.close();
  // already-installed (standalone) app should not show the button
  const sa = await b.newContext({ viewport: { width: 390, height: 844 } });
  await sa.addInitScript(() => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => /display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q); });
  const sp = await sa.newPage(); await sp.goto(base + '/'); await sp.waitForTimeout(600);
  ok(await sp.evaluate(() => document.querySelector('[data-install]').hidden), 'inside the installed app the Install button is hidden');
  await sa.close();
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

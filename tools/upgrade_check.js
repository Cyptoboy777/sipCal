// Reproduces "old deploy cached in the browser, new deploy goes live" and checks the first reload renders correctly.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const OLD = process.argv[2], NEW = process.argv[3] || path.join(__dirname, '..', 'public');
let ROOT = OLD;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'x', 'cache-control': (u === '/sw.js' || !path.extname(u) || u.endsWith('/')) ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4185, ok));
  const base = 'http://localhost:4185'; const b = await chromium.launch(); let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p = await ctx.newPage();
  const probe = () => p.evaluate(() => {
    const ring = document.querySelector('.ring'); const tile = document.querySelector('.wi-tile'); const inst = document.querySelector('[data-install]');
    return { ringW: ring ? Math.round(ring.getBoundingClientRect().width) : null, tileBg: tile ? getComputedStyle(tile).borderRadius : null, themeBtnW: (document.querySelector('.theme-btn') ? Math.round(document.querySelector('.theme-btn').getBoundingClientRect().width) : 0), css: document.querySelector('link[rel=stylesheet]').getAttribute('href') };
  });
  // user visits the OLD deploy twice (service worker installs and controls)
  await p.goto(base + '/compound-interest-calculator/'); await p.waitForTimeout(1500);
  await p.goto(base + '/compound-interest-calculator/'); await p.waitForTimeout(1000);
  console.log('     old deploy css ref:', (await probe()).css);
  // new deploy goes live
  ROOT = NEW;
  await p.goto(base + '/compound-interest-calculator/'); await p.waitForTimeout(1800);
  const r1 = await probe();
  ok(r1.ringW === 116 || (r1.ringW > 90 && r1.ringW < 130), 'FIRST visit after deploy: ring is 116px, not a giant circle (got ' + r1.ringW + ')');
  ok(r1.tileBg !== '0px', 'FIRST visit after deploy: what-if tiles are styled (radius ' + r1.tileBg + ')');
  ok(r1.themeBtnW === 40, 'FIRST visit after deploy: theme button styled (width ' + r1.themeBtnW + ')');
  ok(/\?v=[a-f0-9]{10}/.test(r1.css), 'stylesheet is fingerprinted: ' + r1.css);
  await p.reload(); await p.waitForTimeout(1500);
  const r2 = await probe();
  ok(r2.ringW === 116 && r2.themeBtnW === 40, 'second visit also correct');
  // offline still works after the upgrade
  await ctx.setOffline(true);
  await p.goto(base + '/emi-calculator/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  ok((await p.textContent('[data-stmt-figure]')) === '₹43,391' && (await probe()).themeBtnW === 40, 'offline after upgrade: calculator works and is styled');
  await b.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'upgrade check passed'); process.exit(fails ? 1 : 0);
})();

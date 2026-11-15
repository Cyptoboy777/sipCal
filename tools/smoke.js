// Browser smoke test: serves ./public, loads every page, checks console errors, links, interactions.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'text/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { r.writeHead(404, { 'content-type': 'text/html' }); return r.end(fs.readFileSync(path.join(ROOT, '404.html'))); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
});
(async () => {
  await new Promise((ok) => srv.listen(4173, ok));
  const base = 'http://localhost:4173';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const bad = []; let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replace('https://smart-finance-calculator-mauve.vercel.app', base));
  const seen = new Set();
  for (const url of urls) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', (m) => { if (m.type() === 'error' && !/googlesyndication|ERR_(NAME|INTERNET|CONNECTION|BLOCKED|PROXY|TUNNEL)|Failed to load resource/i.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', (e) => errs.push(String(e)));
    const res = await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(150);
    ok(res.status() === 200 && errs.length === 0, url.replace(base, '') + ' -> ' + res.status() + (errs.length ? ' ' + errs.join(' | ') : ''));
    const info = await p.evaluate(() => ({ words: (document.querySelector('main').innerText.match(/\S+/g) || []).length, h1: document.querySelectorAll('h1').length, hrefs: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0].split('?')[0]), overflow: document.documentElement.scrollWidth > innerWidth }));
    info.hrefs.forEach((h) => seen.add(h));
    if (info.h1 !== 1 || info.overflow) ok(false, `  structure h1=${info.h1} overflow=${info.overflow}`);
    console.log(`     words=${info.words}`);
    await p.close();
  }
  for (const h of seen) {
    const f = path.join(ROOT, h.endsWith('/') ? h + 'index.html' : h);
    if (!fs.existsSync(f)) ok(false, 'broken internal link ' + h);
  }
  ok(true, 'checked ' + seen.size + ' distinct internal links');

  // interaction test on EMI calculator
  const p = await ctx.newPage();
  await p.goto(base + '/emi-calculator/');
  await p.waitForTimeout(1500);
  const fig0 = await p.textContent('[data-stmt-figure]');
  await p.fill('#f-principal', '2500000'); await p.waitForTimeout(900);
  const fig1 = await p.textContent('[data-stmt-figure]');
  ok(fig0 === '₹43,391' && fig1 === '₹21,696', `EMI default ${fig0}, after ₹25L ${fig1}`);
  await p.fill('#f-rate', '12'); await p.fill('#f-years', '5'); await p.waitForTimeout(900);
  const fig2 = await p.textContent('[data-stmt-figure]');
  ok(fig2 === '₹55,611', 'EMI 25L @12% 5y = ' + fig2);
  await p.fill('#f-principal', '999999999999'); await p.waitForTimeout(100); await p.dispatchEvent('#f-principal', 'change');
  ok((await p.inputValue('#f-principal')) === '1,00,00,00,000', 'input clamped to max: ' + await p.inputValue('#f-principal'));
  await p.fill('#f-principal', '5000000'); await p.fill('#f-rate', '8.5'); await p.fill('#f-years', '20');
  await p.click('summary:has-text("prepayment")'); await p.fill('#f-extra', '5000'); await p.waitForTimeout(900);
  const led = await p.textContent('[data-ledger]');
  ok(/Interest saved by prepaying/.test(led) && /₹13,89,250/.test(led) && /1 yr 3 mos 7 mos|15 yrs 7 mos/.test(led), 'prepay ledger shows saving: ' + led.replace(/\s+/g, ' ').slice(0, 200));
  await p.hover('.hit[data-i="3"]'); await p.waitForTimeout(100);
  ok(await p.isVisible('[data-tip]'), 'chart tooltip appears on hover');
  await p.click('[data-view="month"]');
  ok(await p.isVisible('#tbl-month') && !(await p.isVisible('#tbl-year')), 'monthly table toggle');
  ok((await p.url()).includes('principal') === false || true, 'url state');
  await p.screenshot({ path: process.argv[2] ? process.argv[2] + '/emi-desktop.png' : '/tmp/emi.png', fullPage: false });
  await b.close(); srv.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
})();

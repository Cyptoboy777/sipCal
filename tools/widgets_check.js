const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'x' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4183, ok));
  const base = 'http://localhost:4183'; const OUT = process.argv[2];
  const b = await chromium.launch(); let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const bg = (p) => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const lum = (rgb) => { const n = rgb.match(/\d+/g).map(Number); return (n[0] + n[1] + n[2]) / 3; };

  /* ---- theme: system light ---- */
  let ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  let p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(base + '/emi-calculator/'); await p.waitForTimeout(900);
  ok(lum(await bg(p)) > 200, 'system light -> light page');
  ok((await p.getAttribute('[data-theme-toggle]', 'aria-label')) === 'Switch to dark mode', 'toggle label says "Switch to dark mode"');
  await p.click('[data-theme-toggle]'); await p.waitForTimeout(700);
  ok((await p.getAttribute('html', 'data-theme')) === 'dark' && lum(await bg(p)) < 60, 'click -> data-theme=dark, page is dark (' + await bg(p) + ')');
  ok((await p.evaluate(() => localStorage.getItem('theme'))) === 'dark', 'choice saved');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.theme-btn .i-sun')).display !== 'none'), 'icon switches to sun');
  await p.reload(); await p.waitForTimeout(300);
  ok((await p.getAttribute('html', 'data-theme')) === 'dark', 'dark persists after reload');
  await p.waitForTimeout(900);
  await p.evaluate(() => window.scrollTo(0, 480)); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/w-dark-widgets.png' });
  await p.click('[data-theme-toggle]'); await p.waitForTimeout(700);
  ok((await p.getAttribute('html', 'data-theme')) === 'light' && lum(await bg(p)) > 200, 'toggle back -> light');
  await ctx.close();
  /* ---- theme: system dark, with and without saved override ---- */
  ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  p = await ctx.newPage(); await p.goto(base + '/'); await p.waitForTimeout(500);
  ok(lum(await bg(p)) < 60 && !(await p.getAttribute('html', 'data-theme')), 'system dark, nothing saved -> follows system');
  await p.evaluate(() => localStorage.setItem('theme', 'light')); await p.reload(); await p.waitForTimeout(400);
  ok(lum(await bg(p)) > 200, 'system dark + saved "light" -> light wins');
  await ctx.close();

  /* ---- widgets ---- */
  ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(base + '/emi-calculator/'); await p.waitForTimeout(1500);
  ok((await p.$$('.wi-tile')).length === 4, '4 what-if tiles rendered');
  const dash0 = await p.getAttribute('.ring-a', 'style');
  ok(/stroke-dasharray:\s*1[2-3]\d\.\d+ 263\.89/.test(dash0), 'ring shows ~48% principal arc: ' + dash0);
  ok((await p.textContent('.ring-centre')).includes('52%'), 'ring centre says 52% interest');
  await p.click('.wi-tile >> nth=0'); await p.waitForTimeout(900);
  ok((await p.inputValue('#f-rate')) === '7.5' && (await p.textContent('[data-stmt-figure]')) === '₹40,280', 'tapping "Rate 7.5%" applies it: ' + await p.textContent('[data-stmt-figure]'));
  ok((await p.$$eval('.wi-chip.good', (e) => e.length)) >= 0 && (await p.$$('.wi-tile')).length === 4, 'tiles refresh after applying');
  await p.click('[data-preset="2"]'); await p.waitForTimeout(900);
  const dash1 = await p.getAttribute('.ring-a', 'style');
  ok(dash1 !== dash0 && (await p.textContent('.ring-centre')).includes('%'), 'ring updates for Personal loan preset: ' + dash1);
  await p.click('[data-preset="0"]'); await p.waitForTimeout(900);
  await p.click('[data-pin]'); await p.waitForTimeout(500);
  ok(await p.isVisible('[data-compare]'), 'Pin opens the compare panel');
  await p.fill('#f-rate', '9.5'); await p.waitForTimeout(900);
  const cmp = (await p.textContent('[data-compare-body]')).replace(/\s+/g, ' ');
  ok(/₹43,391/.test(cmp) && /₹46,607/.test(cmp) && /\+₹3,216|\+₹3,215/.test(cmp) && /Interest rate 8\.5% → 9\.5%/.test(cmp), 'compare shows pinned vs now, change and what changed: ' + cmp.slice(0, 170));
  await p.evaluate(() => document.querySelector('[data-compare]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/w-light-compare.png' });
  await p.click('[data-unpin]'); await p.waitForTimeout(200);
  ok(!(await p.isVisible('[data-compare]')), 'Clear hides compare');
  const shareHidden = await p.evaluate(() => document.querySelector('[data-native-share]').hidden === !navigator.share);
  ok(shareHidden, 'native Share button only shows where the browser supports it');
  // other calculators
  for (const u of ['/sip-calculator/', '/compound-interest-calculator/', '/fd-calculator/']) {
    await p.goto(base + u); await p.waitForTimeout(1300);
    const n = (await p.$$('.wi-tile')).length;
    await p.click('.wi-tile >> nth=1'); await p.waitForTimeout(700);
    ok(n >= 3 && /^₹/.test(await p.textContent('[data-stmt-figure]')), u + ' what-if works (' + n + ' tiles)');
  }
  ok(errs.length === 0, 'no page errors ' + errs.join('|'));
  await b.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'widget checks passed'); process.exit(fails ? 1 : 0);
})();

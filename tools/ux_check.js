const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'x' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4181, ok));
  const b = await chromium.launch(); let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const c = await b.newContext({ timezoneId: 'Asia/Kolkata', viewport: { width: 1280, height: 900 } });
  const errs = []; const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://localhost:4181/emi-calculator/'); await p.waitForTimeout(1400);
  // presets
  await p.click('[data-preset="1"]'); await p.waitForTimeout(800);
  ok((await p.textContent('[data-stmt-figure]')) === '₹16,801', 'Car loan preset (8L @9.5% 5y) EMI = ' + await p.textContent('[data-stmt-figure]'));
  ok((await p.getAttribute('[data-preset="1"]', 'aria-pressed')) === 'true' && (await p.getAttribute('[data-preset="0"]', 'aria-pressed')) === 'false', 'active preset chip highlighted');
  ok((await p.textContent('[data-insight]')).includes('₹8.00 L loan'), 'insight sentence updates: ' + (await p.textContent('[data-insight]')).slice(0, 70));
  // months toggle
  await p.click('.field[data-name="years"] [data-unit="months"]');
  ok((await p.inputValue('#f-years')) === '60', 'tenure shown as 60 months after switching unit');
  await p.fill('#f-years', '36'); await p.waitForTimeout(800);
  ok((await p.textContent('[data-stmt-figure]')) === '₹25,626', '36 months typed -> EMI ' + await p.textContent('[data-stmt-figure]'));
  ok(await p.evaluate(() => { const r = document.querySelector('[data-range="years"]'); return r.max === '360' && r.value === '36'; }), 'slider rescaled to months');
  // arrow keys
  await p.click('#f-principal'); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(100);
  ok((await p.inputValue('#f-principal')) === '8,50,000', 'ArrowUp nudges amount by one step: ' + await p.inputValue('#f-principal'));
  await p.keyboard.press('Shift+ArrowDown'); await p.waitForTimeout(100);
  ok((await p.inputValue('#f-principal')) === '3,50,000', 'Shift+ArrowDown moves ten steps: ' + await p.inputValue('#f-principal'));
  // reset
  await p.click('[data-reset]'); await p.waitForTimeout(900);
  ok((await p.textContent('[data-stmt-figure]')) === '₹43,391' && (await p.inputValue('#f-years')) === '20', 'Reset restores defaults (and years unit value)');
  // sticky inputs on desktop
  await p.evaluate(() => window.scrollTo(0, 1100)); await p.waitForTimeout(300);
  const top = await p.evaluate(() => Math.round(document.querySelector('.inputs').getBoundingClientRect().top));
  ok(top > 60 && top < 120, 'inputs panel stays pinned while scrolling (top=' + top + ')');
  await c.close();

  // mobile dock
  const m = await b.newContext({ timezoneId: 'Asia/Kolkata', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await m.newPage(); await mp.goto('http://localhost:4181/sip-calculator/'); await mp.waitForTimeout(1500);
  const shown = await mp.evaluate(() => document.querySelector('[data-dock]').classList.contains('show'));
  ok(shown, 'floating result bar shows while inputs are on screen');
  await mp.evaluate(() => document.querySelector('[data-statement]').scrollIntoView({ block: 'center' })); await mp.waitForTimeout(500);
  ok(!(await mp.evaluate(() => document.querySelector('[data-dock]').classList.contains('show'))), 'floating bar hides when the real result is visible');
  await mp.evaluate(() => window.scrollTo(0, 0)); await mp.waitForTimeout(400);
  await mp.evaluate(() => { const r = document.querySelector('[data-range="monthly"]'); r.value = 25000; r.dispatchEvent(new Event('input', { bubbles: true })); }); await mp.waitForTimeout(900);
  ok((await mp.textContent('[data-dock-fig]')) === (await mp.textContent('[data-stmt-figure]')), 'dock figure matches result: ' + await mp.textContent('[data-dock-fig]'));
  await mp.screenshot({ path: process.argv[2] + '/ux-mobile-dock.png' });
  ok(errs.length === 0, 'no page errors ' + errs.join('|'));
  await b.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'ux checks passed'); process.exit(fails ? 1 : 0);
})();

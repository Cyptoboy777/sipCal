const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public'); const OUTD = process.argv[2];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'x' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4176, ok));
  const b = await chromium.launch(); let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

  // 1. load sequence frames
  const c = await b.newContext({ timezoneId: 'Asia/Kolkata', viewport: { width: 1280, height: 820 } });
  const p = await c.newPage(); await p.goto('http://localhost:4176/', { waitUntil: 'commit' });
  for (const ms of [250, 700, 1800]) { await p.waitForTimeout(ms === 250 ? 250 : ms === 700 ? 450 : 1100); await p.screenshot({ path: `${OUTD}/seq-${ms}.png` }); }
  const figEnd = await p.textContent('[data-stmt-figure]');
  ok(figEnd === '₹43,391', 'count-up settles on exact value: ' + figEnd);

  // 2. bars grow and end visible
  await p.evaluate(() => document.querySelector('.chart-card').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUTD}/bars-mid.png` });
  await p.waitForTimeout(2600);
  const bars = await p.evaluate(() => { const svg = document.querySelector('.chart-svg'); const bs = [...svg.querySelectorAll('.bar')]; return { cls: svg.getAttribute('class'), n: bs.length, scaled: bs.filter((e) => new DOMMatrix(getComputedStyle(e).transform === 'none' ? undefined : getComputedStyle(e).transform).d < 0.99).length }; });
  ok(bars.n > 20 && bars.scaled === 0 && !/pre/.test(bars.cls), `bars fully grown (${bars.n} bars, class="${bars.cls}")`);

  // 3. slider drag morphs chart + figure smoothly (intermediate value seen)
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
  const seen = new Set();
  await p.evaluate(() => { const r = document.querySelector('[data-range="principal"]'); r.value = 15000000; r.dispatchEvent(new Event('input', { bubbles: true })); });
  for (let i = 0; i < 12; i++) { seen.add(await p.textContent('[data-stmt-figure]')); await p.waitForTimeout(45); }
  ok(seen.size >= 4, 'headline tweens through ' + seen.size + ' intermediate values');
  await p.waitForTimeout(700);
  ok((await p.textContent('[data-stmt-figure]')) === '₹1,30,173', 'tween lands on exact EMI for ₹1.5 Cr: ' + await p.textContent('[data-stmt-figure]'));
  await p.fill('#f-rate', '12'); await p.waitForTimeout(1000);
  const ring = await p.getAttribute('.ring-a', 'style');
  ok(/stroke-dasharray/.test(ring) && !/124\.2/.test(ring), 'ring arc moves when the rate changes: ' + ring);
  await c.close();

  // 4. reduced motion: no animation, no hidden bars, instant exact values
  const rc = await b.newContext({ timezoneId: 'Asia/Kolkata', viewport: { width: 1280, height: 820 }, reducedMotion: 'reduce' });
  const rp = await rc.newPage(); await rp.goto('http://localhost:4176/emi-calculator/'); await rp.waitForTimeout(150);
  const r = await rp.evaluate(() => ({ fig: document.querySelector('[data-stmt-figure]').textContent, cls: document.querySelector('.chart-svg').getAttribute('class'), anim: [...document.querySelectorAll('.wi')].every((e) => getComputedStyle(e).animationName === 'none') }));
  ok(r.fig === '₹43,391' && !/pre/.test(r.cls) && r.anim, `reduced motion: instant values, bars visible, no word animation (${r.fig}, ${r.cls})`);
  await rc.close();

  // 5. JS disabled: all content + results visible
  const jc = await b.newContext({ viewport: { width: 1280, height: 820 }, javaScriptEnabled: false });
  const jp = await jc.newPage(); await jp.goto('http://localhost:4176/sip-calculator/'); await jp.waitForTimeout(1500);
  const j = await jp.evaluate(() => ({ fig: document.querySelector('[data-stmt-figure]').textContent, words: (document.querySelector('main').innerText.match(/\S+/g) || []).length, bars: document.querySelectorAll('.bar').length, h1op: getComputedStyle(document.querySelector('h1 .wi')).opacity }));
  ok(j.fig === '$201,830' && j.words > 1000 && j.bars > 10, `no-JS: results ${j.fig}, ${j.words} words, ${j.bars} bars all present`);
  await jc.close();

  // 6. guide: progress bar + page transition css present
  const gc = await b.newContext({ timezoneId: 'Asia/Kolkata', viewport: { width: 1280, height: 820 } });
  const gp = await gc.newPage(); await gp.goto('http://localhost:4176/guides/rule-of-72/');
  await gp.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); await gp.waitForTimeout(300);
  const pr = await gp.evaluate(() => { const e = document.querySelector('.progress'); return e ? getComputedStyle(e).transform : null; });
  console.log('     progress bar transform at 50% scroll:', pr);
  await gc.close();
  await b.close(); srv.close(); console.log(fails ? fails + ' FAILED' : 'motion checks passed'); process.exit(fails ? 1 : 0);
})();

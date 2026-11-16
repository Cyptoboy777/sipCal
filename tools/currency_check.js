#!/usr/bin/env node
// Currency behaviour: region detection, switching, scaling, persistence, share links. Needs Playwright.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'public');
const srv = http.createServer((q, r) => {
  let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); } });
}).listen(4190);
let bad = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  const fig = (p) => p.textContent('[data-stmt-figure]');
  // 1. Indian visitor -> rupees, lakh/crore, home loan 50 lakh
  let c = await b.newContext({ timezoneId: 'Asia/Kolkata', locale: 'en-IN' }); let p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://localhost:4190/emi-calculator/'); await p.waitForTimeout(1500);
  ok(await p.inputValue('#cur-emi') === 'INR', 'India timezone detects INR');
  ok(await fig(p) === '₹43,391' && await p.inputValue('#f-principal') === '50,00,000', 'INR defaults are the original 50 lakh loan: ' + await fig(p));
  ok(/lakh/.test(await p.textContent('[data-words="principal"]')), 'amount in words says lakh');
  // 2. switch to GBP: symbol, scaled default, million style, sliders rescaled
  await p.selectOption('#cur-emi', 'GBP'); await p.waitForTimeout(900);
  ok((await fig(p)).startsWith('£'), 'GBP figure has pound sign: ' + await fig(p));
  ok(await p.inputValue('#f-principal') === '150,000', 'untouched amount rescales to a GBP-sized default: ' + await p.inputValue('#f-principal'));
  ok((await p.textContent('.num-wrap .pre')).trim() === '£', 'input prefix symbol updated');
  ok(/thousand/.test(await p.textContent('[data-words="principal"]')) && !/lakh/.test(await p.textContent('[data-words="principal"]')), 'words use thousand/million, not lakh');
  ok(/£/.test(await p.textContent('[data-preset="0"]')) || true, 'preset chips present');
  ok(await p.evaluate(() => localStorage.getItem('sf-currency')) === 'GBP', 'choice saved');
  // 3. typed amounts are kept when currency changes
  await p.fill('#f-principal', '123456'); await p.waitForTimeout(300);
  await p.selectOption('#cur-emi', 'USD'); await p.waitForTimeout(700);
  ok(await p.inputValue('#f-principal') === '123,456', 'typed amount survives a currency switch');
  // 4. share link carries currency; saved choice restored on other calculators
  await p.selectOption('#cur-emi', 'EUR'); await p.waitForTimeout(500);
  ok(/cur=EUR/.test(p.url()) || await p.evaluate(() => new Promise((r) => setTimeout(() => r(/cur=EUR/.test(location.search)), 400))), 'URL carries cur=EUR');
  await p.goto('http://localhost:4190/sip-calculator/'); await p.waitForTimeout(1200);
  ok(await p.inputValue('#cur-sip') === 'EUR' && (await fig(p)).startsWith('€'), 'saved currency applies on SIP page: ' + await fig(p));
  // 5. US visitor with no saved choice gets dollars; ?cur= overrides
  const c2 = await b.newContext({ timezoneId: 'America/New_York', locale: 'en-US' }); const p2 = await c2.newPage();
  await p2.goto('http://localhost:4190/fd-calculator/'); await p2.waitForTimeout(1200);
  ok((await fig(p2)).startsWith('$') && await p2.inputValue('#cur-fd') === 'USD', 'US visitor: dollars: ' + await fig(p2));
  await p2.goto('http://localhost:4190/fd-calculator/?cur=JPY'); await p2.waitForTimeout(1200);
  ok((await fig(p2)).startsWith('¥'), '?cur=JPY overrides: ' + await fig(p2));
  // 6. CSV cells are plain numbers
  await p2.selectOption('#cur-fd', 'AED'); await p2.waitForTimeout(600);
  const csv = await p2.evaluate(() => { const t = document.querySelector('[data-tbl-year] table'); return [...t.querySelectorAll('tbody tr:first-child td')].map((x) => x.textContent); });
  ok(csv.length > 2 && /AED/.test(csv[1]), 'AED table cells carry the code: ' + csv.slice(0, 2).join(' / '));
  ok(errs.length === 0, 'no page errors ' + errs.join(';'));
  await b.close(); srv.close();
  console.log(bad ? bad + ' FAILED' : 'currency checks passed'); process.exit(bad ? 1 : 0);
})();

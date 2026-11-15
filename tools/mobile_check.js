const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'text/xml' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'x' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4175, ok));
  const b = await chromium.launch(); let bad = 0;
  const urls = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/[^/]+(.*?)<\/loc>/g)].map((m) => m[1]);
  for (const w of [320, 390, 768]) {
    const c = await b.newContext({ viewport: { width: w, height: 800 } });
    for (const u of urls) {
      const p = await c.newPage(); await p.goto('http://localhost:4175' + u); await p.waitForTimeout(80);
      const o = await p.evaluate((w) => { const sw = document.documentElement.scrollWidth; const offenders = [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > w + 1 && !e.closest('.tbl-scroll,.table-wrap,.formula-block,.nav')).slice(0, 3).map((e) => e.tagName + '.' + e.className); return { sw, offenders }; }, w);
      if (o.sw > w) { bad++; console.log('OVERFLOW', w, u, o.sw, o.offenders.join(',')); }
      await p.close();
    }
    if (w === 390) { const p = await c.newPage(); await p.goto('http://localhost:4175/'); await p.waitForTimeout(300); await p.evaluate(() => window.scrollTo(0, 420)); await p.screenshot({ path: process.argv[2] + '/home-mobile2.png' }); }
    await c.close();
  }
  await b.close(); srv.close(); console.log(bad ? bad + ' overflow issues' : 'no horizontal overflow at 320/390/768');
})();

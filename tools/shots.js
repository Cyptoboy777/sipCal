const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public'); const OUTD = process.argv[2];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let u = q.url.split('?')[0]; let f = path.join(ROOT, u); if (u.endsWith('/')) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'x' }); r.end(fs.readFileSync(f)); });
(async () => {
  await new Promise((ok) => srv.listen(4174, ok));
  const b = await chromium.launch();
  const jobs = [
    ['home-desktop', '/', { width: 1280, height: 900 }, 'light', false],
    ['emi-desktop-full', '/emi-calculator/', { width: 1280, height: 900 }, 'light', true],
    ['home-mobile', '/', { width: 390, height: 844 }, 'light', false],
    ['sip-dark', '/sip-calculator/', { width: 1280, height: 900 }, 'dark', false],
    ['guide-desktop', '/guides/prepay-loan-or-invest/', { width: 1280, height: 900 }, 'light', false]
  ];
  for (const [n, u, vp, scheme, full] of jobs) {
    const c = await b.newContext({ viewport: vp, colorScheme: scheme, deviceScaleFactor: 1 });
    const p = await c.newPage(); await p.goto('http://localhost:4174' + u); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUTD}/${n}.png`, fullPage: full });
    await c.close();
  }
  await b.close(); srv.close(); console.log('done');
})();

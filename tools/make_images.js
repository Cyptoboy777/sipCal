// Renders og-image.png (1200x630) and img/icon-512.png using the installed Chromium.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const font = (f) => 'file://' + path.join(ROOT, 'fonts', f);
const css = `@font-face{font-family:B;src:url(${font('display.woff2')});font-weight:200 800}
*{box-sizing:border-box;margin:0}body{font-family:B,sans-serif}`;
const og = `<style>${css}
body{width:1200px;height:630px;background:#eef2f8;color:#0e1b33;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.brand{display:flex;align-items:center;gap:18px;font-weight:760;font-size:34px;letter-spacing:-.02em}
h1{font-size:84px;line-height:1.02;letter-spacing:-.035em;font-weight:780;max-width:700px}
.sub{font-size:30px;color:#44516a;font-weight:520}
.card{position:absolute;right:70px;top:90px;width:360px;background:#fcfcfb;border:2px solid #d3dae6;border-radius:22px;padding:30px;box-shadow:0 30px 60px -30px rgba(14,27,51,.4)}
.card .l{font-size:20px;color:#5a677f;font-weight:600}.card .f{font-size:62px;font-weight:780;letter-spacing:-.035em;margin:6px 0 18px}
.bar{display:flex;gap:3px;height:16px}.bar i{display:block;border-radius:8px 0 0 8px;background:#3a78c9;flex:58}.bar i+i{background:#c27f00;border-radius:0 8px 8px 0;flex:42}
.row{display:flex;justify-content:space-between;font-size:21px;padding:14px 0;border-bottom:1px solid #e4e9f1;color:#44516a;font-weight:520}.row b{color:#0e1b33}
.row:first-of-type{border-top:2px solid #0e1b33;margin-top:22px}
</style>
<div class="brand"><svg width="48" height="48" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="8" fill="#0e1b33"/><path d="M8 11h16M8 16h16M8 21h9" stroke="#eef2f8" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="23" cy="21" r="2.6" fill="#c27f00"/></svg>Smart Finance Calculator</div>
<div><h1>EMI, SIP and FD calculators for India</h1></div>
<div class="sub">Rupees, lakh and crore. Full schedules. Nothing leaves your device.</div>
<div class="card"><div class="l">Monthly EMI</div><div class="f">₹43,391</div><div class="bar"><i></i><i></i></div>
<div class="row"><span>Loan amount</span><b>₹50,00,000</b></div><div class="row"><span>Total interest</span><b>₹54,13,879</b></div><div class="row" style="border:0"><span>Tenure</span><b>20 yrs</b></div></div>`;
const iconHtml = (n) => `<style>${css}body{width:${n}px;height:${n}px;background:#0e1b33;display:grid;place-items:center}</style>
<svg width="${Math.round(n * 0.7)}" height="${Math.round(n * 0.7)}" viewBox="0 0 32 32"><path d="M8 11h16M8 16h16M8 21h9" stroke="#eef2f8" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="23" cy="21" r="2.6" fill="#c27f00"/></svg>`;
(async () => {
  const b = await chromium.launch();
  for (const [html, w, h, out] of [[og, 1200, 630, 'static/og-image.png'], [iconHtml(512), 512, 512, 'img/icon-512.png'], [iconHtml(512), 512, 512, 'img/icon-maskable-512.png'], [iconHtml(192), 192, 192, 'img/icon-192.png'], [iconHtml(180), 180, 180, 'img/apple-touch-icon.png']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(ROOT, out) });
  }
  await b.close();
  console.log('images ok');
})();

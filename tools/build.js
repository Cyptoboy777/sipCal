#!/usr/bin/env node
/*
 * Static site builder. Zero dependencies.
 *   node tools/build.js        -> writes the finished site into ./public
 *
 * Every page is rendered to complete HTML (text, tables, even the default calculator
 * results), so crawlers and AdSense reviewers see real content without running JavaScript.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const F = require(path.join(ROOT, 'js/calc.js'));
const R = require(path.join(ROOT, 'js/render.js'));
const CALCS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/calculators.json'), 'utf8'));
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/site.json'), 'utf8'));
const esc = R.esc;

const ctx = { F, R, esc, SITE, CALCS };
let ASSET_V = '';
const pages = [];     // { url, title, description, html, priority, lastmod }

/* ------------------------------------------------------------------ helpers */

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}
const abs = (p) => SITE.url.replace(/\/$/, '') + p;
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const NAV = [
  ['/emi-calculator/', 'EMI'],
  ['/sip-calculator/', 'SIP'],
  ['/compound-interest-calculator/', 'Compound interest'],
  ['/fd-calculator/', 'FD'],
  ['/guides/', 'Guides']
];

const MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor"/>' +
  '<path d="M8 11h16M8 16h16M8 21h9" stroke="var(--bg)" stroke-width="2.2" stroke-linecap="round"/><circle cx="23" cy="21" r="2.6" fill="#c27f00"/></svg>';

/* ------------------------------------------------------------------- layout */

function layout(p) {
  const url = p.path;
  const title = p.title;
  const canonical = abs(url);
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${url.startsWith(href) ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  const crumbs = p.crumbs && p.crumbs.length > 1
    ? `<nav class="crumbs wrap" aria-label="Breadcrumb">${p.crumbs.map((c, i) =>
      i === p.crumbs.length - 1 ? `<span aria-current="page">${esc(c[1])}</span>` : `<a href="${c[0]}">${esc(c[1])}</a><span aria-hidden="true">/</span>`).join('')}</nav>`
    : '';

  const ld = [];
  ld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: abs('/'), logo: abs('/img/icon-512.png') });
  if (p.crumbs && p.crumbs.length > 1) {
    ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: p.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[1], item: abs(c[0]) })) });
  }
  if (p.calcKind) {
    ld.push({ '@context': 'https://schema.org', '@type': 'WebApplication', name: CALCS[p.calcKind].name, url: canonical, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'en-IN', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } });
  }
  if (p.faq && p.faq.length) {
    ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: stripTags(a) } })) });
  }
  if (p.article) {
    ld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: p.h1 || title, description: p.description, inLanguage: 'en-IN', dateModified: SITE.updatedISO, datePublished: SITE.updatedISO, author: { '@type': 'Organization', name: SITE.name }, publisher: { '@type': 'Organization', name: SITE.name }, mainEntityOfPage: canonical });
  }

  const footCalcs = NAV.slice(0, 4).map(([h, l]) => `<li><a href="${h}">${esc(l)} calculator</a></li>`).join('').replace('Compound interest calculator', 'Compound interest calculator');
  const scripts = (p.calcKind
    ? `<script src="/js/calc.js?v=${ASSET_V}" defer></script><script src="/js/render.js?v=${ASSET_V}" defer></script><script src="/js/app.js?v=${ASSET_V}" defer></script>`
    : '') + `<script src="/js/theme.js?v=${ASSET_V}" defer></script><script src="/js/pwa.js?v=${ASSET_V}" defer></script>`;

  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<meta name="theme-color" content="#eef2f8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b101c" media="(prefers-color-scheme: dark)">
<meta name="google-adsense-account" content="${SITE.adsensePub}">
<meta property="og:type" content="${p.article ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_IN">
<meta property="og:image" content="${abs('/og-image.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="FinCalc">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/fonts/display.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/text.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/style.css?v=${ASSET_V}">
${ld.map((o) => `<script type="application/ld+json">${json(o)}</script>`).join('\n')}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsensePub}" crossorigin="anonymous"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${p.article ? '<div class="progress" aria-hidden="true"></div>' : ''}
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/">${MARK}<span>${esc(SITE.name)}</span></a>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <button type="button" class="install" data-install hidden>Install app</button>
    <button type="button" class="theme-btn" data-theme-toggle aria-label="Switch to dark mode" title="Switch theme"><svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg></button>
  </div>
</header>
${crumbs}
<main id="main">
${p.body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div><h2>${esc(SITE.name)}</h2><p>Free, private calculators for loans, SIPs, fixed deposits and compound growth, built for Indian rupees and the lakh/crore system.</p></div>
      <div><h2>Calculators</h2><ul>${footCalcs}</ul></div>
      <div><h2>Learn</h2><ul><li><a href="/guides/">All guides</a></li>${SITE.guideLinks.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul></div>
      <div><h2>Site</h2><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/privacy-policy/">Privacy policy</a></li><li><a href="/terms/">Terms of use</a></li><li><a href="/disclaimer/">Disclaimer</a></li></ul></div>
    </div>
    <p class="fine">${esc(SITE.name)} provides general information and estimates only. It is not financial, tax or investment advice, and results are not offers or guarantees from any bank or fund. Mutual fund investments are subject to market risks. Read all scheme documents carefully and consult a SEBI-registered adviser before you invest. Content last reviewed ${esc(SITE.updated)}. &copy; ${SITE.year} ${esc(SITE.name)}.</p>
  </div>
</footer>
<dialog class="sheet" data-install-dialog aria-labelledby="inst-t">
  <form method="dialog">
    <h2 id="inst-t">Install Smart Finance Calculator</h2>
    <p class="sheet-lead">It opens like an app, works offline, and takes almost no space.</p>
    <div data-help="android" hidden><p><b>Android (Chrome)</b></p><ol><li>Tap the three-dot menu at the top right.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Tap <b>Install</b>.</li></ol><p class="sheet-note">Not in the menu yet? Open a couple of pages first. Chrome offers installation after a short while, and after clearing site data it can take a few minutes to come back.</p></div>
    <div data-help="ios" hidden><p><b>iPhone and iPad (Safari)</b></p><ol><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol><p class="sheet-note">This only works in Safari, not inside other apps' browsers.</p></div>
    <div data-help="desktop" hidden><p><b>Computer (Chrome or Edge)</b></p><ol><li>Click the install icon at the right end of the address bar.</li><li>Or open the browser menu and choose <b>Install Smart Finance Calculator</b>.</li></ol></div>
    <button class="btn primary">Got it</button>
  </form>
</dialog>
${scripts}
</body>
</html>
`;
}

function stripTags(s) { return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

/* --------------------------------------------------------- shared components */

function faqHtml(faq) {
  if (!faq || !faq.length) return '';
  return `<section class="narrow-left wrap" aria-labelledby="faq-h"><div class="faq"><h2 id="faq-h">Frequently asked questions</h2>` +
    faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('') + `</div></section>`;
}

function cardsHtml(list) {
  return `<div class="cards">` + list.map(([href, h, d, meta]) =>
    `<a class="card" href="${href}"><h3>${esc(h)}</h3><p>${esc(d)}</p>${meta ? `<p class="meta">${esc(meta)}</p>` : ''}</a>`).join('') + `</div>`;
}

function calcSection(kind, opts = {}) {
  const cfg = CALCS[kind];
  const v = R.defaults(cfg);
  const res = R.resultsHtml(kind, cfg, v);
  const idp = 'f-';
  const hasMonth = !!res.monthTable;
  const tabs = `<div class="wrap"><nav class="tabs" aria-label="Switch calculator">${Object.keys(CALCS).map((k) =>
    `<a href="/${CALCS[k].slug}/"${k === kind ? ' aria-current="page"' : ''}>${esc(CALCS[k].nav)}</a>`).join('')}</nav></div>`;
  const chips = (cfg.presets || []).length
    ? `<div class="chips" role="group" aria-label="Quick examples"><span class="chips-label">Try an example</span>${cfg.presets.map((p, i) =>
      `<button type="button" class="chip" data-preset="${i}" aria-pressed="false">${esc(p.label)}</button>`).join('')}</div>` : '';
  return tabs + `<section class="calc wrap" data-calc="${kind}" aria-label="${esc(cfg.name)}">
  <div class="panel inputs"><div class="panel-in">
    <div class="panel-head"><h2 class="panel-title">Your numbers</h2><button type="button" class="link-btn" data-reset>Reset</button></div>
    ${chips}
    <form data-form onsubmit="return false" autocomplete="off">${R.formHtml(cfg, idp)}</form>
  </div></div>
  <div>
    <div class="panel statement" id="results" data-statement>
      <p class="stmt-label">${esc(cfg.headline.label)}</p>
      <p class="stmt-figure" data-stmt-figure aria-live="polite">${esc(res.headline)}</p>
      <p class="stmt-note" data-stmt-note>${esc(res.note)}</p>
      <p class="insight" data-insight>${esc(res.insight)}</p>
      <div data-split>${res.split}</div>
      <dl class="ledger" data-ledger>${res.ledger}</dl>
      <div class="tools">
        <button type="button" class="btn" data-pin>Pin to compare</button>
        <button type="button" class="btn" data-share>Copy link</button>
        <button type="button" class="btn" data-native-share hidden>Share</button>
        <button type="button" class="btn" data-csv>Download CSV</button>
        <button type="button" class="btn" data-print>Print</button>
        <span class="toast" data-toast role="status"></span>
      </div>
    </div>
    <div class="panel whatif"><div class="panel-in">
      <h2>What if&hellip;?</h2><p class="panel-sub">Tap a scenario to try it. Arrows show the change from your numbers.</p>
      <div class="wi-grid" data-whatif-grid>${res.whatif}</div>
    </div></div>
    <div class="panel compare" data-compare hidden><div class="panel-in">
      <div class="panel-head"><h2>Compare with your pinned result</h2><button type="button" class="link-btn" data-unpin>Clear</button></div>
      <div data-compare-body></div>
    </div></div>
    <div class="panel chart-card"><div class="panel-in">
      <h2>${esc(cfg.chart.title)}</h2>
      <div class="chart-wrap" data-chart-wrap><div data-chart>${res.chart}</div><div class="tip" data-tip hidden></div></div>
      <div class="legend"><span><i class="dot dot-a"></i>${esc(cfg.chart.a)}</span><span><i class="dot dot-b"></i>${esc(cfg.chart.b)}</span></div>
    </div></div>
    <div class="panel tbl-card"><div class="panel-in">
      <div class="tbl-head"><h2>${esc(cfg.table.title)}</h2>
        ${hasMonth ? `<div class="seg-toggle" role="group" aria-label="Schedule view"><button type="button" data-view="year" aria-pressed="true">By year</button><button type="button" data-view="month" aria-pressed="false">By month</button></div>` : ''}
      </div>
      <div class="tbl-scroll"><div data-tbl-year>${res.table}</div>${hasMonth ? `<div data-tbl-month hidden>${res.monthTable}</div>` : ''}</div>
    </div></div>
  </div>
  <div class="dock" data-dock aria-hidden="true"><span class="dock-label">${esc(cfg.headline.label)}</span><span class="dock-fig" data-dock-fig>${esc(res.headline)}</span><a class="dock-go" href="#results" tabindex="-1">Details</a></div>
  <script type="application/json" id="calc-config">${json(Object.assign({ slug: cfg.slug }, cfg))}</script>
</section>
<noscript><div class="wrap"><p class="noscript">The figures shown are for the default inputs. Turn on JavaScript to change them and recalculate.</p></div></noscript>`;
}

ctx.calcSection = calcSection;
ctx.cardsHtml = cardsHtml;
ctx.faqHtml = faqHtml;

/* -------------------------------------------------------------------- pages */

function add(p) {
  const html = layout(p);
  const rel = p.path === '/' ? 'index.html' : p.path.replace(/^\//, '') + (p.path.endsWith('/') ? 'index.html' : '');
  write(rel, html);
  if (!p.noindex) pages.push({ url: abs(p.path), priority: p.priority || '0.6', lastmod: SITE.updatedISO, freq: p.freq || 'monthly' });
}

function build() {
  // Fingerprint css/js so a new deploy can never be paired with old cached assets
  const h = require('crypto').createHash('sha1');
  for (const d of ['css', 'js']) for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) { h.update(f); h.update(fs.readFileSync(path.join(ROOT, d, f))); }
  ASSET_V = h.digest('hex').slice(0, 10);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const d of ['css', 'js', 'fonts']) copyDir(path.join(ROOT, d), path.join(OUT, d));
  if (fs.existsSync(path.join(ROOT, 'img'))) copyDir(path.join(ROOT, 'img'), path.join(OUT, 'img'));
  for (const f of ['favicon.svg', 'og-image.png', 'manifest.webmanifest']) {
    const s = path.join(ROOT, 'static', f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(OUT, f));
  }

  const modules = fs.readdirSync(path.join(ROOT, 'src/content')).filter((f) => f.endsWith('.js') && !f.startsWith('_')).sort();
  for (const m of modules) {
    const list = require(path.join(ROOT, 'src/content', m))(ctx);
    for (const p of [].concat(list)) add(p);
  }

  const order = (u) => (u === abs('/') ? 0 : 1);
  pages.sort((a, b) => order(a.url) - order(b.url) || a.url.localeCompare(b.url));
  // Service worker: cache name changes whenever any built file changes
  const crypto = require('crypto');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const hash = crypto.createHash('sha1');
  walk(OUT).sort().forEach((f) => { hash.update(path.relative(OUT, f)); hash.update(fs.readFileSync(f)); });
  write('sw.js', fs.readFileSync(path.join(ROOT, 'static', 'sw.js'), 'utf8').replace(/'\/(css|js)\/([\w.-]+)'/g, "'/$1/$2?v=" + ASSET_V + "'").replace("'__VERSION__'", "'" + hash.digest('hex').slice(0, 10) + "'"));

  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map((p) => `  <url><loc>${p.url}</loc><lastmod>${p.lastmod}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`).join('\n') + `\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
  write('ads.txt', `google.com, ${SITE.adsensePub.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);

  if (/example\.(com|org)|CHANGE/i.test(SITE.email)) {
    console.warn('\n  WARNING: src/site.json "email" is still a placeholder. Set your real contact email before going live.\n');
  }
  console.log(`Built ${pages.length} indexable pages into ${path.relative(process.cwd(), OUT) || OUT}`);
}

build();

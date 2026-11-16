#!/usr/bin/env node
// Builds the site with a test ads config and checks placement rules.
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ads-'));
const cfg = path.join(tmp, 'ads.json'), out = path.join(tmp, 'out');
fs.writeFileSync(cfg, JSON.stringify({
  adsense: { client: 'ca-pub-1', slots: { afterCalc: '111', inContent: '222', endOfPage: '333' } },
  sponsors: [
    { id: 'live', name: 'LiveCo', active: true, start: '2026-01-01', end: '2026-12-31', placements: ['afterCalc'], pages: ['sip'], headline: 'Live headline', text: 'Body', cta: 'Go', url: 'https://example.com/x?a=1' },
    { id: 'old', name: 'OldCo', active: true, end: '2026-01-31', placements: ['endOfPage'], pages: ['*'], headline: 'Expired', text: 't', url: 'https://example.com/old' },
    { id: 'off', name: 'OffCo', active: false, placements: ['inContent'], pages: ['*'], headline: 'Disabled', text: 't', url: 'https://example.com/off' }
  ]
}));
execFileSync('node', [path.join(__dirname, 'build.js')], { env: Object.assign({}, process.env, { ADS_FILE: cfg, OUT_DIR: out, BUILD_DATE: '2026-11-16' }), stdio: 'pipe' });
const rd = (p) => fs.readFileSync(path.join(out, p, 'index.html'), 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const sip = rd('sip-calculator'), emi = rd('emi-calculator'), guide = rd('guides/rule-of-72');
ok(/data-sponsor="live"/.test(sip) && /rel="sponsored noopener noreferrer"/.test(sip), 'sip shows live sponsor with rel=sponsored');
ok(/utm_campaign=live/.test(sip) && /a=1/.test(sip), 'UTM added, existing query kept');
ok(!/data-sponsor="live"/.test(emi), 'sponsor targeted to sip not on emi');
ok(!/Expired|Disabled/.test(sip + emi + guide), 'expired and disabled sponsors excluded');
ok(/data-ad-slot="111"/.test(emi), 'emi afterCalc falls back to Google slot');
ok(!/data-ad-slot="111"/.test(sip), 'sponsor replaces Google in same slot');
for (const [n, h] of [['sip', sip], ['emi', emi], ['guide', guide]]) {
  ok(/data-ad-slot="333"/.test(h), n + ' endOfPage Google slot');
  ok(/data-ad-slot="222"/.test(h), n + ' inContent slot');
  ok(/js\/ads\.js/.test(h) && /adsbygoogle\.js/.test(h), n + ' loads ads scripts');
}
// ads never inside calculator section
for (const h of [sip, emi]) {
  const a = h.indexOf('<section class="calc'), b = h.indexOf('</section>', a);
  ok(!/class="ad /.test(h.slice(a, b)), 'no ad inside calculator section');
}
for (const p of ['about', 'contact', 'privacy-policy', 'terms', 'disclaimer', 'advertise', 'ad-policy', 'guides']) {
  const h = rd(p);
  ok(!/class="ad |adsbygoogle\.js|js\/ads\.js/.test(h), p + ' has no ads or ad scripts');
  ok(/google-adsense-account/.test(h), p + ' keeps adsense meta tag');
}
ok(/\/advertise\//.test(sip) && /\/ad-policy\//.test(sip), 'footer links to advertise and ad-policy');
console.log(bad ? bad + ' FAILED' : 'all ads checks passed');
process.exit(bad ? 1 : 0);

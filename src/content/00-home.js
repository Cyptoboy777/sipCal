module.exports = function (ctx) {
  const { F, esc, SITE, CALCS, calcSection, faqHtml, cardsHtml } = ctx;
  const L = require('./_lib.js')(ctx);
  const { inr, short } = L;

  const e = F.loan({ principal: 5000000, rate: 8.5, months: 240 });
  const s = F.sip({ monthly: 10000, rate: 12, years: 15 });
  const c = F.compound({ principal: 100000, rate: 8, years: 10, freq: 1 });
  const d = F.fd({ principal: 500000, rate: 7, months: 60, freq: 4 });

  const index = `<div class="wrap"><div class="index">
  <a href="/emi-calculator/"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg></span><h3>EMI Calculator</h3><p>Monthly instalment, total interest and the full repayment schedule for a home, car or personal loan.</p><div class="eg">${inr(e.emi)} a month<small>${short(5000000)} at 8.5% for 20 years</small></div></a>
  <a href="/sip-calculator/"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 3 8-9"/><path d="M15 6h5v5"/></svg></span><h3>SIP Calculator</h3><p>What a monthly mutual fund SIP could grow into, with step-up, lump sum and inflation.</p><div class="eg">${short(s.value)}<small>${inr(10000)} a month at 12% for 15 years</small></div></a>
  <a href="/compound-interest-calculator/"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20c6 0 9-3 11-8s3-7 7-8"/><path d="M3 20h18"/></svg></span><h3>Compound Interest</h3><p>See interest earn interest, with your choice of compounding and optional monthly deposits.</p><div class="eg">${short(c.value)}<small>${short(100000)} at 8% for 10 years</small></div></a>
  <a href="/fd-calculator/"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><h3>FD Calculator</h3><p>Maturity amount and effective yield for a cumulative fixed deposit.</p><div class="eg">${short(d.value)}<small>${short(500000)} at 7% for 5 years, quarterly</small></div></a>
</div></div>`;

  const faq = [
    ['Are these calculators free?', 'Yes. They are free to use, with no sign-up. The site is supported by advertising.'],
    ['Do you store the numbers I enter?', 'No. Calculations happen in your browser, and the figures you type are not sent to our servers.'],
    ['Are the results exact?', 'The arithmetic is exact for the inputs you give, and each calculator states its assumptions. Real products can differ because of fees, taxes, floating rates and bank-specific rounding, so treat results as planning estimates.'],
    ['Is this financial advice?', 'No. The calculators and guides are for general information and education. They do not recommend any loan, fund or deposit. Consult a qualified adviser before making financial decisions.'],
    ['Why do you show amounts in lakh and crore?', 'Because that is how most people in India think about money. &#8377;12,50,000 is shown as &#8377;12.50 L, and &#8377;1,25,00,000 as &#8377;1.25 Cr, with exact figures in the tables.']
  ];

  const body = `
<div class="wrap home-hero">
  <h1>${L.words('See what a loan, SIP or deposit will really come to')}</h1>
  <p class="lede">Four free calculators built for Indian money: instant results in rupees, lakh and crore, a full schedule behind every number, and nothing you type ever leaves your device.</p>
  <ul class="trust"><li>Free</li><li>No sign-up</li><li>Private, runs in your browser</li><li>Lakh and crore</li></ul>
</div>
${calcSection('emi')}
<div class="wrap"><p class="meta-line">The EMI calculator above starts with a ${inr(5000000)} loan at 8.5% over 20 years. Change any number to try your own. Looking for something else? Pick a calculator below.</p></div>
<div class="wrap"><h2 style="margin-top:1.4rem">What do you want to work out?</h2></div>
${index}

<div class="wrap"><article class="prose">
<h2>How these calculators work</h2>
<p>Every calculator here uses the standard formula for its job, shown in full on its own page, and then builds a year-by-year or month-by-month table so you can see where each rupee goes. We do not use hidden multipliers or rounded shortcuts. The loan calculator follows reducing-balance interest, the way banks quote most loans in India. The SIP, compound interest and fixed deposit calculators use compound growth, and each tells you which compounding it assumed.</p>
<p>Before publishing, we cross-check each engine against independent closed-form calculations: for example, that a loan schedule ends at exactly zero, that principal repaid adds back to the amount borrowed, and that a SIP matches the textbook future-value formula to the paisa. The worked examples in our articles are generated by the same code that powers the calculators, so the text and the tools cannot disagree.</p>

<h2>What the calculators can and cannot tell you</h2>
<p>A calculator is a way to see arithmetic, not a way to see the future. The EMI figure is exact for the rate and tenure you enter, but your real loan may have a floating rate, fees or insurance. A SIP result depends entirely on the return you assume, and real markets do not deliver a smooth line. A deposit calculation will match your bank&rsquo;s certificate closely, but day-count rules can shift the final rupees. We label each result as an estimate and explain what is left out so you can plan with a clear head.</p>

<h2>Four ideas worth understanding first</h2>
<h3>1. Early EMIs are mostly interest</h3>
<p>On a ${short(5000000)} loan at 8.5% for 20 years, ${(e.rows[0].interest / e.rows[0].payment * 100).toFixed(0)}% of the first instalment is interest. That is why a small prepayment in the first few years saves more than a large one near the end. See the <a href="/guides/prepay-loan-or-invest/">prepay or invest guide</a>.</p>
<h3>2. Tenure is a trade between monthly comfort and total cost</h3>
<p>A longer loan lowers the EMI and raises the total interest. The right tenure is the shortest one you can pay comfortably, with room for a bad month. The <a href="/guides/emi-tenure-vs-interest/">tenure guide</a> has numbers.</p>
<h3>3. Time matters more than the amount</h3>
<p>For investments, the number of years you stay invested usually moves the result more than the instalment size. A ${inr(10000)} monthly SIP at a steady 12% grows to ${short(s.value)} in 15 years, but the second half of that journey contributes far more than the first. Try different periods in the <a href="/sip-calculator/">SIP calculator</a>.</p>
<h3>4. Small rate differences compound</h3>
<p>One percentage point on a long loan is worth lakhs; one percentage point on a long investment is, too. Use the calculators to compare offers on equal terms rather than comparing headline rates alone. The <a href="/guides/rule-of-72/">rule of 72</a> is a handy mental shortcut.</p>

<h2>Your privacy</h2>
<p>All calculations run in your browser. The amounts you enter are not uploaded, stored or tied to you. If you use the &ldquo;Copy link&rdquo; button, your numbers go into the link you share, and only to whoever you give it to. Read the <a href="/privacy-policy/">privacy policy</a> for how advertising cookies are handled.</p>
</article></div>

${faqHtml(faq)}

<section class="wrap related"><h2>Guides</h2>${cardsHtml([
    ['/guides/emi-tenure-vs-interest/', 'Shorter or longer loan?', 'See what stretching a home loan from 15 to 30 years really costs.', 'Loans'],
    ['/guides/prepay-loan-or-invest/', 'Prepay a loan or invest the money?', 'A fair side-by-side, with the one number that decides it.', 'Loans and investing'],
    ['/guides/sip-step-up/', 'SIP step-up explained', 'What raising your SIP every year does over 20 years.', 'Investing'],
    ['/guides/rule-of-72/', 'The rule of 72', 'Estimate doubling time in seconds, and know where the shortcut fails.', 'Compounding']
  ])}</section>`;

  return [{
    path: '/',
    calcKind: 'emi',
    title: 'EMI, SIP, Compound Interest & FD Calculators for India',
    description: 'Free EMI, SIP, compound interest and FD calculators for India. Instant results in rupees, lakh and crore with full schedules, charts and prepayment and step-up options. No sign-up.',
    h1: 'Smart Finance Calculator',
    faq,
    priority: '1.0',
    freq: 'weekly',
    body
  }];
};

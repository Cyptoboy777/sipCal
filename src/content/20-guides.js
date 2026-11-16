// Guides: every number is computed by the same engine that powers the calculators.
module.exports = function (ctx) {
  const { F, esc, A, cardsHtml } = ctx;
  const L = require('./_lib.js')(ctx);
  const { table, inr, short } = L;
  const pct = (a, b) => (a / b * 100).toFixed(1) + '%';

  /* ---------------- 1. EMI tenure vs interest ---------------- */
  const P = A(5000000), R = 8.5;
  const tens = [5, 10, 15, 20, 25, 30].map((y) => ({ y, l: F.loan({ principal: P, rate: R, months: y * 12 }) }));
  const t = (y) => tens.find((x) => x.y === y).l;
  const tenureRows = tens.map(({ y, l }) => [y + ' years', inr(l.emi), inr(l.totalInterest), pct(l.totalInterest, P), inr(l.totalPayment)]);
  const half = F.loan({ principal: P, rate: R, months: 15 * 12 });

  const emiGuide = L.guidePage({
    slug: 'emi-tenure-vs-interest',
    title: 'Shorter or Longer Home Loan? What Tenure Really Costs',
    description: 'Compare 5 to 30 year loan tenures on the same amount and rate. See how EMI, total interest and affordability change, with a framework for choosing a tenure.',
    h1: 'Shorter or longer loan: what tenure really costs',
    lede: 'The tenure you choose decides your monthly EMI and, much more quietly, how much interest you pay. Here are the real numbers.',
    read: 6,
    body: `
<h2>The same loan at six different tenures</h2>
<p>Take a loan of ${inr(P)} at ${R}%, the same amount and the same rate, and change only the number of years:</p>
${table(['Tenure', 'Monthly EMI', 'Total interest', 'Interest as % of loan', 'Total paid'], tenureRows)}
<p>Two things stand out. First, the EMI falls quickly at first and then barely at all: stretching from 25 to 30 years lowers the EMI by only ${inr(t(25).emi - t(30).emi)} a month, yet adds ${inr(t(30).totalInterest - t(25).totalInterest)} of interest. Second, at 30 years you pay more in interest (${inr(t(30).totalInterest)}) than the ${inr(P)} you borrowed.</p>

<h2>The cost of the last few years</h2>
<p>The extra years at the end of a long loan are the most expensive per unit of monthly payment saved. Compare going from 15 to 20 years, and from 20 to 30:</p>
<ul>
<li><strong>15 to 20 years:</strong> the EMI drops by ${inr(t(15).emi - t(20).emi)} a month, and total interest rises by ${inr(t(20).totalInterest - t(15).totalInterest)}.</li>
<li><strong>20 to 30 years:</strong> the EMI drops by ${inr(t(20).emi - t(30).emi)} a month, and total interest rises by ${inr(t(30).totalInterest - t(20).totalInterest)}.</li>
</ul>
<p>Each additional year buys you a little breathing room today and charges you a lot for it later.</p>

<h2>A middle path: choose a long tenure, pay like a short one</h2>
<p>You do not have to pick one extreme. Many borrowers take a longer tenure for a lower required EMI, which protects them in a lean month, and then pay extra when they can. On the ${inr(P)} loan over 25 years, adding ${inr(A(10000))} a month on top of the EMI cuts the real tenure to ${F.duration(F.loanSummary({ principal: P, rate: R, months: 300, extra: A(10000) }).months)}, and saves ${inr(F.loanSummary({ principal: P, rate: R, months: 300, extra: A(10000) }).interestSaved)}. The difference from a short loan is that the extra payment is optional. Check that your lender allows part-payments without a penalty; prepayment rules differ by country and loan type, and many fixed-rate loans carry charges.</p>

<h2>How much EMI can you afford?</h2>
<p>There is no universal safe figure, but lenders often look at the share of your monthly income that goes to fixed obligations, and commonly cap it somewhere around 40 to 50%. For your own planning, a stricter test is useful: after paying every EMI, would you still cover essentials, an emergency fund contribution and your regular investing, even if your income dipped? If the answer is only &ldquo;yes, barely&rdquo;, a longer tenure is a reasonable safety margin.</p>
<ol>
<li>Write down your take-home income and your fixed monthly costs, including all existing EMIs.</li>
<li>Subtract them to see what a new EMI could comfortably be, then leave a buffer.</li>
<li>Try tenures in the <a href="/emi-calculator/">EMI calculator</a> until the EMI fits inside that figure.</li>
<li>If the only tenure that fits is very long, consider whether a smaller loan or a bigger down payment is the better fix.</li>
</ol>

<h2>Other things that change the picture</h2>
<ul>
<li><strong>Interest rate changes.</strong> On a floating loan, a rate rise can lengthen your tenure or raise your EMI. A long tenure leaves more time for rates to move.</li>
<li><strong>Your income trajectory.</strong> If you expect your income to grow, a shorter tenure becomes easier over time, and a longer one can be shortened later by prepaying.</li>
<li><strong>Tax benefits.</strong> Some loans carry deductions on interest or principal under the tax rules in force. They do change, so check the current rules before relying on them, and do not take a bigger loan just for a deduction.</li>
</ul>
<div class="note"><strong>The short version.</strong> Choose the shortest tenure you can pay without strain, keep the option to prepay, and run the numbers for two or three tenures before you decide.</div>`,
    faq: [
      ['Is a 30-year loan a bad idea?', 'Not necessarily. It gives the lowest EMI and the most flexibility, which can suit a tight budget. It also costs the most in interest, so many borrowers pair a long tenure with regular prepayments.'],
      ['How much interest does a ' + short(P) + ' loan cost over 20 years at ' + R + '%?', 'About ' + inr(t(20).totalInterest) + ', or ' + pct(t(20).totalInterest, P) + ' of the amount borrowed, on a monthly EMI of ' + inr(t(20).emi) + '.'],
      ['Can I change my tenure later?', 'Often yes. Lenders usually allow part-prepayments, and some allow you to revisit the EMI or tenure. Terms vary, so confirm with your lender before you sign.']
    ],
    related: [['/emi-calculator/', 'EMI Calculator', 'Try your own amount, rate and tenure.'], ['/guides/prepay-loan-or-invest/', 'Prepay a loan or invest?', 'What to do with spare money while you have a loan.']]
  });

  /* ---------------- 2. Prepay or invest ---------------- */
  const LP = A(5000000), LR = 8.5, LM = 240, EX = A(5000);
  const baseLoan = F.loan({ principal: LP, rate: LR, months: LM });
  const prepaid = F.loan({ principal: LP, rate: LR, months: LM, extra: EX });
  // Same monthly outflow in both routes: EMI + EX. Compare wealth at month 240.
  function routeA(ret) { // prepay: loan ends early, the freed cash is invested
    const ri = ret / 1200; let bal = 0;
    for (let m = 1; m <= LM; m++) {
      const paid = prepaid.rows[m - 1] ? prepaid.rows[m - 1].payment : 0;
      const free = baseLoan.emi + EX - paid;
      bal = bal * (1 + ri) + free;
    }
    return bal;
  }
  function routeB(ret) { // keep the loan, invest EX every month
    const ri = ret / 1200; let bal = 0;
    for (let m = 1; m <= LM; m++) bal = bal * (1 + ri) + EX;
    return bal;
  }
  const rets = [6, 7, 8.5, 10, 12];
  const compRows = rets.map((r) => {
    const a = routeA(r), b = routeB(r);
    return [r + '%', inr(a), inr(b), b > a + 1 ? 'Invest' : (a > b + 1 ? 'Prepay' : 'Tie')];
  });

  const prepayGuide = L.guidePage({
    slug: 'prepay-loan-or-invest',
    title: 'Prepay a Loan or Invest the Money? A Fair Comparison',
    description: 'Should spare money go to a home loan prepayment or an SIP? The loan interest rate is the number to beat. See a same-cash-flow comparison across return assumptions.',
    h1: 'Prepay a loan or invest the money?',
    lede: 'Both routes use the same cash. The only real question is whether your investment will beat your loan rate, after tax and after risk.',
    read: 7,
    body: `
<h2>Prepaying is a guaranteed return equal to your loan rate</h2>
<p>Every unit of money you prepay stops charging interest at your loan&rsquo;s rate for the rest of the term. If your loan costs ${LR}%, prepaying earns you a certain ${LR}% before tax, with no market risk. That is the number any investment has to beat to be worth choosing instead, and it has to beat it by enough to compensate for the risk that it may not.</p>
<p>The effect is big when done early. On a ${inr(LP)} loan at ${LR}% for 20 years, an extra ${inr(EX)} every month ends the loan in ${F.duration(prepaid.months)} instead of ${F.duration(LM)}, and saves ${inr(baseLoan.totalInterest - prepaid.totalInterest)} in interest.</p>

<h2>A like-for-like comparison</h2>
<p>To compare the routes fairly, both must use identical cash every month. We set it up like this on the same loan:</p>
<ul>
<li><strong>Route A: prepay.</strong> Pay the EMI plus ${inr(EX)} extra. The loan ends in ${F.duration(prepaid.months)}. After that, the money you were paying (EMI plus ${inr(EX)}) is invested instead, until month ${LM}.</li>
<li><strong>Route B: invest.</strong> Pay only the EMI on the original schedule and invest ${inr(EX)} every month for all ${LM} months.</li>
</ul>
<p>Either way you pay out ${inr(baseLoan.emi + EX)} each month. Here is what you hold at the end of ${LM / 12} years, with the loan fully repaid in both cases, if the investment earns a steady return, before tax:</p>
${table(['Investment return', 'Route A: prepay, then invest', 'Route B: invest all along', 'Better route'], compRows)}
<p>At ${LR}%, the break-even, the routes are equal, which is the point of the exercise: prepaying behaves like an investment that earns your loan rate. Investment returns above that favour Route B, and returns below it favour Route A. Real returns are not steady, so the table shows where the lines cross, not what will happen.</p>

<h2>What the table leaves out</h2>
<ul>
<li><strong>Risk.</strong> Route A&rsquo;s return is certain. Route B&rsquo;s is not, and a year or two of poor returns early on can leave you behind even if the long-run average looks fine.</li>
<li><strong>Tax on both sides.</strong> Investment gains may be taxed. Loan interest may carry a deduction under the rules in force. Both change the break-even, in different directions, so check the current rules.</li>
<li><strong>Liquidity.</strong> A prepayment cannot be taken back out. An investment can usually be sold in an emergency. This is a real advantage of investing, and a reason to hold an emergency fund before doing either.</li>
<li><strong>Behaviour.</strong> Some people find a prepayment is the more reliable habit, because the money is spent on something concrete. Others do better with automated investing.</li>
</ul>

<h2>A practical order of operations</h2>
<ol>
<li><strong>Emergency fund first.</strong> Several months of expenses in an accessible account, so a surprise does not force you to break an investment or miss an EMI.</li>
<li><strong>Expensive debt next.</strong> Credit card balances and personal loans usually cost far more than any investment can reliably earn. Clear these before anything else.</li>
<li><strong>Then compare your loan rate with realistic after-tax returns.</strong> The higher the loan rate, the stronger the case for prepaying.</li>
<li><strong>Consider splitting.</strong> Many people prepay part and invest part, which reduces the regret of choosing wrong.</li>
</ol>
<p>Try your own loan in the <a href="/emi-calculator/">EMI calculator</a> using <em>Add a monthly prepayment</em>, and model the investing side in the <a href="/sip-calculator/">SIP calculator</a>.</p>
<div class="note"><strong>This is not advice to pick either route.</strong> It shows how to frame the choice. Your tax position, risk tolerance and goals decide which side wins for you.</div>`,
    faq: [
      ['Is it better to prepay a home loan or invest in mutual funds?', 'It depends on whether your after-tax investment return, adjusted for risk, is likely to exceed your loan rate. Prepaying gives a certain return equal to the loan rate; investing offers the chance of more, with the risk of less.'],
      ['Which saves more interest, prepaying early or late?', 'Early. Interest is charged on the outstanding balance, which is largest at the start, so money prepaid in year two removes many more future interest charges than the same amount prepaid in year eighteen.'],
      ['Do I pay a penalty for prepaying?', 'Rules differ by country and by loan type. Some floating-rate consumer loans cannot carry prepayment charges, but fixed-rate loans and loans to non-individual borrowers may have them. Check your sanction letter.']
    ],
    related: [['/emi-calculator/', 'EMI Calculator', 'See the interest a prepayment saves on your loan.'], ['/sip-calculator/', 'SIP Calculator', 'Model what a monthly investment could grow to.']]
  });

  /* ---------------- 3. SIP step-up ---------------- */
  const stepRows = [0, 5, 10, 15].map((p) => {
    const s = F.sip({ monthly: A(10000), rate: 12, years: 20, stepUp: p });
    return [p === 0 ? 'No step-up' : p + '% a year', inr(s.invested), inr(s.value), inr(s.gains)];
  });
  const s0 = F.sip({ monthly: A(10000), rate: 12, years: 20 });
  const s10 = F.sip({ monthly: A(10000), rate: 12, years: 20, stepUp: 10 });
  const matchFlat = (() => { // flat SIP needed to match 10% step-up
    let lo = A(10000), hi = A(100000);
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; (F.sip({ monthly: mid, rate: 12, years: 20 }).value < s10.value) ? lo = mid : hi = mid; }
    return (lo + hi) / 2;
  })();
  const last10 = F.sip({ monthly: A(10000), rate: 12, years: 20, stepUp: 10 });
  const instalLast = A(10000) * Math.pow(1.1, 19);

  const stepGuide = L.guidePage({
    slug: 'sip-step-up',
    title: 'SIP Step-Up Explained: Raise Your SIP Every Year',
    description: 'What a yearly step-up does to a SIP over 20 years, with a comparison of 0%, 5%, 10% and 15% step-ups. Learn how to pick a step-up that fits your income.',
    h1: 'SIP step-up explained',
    lede: 'A fixed SIP quietly shrinks as your income grows. A step-up fixes that by raising the instalment on a schedule you choose.',
    read: 5,
    body: `
<h2>What a step-up SIP is</h2>
<p>A step-up (or top-up) SIP increases your monthly instalment by a fixed percentage or amount every year. If you start at ${inr(A(10000))} with a 10% yearly step-up, you invest ${inr(A(10000))} a month in year one, ${inr(A(11000))} in year two, ${inr(A(12100))} in year three, and so on. The idea is that your investing keeps pace with your income instead of staying frozen at what felt right the year you started.</p>

<h2>What it does over 20 years</h2>
<p>Here is a ${inr(A(10000))} monthly SIP at a steady 12% a year for 20 years, with four different step-ups:</p>
${table(['Yearly step-up', 'You invest', 'Final value', 'Returns'], stepRows)}
<p>A 10% step-up more than doubles the final value compared with a flat SIP (${inr(s10.value)} against ${inr(s0.value)}), but you also contribute more: ${inr(s10.invested)} against ${inr(s0.invested)}. In year 20 the monthly instalment has grown to about ${inr(instalLast)}. A fair way to see the benefit is to ask what flat SIP would give the same result. You would need to invest about <strong>${inr(matchFlat)}</strong> a month from day one, which is ${(matchFlat / A(10000)).toFixed(1)} times the starting amount. A step-up lets you reach the same place while starting small.</p>

<h2>Why a step-up works well in practice</h2>
<ul>
<li><strong>It follows your income.</strong> Raises and promotions make a bigger SIP affordable, and automating the increase means you do not need to decide each year.</li>
<li><strong>It keeps your investing in step with inflation.</strong> A fixed ${inr(A(10000))} buys less each year. A step-up at least matches rising prices, and ideally exceeds them.</li>
<li><strong>It removes a decision.</strong> The habit that is hardest to keep is the one you must remember. An automatic increase makes the better behaviour the default.</li>
</ul>

<h2>Choosing a step-up percentage</h2>
<ol>
<li><strong>Start from your income growth.</strong> If your pay rises about 8% a year, a step-up of 5 to 8% leaves your take-home growing too.</li>
<li><strong>Be honest about cash flow.</strong> A step-up you cannot sustain tends to end in a paused SIP. A smaller one that you keep is worth more than a larger one you cancel.</li>
<li><strong>Try several values.</strong> Use the <em>yearly step-up</em> field in the <a href="/sip-calculator/">SIP calculator</a> to see how 5%, 10% and 15% change your goal.</li>
<li><strong>Review every year or two.</strong> Raise it after a big pay rise or once an EMI ends, and lower it if your circumstances change.</li>
</ol>

<h2>What to watch for</h2>
<p>The projections assume a steady return, which real markets do not deliver, and a step-up increases your exposure to a bad market late in the journey, when more money is invested. If your goal is close, shift towards less volatile holdings rather than relying on a high assumed return. Also check whether your platform supports step-up on the fund you chose; most do, but the options and the frequency differ.</p>
<div class="note"><strong>Illustration only.</strong> The figures assume a constant ${12}% return. Mutual fund investments are subject to market risks, and actual outcomes can be well above or below these numbers.</div>`,
    faq: [
      ['Is a step-up SIP better than a flat SIP?', 'It usually produces a larger corpus because you contribute more over time, and it keeps your investing in step with your income. It is better only if you can sustain the higher instalments.'],
      ['How much step-up should I choose?', 'A sensible starting point is a figure close to your expected income growth, often between 5% and 10%. Choose a rate you will actually keep.'],
      ['Can I change or stop a step-up?', 'Generally yes. Most platforms let you modify or cancel a SIP or its step-up. Check with the platform or fund house for the process.']
    ],
    related: [['/sip-calculator/', 'SIP Calculator', 'Try a step-up on your own numbers.'], ['/guides/rule-of-72/', 'The rule of 72', 'How long does it take your money to double?']]
  });

  /* ---------------- 4. Rule of 72 ---------------- */
  const rateList = [2, 4, 6, 8, 10, 12, 15, 18, 24];
  const rRows = rateList.map((r) => {
    const exact = Math.log(2) / Math.log(1 + r / 100);
    const approx = 72 / r;
    return [r + '%', exact.toFixed(2) + ' years', approx.toFixed(2) + ' years', ((approx - exact) / exact * 100).toFixed(1) + '%'];
  });

  const ruleGuide = L.guidePage({
    slug: 'rule-of-72',
    title: 'The Rule of 72: Estimate How Fast Your Money Doubles',
    description: 'Divide 72 by the annual rate to estimate how long money takes to double. See how accurate the rule is at rates from 2% to 24%, and where it misleads.',
    h1: 'The rule of 72',
    lede: 'A mental shortcut that turns any interest rate into a doubling time, in about two seconds.',
    read: 4,
    body: `
<h2>The rule</h2>
<p>To estimate how many years it takes for money to double at a given annual rate of return, divide 72 by the rate. At 8%, it takes about 72 &divide; 8 = 9 years. At 12%, about 6 years. At 6%, about 12 years. It works the same way for debt that compounds against you: a loan or card balance growing at 18% roughly doubles in 4 years if left alone.</p>

<h2>Where it comes from</h2>
<p>With yearly compounding, money doubles when (1 + r)<sup>t</sup> = 2. Solving for t gives t = ln(2) &divide; ln(1 + r). For small rates, ln(1 + r) is close to r, so t is about 0.693 &divide; r, or 69.3 &divide; the rate in percent. Seventy-two is used instead of 69.3 because it is easier to divide (it has many factors: 2, 3, 4, 6, 8, 9, 12) and it corrects for the fact that the approximation is a little off at ordinary rates.</p>

<h2>How accurate is it?</h2>
<p>Here is the rule against the exact answer, with yearly compounding:</p>
${table(['Annual rate', 'Exact doubling time', 'Rule of 72', 'Error'], rRows)}
<p>The rule is very close between roughly 6% and 12%, which is where most savings and investment assumptions live. It drifts at the extremes: it slightly overstates the doubling time at low rates, and understates it at high ones. For rates above about 20%, use 70 or the exact formula in the <a href="/compound-interest-calculator/">compound interest calculator</a>, which shows the exact doubling time for any rate.</p>

<h2>Useful ways to apply it</h2>
<ul>
<li><strong>Fixed deposits.</strong> A deposit at 7.2% doubles in about 10 years. Check the real figure for your rate in the <a href="/fd-calculator/">FD calculator</a>.</li>
<li><strong>Inflation.</strong> At 6% inflation, prices double in about 12 years, so what costs ${inr(A(100000))} today could cost ${inr(A(200000))} then. Prices that double in twelve years halve the buying power of money that does not grow.</li>
<li><strong>Debt.</strong> A balance growing at 36% a year doubles in about 2 years, which is why credit card debt left to compound is so dangerous.</li>
<li><strong>Sanity checks.</strong> If a product promises to double your money in 3 years, the rule says it implies about 24% a year, which is a reason to ask hard questions.</li>
<li><strong>Fees.</strong> A cost of 1% a year on a 8% return changes the doubling time from 9 years to about 10.3 years.</li>
</ul>

<h2>What the rule cannot do</h2>
<p>It says nothing about regular contributions. If you add money every month, as in a SIP, money does not double on a simple schedule, because new money keeps arriving. It also assumes a steady return, while real returns vary, and it ignores tax and fees. Use it for a quick intuition, and use the calculators for numbers you plan around.</p>
<div class="note"><strong>The one-line summary.</strong> Divide 72 by the rate to get the doubling time in years. Good between about 6% and 12%; use the exact formula elsewhere.</div>`,
    faq: [
      ['Why 72 and not 70 or 69?', '69.3 is the most accurate for continuous compounding, and 70 for low rates. Seventy-two works well at the 6 to 12% range and divides evenly by many common rates, so it is easier to use in your head.'],
      ['Can I use the rule of 72 for a SIP?', 'Not directly. It works for a single amount that grows undisturbed. With monthly contributions, use the SIP calculator.'],
      ['Does the rule work for inflation?', 'Yes. Divide 72 by the inflation rate to estimate how long it takes prices to double, or the buying power of money to halve.']
    ],
    related: [['/compound-interest-calculator/', 'Compound Interest Calculator', 'Get the exact doubling time for any rate.'], ['/fd-calculator/', 'FD Calculator', 'See how a deposit grows at your bank’s rate.']]
  });

  /* ---------------- 5. How to read an amortization schedule ---------------- */
  const am = F.loan({ principal: A(1000000), rate: 9, months: 60 });
  const amRows = [0, 1, 2, 3, 4, 5].map((i) => am.rows[i]);
  const amGuide = L.guidePage({
    slug: 'how-to-read-a-loan-schedule',
    title: 'How to Read a Loan Amortization Schedule',
    description: 'Learn what each column of a repayment schedule means, how interest and principal change each month, and what to check on your own loan statement.',
    h1: 'How to read a loan repayment schedule',
    lede: 'An amortization schedule is a table of every payment on your loan. Once you know how to read it, your loan statement stops being mysterious.',
    read: 5,
    body: `
<h2>A small example</h2>
<p>Consider a ${inr(A(1000000))} loan at 9% for 5 years. The EMI is ${inr(am.emi)}. The first six rows of the schedule look like this:</p>
${table(['Month', 'EMI', 'Interest', 'Principal', 'Balance left'], amRows.map((r) => [r.month, inr(r.payment), inr(r.interest), inr(r.principal), inr(r.balance)]))}

<h2>What each column means</h2>
<ul>
<li><strong>Interest.</strong> The opening balance times the monthly rate (9% &divide; 12 = 0.75%). In month 1 that is ${inr(A(1000000))} &times; 0.0075 = ${inr(am.rows[0].interest)}.</li>
<li><strong>Principal.</strong> What is left of the EMI after interest is paid, which actually reduces what you owe: ${inr(am.emi)} &minus; ${inr(am.rows[0].interest)} = ${inr(am.rows[0].principal)}.</li>
<li><strong>Balance.</strong> The opening balance minus the principal portion. The next month&rsquo;s interest is charged on this smaller figure, which is why the interest column falls and the principal column rises while the EMI stays the same.</li>
</ul>

<h2>The patterns to look for</h2>
<ol>
<li><strong>Interest falls every month, principal rises.</strong> Their sum is the constant EMI.</li>
<li><strong>The crossover.</strong> At some point the principal part overtakes the interest part. On long loans this happens late, sometimes more than ten years in.</li>
<li><strong>The balance ends at zero.</strong> If it does not, there is a rounding adjustment in the final instalment, or your rate changed.</li>
<li><strong>Total interest.</strong> Add the interest column to see the real cost of borrowing. For this loan it is ${inr(am.totalInterest)}.</li>
</ol>

<h2>Check your own loan against it</h2>
<ul>
<li>Enter your loan amount, rate and tenure in the <a href="/emi-calculator/">EMI calculator</a>, then compare the EMI and first-month interest with your statement.</li>
<li>If the EMI matches but the interest differs slightly, your lender may be computing interest daily or from specific dates.</li>
<li>If the numbers differ a lot, check whether the rate has been reset, whether fees were capitalised into the loan, or whether you have a pre-EMI period.</li>
<li>After a part-prepayment, confirm whether your lender shortened the tenure or lowered the EMI. The choice changes the saving.</li>
</ul>
<p>The calculator can show the schedule by year or by month and download it as a CSV file, so you can keep a copy or open it in a spreadsheet.</p>`,
    faq: [
      ['Why does my loan balance fall so slowly at first?', 'Because interest is charged on the full outstanding balance, so most of the early EMIs goes to interest, and only a small part reduces the principal.'],
      ['What is amortization?', 'It is the process of paying off a loan through regular instalments, each covering interest and part of the principal, so that the balance reaches zero by the end of the term.'],
      ['Will my bank&rsquo;s schedule match this exactly?', 'It should match closely for a standard reducing-balance loan. Small differences come from day-count conventions, rounding and any fee or rate changes.']
    ],
    related: [['/emi-calculator/', 'EMI Calculator', 'Generate your own schedule.'], ['/guides/emi-tenure-vs-interest/', 'Shorter or longer loan?', 'See how tenure changes the schedule.']]
  });

  /* ---------------- guides index ---------------- */
  const all = [
    ['/guides/emi-tenure-vs-interest/', 'Shorter or longer loan: what tenure really costs', 'Six tenures on the same loan, with the cost of the extra years.', 'Loans, 6 min'],
    ['/guides/prepay-loan-or-invest/', 'Prepay a loan or invest the money?', 'A same-cash-flow comparison and the one number that decides it.', 'Loans and investing, 7 min'],
    ['/guides/sip-step-up/', 'SIP step-up explained', 'What raising your SIP every year does over 20 years.', 'Investing, 5 min'],
    ['/guides/rule-of-72/', 'The rule of 72', 'Estimate doubling time, and where the shortcut fails.', 'Compounding, 4 min'],
    ['/guides/how-to-read-a-loan-schedule/', 'How to read a loan repayment schedule', 'What each column means and what to check on your statement.', 'Loans, 5 min']
  ];
  const index = {
    path: '/guides/',
    title: 'Money Guides: Loans, SIPs, FDs and Compounding',
    description: 'Plain-language guides on loan tenure, prepayment, SIP step-ups, the rule of 72 and reading a repayment schedule, each with real worked numbers.',
    h1: 'Guides',
    priority: '0.8',
    crumbs: [['/', 'Home'], ['/guides/', 'Guides']],
    body: L.head('Guides', 'Short, practical explanations with real numbers, generated by the same engine as the calculators.') +
      `<div class="wrap">${cardsHtml(all)}</div>` +
      `<div class="wrap"><article class="prose"><h2>How we write these</h2><p>Each guide starts with a question people actually ask when they take a loan or start investing. We work the numbers through our calculators, show the table, and say plainly what the numbers do not capture, including fees, taxes and risk. We do not recommend specific funds, banks or lenders. If a rule or rate changes, we update the guide and the review date at the top.</p></article></div>`
  };

  return [index, emiGuide, prepayGuide, stepGuide, ruleGuide, amGuide];
};

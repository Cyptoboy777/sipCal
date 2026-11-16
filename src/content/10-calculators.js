// Calculator pages: long-form explanation, worked examples (computed live from the engine
// at build time, so the numbers in the text can never drift from the calculator), and FAQs.
module.exports = function (ctx) {
  const { F, esc, A } = ctx;
  const L = require('./_lib.js')(ctx);
  const { table, inr, short } = L;
  const pct = (a, b) => (a / b * 100).toFixed(1) + '%';

  /* ============================== EMI ============================== */
  const P = A(5000000), RATE = 8.5, YRS = 20;
  const base = F.loan({ principal: P, rate: RATE, months: YRS * 12 });
  const m1 = base.rows[0], m60 = base.rows[59], m120 = base.rows[119], m180 = base.rows[179], m240 = base.rows[239];
  const share = (r) => pct(r.interest, r.payment);

  const tenureRows = [10, 15, 20, 25, 30].map((y) => {
    const l = F.loan({ principal: P, rate: RATE, months: y * 12 });
    return [y + ' years', inr(l.emi), inr(l.totalInterest), inr(l.totalPayment)];
  });
  const rateRows = [7.5, 8, 8.5, 9, 9.5, 10].map((r) => {
    const l = F.loan({ principal: P, rate: r, months: YRS * 12 });
    return [r.toFixed(2) + '%', inr(l.emi), inr(l.totalInterest)];
  });
  const pre = F.loanSummary({ principal: P, rate: RATE, months: YRS * 12, extra: A(5000) });
  const pre1 = F.loanSummary({ principal: P, rate: RATE, months: YRS * 12, extra: A(10000) });

  const emiBody = `
<h2>What an EMI actually is</h2>
<p>An equated monthly instalment (EMI) is the fixed amount you pay your lender every month until a loan is cleared. It is called &ldquo;equated&rdquo; because the payment stays the same, even though what it is made of keeps changing. Each EMI is split into two parts: interest on the balance you still owe, and repayment of the loan itself (the principal). In the early years most of the instalment is interest. As the balance shrinks, the interest part shrinks too, and more of the same payment goes to principal.</p>
<p>That shift is the single most useful thing to understand about a loan. It explains why prepaying early saves far more than prepaying late, and why a longer tenure makes a loan look cheap monthly while costing a great deal more overall.</p>

<h2>The EMI formula</h2>
<div class="formula-block">EMI = P &times; r &times; (1 + r)<sup>n</sup> &divide; [(1 + r)<sup>n</sup> &minus; 1]
<small><b>P</b> is the loan amount. <b>r</b> is the monthly interest rate, which is the annual rate divided by 12 and by 100. <b>n</b> is the number of monthly instalments. If the rate is 0%, the EMI is simply P &divide; n.</small></div>
<p>This calculator uses exactly that formula, then builds the month-by-month schedule by charging interest on the opening balance each month and moving the rest of the EMI against principal. The schedule always ends at zero, which is how we check the arithmetic: the principal repaid across all months must add back up to the amount you borrowed.</p>

<h2>A worked example: ${short(P)} at ${RATE}% for ${YRS} years</h2>
<p>Take a home loan of ${inr(P)} at ${RATE}% a year over ${YRS} years (${YRS * 12} instalments). The monthly rate is ${RATE} &divide; 12 &divide; 100 = ${(RATE / 1200).toFixed(6)}. Putting that into the formula gives an EMI of <strong>${inr(base.emi)}</strong>.</p>
<p>Over the full term you would pay ${inr(base.totalPayment)} in total, of which <strong>${inr(base.totalInterest)}</strong> is interest. That is ${pct(base.totalInterest, base.totalPayment)} of everything you pay, and it is more than the ${inr(P)} you borrowed. Here is how the same EMI changes character over time:</p>
${table(['Instalment', 'Interest part', 'Principal part', 'Interest share', 'Balance after'], [
    ['Month 1', inr(m1.interest), inr(m1.principal), share(m1), inr(m1.balance)],
    ['Month 60 (year 5)', inr(m60.interest), inr(m60.principal), share(m60), inr(m60.balance)],
    ['Month 120 (year 10)', inr(m120.interest), inr(m120.principal), share(m120), inr(m120.balance)],
    ['Month 180 (year 15)', inr(m180.interest), inr(m180.principal), share(m180), inr(m180.balance)],
    ['Month 240 (year 20)', inr(m240.interest), inr(m240.principal), share(m240), inr(m240.balance)]
  ])}
<p>Notice that after five years of faithful payments, you still owe ${inr(m60.balance)} of the original ${inr(P)}. Early EMIs mostly pay the bank for the use of its money.</p>

<h2>How tenure changes the cost</h2>
<p>Stretching a loan lowers the monthly payment but raises the total interest, often dramatically. For the same ${inr(P)} at ${RATE}%:</p>
${table(['Tenure', 'Monthly EMI', 'Total interest', 'Total paid'], tenureRows)}
<p>Moving from 30 years to 20 raises the EMI by ${inr(F.emi(P, RATE, 240) - F.emi(P, RATE, 360))} a month but cuts total interest by ${inr(F.loan({ principal: P, rate: RATE, months: 360 }).totalInterest - base.totalInterest)}. Whether that trade suits you depends on your cash flow, which is why it is worth trying several tenures in the calculator above before you sign. Our guide on <a href="/guides/emi-tenure-vs-interest/">choosing a shorter or longer loan</a> goes deeper.</p>

<h2>How the interest rate changes the cost</h2>
<p>Small rate differences matter more than they look. On the same ${inr(P)} over ${YRS} years:</p>
${table(['Interest rate', 'Monthly EMI', 'Total interest'], rateRows)}
<p>A single percentage point can be worth thousands over a long loan. If your loan has a floating rate linked to an external benchmark, your EMI or tenure can change when the benchmark moves, so treat any single figure as a snapshot, not a promise.</p>

<h2>Reducing balance versus flat rate</h2>
<p>Most home, car and personal loans from banks are quoted on a <strong>reducing balance</strong>, meaning interest is charged only on what you still owe. Some dealers and lenders quote a <strong>flat rate</strong>, where interest is calculated on the full original amount for the entire term. A flat rate of 8% is not the same as a reducing rate of 8%. Because you are repaying principal every month, the equivalent reducing-balance rate on a flat-rate loan is typically close to double the quoted figure. If a lender quotes a flat rate, ask for the annual percentage rate on a reducing balance, then enter that here to see the true cost.</p>

<h2>What an EMI figure does not include</h2>
<ul>
<li><strong>Fees.</strong> Processing fees, documentation charges, and any insurance bundled with the loan are not part of the EMI formula. Add them to your own cost comparison.</li>
<li><strong>Rate resets.</strong> On floating-rate loans, a change in the benchmark changes your EMI or your remaining tenure.</li>
<li><strong>Pre-EMI periods.</strong> For an under-construction property, you may pay interest only on the amount disbursed so far until the loan is fully disbursed.</li>
<li><strong>Day-count differences.</strong> Banks may compute interest daily or on specific dates, so the final cents on your actual schedule can differ slightly from any calculator, including this one.</li>
</ul>
<div class="note"><strong>Use your lender&rsquo;s schedule for the final word.</strong> This tool is built for planning and comparison. The sanction letter and repayment schedule from your lender are the binding figures.</div>

<h2>Ways to reduce what a loan costs</h2>
<p>Open the &ldquo;Add a monthly prepayment&rdquo; section above and try an extra ${inr(A(5000))} a month on the ${inr(P)} example. The loan clears in ${F.duration(pre.months)} instead of ${F.duration(YRS * 12)}, and you save ${inr(pre.interestSaved)} in interest. Raise the extra payment to ${inr(A(10000))} and the loan ends in ${F.duration(pre1.months)} with ${inr(pre1.interestSaved)} saved. Other levers worth checking:</p>
<ul>
<li><strong>Compare rates, not just EMIs.</strong> Ask each lender for the rate, the fees, and whether the rate is fixed or floating, then run each offer through the calculator.</li>
<li><strong>Look after your credit profile.</strong> Many lenders offer better rates to borrowers with strong credit histories, so pay existing dues on time and avoid unnecessary new credit before applying.</li>
<li><strong>Check prepayment terms.</strong> Rules differ by country: some jurisdictions bar prepayment penalties on certain loans, while others allow them, and fixed-rate loans often carry charges. Read your sanction letter.</li>
<li><strong>Consider a balance transfer carefully.</strong> A lower rate elsewhere helps only if the savings outweigh the new processing fee and any charges on the old loan.</li>
</ul>

<h2>How to use this calculator</h2>
<ol>
<li>Enter the loan amount, annual interest rate and tenure. Use the sliders for a quick feel or type exact values.</li>
<li>Read the monthly EMI, total interest and total cost in the statement beside your inputs.</li>
<li>Open <em>Add a monthly prepayment</em> to see how much time and interest a regular extra payment saves.</li>
<li>Switch the repayment schedule between yearly and monthly views, or download it as a CSV file for a spreadsheet.</li>
<li>Use <em>Copy link</em> to share your exact numbers with a co-borrower or adviser. Everything you enter stays in your browser.</li>
</ol>`;

  const emiFaq = [
    ['How is EMI calculated?', 'EMI = P &times; r &times; (1 + r)^n &divide; [(1 + r)^n &minus; 1], where P is the loan amount, r is the monthly interest rate (annual rate &divide; 12 &divide; 100) and n is the number of months. The calculator above applies this formula and then builds the full month-by-month schedule.'],
    ['Why is so much of my early EMI interest?', 'Interest is charged on the outstanding balance, which is highest at the start. With a ' + inr(P) + ' loan at ' + RATE + '% for ' + YRS + ' years, ' + share(m1) + ' of the first instalment is interest. By the final year it is a tiny fraction.'],
    ['Does a longer tenure save money?', 'It lowers your monthly EMI but increases the total interest you pay, often by a very large amount. A longer tenure helps cash flow; a shorter one helps total cost. The tenure table above shows the trade-off for a real example.'],
    ['What is the difference between flat and reducing-balance interest?', 'Reducing-balance interest is charged only on the amount still owed, which is how most bank loans work. Flat-rate interest is charged on the original amount for the whole term, so the effective cost is much higher than the quoted number suggests.'],
    ['Can I reduce my EMI or my tenure after prepaying?', 'Usually yes, but it depends on the lender. Cutting the tenure normally saves more interest than cutting the EMI. This calculator models the tenure-reduction approach: your EMI stays the same and the loan ends sooner.'],
    ['Is this the same figure my bank will show?', 'It should be very close for a standard reducing-balance loan, but small differences are normal because banks apply their own day-count and rounding rules. Fees and insurance are not included here. Your lender&rsquo;s schedule is the final reference.'],
    ['Are my numbers stored or sent anywhere?', 'No. The calculation runs entirely in your browser. Nothing you type into the calculator is sent to our servers.']
  ];

  /* ============================== SIP ============================== */
  const sipBase = F.sip({ monthly: A(10000), rate: 12, years: 15 });
  const yearsRows = [5, 10, 15, 20, 25].map((y) => {
    const s = F.sip({ monthly: A(10000), rate: 12, years: y });
    return [y + ' years', inr(s.invested), inr(s.gains), inr(s.value), (s.value / s.invested).toFixed(2) + 'x'];
  });
  const returnRows = [6, 8, 10, 12, 14].map((r) => {
    const s = F.sip({ monthly: A(10000), rate: r, years: 15 });
    return [r + '%', inr(s.invested), inr(s.gains), inr(s.value)];
  });
  const flat = F.sip({ monthly: A(10000), rate: 12, years: 15 });
  const step10 = F.sip({ monthly: A(10000), rate: 12, years: 15, stepUp: 10 });
  const infl = F.sip({ monthly: A(10000), rate: 12, years: 15, inflation: 6 });
  const lump = F.sip({ monthly: A(10000), rate: 12, years: 15, lumpsum: A(500000) });

  const sipBody = `
<h2>What a SIP is, and what it is not</h2>
<p>A systematic investment plan (SIP) lets you invest a fixed amount in a mutual fund at regular intervals, usually monthly. Each instalment buys units at that day&rsquo;s net asset value (NAV). When prices are low your money buys more units; when prices are high it buys fewer. Over a long period this spreads your entry price across many market levels instead of staking everything on one day.</p>
<p>A SIP is a <em>way of investing</em>, not a product with a fixed return. The fund you choose decides the risk. An equity fund can fall sharply in a bad year; a debt fund usually moves less but is not risk-free. No SIP calculator, including this one, can know what your fund will earn. It answers a narrower question: <strong>if your money grew at a steady rate, what would your instalments add up to?</strong></p>

<h2>The SIP formula</h2>
<div class="formula-block">Future value = P &times; [((1 + i)<sup>n</sup> &minus; 1) &divide; i] &times; (1 + i)
<small><b>P</b> is your monthly investment. <b>i</b> is the monthly rate, the expected annual return divided by 12 and by 100. <b>n</b> is the number of months. The final (1 + i) reflects that each instalment is invested at the start of the month.</small></div>
<p>With a yearly step-up, a starting lump sum or an inflation adjustment, the calculator runs the same logic month by month: add the instalment, apply a month of growth, and raise the instalment by your step-up percentage at the end of each year. Today&rsquo;s-money value is the final amount divided by (1 + inflation) for each year invested.</p>

<h2>A worked example: ${inr(A(10000))} a month at 12% for 15 years</h2>
<p>If you invest ${inr(A(10000))} every month for 15 years, you put in ${inr(sipBase.invested)} in total. At a steady 12% a year that grows to about <strong>${inr(sipBase.value)}</strong>, which means roughly ${inr(sipBase.gains)} comes from returns. Time is doing most of the work, and the table below shows how much longer horizons add:</p>
${table(['Period', 'You invest', 'Returns', 'Value', 'Multiple of money invested'], yearsRows)}
<p>The second half of the journey is where growth accelerates, because returns start earning returns. That is why starting early, even with a modest amount, usually matters more than starting big and late.</p>

<h2>How the return assumption changes the answer</h2>
<p>The expected return is the input you control least and that moves the result most. For ${inr(A(10000))} a month over 15 years:</p>
${table(['Assumed annual return', 'You invest', 'Returns', 'Value'], returnRows)}
<p>Real returns are not a smooth line. A fund may gain 25% in one year and lose 10% in the next, and the average over your own period may land above or below any figure we show. Use a few different rates here to build a range of outcomes, and be conservative when a goal such as school fees or a down payment depends on the result.</p>

<h2>Step-up SIP: raising your instalment as income grows</h2>
<p>Most people earn more each year, so a fixed instalment shrinks in relative terms. A step-up raises the SIP by a set percentage every year. Open <em>Add a lump sum, yearly step-up or inflation</em> above to try it. With a 10% yearly step-up, the same starting ${inr(A(10000))} grows to <strong>${inr(step10.value)}</strong> over 15 years instead of ${inr(flat.value)}, on total contributions of ${inr(step10.invested)} against ${inr(flat.invested)}. Our <a href="/guides/sip-step-up/">step-up guide</a> compares several percentages.</p>

<h2>Inflation: what the number is worth in today&rsquo;s money</h2>
<p>A large figure in the future buys less than the same figure today. If inflation averages 6% a year, ${inr(flat.value)} in 15 years has the buying power of about <strong>${inr(infl.realValue)}</strong> in today&rsquo;s money. Setting the inflation field above shows this as a separate line, so you can judge a goal in terms you can feel. If you want to buy what costs ${inr(A(2500000))} today, plan around what that same thing will cost then, not today&rsquo;s price.</p>

<h2>Starting with a lump sum</h2>
<p>If you also invest a one-time amount at the start, the lump sum compounds for the full period. Adding ${inr(A(500000))} up front to the same monthly SIP lifts the 15-year value from ${inr(flat.value)} to ${inr(lump.value)}.</p>

<h2>SIP versus lump sum</h2>
<p>A lump sum is invested all at once; a SIP builds the position gradually. If markets rise steadily, the lump sum wins because more money was working for longer. If markets fall soon after you invest, the SIP wins because later instalments buy cheaper units. Nobody can know in advance. In practice the choice is often decided by cash flow: most people invest from monthly income, which makes a SIP the natural fit, and it also builds a habit that does not depend on guessing market timing. &ldquo;Rupee cost averaging&rdquo; lowers the risk of a poorly timed entry, but it does not protect you from a falling market, and it does not guarantee a profit.</p>

<h2>What this calculator leaves out</h2>
<ul>
<li><strong>Costs.</strong> A fund&rsquo;s expense ratio is already reflected in its NAV, so use a return net of costs. Some funds charge an exit load if you redeem early.</li>
<li><strong>Taxes.</strong> Gains from mutual funds can be taxable, and the rules differ between equity and debt funds and have changed in the past. Check the current rules or ask a tax professional.</li>
<li><strong>Irregular investing.</strong> Missed or changed instalments will change the result.</li>
</ul>
<div class="note"><strong>Mutual fund investments are subject to market risks.</strong> Past performance does not guarantee future results. The return you enter is an assumption, not a forecast, and this calculator does not recommend any fund.</div>`;

  const sipFaq = [
    ['How is SIP return calculated here?', 'We assume your money grows at a steady annual rate, converted to a monthly rate, with each instalment invested at the start of the month. The formula is P &times; [((1 + i)^n &minus; 1) &divide; i] &times; (1 + i). Real funds fluctuate, so the actual outcome will differ.'],
    ['What return should I assume?', 'There is no single right answer, and no one can promise a return. Try several rates, such as a cautious figure and an optimistic one, to see a range. Use lower rates for debt-oriented funds and be conservative for short horizons.'],
    ['Is the SIP return guaranteed?', 'No. SIP investments in mutual funds are market-linked and can lose value. The calculator shows what would happen at the rate you type in, which is an assumption and not a forecast.'],
    ['What is a step-up SIP?', 'It is a SIP whose instalment rises by a fixed percentage each year, for example 10%. It lets your investment keep pace with income growth and can lift the final value substantially over long periods.'],
    ['Can I stop or change a SIP?', 'Generally yes. Most funds let you pause, change or cancel a SIP with a notice period set by the fund house or platform. Check the terms of your fund and any exit load on units you redeem.'],
    ['Why show the value in today&rsquo;s money?', 'Because prices rise over time. The inflation-adjusted figure estimates what the future amount could buy in terms of today&rsquo;s prices, which is a better basis for judging whether a goal is on track.'],
    ['Does this include taxes and fund charges?', 'No. Use an expected return that is already net of the fund&rsquo;s expense ratio, and check the current tax rules for your type of fund separately.']
  ];

  /* ========================= COMPOUND INTEREST ========================= */
  const c1 = F.compound({ principal: A(100000), rate: 8, years: 10, freq: 1 });
  const freqLabel = { 1: 'Yearly', 2: 'Half-yearly', 4: 'Quarterly', 12: 'Monthly', 365: 'Daily' };
  const freqRows = [1, 2, 4, 12, 365].map((f) => {
    const c = F.compound({ principal: A(100000), rate: 8, years: 10, freq: f });
    return [freqLabel[f], inr(c.value), inr(c.gains), c.effectiveRate.toFixed(3) + '%'];
  });
  const timeRows = [5, 10, 20, 30, 40].map((y) => {
    const c = F.compound({ principal: A(100000), rate: 8, years: y, freq: 1 });
    return [y + ' years', inr(c.value), inr(c.gains), (c.value / A(100000)).toFixed(2) + 'x'];
  });
  const simple10 = A(100000) * 0.08 * 10;
  const cdep = F.compound({ principal: A(100000), rate: 8, years: 10, freq: 12, monthly: A(5000) });

  const compBody = `
<h2>What compound interest means</h2>
<p>Compound interest is interest earned on your original money <em>and</em> on the interest it has already earned. With simple interest, ${inr(A(100000))} at 8% earns the same ${inr(A(8000))} every year. With compound interest, the second year&rsquo;s interest is calculated on ${inr(A(108000))}, the third year&rsquo;s on a larger amount still, and so on. The difference looks small at first and then becomes very large, which is why long horizons are so powerful.</p>

<h2>The compound interest formula</h2>
<div class="formula-block">A = P &times; (1 + r &divide; n)<sup>n &times; t</sup>
<small><b>P</b> is the starting amount. <b>r</b> is the annual interest rate as a decimal (8% = 0.08). <b>n</b> is how many times a year interest is added. <b>t</b> is the time in years. <b>A</b> is the final amount, and A &minus; P is the interest earned.</small></div>
<p>When you also add a deposit every month, this calculator converts your chosen compounding frequency into an equivalent monthly rate so that deposits and compounding line up, then adds each deposit at the end of its month. The result for a lump sum alone matches the formula above exactly.</p>

<h2>A worked example: ${inr(A(100000))} at 8% for 10 years</h2>
<p>With interest added once a year, ${inr(A(100000))} grows to <strong>${inr(c1.value)}</strong> after 10 years, so the interest earned is ${inr(c1.gains)}. Simple interest on the same amount would give just ${inr(simple10)}. The ${inr(c1.gains - simple10)} gap is the extra that compounding adds.</p>

<h2>How compounding frequency matters</h2>
<p>The more often interest is added, the more you earn, although the effect is smaller than most people expect. Same ${inr(A(100000))}, same 8%, same 10 years:</p>
${table(['Interest added', 'Final amount', 'Interest earned', 'Effective yearly rate'], freqRows)}
<p>The <strong>effective yearly rate</strong> shows what the quoted rate really delivers after compounding. Moving from yearly to daily compounding adds only about ${inr(F.compound({ principal: A(100000), rate: 8, years: 10, freq: 365 }).value - c1.value)} here. The rate itself and the time you leave the money matter far more than the compounding frequency.</p>

<h2>Time is the strongest lever</h2>
<p>Doubling the time does much more than double the interest. At 8% a year, with yearly compounding:</p>
${table(['Time', 'Final amount', 'Interest earned', 'Multiple of starting amount'], timeRows)}
<p>The last ten years from year 30 to year 40 add more than the first twenty years combined. This is the arithmetic behind the advice to start early and avoid interrupting growth. It also works in reverse for debt: unpaid interest on a credit card or a loan compounds against you.</p>

<h2>Adding a deposit every month</h2>
<p>Open <em>Add a deposit every month</em> above. Starting with ${inr(A(100000))} and adding ${inr(A(5000))} at the end of each month for 10 years at 8%, compounded monthly, builds to <strong>${inr(cdep.value)}</strong>. You put in ${inr(cdep.invested)} and the rest, ${inr(cdep.gains)}, is interest.</p>

<h2>The rule of 72</h2>
<p>A quick way to estimate how long money takes to double is to divide 72 by the annual rate. At 8%, that is about 9 years, and the exact figure is ${c1.doublingYears.toFixed(2)} years. Read our guide to <a href="/guides/rule-of-72/">the rule of 72</a> for when it works and where it breaks down.</p>

<h2>Where compound interest shows up</h2>
<ul>
<li><strong>Savings and deposits.</strong> Bank fixed deposits usually add interest quarterly. See the <a href="/fd-calculator/">FD calculator</a>.</li>
<li><strong>Investments.</strong> Reinvested dividends and growth compound over time. Use the <a href="/sip-calculator/">SIP calculator</a> for regular investing.</li>
<li><strong>Debt.</strong> Credit card balances and some loans compound against you. Check the <a href="/emi-calculator/">EMI calculator</a> to see the true cost of a loan.</li>
</ul>
<div class="note"><strong>Taxes and inflation are not included.</strong> Interest is usually taxable, and prices rise over time, so your real gain is smaller than the headline figure. Treat results as a planning estimate.</div>`;

  const compFaq = [
    ['What is the difference between simple and compound interest?', 'Simple interest is calculated only on the original amount. Compound interest is calculated on the original amount plus the interest already added. Over long periods, compound interest produces much larger sums.'],
    ['Does daily compounding make a big difference?', 'Not usually. For ' + inr(A(100000)) + ' at 8% over 10 years, yearly compounding gives ' + inr(c1.value) + ' and daily compounding gives ' + inr(F.compound({ principal: A(100000), rate: 8, years: 10, freq: 365 }).value) + '. The rate and the time matter far more than how often interest is added.'],
    ['What is the effective annual rate?', 'It is the yearly growth rate after compounding is taken into account. A nominal 8% compounded quarterly is an effective rate of about 8.24%. It lets you compare products that compound at different frequencies.'],
    ['How do I calculate how long it takes to double my money?', 'Divide 72 by the annual rate for a quick estimate, or use the exact formula: ln(2) &divide; ln(1 + effective rate). The calculator shows the exact figure for a lump sum.'],
    ['How are monthly deposits treated?', 'Each deposit is added at the end of its month and then earns interest from the following month. The compounding frequency you choose is converted to an equivalent monthly rate so that deposits and interest are consistent.'],
    ['Is the result guaranteed?', 'The arithmetic is exact for the inputs you enter, but a real product may pay a variable rate, charge fees or tax the interest. Use the result to compare options, and check the terms of the actual product.']
  ];

  /* ================================ FD ================================ */
  const fdBase = F.fd({ principal: A(500000), rate: 7, months: 60, freq: 4 });
  const fdFreq = [[1, 'Yearly'], [2, 'Half-yearly'], [4, 'Quarterly'], [12, 'Monthly']].map(([f, n]) => {
    const d = F.fd({ principal: A(500000), rate: 7, months: 60, freq: f });
    return [n, inr(d.value), inr(d.gains), d.effectiveRate.toFixed(3) + '%'];
  });
  const fdTen = [1, 2, 3, 5, 7, 10].map((y) => {
    const d = F.fd({ principal: A(500000), rate: 7, months: y * 12, freq: 4 });
    return [y + (y === 1 ? ' year' : ' years'), inr(d.value), inr(d.gains)];
  });

  const fdBody = `
<h2>How a fixed deposit earns interest</h2>
<p>A fixed deposit (FD) lets you lock a lump sum with a bank or finance company for a fixed period at a stated rate. There are two common ways to take the interest:</p>
<ul>
<li><strong>Cumulative (reinvestment) FD.</strong> Interest is added to the deposit and compounds until maturity, when you receive everything at once. This is what the calculator above models.</li>
<li><strong>Non-cumulative (payout) FD.</strong> Interest is paid out monthly, quarterly or yearly, so the deposit itself does not grow. You earn simple interest on the original amount.</li>
</ul>
<p>Many banks compound deposits quarterly, but this varies by country and institution, so choose the compounding that matches your deposit in the calculator.</p>

<h2>The FD maturity formula</h2>
<div class="formula-block">Maturity = P &times; (1 + r &divide; n)<sup>n &times; t</sup>
<small><b>P</b> is the deposit. <b>r</b> is the annual rate as a decimal. <b>n</b> is the number of times interest is added each year (4 for quarterly). <b>t</b> is the term in years.</small></div>

<h2>A worked example: ${inr(A(500000))} at 7% for 5 years</h2>
<p>A ${inr(A(500000))} cumulative FD at 7% with quarterly compounding matures at <strong>${inr(fdBase.value)}</strong> after five years. The interest earned is ${inr(fdBase.gains)}, and the effective yearly yield is ${fdBase.effectiveRate.toFixed(2)}%, a little higher than the quoted 7% because interest is added four times a year. How the compounding choice changes the same deposit:</p>
${table(['Interest added', 'Maturity amount', 'Interest earned', 'Effective yield'], fdFreq)}

<h2>How the term changes what you earn</h2>
<p>For the same ${inr(A(500000))} at 7%, compounded quarterly:</p>
${table(['Deposit period', 'Maturity amount', 'Interest earned'], fdTen)}
<p>Longer deposits earn disproportionately more because interest is compounding for longer. But they also lock your money away, and interest rates change, so a long term can leave you stuck at a rate that later looks low. A &ldquo;ladder&rdquo; of deposits with staggered maturity dates is a common way to balance access and return.</p>

<h2>Things to check before you book an FD</h2>
<ul>
<li><strong>Tax.</strong> FD interest is generally taxable as part of your income at your slab rate, and banks may deduct tax at source (TDS) once interest crosses a threshold. Thresholds and rules change and differ for senior citizens, so check the current rules.</li>
<li><strong>Premature withdrawal.</strong> Breaking an FD early usually reduces the rate and may carry a penalty. Check the terms.</li>
<li><strong>Deposit insurance.</strong> Bank deposits are usually covered by a national deposit-insurance scheme (for example the FDIC in the US, the FSCS in the UK, or the DICGC in India) up to a limit per depositor per bank. Check the current limit in your country. Spreading large sums across institutions can reduce concentration risk.</li>
<li><strong>Real returns.</strong> If inflation is close to your FD rate, your purchasing power grows slowly or not at all after tax. Compare the after-tax, after-inflation return with your goal.</li>
<li><strong>Company deposits.</strong> Corporate FDs may offer higher rates but are not covered by DICGC insurance and carry credit risk.</li>
</ul>

<h2>How to use this calculator</h2>
<ol>
<li>Enter your deposit amount, the bank&rsquo;s quoted annual rate and the deposit period. You can enter a fraction of a year, such as 1.5 for 18 months.</li>
<li>Pick how often interest is added. For most bank cumulative FDs that is quarterly.</li>
<li>Read the maturity amount, interest earned and effective yield. Compare two banks by changing only the rate.</li>
<li>Use the year-by-year table to see how the balance builds.</li>
</ol>
<div class="note"><strong>Your bank&rsquo;s certificate is final.</strong> Banks may compound on specific dates or use day counts that differ slightly from this model, so the exact maturity value can differ by a few units of money.</div>`;

  const fdFaq = [
    ['How is FD maturity calculated?', 'For a cumulative FD, maturity = P &times; (1 + r &divide; n)^(n &times; t), where n is the number of compounding periods per year. Many banks compound quarterly, so n is 4.'],
    ['What is the difference between cumulative and non-cumulative FDs?', 'A cumulative FD reinvests interest and pays everything at maturity. A non-cumulative FD pays interest out at regular intervals and returns only the principal at maturity, so it does not compound.'],
    ['Why is the effective yield higher than the quoted rate?', 'Because interest is added more than once a year, later interest is earned on earlier interest. A 7% quoted rate compounded quarterly is an effective yield of about 7.19%.'],
    ['Is FD interest taxable?', 'Generally yes, as income at your applicable slab rate, and TDS may apply above certain thresholds. Rules change and vary by age, so check the latest rules from the Income Tax Department or a tax professional.'],
    ['Is my money safe in an FD?', 'Bank deposits are insured by the DICGC up to a stated limit per depositor per bank. Amounts above the limit, and deposits with non-bank companies, are not covered in the same way.'],
    ['Can I use this for a recurring deposit (RD)?', 'Not exactly. An RD takes a deposit every month, and banks compound it quarterly. For a close approximation of regular deposits, try the compound interest calculator with a monthly deposit.']
  ];

  return [
    L.calcPage({
      kind: 'emi',
      title: 'EMI Calculator: Home, Car & Personal Loan EMI with Schedule',
      description: 'Free EMI calculator in any currency. Get your monthly EMI, total interest and a month-by-month repayment schedule, and see how prepayments cut your loan cost.',
      h1: 'EMI Calculator',
      body: emiBody, faq: emiFaq,
      related: [['/guides/emi-tenure-vs-interest/', 'Shorter or longer loan?', 'How tenure changes your EMI and total interest, with real numbers.'], ['/guides/prepay-loan-or-invest/', 'Prepay a loan or invest?', 'Why the loan rate is the number to beat, and how to compare fairly.']]
    }),
    L.calcPage({
      kind: 'sip',
      title: 'SIP Calculator: Mutual Fund SIP Returns with Step-Up & Inflation',
      description: 'Free SIP (monthly investment) calculator in any currency. See what a monthly mutual fund SIP could grow to, with optional lump sum, yearly step-up and inflation-adjusted value. Results in your currency.',
      h1: 'SIP Calculator',
      body: sipBody, faq: sipFaq,
      related: [['/guides/sip-step-up/', 'SIP step-up explained', 'What raising your SIP every year does to the final corpus.'], ['/guides/rule-of-72/', 'The rule of 72', 'A mental shortcut for how fast money doubles.']]
    }),
    L.calcPage({
      kind: 'compound',
      title: 'Compound Interest Calculator: Growth, Frequency & Monthly Deposits',
      description: 'Free compound interest calculator. See how money grows with yearly, quarterly, monthly or daily compounding, add monthly deposits, and find how long it takes to double.',
      h1: 'Compound Interest Calculator',
      body: compBody, faq: compFaq,
      related: [['/guides/rule-of-72/', 'The rule of 72', 'Estimate doubling time in your head, and know when it misleads.']]
    }),
    L.calcPage({
      kind: 'fd',
      title: 'FD Calculator: Fixed Deposit Maturity Amount & Interest',
      description: 'Free fixed deposit (CD / term deposit) calculator in any currency. Work out the maturity amount, interest earned and effective yield of a cumulative FD with quarterly, monthly or yearly compounding.',
      h1: 'FD Calculator',
      body: fdBody, faq: fdFaq,
      related: [['/guides/rule-of-72/', 'The rule of 72', 'How long will a deposit take to double at your bank’s rate?']]
    })
  ];
};

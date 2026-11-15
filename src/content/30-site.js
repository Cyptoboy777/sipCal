// About, contact, privacy, terms, disclaimer and the 404 page.
module.exports = function (ctx) {
  const { SITE, esc } = ctx;
  const L = require('./_lib.js')(ctx);
  const mail = `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`;
  const when = esc(SITE.updated);

  const about = L.plainPage({
    path: '/about/',
    priority: '0.5',
    title: 'About Smart Finance Calculator',
    description: 'Who runs Smart Finance Calculator, how the calculators are built and checked, and how the site is funded.',
    h1: 'About this site',
    lede: 'Smart Finance Calculator is a free set of money calculators for people in India, with the working shown.',
    body: `
<h2>What this site is for</h2>
<p>Most people meet big financial numbers in a hurry: a loan offer with an EMI printed on it, a SIP projection in a brochure, a deposit rate on a bank poster. The figure is rarely explained. We built these calculators so you can see how the number is made, change the assumptions, and read the full schedule behind it, in rupees and in the lakh and crore format you already think in.</p>

<h2>What you will find here</h2>
<ul>
<li><a href="/emi-calculator/">EMI calculator</a> for home, car and personal loans, with prepayment and a full repayment schedule.</li>
<li><a href="/sip-calculator/">SIP calculator</a> with lump sum, yearly step-up and inflation-adjusted results.</li>
<li><a href="/compound-interest-calculator/">Compound interest calculator</a> with different compounding frequencies and monthly deposits.</li>
<li><a href="/fd-calculator/">FD calculator</a> for cumulative fixed deposits.</li>
<li><a href="/guides/">Guides</a> that explain the ideas, with worked numbers produced by the same code as the calculators.</li>
</ul>

<h2>How we keep the numbers right</h2>
<p>Each calculator uses the standard formula for its purpose, and every page spells out that formula and its assumptions. Before changes go live, the calculation engine is checked against independent calculations written separately from the engine: closed-form loan and future-value formulas, a loan schedule that must end at exactly zero, and principal repaid that must add up to the amount borrowed. Every worked example in our articles is generated from the engine, so an article cannot quote a number the calculator would not produce.</p>
<p>We are open about what the tools do not know. They do not know your lender&rsquo;s fees, your tax position or what a market will return. Each page says what is left out.</p>

<h2>Editorial independence</h2>
<p>We do not sell loans, funds, deposits or insurance, and we do not take commissions or referral fees from any lender, bank or fund house. We do not recommend a particular product. The site is funded by advertising, including ads served by Google AdSense, which appear separately from our content and have no influence on what we write or how we calculate.</p>

<h2>Corrections and updates</h2>
<p>Tax rules, deposit limits and regulations change. Each page shows the date it was last reviewed, and when we learn something is out of date we update it. If you spot an error in a calculation or an article, please <a href="/contact/">tell us</a>. We read every message about accuracy.</p>

<h2>Important</h2>
<p>This site provides general information and educational tools. It is not financial, investment, legal or tax advice. Please read the <a href="/disclaimer/">disclaimer</a>.</p>`
  });

  const contact = L.plainPage({
    path: '/contact/',
    priority: '0.4',
    title: 'Contact Smart Finance Calculator',
    description: 'Get in touch with Smart Finance Calculator to report a calculation error, suggest a feature, or ask about the site.',
    h1: 'Contact',
    lede: 'Found a wrong number, or want a calculator we do not have yet? We would like to hear it.',
    body: `
<h2>Email</h2>
<p>You can reach us at ${mail}.</p>

<h2>What to include</h2>
<ul>
<li><strong>For a calculation error:</strong> the calculator you used, the exact values you entered, the result you saw, and the result you expected, with how you worked it out. Using the <em>Copy link</em> button in the calculator gives us your exact inputs.</li>
<li><strong>For a feature request:</strong> what you want to calculate, and what decision it would help you make.</li>
<li><strong>For a content correction:</strong> the page address and the sentence you think is wrong.</li>
</ul>

<h2>What we cannot do</h2>
<p>We cannot give personal financial, investment, tax or legal advice, recommend a bank, lender or fund, or review a specific loan agreement. For those questions, speak to a qualified adviser. We also cannot see or retrieve anything you entered into a calculator, because those numbers stay in your browser and are never sent to us.</p>

<h2>Privacy of your message</h2>
<p>If you email us, we see your email address and the message, and we use them only to reply and to improve the site. See the <a href="/privacy-policy/">privacy policy</a> for details.</p>`
  });

  const privacy = L.plainPage({
    path: '/privacy-policy/',
    priority: '0.3',
    title: 'Privacy Policy | Smart Finance Calculator',
    description: 'How Smart Finance Calculator handles your data, what cookies are used for advertising, and the choices you have.',
    h1: 'Privacy policy',
    lede: `Last updated ${SITE.updated}.`,
    body: `
<h2>The short version</h2>
<p>The numbers you type into our calculators are processed in your browser and are not sent to our servers. We do not ask you to create an account. The site is supported by advertising, and the advertising partners we use, including Google, may use cookies as described below.</p>

<h2>Information we do not collect</h2>
<p>We do not collect the loan amounts, investment amounts, rates or any other values you enter into the calculators. They are calculated on your device. We do not require your name, phone number or email address to use any calculator.</p>

<h2>Information collected automatically</h2>
<p>Like most websites, our hosting provider receives standard technical information when your browser requests a page, such as your IP address, browser type, device type, the page requested and the time. This is used to deliver the site, keep it secure and understand overall usage. We do not use it to identify you personally.</p>

<h2>Links that contain your numbers</h2>
<p>The <em>Copy link</em> button creates a web address that includes the values you entered, so you can share them. Those values live in the link itself. Only people you give the link to can see them. Be mindful when pasting such a link in a public place.</p>

<h2>Advertising and cookies</h2>
<p>We use Google AdSense to show ads. Google and its partners may use cookies and similar technologies, including web beacons and device identifiers, to serve ads based on your prior visits to this and other websites, to measure ads, and to prevent fraud.</p>
<ul>
<li>Google, as a third-party vendor, uses cookies to serve ads on this site. Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</li>
<li>You can manage personalised advertising for your Google account at <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>.</li>
<li>You can learn how Google uses information from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>.</li>
<li>You can opt out of some third-party vendors&rsquo; use of cookies for personalised advertising at <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>.</li>
</ul>
<p>Where required by law, such as for visitors in the European Economic Area, the United Kingdom and Switzerland, consent for personalised advertising is requested through a consent message, and you can change your choice at any time.</p>
<p>You can also block or delete cookies in your browser settings. Doing so does not stop the calculators from working, but you may see ads that are less relevant to you.</p>

<h2>Cookies and storage we set</h2>
<p>The calculators themselves do not set cookies and do not store your inputs. Cookies on this site come from advertising and measurement partners, as described above.</p>

<h2>Third-party links</h2>
<p>Our pages link to other sites, such as government and regulator pages. We do not control those sites and are not responsible for their privacy practices.</p>

<h2>Children</h2>
<p>This site is intended for a general audience and is not directed at children under 13. We do not knowingly collect personal information from children.</p>

<h2>Your rights</h2>
<p>Because we do not hold personal information about you beyond what is described above, there is usually nothing for us to access or delete. If you have emailed us and want your message deleted, or you have any question about how your information is handled, contact us at ${mail}. Depending on where you live, you may have rights under laws such as India&rsquo;s Digital Personal Data Protection Act, 2023, or other applicable data protection laws.</p>

<h2>Changes to this policy</h2>
<p>If we change this policy, we will update the date at the top of this page. Please check it from time to time.</p>

<h2>Contact</h2>
<p>Questions about this policy can be sent to ${mail}, or see our <a href="/contact/">contact page</a>.</p>`
  });

  const terms = L.plainPage({
    path: '/terms/',
    priority: '0.3',
    title: 'Terms of Use | Smart Finance Calculator',
    description: 'The terms that apply when you use the Smart Finance Calculator website, calculators and guides.',
    h1: 'Terms of use',
    lede: `Last updated ${SITE.updated}.`,
    body: `
<h2>Acceptance of these terms</h2>
<p>By using this website, you agree to these terms. If you do not agree, please do not use the site.</p>

<h2>What the site provides</h2>
<p>The site offers free calculators and educational articles about loans, investments and savings. The results are estimates calculated from the values you enter and the assumptions stated on each page. They are provided for general information and planning.</p>

<h2>Not advice</h2>
<p>Nothing on this site is financial, investment, tax, accounting or legal advice, or an offer or solicitation to buy or sell any financial product. Do not make financial decisions based only on a calculator result. Please read the <a href="/disclaimer/">disclaimer</a> and consult a qualified professional.</p>

<h2>Accuracy and availability</h2>
<p>We work to make the calculations correct and the content current, but we do not guarantee that the site is free of errors, that results match those of any lender, bank or fund, or that the site will always be available. We may change or remove content and features at any time.</p>

<h2>Acceptable use</h2>
<ul>
<li>Do not attempt to disrupt, overload or gain unauthorised access to the site.</li>
<li>Do not use automated tools to copy the site at a rate that harms its operation.</li>
<li>Do not present our content as your own or misrepresent the source of calculations.</li>
</ul>

<h2>Intellectual property</h2>
<p>The text, design and code of this site are owned by us or our licensors and are protected by applicable laws. You may use the calculators for personal, non-commercial purposes and may quote short extracts of our content with a link back to the source. Other reuse requires our permission.</p>

<h2>Limitation of liability</h2>
<p>To the fullest extent permitted by law, we are not liable for any loss or damage, including financial loss, arising from your use of, or reliance on, the site or any result it produces. The site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind.</p>

<h2>Third-party content and advertising</h2>
<p>The site displays advertisements served by third parties, such as Google AdSense. We are not responsible for the content of those ads or for any dealings between you and an advertiser.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of India. Any dispute will be subject to the courts of India, to the extent permitted by law.</p>

<h2>Changes and contact</h2>
<p>We may update these terms and will change the date above when we do. Continued use of the site after a change means you accept the new terms. Questions can be sent to ${mail}.</p>`
  });

  const disclaimer = L.plainPage({
    path: '/disclaimer/',
    priority: '0.3',
    title: 'Disclaimer | Smart Finance Calculator',
    description: 'Important limits on the information, calculators and estimates provided by Smart Finance Calculator.',
    h1: 'Disclaimer',
    lede: `Last updated ${SITE.updated}.`,
    body: `
<h2>General information only</h2>
<p>The calculators, articles and other content on this website are provided for general information and education. They are not financial, investment, tax, legal or accounting advice, and they do not take into account your personal objectives, financial situation or needs.</p>

<h2>No recommendations</h2>
<p>We do not recommend, rate or endorse any lender, bank, mutual fund, scheme, insurance product or other financial product. Nothing here is an offer, a solicitation or an invitation to buy or sell any security or product. We are not a registered investment adviser, research analyst or distributor, and we do not offer those services.</p>

<h2>Estimates, not guarantees</h2>
<p>Calculator results are estimates based on the values and assumptions you enter. In particular:</p>
<ul>
<li><strong>Loans.</strong> Real EMIs depend on your lender&rsquo;s rate, whether it is fixed or floating, fees, insurance, day-count conventions and rounding. Your lender&rsquo;s documents are the binding source.</li>
<li><strong>Investments.</strong> Returns on mutual funds and other market-linked investments are not guaranteed and can be negative. A SIP result shows what would happen at the return you type in; it is not a forecast. Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Past performance is not an indicator of future returns.</li>
<li><strong>Deposits.</strong> Maturity values depend on the bank&rsquo;s compounding and day-count methods, and on the rate in force when you book the deposit.</li>
<li><strong>Taxes and charges.</strong> Calculators do not include taxes, fund expenses, exit loads, fees or other charges unless stated.</li>
</ul>

<h2>Rules change</h2>
<p>Tax laws, regulatory limits and product terms change. Where we mention them, the information is a summary that was reviewed on the date shown on the page, and it may be out of date by the time you read it. Check current rules with the relevant authority or a qualified professional.</p>

<h2>Seek professional advice</h2>
<p>Before you borrow, invest or make any significant financial decision, consult a qualified professional, such as a SEBI-registered investment adviser, a chartered accountant or a lawyer, who can consider your full circumstances.</p>

<h2>External links</h2>
<p>We may link to third-party websites for reference. We do not control or endorse their content.</p>

<h2>Liability</h2>
<p>You use this site and its results at your own risk. See our <a href="/terms/">terms of use</a> for the limitation of liability.</p>`
  });

  const notFound = {
    path: '/404.html',
    noindex: true,
    title: 'Page not found | Smart Finance Calculator',
    description: 'This page could not be found.',
    h1: 'Page not found',
    body: L.head('That page does not exist', 'The link may be old, or the address may have a typo. These are the places people usually want:') +
      `<div class="wrap">${ctx.cardsHtml([
        ['/emi-calculator/', 'EMI Calculator', 'Monthly instalment and repayment schedule.'],
        ['/sip-calculator/', 'SIP Calculator', 'Grow a monthly investment.'],
        ['/compound-interest-calculator/', 'Compound Interest Calculator', 'See interest earn interest.'],
        ['/fd-calculator/', 'FD Calculator', 'Fixed deposit maturity amount.'],
        ['/guides/', 'Guides', 'Plain-language explanations.']
      ])}</div>`
  };

  const offline = {
    path: '/offline/',
    noindex: true,
    title: 'You are offline | Smart Finance Calculator',
    description: 'You are offline. Saved calculators still work.',
    h1: 'You are offline',
    body: L.head('You are offline', 'This page is not saved on your device yet. The calculators you have already opened still work without a connection.') +
      `<div class="wrap">${ctx.cardsHtml([
        ['/emi-calculator/', 'EMI Calculator', 'Monthly instalment and repayment schedule.'],
        ['/sip-calculator/', 'SIP Calculator', 'Grow a monthly investment.'],
        ['/compound-interest-calculator/', 'Compound Interest Calculator', 'See interest earn interest.'],
        ['/fd-calculator/', 'FD Calculator', 'Fixed deposit maturity amount.']
      ])}</div>`
  };

  return [about, contact, privacy, terms, disclaimer, notFound, offline];
};

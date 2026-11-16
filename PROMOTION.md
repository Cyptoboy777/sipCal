# Free promotion checklist

No one can "submit" a site to ChatGPT, Claude or Gemini. They find sites through search indexes and their own crawlers, then quote pages that answer a question clearly. So the plan is: get indexed, be easy to quote, be mentioned elsewhere.

## Already done in the site
- `robots.txt` allows Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot and others.
- `/llms.txt`: a plain-text map of the site for AI assistants.
- Full static HTML (no JS needed to read results), FAQ/Article/WebApplication structured data, sitemap, canonical URLs.
- IndexNow key file: `/cf57a96a3b9be6b911a1fe4ce971de3a.txt`.

## Do once (about 30 minutes)
1. **Google Search Console**: verified. Submit `sitemap.xml`. URL Inspection > Request indexing for the home page and each calculator.
2. **Bing Webmaster Tools** (bing.com/webmasters): sign in, import from Search Console, submit the sitemap. Bing's index feeds ChatGPT search, Copilot and DuckDuckGo, so this matters a lot.
3. **IndexNow ping** (tells Bing a page changed): open in a browser, one URL at a time:
   `https://www.bing.com/indexnow?url=https://sipcalculater.vercel.app/&key=cf57a96a3b9be6b911a1fe4ce971de3a`
   Repeat with each calculator URL after a deploy.
4. **Google Business / Brand name**: use the same name "Smart Finance Calculator" everywhere.

## Get mentioned (this is what AI assistants pick up)
- **YouTube**: upload the promo video as a Short with the link in the description and a pinned comment.
- **Reddit / Quora / Stack Exchange**: answer real questions ("EMI for 50 lakh loan?", "SIP 10000 per month for 15 years?", "prepay loan or invest?") with the actual numbers and a link to the matching calculator or guide. Be useful first; follow each community's self-promotion rules. Do not spam.
- **Directories**: Product Hunt, AlternativeTo, BetaList, Indie Hackers, Hacker News "Show HN", free-tool directories.
- **GitHub**: this repo's README with a clear description and the live link; add topics (emi-calculator, sip-calculator, finance, pwa).
- **Instagram / X / LinkedIn / WhatsApp status**: post the promo video; a link in bio.
- **Guest/short posts** on finance blogs or Medium / Dev.to explaining one guide, linking back.

## Make pages easy to quote
- Keep each page answering one question directly near the top, with numbers.
- Keep "Last updated" and the About/Contact pages honest and current.
- Add a new useful guide every week or two (e.g. "EMI vs SIP", "FD vs debt fund", "how much house can I afford"). Use real questions from Search Console > Performance > Queries.

## Check results
- Search Console: Performance (queries, clicks) and Pages (indexed count).
- Bing Webmaster: same.
- Ask ChatGPT / Claude / Gemini / Perplexity your target questions monthly and note whether the site is cited.
- Expect weeks to months. Nothing here guarantees traffic or citations.

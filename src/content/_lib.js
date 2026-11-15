// Shared page shells for content modules.
module.exports = function lib(ctx) {
  const { esc, SITE, CALCS, calcSection, faqHtml, cardsHtml, F } = ctx;

  const words = (t) => String(t).split(/\s+/).filter(Boolean).map((w, i) => `<span class="w"><span class="wi" style="--n:${i}">${esc(w)}</span></span>`).join(' ');
  const prose = (html) => `<div class="wrap"><article class="prose">${html}</article></div>`;
  const head = (h1, lede) => `<div class="wrap page-head"><h1>${words(h1)}</h1>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div>`;

  const table = (cols, rows) => `<div class="table-wrap"><table><thead><tr>${cols.map((c, i) => `<th scope="col"${i ? ' style="text-align:right"' : ''}>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map((c, i) => i ? `<td style="text-align:right">${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;

  const related = (list) => `<section class="wrap related"><h2>Keep going</h2>${cardsHtml(list)}</section>`;

  const calcCards = (except) => related(Object.keys(CALCS).filter((k) => k !== except).map((k) => [`/${CALCS[k].slug}/`, CALCS[k].name, CALCS[k].tagline]));

  function calcPage(o) {
    const cfg = CALCS[o.kind];
    return {
      path: `/${cfg.slug}/`,
      calcKind: o.kind,
      title: o.title,
      description: o.description,
      h1: o.h1,
      faq: o.faq,
      priority: '0.9',
      crumbs: [['/', 'Home'], [`/${cfg.slug}/`, cfg.name]],
      body: head(o.h1, cfg.tagline) + calcSection(o.kind) +
        prose(`<p class="meta-line">Reviewed ${esc(SITE.updated)}. Formulas checked against independent calculations.</p>` + o.body) +
        faqHtml(o.faq) + (o.related ? related(o.related) : '') + calcCards(o.kind)
    };
  }

  function guidePage(o) {
    return {
      path: `/guides/${o.slug}/`,
      article: true,
      title: o.title,
      description: o.description,
      h1: o.h1,
      faq: o.faq,
      priority: '0.7',
      crumbs: [['/', 'Home'], ['/guides/', 'Guides'], [`/guides/${o.slug}/`, o.h1]],
      body: head(o.h1, o.lede) + prose(`<p class="meta-line">Reviewed ${esc(SITE.updated)} &middot; ${o.read} min read</p>` + o.body) +
        faqHtml(o.faq) + related(o.related)
    };
  }

  function plainPage(o) {
    return {
      path: o.path,
      title: o.title,
      description: o.description,
      h1: o.h1,
      priority: o.priority || '0.3',
      freq: 'yearly',
      crumbs: [['/', 'Home'], [o.path, o.h1]],
      body: head(o.h1, o.lede) + prose(o.body)
    };
  }

  const inr = F.inr, short = F.short;
  return { words, prose, head, table, related, calcCards, calcPage, guidePage, plainPage, inr, short };
};

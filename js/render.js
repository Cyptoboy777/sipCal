/*
 * Shared renderer: turns calculator inputs into HTML strings.
 * Used at build time (Node) to prerender the default state into static HTML,
 * and in the browser to update the page live. One code path, so what search
 * engines see is exactly what visitors see before they touch anything.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./calc.js'));
  else root.FinRender = factory(root.FinCalc);
})(typeof self !== 'undefined' ? self : this, function (F) {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- models ---------- */

  function model(kind, v) {
    var m;
    if (kind === 'emi') m = emiModel(v);
    else if (kind === 'sip') m = sipModel(v);
    else if (kind === 'compound') m = compoundModel(v);
    else if (kind === 'fd') m = fdModel(v);
    else throw new Error('Unknown calculator: ' + kind);
    m.insight = insight(kind, m, v);
    return m;
  }

  /* One plain-language sentence that says what the numbers mean. */
  function insight(kind, m, v) {
    var R = m.raw, S = F.short, pct = function (a, b) { return Math.round(a / b * 100); };
    var s;
    if (kind === 'emi') {
      s = 'You repay ' + S(R.totalPayment) + ' in total on a ' + S(R.principal) + ' loan. ' + S(R.totalInterest) + ' of that (' + pct(R.totalInterest, R.totalPayment) + '%) is interest' + (R.totalInterest > R.principal ? ', more than you borrowed.' : '.');
      if (v.extra > 0) s += ' Paying ' + F.inr(v.extra) + ' extra every month saves ' + S(R.interestSaved) + ' and clears the loan ' + F.duration(R.monthsSaved) + ' sooner.';
    } else if (kind === 'sip') {
      s = 'You put in ' + S(R.invested) + ' over ' + F.duration(R.months) + '. At an assumed ' + v.rate + '% a year it could grow to ' + S(R.value) + ', about ' + (R.value / R.invested).toFixed(1) + ' times what you invested.';
      if (v.inflation > 0) s += ' In today\u2019s money that is closer to ' + S(R.realValue) + '.';
    } else if (kind === 'compound') {
      s = 'Your money grows to ' + S(R.value) + ' in ' + F.duration(R.months) + '. Interest makes up ' + S(R.gains) + ' of that (' + pct(Math.max(0, R.gains), R.value) + '%), on ' + S(R.invested) + ' put in.';
    } else {
      s = 'You get back ' + S(R.value) + ' on a ' + S(R.invested) + ' deposit. ' + S(R.gains) + ' of it is interest, an effective yield of ' + R.effectiveRate.toFixed(2) + '% a year.';
    }
    return s;
  }

  function emiModel(v) {
    var months = Math.max(1, Math.round(v.years * 12));
    var L = F.loanSummary({ principal: v.principal, rate: v.rate, months: months, extra: v.extra || 0 });
    var yearly = F.yearlyLoan(L.rows);
    return {
      kind: 'emi',
      hv: L.emi, hf: 'inr',
      num: { principal: L.principal, interest: L.totalInterest, total: L.totalPayment, saved: L.interestSaved || 0 },
      headline: F.inr(L.emi),
      headlineNote: 'a month, for ' + F.duration(months),
      out: {
        principal: F.inr(L.principal),
        interest: F.inr(L.totalInterest),
        total: F.inr(L.totalPayment),
        ends: F.duration(L.months),
        saved: F.inr(L.interestSaved || 0),
        earlier: F.duration(L.monthsSaved || 0)
      },
      split: { a: L.principal, b: L.totalInterest },
      yearly: yearly.map(function (y) {
        return {
          year: y.year, a: y.principal, b: y.interest,
          tip: [['Principal paid', F.inr(y.principal)], ['Interest paid', F.inr(y.interest)], ['Balance left', F.inr(y.balance)]]
        };
      }),
      table: {
        head: ['Year', 'Principal', 'Interest', 'Total paid', 'Balance'],
        rows: yearly.map(function (y) {
          return [y.year, F.inr(y.principal), F.inr(y.interest), F.inr(y.principal + y.interest), F.inr(y.balance)];
        }),
        monthHead: ['Month', 'Principal', 'Interest', 'Total paid', 'Balance'],
        monthRows: L.rows.map(function (r) {
          return [r.month, F.inr(r.principal), F.inr(r.interest), F.inr(r.payment), F.inr(r.balance)];
        })
      },
      raw: L
    };
  }

  function growthYearly(list) {
    return list.map(function (y) {
      return {
        year: y.year, a: y.invested, b: Math.max(0, y.gains),
        tip: [['Put in', F.inr(y.invested)], ['Returns', F.inr(y.gains)], ['Total value', F.inr(y.value)]]
      };
    });
  }
  function growthTable(list, a, b) {
    return {
      head: ['Year', a, b, 'Value'],
      rows: list.map(function (y) { return [y.year, F.inr(y.invested), F.inr(y.gains), F.inr(y.value)]; })
    };
  }

  function sipModel(v) {
    var S = F.sip({ monthly: v.monthly, rate: v.rate, years: v.years, stepUp: v.stepUp || 0, lumpsum: v.lumpsum || 0, inflation: v.inflation || 0 });
    return {
      kind: 'sip',
      hv: S.value, hf: 'short',
      num: { invested: S.invested, gains: S.gains, value: S.value, real: S.realValue },
      headline: F.short(S.value),
      headlineNote: F.inr(S.value) + ' after ' + F.duration(S.months),
      out: {
        invested: F.inr(S.invested), gains: F.inr(S.gains), value: F.inr(S.value), real: F.inr(S.realValue)
      },
      split: { a: S.invested, b: Math.max(0, S.gains) },
      yearly: growthYearly(S.yearly),
      table: growthTable(S.yearly, 'Invested', 'Returns'),
      raw: S
    };
  }

  function compoundModel(v) {
    var C = F.compound({ principal: v.principal, rate: v.rate, years: v.years, freq: v.freq || 1, monthly: v.monthly || 0 });
    return {
      kind: 'compound',
      hv: C.value, hf: 'short',
      num: { invested: C.invested, gains: C.gains },
      headline: F.short(C.value),
      headlineNote: F.inr(C.value) + ' after ' + F.duration(C.months),
      out: {
        invested: F.inr(C.invested), gains: F.inr(C.gains),
        eay: C.effectiveRate.toFixed(2) + '%',
        double: isFinite(C.doublingYears) ? C.doublingYears.toFixed(1) + ' years' : 'Never at 0%'
      },
      split: { a: C.invested, b: Math.max(0, C.gains) },
      yearly: growthYearly(C.yearly),
      table: growthTable(C.yearly, 'Put in', 'Interest'),
      raw: C
    };
  }

  function fdModel(v) {
    var D = F.fd({ principal: v.principal, rate: v.rate, months: Math.round(v.years * 12), freq: v.freq || 4 });
    return {
      kind: 'fd',
      hv: D.value, hf: 'inr',
      num: { invested: D.invested, gains: D.gains, value: D.value },
      headline: F.inr(D.value),
      headlineNote: 'at maturity, after ' + F.duration(D.months),
      out: {
        invested: F.inr(D.invested), gains: F.inr(D.gains), eay: D.effectiveRate.toFixed(2) + '%', value: F.inr(D.value)
      },
      split: { a: D.invested, b: Math.max(0, D.gains) },
      yearly: growthYearly(D.yearly),
      table: growthTable(D.yearly, 'Deposit', 'Interest'),
      raw: D
    };
  }

  /* ---------- HTML pieces ---------- */

  function ledgerHtml(cfg, m, v) {
    return cfg.ledger.map(function (row) {
      if (row.showIf && !(Number(v[row.showIf]) > 0)) return '';
      var n = m.num && m.num[row.out] != null ? ' data-num="' + m.num[row.out] + '"' : '';
      return '<div class="ledger-row"><dt>' + esc(row.label) + '</dt><dd data-key="' + row.out + '"' + n + '>' + esc(m.out[row.out]) + '</dd></div>';
    }).join('');
  }

  function splitHtml(cfg, m) {
    var a = m.split.a, b = m.split.b, t = a + b || 1;
    var pb = Math.round((b / t) * 1000) / 10;
    var pa = Math.round((100 - pb) * 10) / 10;
    return '<div class="split" role="img" aria-label="' + esc(cfg.chart.a + ' ' + pa + ' percent, ' + cfg.chart.b + ' ' + pb + ' percent') + '">' +
      '<div class="split-bar"><span class="seg seg-a" style="flex:' + a + '"></span><span class="seg seg-b" style="flex:' + b + '"></span></div>' +
      '<div class="split-key"><span><i class="dot dot-a"></i>' + esc(cfg.chart.a) + ' <b>' + pa + '%</b></span>' +
      '<span><i class="dot dot-b"></i>' + esc(cfg.chart.b) + ' <b>' + pb + '%</b></span></div></div>';
  }

  function niceMax(x) {
    if (x <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10));
    var f = x / p;
    var n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return n * p;
  }

  function chartHtml(cfg, m, opts) {
    opts = opts || {};
    var data = m.yearly;
    var W = 640, H = 300, L = 62, R = 8, T = 10, B = 34;
    var iw = W - L - R, ih = H - T - B;
    var max = 0;
    data.forEach(function (d) { max = Math.max(max, d.a + d.b); });
    var top = niceMax(max);
    var ticks = 4, svg = [];
    svg.push('<svg class="chart-svg' + (opts.pre ? ' pre' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="chart-title chart-desc" preserveAspectRatio="xMidYMid meet">');
    svg.push('<title id="chart-title">' + esc(cfg.chart.title) + '</title>');
    svg.push('<desc id="chart-desc">Stacked bars, one per year. Use the table below for exact figures.</desc>');
    for (var i = 0; i <= ticks; i++) {
      var val = (top / ticks) * i;
      var y = T + ih - (val / top) * ih;
      svg.push('<line class="grid' + (i === 0 ? ' base' : '') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>');
      svg.push('<text class="tick" x="' + (L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + esc(F.short(val)) + '</text>');
    }
    var n = data.length || 1;
    var slot = iw / n;
    var bw = Math.max(3, Math.min(34, slot * 0.68));
    var every = n > 24 ? 5 : n > 12 ? 2 : 1;
    data.forEach(function (d, idx) {
      var cx = L + slot * idx + slot / 2;
      var x = cx - bw / 2;
      var ha = (d.a / top) * ih;
      var hb = (d.b / top) * ih;
      var gap = ha > 2 && hb > 2 ? 2 : 0;
      var ya = T + ih - ha;
      var yb = ya - gap - hb;
      var rx = Math.min(3, bw / 2).toFixed(1);
      if (ha > 0.5) svg.push('<rect class="bar bar-a" style="--i:' + idx + '" rx="' + rx + '" x="' + x.toFixed(1) + '" y="' + ya.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + ha.toFixed(1) + '"/>');
      if (hb > 0.5) svg.push('<rect class="bar bar-b" style="--i:' + idx + '" rx="' + rx + '" x="' + x.toFixed(1) + '" y="' + yb.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hb.toFixed(1) + '"/>');
      if ((idx + 1) % every === 0 || idx === 0) {
        svg.push('<text class="tick" x="' + cx.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + d.year + '</text>');
      }
      svg.push('<rect class="hit" data-i="' + idx + '" x="' + (cx - slot / 2).toFixed(1) + '" y="' + T + '" width="' + slot.toFixed(1) + '" height="' + ih + '" tabindex="0" aria-label="Year ' + d.year + ': ' + esc(d.tip.map(function (t) { return t[0] + ' ' + t[1]; }).join(', ')) + '"/>');
    });
    svg.push('<line class="cursor" x1="0" x2="0" y1="' + T + '" y2="' + (T + ih) + '" style="display:none"/>');
    svg.push('</svg>');
    return svg.join('');
  }

  function roundTop(x, y, w, h, r) {
    r = Math.min(r, h, w / 2);
    return 'M' + x.toFixed(1) + ' ' + (y + h).toFixed(1) +
      'V' + (y + r).toFixed(1) + 'Q' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + (x + r).toFixed(1) + ' ' + y.toFixed(1) +
      'H' + (x + w - r).toFixed(1) + 'Q' + (x + w).toFixed(1) + ' ' + y.toFixed(1) + ' ' + (x + w).toFixed(1) + ' ' + (y + r).toFixed(1) +
      'V' + (y + h).toFixed(1) + 'Z';
  }

  function tableHtml(t, rows, head, id) {
    var h = '<tr>' + head.map(function (c, i) { return '<th scope="col"' + (i ? ' class="n"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr>';
    var b = rows.map(function (r) {
      return '<tr>' + r.map(function (c, i) { return i ? '<td class="n">' + esc(c) + '</td>' : '<th scope="row">' + esc(c) + '</th>'; }).join('') + '</tr>';
    }).join('');
    return '<table class="data" id="' + id + '"><thead>' + h + '</thead><tbody>' + b + '</tbody></table>';
  }

  /** Everything inside the results panel. */
  function resultsHtml(kind, cfg, v, opts) {
    var m = model(kind, v);
    return {
      model: m,
      headline: m.headline,
      insight: m.insight,
      note: m.headlineNote,
      ledger: ledgerHtml(cfg, m, v),
      split: splitHtml(cfg, m),
      chart: chartHtml(cfg, m, opts),
      table: tableHtml(m.table, m.table.rows, m.table.head, 'tbl-year'),
      monthTable: m.table.monthRows ? tableHtml(m.table, m.table.monthRows, m.table.monthHead, 'tbl-month') : ''
    };
  }

  /* ---------- input fields ---------- */

  function fieldHtml(f, idPrefix) {
    var id = idPrefix + f.name;
    if (f.type === 'select') {
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' +
        '<select id="' + id + '" name="' + f.name + '" data-field="' + f.name + '">' +
        f.options.map(function (o) { return '<option value="' + o.v + '"' + (o.v === f.value ? ' selected' : '') + '>' + esc(o.t) + '</option>'; }).join('') +
        '</select></div>';
    }
    var isMoney = f.type === 'money';
    return '<div class="field" data-type="' + f.type + '" data-name="' + f.name + '">' +
      '<div class="field-top"><label for="' + id + '">' + esc(f.label) + '</label>' +
      '<div class="num-wrap">' + (isMoney ? '<span class="pre" aria-hidden="true">₹</span>' : '') +
      '<input class="num" id="' + id + '" name="' + f.name + '" data-field="' + f.name + '" type="text" inputmode="decimal" autocomplete="off" value="' + (isMoney ? F.num(f.value) : f.value) + '"' +
      ' data-min="' + f.hardMin + '" data-max="' + f.hardMax + '">' +
      (f.toggle
        ? '<span class="unit-toggle" role="group" aria-label="Tenure unit"><button type="button" data-unit="years" aria-pressed="true">yrs</button><button type="button" data-unit="months" aria-pressed="false">mo</button></span>'
        : (f.unit ? '<span class="post" aria-hidden="true">' + esc(f.unit) + '</span>' : '')) + '</div></div>' +
      '<input class="range" type="range" data-range="' + f.name + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.value + '" aria-label="' + esc(f.label) + ' slider">' +
      (isMoney ? '<p class="words" data-words="' + f.name + '">' + esc(F.words(f.value)) + '</p>' : '') +
      '</div>';
  }

  function formHtml(cfg, idPrefix) {
    idPrefix = idPrefix || 'f-';
    var out = cfg.fields.map(function (f) { return fieldHtml(f, idPrefix); }).join('');
    if (cfg.advanced) {
      out += '<details class="more"><summary>' + esc(cfg.advanced.summary) + '</summary><div class="more-body">' +
        cfg.advanced.fields.map(function (f) { return fieldHtml(f, idPrefix); }).join('') + '</div></details>';
    }
    return out;
  }

  function defaults(cfg) {
    var v = {};
    cfg.fields.concat(cfg.advanced ? cfg.advanced.fields : []).forEach(function (f) { v[f.name] = f.value; });
    return v;
  }

  return {
    esc: esc, model: model, chart: chartHtml,
    fmt: function (hf, v) { return hf === 'short' ? F.short(v) : F.inr(v); }, resultsHtml: resultsHtml, formHtml: formHtml, fieldHtml: fieldHtml, defaults: defaults
  };
});

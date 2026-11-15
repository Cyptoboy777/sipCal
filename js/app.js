/* Smart Finance Calculator - page behaviour. Progressive enhancement: every page is
   fully rendered as static HTML first; this file only makes the calculator live. */
(function () {
  'use strict';
  var root = document.querySelector('[data-calc]');
  if (!root || !window.FinRender || !window.FinCalc) return;

  var kind = root.getAttribute('data-calc');
  var cfg = JSON.parse(document.getElementById('calc-config').textContent);
  var fields = cfg.fields.concat(cfg.advanced ? cfg.advanced.fields : []);
  var byName = {};
  fields.forEach(function (f) { byName[f.name] = f; });

  var $ = function (sel) { return root.querySelector(sel); };
  var els = {
    figure: $('[data-stmt-figure]'), note: $('[data-stmt-note]'), insight: $('[data-insight]'), ledger: $('[data-ledger]'),
    split: $('[data-split]'), chart: $('[data-chart]'), tblYear: $('[data-tbl-year]'), tblMonth: $('[data-tbl-month]'),
    tip: $('[data-tip]'), toast: $('[data-toast]'), dock: $('[data-dock-fig]')
  };
  var values = {};
  var unit = {};            // per-field display unit: 'years' | 'months' (tenure fields only)
  var last = null;
  var monthly = false;

  /* ---------- value helpers ---------- */
  function parse(text) {
    var n = parseFloat(String(text).replace(/,/g, '').replace(/[^\d.\-]/g, ''));
    return isFinite(n) ? n : NaN;
  }
  function clamp(f, n) {
    if (!isFinite(n)) return f.value;
    return Math.min(f.hardMax, Math.max(f.hardMin, n));
  }
  function inMonths(f) { return unit[f.name] === 'months'; }
  function fmt(f, n) {
    if (f.type === 'money') return FinCalc.num(n);
    if (inMonths(f)) return String(Math.round(n * 12));
    return String(Math.round(n * 100) / 100);
  }
  function fill(range) {
    var min = +range.min, max = +range.max, v = Math.min(max, Math.max(min, +range.value));
    range.style.setProperty('--fill', (max === min ? 0 : ((v - min) / (max - min)) * 100) + '%');
  }
  function words(f, v) {
    var w = $('[data-words="' + f.name + '"]');
    if (w) w.textContent = FinCalc.words(v);
  }
  /* Push values[name] into the number box, slider and helper text. */
  function show(f) {
    var v = values[f.name];
    var input = $('[data-field="' + f.name + '"]');
    if (f.type === 'select') { input.value = String(v); return; }
    input.value = fmt(f, v);
    var range = $('[data-range="' + f.name + '"]');
    if (inMonths(f)) {
      range.min = f.min * 12; range.max = f.max * 12; range.step = 1; range.value = Math.round(v * 12);
    } else {
      range.min = f.min; range.max = f.max; range.step = f.step; range.value = v;
    }
    fill(range); words(f, v);
  }

  /* ---------- start-up: URL first, then the prerendered defaults ---------- */
  var params = new URLSearchParams(location.search);
  fields.forEach(function (f) {
    values[f.name] = params.has(f.name) ? clamp(f, parse(params.get(f.name))) : f.value;
    if (f.toggle) unit[f.name] = 'years';
    show(f);
  });

  /* ---------- events ---------- */
  root.addEventListener('input', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-range')) {
      var f = byName[t.getAttribute('data-range')];
      var v = parseFloat(t.value);
      if (inMonths(f)) v = v / 12;
      values[f.name] = v;
      $('[data-field="' + f.name + '"]').value = fmt(f, v);
      fill(t); words(f, v); changed();
    } else if (t.hasAttribute('data-field') && t.tagName === 'INPUT') {
      var g = byName[t.getAttribute('data-field')];
      var n = parse(t.value);
      if (!isFinite(n)) return;
      if (inMonths(g)) n = n / 12;
      n = clamp(g, n);
      values[g.name] = n;
      var r = $('[data-range="' + g.name + '"]');
      r.value = inMonths(g) ? Math.round(n * 12) : n; fill(r); words(g, n); changed();
    }
  });
  root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.tagName === 'SELECT') { values[t.getAttribute('data-field')] = parseFloat(t.value); changed(); }
    else if (t.hasAttribute('data-field')) {
      var f = byName[t.getAttribute('data-field')];
      t.value = fmt(f, values[f.name]);   // tidy formatting and show the clamped value
    }
  });
  /* Arrow keys nudge a number box; Shift makes the step ten times bigger. */
  root.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!(t.hasAttribute && t.hasAttribute('data-field') && t.tagName === 'INPUT')) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    var f = byName[t.getAttribute('data-field')];
    var step = inMonths(f) ? 1 / 12 : f.step;
    var dir = e.key === 'ArrowUp' ? 1 : -1;
    values[f.name] = clamp(f, values[f.name] + dir * step * (e.shiftKey ? 10 : 1));
    show(f); changed();
  });
  /* Years / months switch on tenure fields */
  root.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-unit]');
    if (!b) return;
    var wrapEl = b.closest('.field');
    var f = byName[wrapEl.getAttribute('data-name')];
    unit[f.name] = b.getAttribute('data-unit');
    wrapEl.querySelectorAll('[data-unit]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    show(f);
  });

  /* ---------- presets + reset ---------- */
  function setAll(src, resetUnits) {
    if (resetUnits) {
      fields.forEach(function (f) {
        if (!f.toggle) return;
        unit[f.name] = 'years';
        var fe = $('.field[data-name="' + f.name + '"]');
        fe.querySelectorAll('[data-unit]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-unit') === 'years')); });
      });
    }
    fields.forEach(function (f) {
      values[f.name] = src && src[f.name] != null ? src[f.name] : f.value;
      show(f);
    });
    changed();
  }
  var chips = root.querySelectorAll('[data-preset]');
  chips.forEach(function (c) {
    c.addEventListener('click', function () { setAll(cfg.presets[+c.getAttribute('data-preset')].values); });
  });
  var resetBtn = $('[data-reset]');
  if (resetBtn) resetBtn.addEventListener('click', function () { setAll(null, true); say('Back to the starting numbers'); });
  function markChips() {
    chips.forEach(function (c) {
      var p = cfg.presets[+c.getAttribute('data-preset')].values;
      var on = fields.every(function (f) {
        var want = p[f.name] != null ? p[f.name] : f.value;
        return Math.abs(values[f.name] - want) < 1e-9;
      });
      c.setAttribute('aria-pressed', String(on));
    });
  }

  /* ---------- render + motion ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var token = 0;
  var timer = null;
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function setFigure(text) {
    els.figure.textContent = text;
    if (els.dock) els.dock.textContent = text;
  }

  function changed() {
    markChips();
    if (timer) cancelAnimationFrame(timer);
    timer = requestAnimationFrame(function () { paint(false); });
    writeUrl();
  }

  /* The split bar keeps its DOM nodes so CSS can transition the segment widths. */
  function syncSplit(html) {
    var tpl = document.createElement('div');
    tpl.innerHTML = html;
    var next = tpl.firstChild, cur = els.split.querySelector('.split');
    if (!cur) { els.split.innerHTML = html; return; }
    var cs = cur.querySelectorAll('.seg'), ns = next.querySelectorAll('.seg');
    for (var i = 0; i < cs.length; i++) cs[i].style.flex = ns[i].style.flex;
    cur.setAttribute('aria-label', next.getAttribute('aria-label'));
    cur.querySelector('.split-key').innerHTML = next.querySelector('.split-key').innerHTML;
  }

  function observeChart() {
    var svg = els.chart.querySelector('svg');
    if (!svg || !svg.classList.contains('pre')) return;
    var play = function () { svg.classList.remove('pre'); svg.classList.add('play'); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.3 });
      io.observe(svg);
    } else play();
    setTimeout(function () { if (svg.classList.contains('pre')) play(); }, 4000);   // never leave bars hidden
  }

  function paint(first) {
    var R = FinRender.resultsHtml(kind, cfg, values, { pre: !!first && !reduce });
    var prev = last, m = R.model;
    last = m;
    els.note.textContent = R.note;
    if (els.insight) els.insight.textContent = R.insight;
    els.ledger.innerHTML = R.ledger;
    syncSplit(R.split);
    els.tblYear.innerHTML = R.table;
    if (els.tblMonth) els.tblMonth.innerHTML = R.monthTable;
    hideTip();

    if (reduce) { setFigure(R.headline); els.chart.innerHTML = R.chart; return; }

    var my = ++token;
    var from = first ? null : prev;
    var dur = first ? 1000 : 480;
    var h0 = from ? from.hv : 0;
    var nums = Array.prototype.slice.call(els.ledger.querySelectorAll('dd[data-num]'));
    var n0 = nums.map(function (dd) {
      var k = dd.getAttribute('data-key');
      return from && from.num && from.num[k] != null ? from.num[k] : 0;
    });
    var cf = from ? from.yearly : null;
    if (first) { els.chart.innerHTML = R.chart; observeChart(); }
    setFigure(FinRender.fmt(m.hf, h0));
    nums.forEach(function (dd, i) { dd.textContent = FinCalc.inr(n0[i]); });

    var t0 = null;
    function frame(ts) {
      if (my !== token) return;                       // a newer paint took over
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = ease(p);
      setFigure(FinRender.fmt(m.hf, lerp(h0, m.hv, e)));
      nums.forEach(function (dd, i) { dd.textContent = FinCalc.inr(lerp(n0[i], +dd.getAttribute('data-num'), e)); });
      if (cf) {
        var data = m.yearly.map(function (d, i) {
          var o = cf[i] || { a: 0, b: 0 };
          return { year: d.year, tip: d.tip, a: lerp(o.a, d.a, e), b: lerp(o.b, d.b, e) };
        });
        els.chart.innerHTML = FinRender.chart(cfg, { yearly: data }, {});
      }
      if (p < 1) requestAnimationFrame(frame);
      else {
        setFigure(R.headline);
        nums.forEach(function (dd) { dd.textContent = FinCalc.inr(+dd.getAttribute('data-num')); });
        if (cf) els.chart.innerHTML = R.chart;
      }
    }
    requestAnimationFrame(frame);
  }

  var urlTimer = null;
  function writeUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(function () {
      var q = new URLSearchParams();
      fields.forEach(function (f) { if (values[f.name] !== f.value) q.set(f.name, values[f.name]); });
      var s = q.toString();
      try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) { /* ignore */ }
    }, 250);
  }
  markChips();
  paint(true);

  /* ---------- floating result bar on small screens ---------- */
  var dock = $('[data-dock]'), stmt = $('[data-statement]');
  if (dock && stmt && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      dock.classList.toggle('show', !es[0].isIntersecting);
    }, { threshold: 0.05 }).observe(stmt);
  }

  /* ---------- chart tooltip ---------- */
  var wrap = $('[data-chart-wrap]');
  function showTip(hit) {
    if (!last || !els.tip) return;
    var d = last.yearly[+hit.getAttribute('data-i')];
    if (!d) return;
    els.tip.innerHTML = '<b>Year ' + d.year + '</b>' + d.tip.map(function (t) {
      return '<div><span>' + FinRender.esc(t[0]) + '</span><span>' + FinRender.esc(t[1]) + '</span></div>';
    }).join('');
    els.tip.hidden = false;
    var svg = els.chart.querySelector('svg');
    var cursor = svg.querySelector('.cursor');
    var hb = hit.getBoundingClientRect(), wb = wrap.getBoundingClientRect();
    var cx = hb.left - wb.left + hb.width / 2;
    var tw = els.tip.offsetWidth;
    var x = Math.max(tw / 2, Math.min(wb.width - tw / 2, cx));
    els.tip.style.left = x + 'px';
    els.tip.style.top = '4px';
    var vb = svg.viewBox.baseVal;
    var scale = svg.getBoundingClientRect().width / vb.width;
    var cxv = (hb.left - svg.getBoundingClientRect().left + hb.width / 2) / scale;
    cursor.setAttribute('x1', cxv); cursor.setAttribute('x2', cxv); cursor.style.display = '';
  }
  function hideTip() {
    if (els.tip) els.tip.hidden = true;
    var c = els.chart && els.chart.querySelector('.cursor');
    if (c) c.style.display = 'none';
  }
  if (wrap) {
    wrap.addEventListener('pointermove', function (e) {
      var h = e.target.closest && e.target.closest('.hit');
      if (h) showTip(h); else hideTip();
    });
    wrap.addEventListener('pointerleave', hideTip);
    wrap.addEventListener('focusin', function (e) { if (e.target.classList.contains('hit')) showTip(e.target); });
    wrap.addEventListener('focusout', hideTip);
  }

  /* ---------- schedule toggle ---------- */
  var toggles = root.querySelectorAll('[data-view]');
  toggles.forEach(function (b) {
    b.addEventListener('click', function () {
      monthly = b.getAttribute('data-view') === 'month';
      toggles.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      els.tblYear.hidden = monthly;
      if (els.tblMonth) els.tblMonth.hidden = !monthly;
    });
  });

  /* ---------- share, CSV, print ---------- */
  function say(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    setTimeout(function () { els.toast.textContent = ''; }, 2600);
  }
  var share = $('[data-share]');
  if (share) share.addEventListener('click', function () {
    var q = new URLSearchParams();
    fields.forEach(function (f) { if (values[f.name] !== f.value) q.set(f.name, values[f.name]); });
    var url = location.origin + location.pathname + (q.toString() ? '?' + q : '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { say('Link copied'); }, function () { say(url); });
    } else say(url);
  });
  var csv = $('[data-csv]');
  if (csv) csv.addEventListener('click', function () {
    if (!last) return;
    var t = last.table;
    var head = monthly && t.monthHead ? t.monthHead : t.head;
    var rows = monthly && t.monthRows ? t.monthRows : t.rows;
    var clean = function (c) { return String(c).replace(/[₹,]/g, ''); };
    var text = [head.join(',')].concat(rows.map(function (r) { return r.map(clean).join(','); })).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = cfg.slug + (monthly ? '-monthly' : '-yearly') + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    say('CSV downloaded');
  });
  var pr = $('[data-print]');
  if (pr) pr.addEventListener('click', function () { window.print(); });
})();

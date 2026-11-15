/* Light / dark switch. The saved choice is applied by a tiny inline script in <head>
   (so there is no flash); this file wires up the button. With no saved choice the site
   follows the device setting. */
(function () {
  'use strict';
  var root = document.documentElement;
  var btn = document.querySelector('[data-theme-toggle]');
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function effective() {
    var t = root.getAttribute('data-theme');
    return t === 'dark' || t === 'light' ? t : (mq && mq.matches ? 'dark' : 'light');
  }
  function paint() {
    var dark = effective() === 'dark';
    if (btn) {
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', String(dark));
    }
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach(function (m) {
      if (!m.hasAttribute('data-orig')) m.setAttribute('data-orig', m.getAttribute('content'));
    });
    if (root.getAttribute('data-theme')) {
      metas.forEach(function (m, i) { m.removeAttribute('media'); m.setAttribute('content', dark ? '#0b101c' : '#eef2f8'); if (i > 0) m.remove(); });
    }
  }
  if (btn) btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    var apply = function () {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
      paint();
    };
    // Cross-fade the whole page where the browser supports it
    if (document.startViewTransition && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) document.startViewTransition(apply);
    else apply();
  });
  if (mq && mq.addEventListener) mq.addEventListener('change', paint);
  paint();
})();

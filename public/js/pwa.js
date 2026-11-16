/* Registers the service worker and powers the "Install app" button. */
(function () {
  'use strict';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* offline support is optional */ });
    });
  }
  var btn = document.querySelector('[data-install]');
  var dialog = document.querySelector('[data-install-dialog]');
  var deferred = null;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  /* The button is always offered unless the app is already installed and running. */
  if (btn && !standalone) btn.hidden = false;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // keep the native prompt for our own button
    deferred = e;
  });

  function platform() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    return 'desktop';
  }
  function showHelp() {
    if (!dialog) return;
    var p = platform();
    dialog.querySelectorAll('[data-help]').forEach(function (el) { el.hidden = el.getAttribute('data-help') !== p; });
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }

  if (btn) btn.addEventListener('click', function () {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function (c) {
        deferred = null;
        if (c && c.outcome === 'accepted') btn.hidden = true;
      });
    } else {
      showHelp();       // browser has not offered the prompt (yet): show the manual steps
    }
  });
  window.addEventListener('appinstalled', function () { if (btn) btn.hidden = true; });
  /* Click outside the sheet closes it */
  if (dialog) dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
})();

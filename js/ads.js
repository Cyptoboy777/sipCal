/* Fills Google ad slots. Sponsor ads are plain HTML and need no script. */
(function () {
  var q = document.querySelectorAll('ins.adsbygoogle:not([data-ad-done])');
  for (var i = 0; i < q.length; i++) {
    q[i].setAttribute('data-ad-done', '1');
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }
})();

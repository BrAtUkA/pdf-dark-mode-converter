(function () {
  var s = document.currentScript;
  var depth = (s.getAttribute('data-depth') || '');
  var langPrefix = '';   // the site is English-only

  var t = { home:'Home', blog:'Blog', about:'About', privacy:'Privacy', terms:'Terms', contact:'Contact', changelog:'Changelog', copy:'Free & open-source', creditOriginal:'Originally by', creditSupercharged:'Supercharged by', starText:'Enjoying this tool? Star us on GitHub!', starBtn:'\u2b50 Star on GitHub' };

  var home = depth + langPrefix;
  var blog = depth + 'blog/';

  // Skip DOM footer creation if a baked (pre-rendered) footer already exists
  var prev = s.previousElementSibling;
  if (!(prev && prev.tagName === 'FOOTER')) {
    var footer = document.createElement('footer');
    footer.className = s.getAttribute('data-class') || 'site-footer';
    footer.innerHTML =
      '<a href="https://github.com/BrAtUkA" class="footer-logo" aria-label="BrAtUkA on GitHub">' +
        '<img src="https://raw.githubusercontent.com/BrAtUkA/BrAtUkA/main/imgs/logo-flat-white.png" alt="BrAtUkA logo" width="26" height="32">' +
      '</a>' +
      '<nav class="footer-links" aria-label="Footer">' +
        '<a href="' + home + '">' + t.home + '</a>' +
        '<a href="' + blog + '">' + t.blog + '</a>' +
        '<a href="' + depth + langPrefix + 'about/">' + t.about + '</a>' +
        '<a href="' + depth + langPrefix + 'privacy/">' + t.privacy + '</a>' +
        '<a href="' + depth + langPrefix + 'terms/">' + t.terms + '</a>' +
        '<a href="' + depth + langPrefix + 'contact/">' + t.contact + '</a>' +
        '<a href="' + depth + langPrefix + 'changelog/">' + t.changelog + '</a>' +
        '<a href="https://github.com/BrAtUkA/pdf-dark-mode-converter">GitHub</a>' +
      '</nav>' +
      '<p class="footer-copy">\u00a9 ' + new Date().getFullYear() + ' BrAtUkA \u00b7 ' + t.copy + '</p>' +
      '<p class="footer-credit">' + t.creditOriginal + ' <a href="https://github.com/Chizkiyahu/pdf-dark-mode-converter">Chizkiyahu</a> \u00b7 ' + t.creditSupercharged + ' <a href="https://github.com/BrAtUkA">BrAtUkA</a></p>';

    s.parentNode.insertBefore(footer, s);
  }

  // --- Analytics (injected once via footer.js, deferred until idle) ---
  if (!window.__analytics_loaded) {
    window.__analytics_loaded = true;

    function loadAnalytics() {
      // Google Analytics (gtag.js)
      var ga = document.createElement('script');
      ga.async = true;
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-FZZB5QC242';
      document.head.appendChild(ga);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', 'G-FZZB5QC242');

      // Cloudflare Web Analytics
      var cf = document.createElement('script');
      cf.defer = true;
      cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      cf.setAttribute('data-cf-beacon', '{"token":"ddb264be776945ce8a8a6f4d9afc1350"}');
      document.head.appendChild(cf);
    }

    // Delay analytics until the browser is idle (or 3s, whichever comes first)
    // This keeps gtag.js off the main thread during LCP and TBT measurement window.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadAnalytics, { timeout: 3000 });
    } else {
      setTimeout(loadAnalytics, 3000);
    }
  }

  // --- Star-on-GitHub banner (mobile only, shown after PDF conversion) ---
  var STAR_KEY = 'pdfdm_star_dismissed';
  var dismissed = false;
  try { dismissed = !!localStorage.getItem(STAR_KEY); } catch (e) {}

  if (!dismissed) {
    var starBanner = document.createElement('div');
    starBanner.className = 'star-banner';
    starBanner.innerHTML =
      '<span class="star-banner-text">' + t.starText + '</span>' +
      '<a class="star-banner-btn" href="https://github.com/BrAtUkA/pdf-dark-mode-converter" target="_blank" rel="noopener">' + t.starBtn + '</a>' +
      '<button class="star-banner-close" aria-label="Close">\u00d7</button>';
    document.body.appendChild(starBanner);

    starBanner.querySelector('.star-banner-close').addEventListener('click', function () {
      starBanner.classList.remove('visible');
      try { localStorage.setItem(STAR_KEY, '1'); } catch (e) {}
    });
    starBanner.querySelector('.star-banner-btn').addEventListener('click', function () {
      setTimeout(function () {
        starBanner.classList.remove('visible');
        try { localStorage.setItem(STAR_KEY, '1'); } catch (e) {}
      }, 300);
    });

    document.addEventListener('pdf-converted', function () {
      if (!starBanner.classList.contains('visible')) {
        setTimeout(function () { starBanner.classList.add('visible'); }, 1500);
      }
    });
  }
})();

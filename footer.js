(function () {
  var s = document.currentScript;
  var depth = (s.getAttribute('data-depth') || '');
  var htmlLang = document.documentElement.lang || 'en';
  var langPrefix = (htmlLang !== 'en') ? htmlLang + '/' : '';

  // Footer labels per language (add new languages here)
  var labels = {
    en: { home:'Home', blog:'Blog', about:'About', privacy:'Privacy', terms:'Terms', contact:'Contact', changelog:'Changelog', copy:'Free & open-source', creditOriginal:'Originally by', creditSupercharged:'Supercharged by', starText:'Enjoying this tool? Star us on GitHub!', starBtn:'\u2b50 Star on GitHub' },
    es: { home:'Inicio', blog:'Blog', about:'Acerca de', privacy:'Privacidad', terms:'Términos', contact:'Contacto', changelog:'Cambios', copy:'Gratis y de código abierto', creditOriginal:'Creado originalmente por', creditSupercharged:'Potenciado por', starText:'\u00bfTe gusta esta herramienta? \u00a1D\u00e9janos una estrella en GitHub!', starBtn:'\u2b50 Estrella en GitHub' },
    fr: { home:'Accueil', blog:'Blog', about:'\u00c0 propos', privacy:'Confidentialit\u00e9', terms:'Conditions', contact:'Contact', changelog:'Changelog', copy:'Gratuit et open-source', creditOriginal:'Cr\u00e9\u00e9 \u00e0 l\'origine par', creditSupercharged:'Boost\u00e9 par', starText:'Vous aimez cet outil\u202f? Mettez-nous une \u00e9toile sur GitHub\u202f!', starBtn:'\u2b50 \u00c9toile sur GitHub' },
    de: { home:'Startseite', blog:'Blog', about:'\u00dcber uns', privacy:'Datenschutz', terms:'Nutzungsbedingungen', contact:'Kontakt', changelog:'\u00c4nderungsprotokoll', copy:'Kostenlos & Open-Source', creditOriginal:'Urspr\u00fcnglich von', creditSupercharged:'Weiterentwickelt von', starText:'Gef\u00e4llt dir dieses Tool? Gib uns einen Stern auf GitHub!', starBtn:'\u2b50 Stern auf GitHub' },
    it: { home:'Home', blog:'Blog', about:'Chi siamo', privacy:'Privacy', terms:'Termini', contact:'Contatti', changelog:'Changelog', copy:'Gratuito e open-source', creditOriginal:'Creato originariamente da', creditSupercharged:'Potenziato da', starText:'Ti piace questo strumento? Lasciaci una stella su GitHub!', starBtn:'\u2b50 Stella su GitHub' },
    pt: { home:'In\u00edcio', blog:'Blog', about:'Sobre', privacy:'Privacidade', terms:'Termos', contact:'Contato', changelog:'Changelog', copy:'Gratuito e open-source', creditOriginal:'Criado originalmente por', creditSupercharged:'Turbinado por', starText:'Gostou desta ferramenta? Deixe uma estrela no GitHub!', starBtn:'\u2b50 Estrela no GitHub' },
    zh: { home:'\u9996\u9875', blog:'\u535a\u5ba2', about:'\u5173\u4e8e', privacy:'\u9690\u79c1', terms:'\u6761\u6b3e', contact:'\u8054\u7cfb', changelog:'\u66f4\u65b0\u65e5\u5fd7', copy:'\u514d\u8d39\u5f00\u6e90', creditOriginal:'\u6700\u521d\u7531', creditSupercharged:'\u5f3a\u529b\u5347\u7ea7', starText:'\u559c\u6b22\u8fd9\u4e2a\u5de5\u5177\uff1f\u5728 GitHub \u4e0a\u7ed9\u6211\u4eec\u4e00\u9897\u661f\uff01', starBtn:'\u2b50 \u5728 GitHub \u4e0a\u7ed9\u661f' },
    ko: { home:'\ud648', blog:'\ube14\ub85c\uadf8', about:'\uc18c\uac1c', privacy:'\uac1c\uc778\uc815\ubcf4', terms:'\uc774\uc6a9\uc57d\uad00', contact:'\ubb38\uc758', changelog:'\ubcc0\uacbd \uc774\ub825', copy:'\ubb34\ub8cc \uc624\ud508\uc18c\uc2a4', creditOriginal:'\uc6d0\uc791', creditSupercharged:'\uac15\ud654', starText:'\uc774 \ub3c4\uad6c\uac00 \ub9c8\uc74c\uc5d0 \ub4dc\uc168\ub098\uc694? GitHub\uc5d0\uc11c \ubcc4\uc744 \ub0a8\uacbc\uc8fc\uc138\uc694!', starBtn:'\u2b50 GitHub\uc5d0\uc11c \ubcc4 \ub0a8\uae30\uae30' },
    ja: { home:'\u30db\u30fc\u30e0', blog:'\u30d6\u30ed\u30b0', about:'\u6982\u8981', privacy:'\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc', terms:'\u5229\u7528\u898f\u7d04', contact:'\u304a\u554f\u3044\u5408\u308f\u305b', changelog:'\u5909\u66f4\u5c65\u6b74', copy:'\u7121\u6599\u30aa\u30fc\u30d7\u30f3\u30bd\u30fc\u30b9', creditOriginal:'\u30aa\u30ea\u30b8\u30ca\u30eb', creditSupercharged:'\u5f37\u5316', starText:'\u3053\u306e\u30c4\u30fc\u30eb\u304c\u6c17\u306b\u5165\u308a\u307e\u3057\u305f\u304b\uff1fGitHub\u3067\u30b9\u30bf\u30fc\u3092\u4ed8\u3051\u3066\u304f\u3060\u3055\u3044\uff01', starBtn:'\u2b50 GitHub\u3067\u30b9\u30bf\u30fc' },
    ru: { home:'\u0413\u043b\u0430\u0432\u043d\u0430\u044f', blog:'\u0411\u043b\u043e\u0433', about:'\u041e \u043f\u0440\u043e\u0435\u043a\u0442\u0435', privacy:'\u041a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', terms:'\u0423\u0441\u043b\u043e\u0432\u0438\u044f', contact:'\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b', changelog:'\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f', copy:'\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e \u0438 \u0441 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u043c \u043a\u043e\u0434\u043e\u043c', creditOriginal:'\u0421\u043e\u0437\u0434\u0430\u043d\u043e', creditSupercharged:'\u0423\u043b\u0443\u0447\u0448\u0435\u043d\u043e', starText:'\u041d\u0440\u0430\u0432\u0438\u0442\u0441\u044f \u044d\u0442\u043e\u0442 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442? \u041f\u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0437\u0432\u0435\u0437\u0434\u0443 \u043d\u0430 GitHub!', starBtn:'\u2b50 \u0417\u0432\u0435\u0437\u0434\u0430 \u043d\u0430 GitHub' }
  };
  var t = labels[htmlLang] || labels.en;

  var home = depth + langPrefix + 'index.html';
  var blog = depth + langPrefix + 'blog/index.html';

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
        '<a href="' + depth + langPrefix + 'about/index.html">' + t.about + '</a>' +
        '<a href="' + depth + langPrefix + 'privacy/index.html">' + t.privacy + '</a>' +
        '<a href="' + depth + langPrefix + 'terms/index.html">' + t.terms + '</a>' +
        '<a href="' + depth + langPrefix + 'contact/index.html">' + t.contact + '</a>' +
        '<a href="' + depth + langPrefix + 'changelog/index.html">' + t.changelog + '</a>' +
        '<a href="https://github.com/BrAtUkA/pdf-dark-mode-converter">GitHub</a>' +
      '</nav>' +
      '<p class="footer-copy">\u00a9 ' + new Date().getFullYear() + ' BrAtUkA \u00b7 ' + t.copy + '</p>' +
      '<p class="footer-credit">' + t.creditOriginal + ' <a href="https://github.com/Chizkiyahu/pdf-dark-mode-converter">Chizkiyahu</a> \u00b7 ' + t.creditSupercharged + ' <a href="https://github.com/BrAtUkA">BrAtUkA</a></p>';

    s.parentNode.insertBefore(footer, s);
  }

  // --- Language switcher (loaded once via footer.js so all pages get it) ---
  if (!window.__lang_switcher_loaded) {
    window.__lang_switcher_loaded = true;
    var ls = document.createElement('script');
    ls.src = depth + 'js/lang-switcher.js';
    ls.defer = true;
    document.body.appendChild(ls);
  }

  // --- Analytics (injected once via footer.js so all pages are covered) ---
  if (!window.__analytics_loaded) {
    window.__analytics_loaded = true;

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

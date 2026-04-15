/**
 * Language Switcher — globe dropdown for all pages.
 * Detects current language from <html lang>, builds RELATIVE links to
 * equivalent pages in other available languages, and saves preference.
 *
 * All internal page links are baked in at build time by the i18n generator.
 * This script only handles: (1) the dropdown UI, (2) suggestion banner,
 * (3) saving the user's explicit language choice to localStorage.
 */
(function () {
  var LANGUAGES = {
    en: { native: 'English' },
    es: { native: 'Español' },
    fr: { native: 'Français' },
    de: { native: 'Deutsch' },
    it: { native: 'Italiano' },
    pt: { native: 'Português' },
    zh: { native: '中文' },
    ko: { native: '한국어' },
    ja: { native: '日本語' },
    ru: { native: 'Русский' }
  };

  var STORAGE_KEY = 'pdfdm_lang';
  var langCodes = Object.keys(LANGUAGES);

  // One-time migration: clear stale language preferences that were
  // previously saved on every dropdown click (caused false suggestions).
  try {
    if (!localStorage.getItem('pdfdm_lang_v2')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem('pdfdm_lang_v2', '1');
    }
  } catch (e) {}

  // Detect current language from the page
  var htmlLang = document.documentElement.lang || 'en';
  var currentLang = LANGUAGES[htmlLang] ? htmlLang : 'en';

  // Figure out depth to project root from footer.js's data-depth
  var footerScript = document.querySelector('script[data-depth]');
  var depth = footerScript ? (footerScript.getAttribute('data-depth') || '') : '';

  // Inject lang.css (single source of truth for switcher + banner styles)
  if (!document.querySelector('link[href*="lang.css"]')) {
    var cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = depth + 'css/lang.css';
    document.head.appendChild(cssLink);
  }

  // Determine englishPagePath: the page path relative to project root, without lang prefix.
  // e.g. on es/blog/chrome-pdf-dark-mode/index.html → "blog/chrome-pdf-dark-mode/index.html"
  // e.g. on index.html → "index.html"
  var pathname = window.location.pathname;
  // Try to extract from a known base path (works on GitHub Pages and custom domains)
  var pagePath = '';
  var baseIdx = pathname.indexOf('/pdf-dark-mode-converter/');
  if (baseIdx !== -1) {
    pagePath = pathname.substring(baseIdx + '/pdf-dark-mode-converter/'.length);
  } else {
    // Fallback: treat entire pathname after leading / as the path (for custom domain)
    pagePath = pathname.replace(/^\//, '');
  }
  // Strip language prefix if present
  for (var j = 0; j < langCodes.length; j++) {
    if (langCodes[j] !== 'en' && pagePath.indexOf(langCodes[j] + '/') === 0) {
      pagePath = pagePath.substring(langCodes[j].length + 1);
      break;
    }
  }
  // Normalize trailing slash to index.html
  if (!pagePath || pagePath.charAt(pagePath.length - 1) === '/') pagePath += 'index.html';

  // Build a relative URL for a target language
  function buildRelativeUrl(lang) {
    if (lang === currentLang) return ''; // current page
    if (lang === 'en') return depth + pagePath;
    return depth + lang + '/' + pagePath;
  }

  // Available languages for THIS page: read from hreflang tags (presence = available)
  var available = [];
  var hreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
  for (var h = 0; h < hreflangs.length; h++) {
    var hl = hreflangs[h].getAttribute('hreflang');
    if (hl && hl !== 'x-default' && LANGUAGES[hl]) {
      available.push(hl);
    }
  }

  // Ensure current language is in the list
  if (available.indexOf(currentLang) === -1) available.unshift(currentLang);
  if (available.length < 2) return;

  // --- Language suggestion banner (never redirect — bad for SEO & UX) ---
  // Check: (1) stored preference, or (2) browser language
  var suggestLang = null;
  try {
    var storedLang = localStorage.getItem(STORAGE_KEY);
    if (storedLang && storedLang !== currentLang && available.indexOf(storedLang) !== -1) {
      suggestLang = storedLang;
    }
  } catch (e) {}

  if (!suggestLang) {
    // Walk browser language preferences (most preferred first).
    // If the page's language appears before any other supported language,
    // the user is already on a preferred language — no suggestion needed.
    var browserLangs = navigator.languages || [navigator.language || ''];
    for (var bl = 0; bl < browserLangs.length; bl++) {
      var blCode = browserLangs[bl].split('-')[0].toLowerCase();
      if (blCode === currentLang) break;
      if (LANGUAGES[blCode] && available.indexOf(blCode) !== -1) {
        suggestLang = blCode;
        break;
      }
    }
  }

  // Show non-intrusive banner if we have a suggestion and user hasn't dismissed it
  var DISMISS_KEY = 'pdfdm_lang_dismiss';
  if (suggestLang) {
    try {
      var dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
      if (!dismissed[suggestLang]) {
        var banner = document.createElement('div');
        banner.className = 'lang-banner';
        var msgs = {
          en: 'This page is available in English',
          es: 'Esta página está disponible en Español',
          fr: 'Cette page est disponible en Français',
          de: 'Diese Seite ist auf Deutsch verfügbar',
          it: 'Questa pagina è disponibile in Italiano',
          pt: 'Esta página está disponível em Português',
          zh: '此页面有中文版本',
          ko: '이 페이지는 한국어로 제공됩니다',
          ja: 'このページは日本語でご利用いただけます'
        };
        var switchLabels = {
          en: 'Switch', es: 'Cambiar', fr: 'Changer', de: 'Wechseln',
          it: 'Cambia', pt: 'Mudar', zh: '切换', ko: '전환', ja: '切替'
        };
        banner.innerHTML =
          '<span class="lang-banner-text">' + (msgs[suggestLang] || msgs.en) + '</span>' +
          '<a class="lang-banner-switch" href="' + buildRelativeUrl(suggestLang) + '" data-lang="' + suggestLang + '">' +
            (switchLabels[suggestLang] || 'Switch') +
          '</a>' +
          '<button class="lang-banner-close" aria-label="Dismiss">&times;</button>';

        document.body.appendChild(banner);
        // Animate in
        requestAnimationFrame(function () { banner.classList.add('visible'); });

        // Save preference if they click switch
        banner.querySelector('.lang-banner-switch').addEventListener('click', function () {
          try { localStorage.setItem(STORAGE_KEY, suggestLang); } catch (e) {}
        });

        // Dismiss
        banner.querySelector('.lang-banner-close').addEventListener('click', function () {
          banner.classList.remove('visible');
          try {
            var d = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
            d[suggestLang] = Date.now();
            localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
          } catch (e) {}
          setTimeout(function () { banner.remove(); }, 300);
        });
      }
    } catch (e) {}
  }

  // Globe SVG
  var globeSvg = '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>';
  var chevronSvg = '<svg class="lang-chevron" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 1 5 5 9 1"/></svg>';

  // Build dropdown items using relative URLs (works on any domain, localhost, etc.)
  var items = '';
  for (var k = 0; k < available.length; k++) {
    var lang = available[k];
    var url = buildRelativeUrl(lang);
    var active = lang === currentLang ? ' active' : '';
    items += '<a class="lang-item' + active + '"' + (url ? ' href="' + url + '"' : '') + ' data-lang="' + lang + '">' +
      '<span class="lang-code">' + lang.toUpperCase() + '</span>' +
      '<span class="lang-name">' + LANGUAGES[lang].native + '</span>' +
    '</a>';
  }

  // Create the switcher element
  var wrapper = document.createElement('div');
  wrapper.className = 'lang-switcher';
  wrapper.innerHTML =
    '<button class="lang-toggle" aria-label="Change language" aria-expanded="false">' +
      globeSvg +
      '<span class="lang-current">' + currentLang.toUpperCase() + '</span>' +
      chevronSvg +
    '</button>' +
    '<div class="lang-dropdown">' + items + '</div>';

  // Insert into the nav bar
  var toolsBar = document.querySelector('nav.tools-bar');
  var blogNav = document.querySelector('nav.blog-nav');
  if (toolsBar) {
    toolsBar.appendChild(wrapper);
  } else if (blogNav) {
    blogNav.appendChild(wrapper);
  }

  // Toggle dropdown
  var toggle = wrapper.querySelector('.lang-toggle');
  var dropdown = wrapper.querySelector('.lang-dropdown');
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = wrapper.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close on outside click
  document.addEventListener('click', function () {
    wrapper.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
  dropdown.addEventListener('click', function (e) { e.stopPropagation(); });

  // Note: Language preference is only saved when the user clicks "Switch"
  // on the suggestion banner (intentional preference). Dropdown navigation
  // is for exploration and does not set a persistent preference.
})();

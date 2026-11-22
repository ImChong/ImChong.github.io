/* 🛡️ Sentinel: Mitigate Clickjacking */
/* Since frame-ancestors CSP directive is ignored in <meta> tags, use frame-busting JS */
try {
  if (window.self !== window.top) {
    document.documentElement.style.display = 'none';
    window.top.location = window.self.location;
  }
} catch {
  document.documentElement.style.display = 'none';
}

/* Apply saved theme and language before first paint to avoid flashes and CLS. */
(function () {
  const root = document.documentElement;

  // Theme initialization: an explicit choice wins, otherwise follow the OS.
  const themeKey = 'cl-theme';
  const savedTheme = localStorage.getItem(themeKey);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  root.setAttribute('data-theme', theme || (prefersLight ? 'light' : 'dark'));

  // Language initialization
  const langKey = 'cl-lang';
  const savedLang = localStorage.getItem(langKey);
  const langMode = savedLang === 'zh' ? 'zh' : 'en';
  root.setAttribute('data-lang-mode', langMode);
  root.setAttribute('lang', langMode === 'zh' ? 'zh-CN' : 'en');
})();

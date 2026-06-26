/* 🛡️ Sentinel: Mitigate Clickjacking */
/* Since frame-ancestors CSP directive is ignored in <meta> tags, use frame-busting JS */
if (window.self !== window.top) {
  window.top.location = window.self.location;
  // Prevent rendering if top.location is blocked (e.g., via sandbox="allow-scripts")
  document.documentElement.style.display = 'none';
}

/* Apply saved theme and language before first paint to avoid flashes and CLS. */
(function () {
  const root = document.documentElement;

  // Theme initialization
  const themeKey = 'cl-theme';
  const savedTheme = localStorage.getItem(themeKey);
  root.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');

  // Language initialization
  const langKey = 'cl-lang';
  const savedLang = localStorage.getItem(langKey);
  const langMode = savedLang === 'zh' ? 'zh' : 'en';
  root.setAttribute('data-lang-mode', langMode);
  root.setAttribute('lang', langMode === 'zh' ? 'zh-CN' : 'en');
})();

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

/* Apply saved theme (dark default) and language before first paint to avoid flashes and CLS. */
(function () {
  const root = document.documentElement;

  const themeKey = 'cl-theme';
  const savedTheme = localStorage.getItem(themeKey);
  const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
  root.setAttribute('data-theme', theme);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', theme === 'light' ? '#f5f4f0' : '#0a0b0d');
  }

  const langKey = 'cl-lang';
  const savedLang = localStorage.getItem(langKey);
  const langMode = savedLang === 'zh' ? 'zh' : 'en';
  root.setAttribute('data-lang-mode', langMode);
  root.setAttribute('lang', langMode === 'zh' ? 'zh-CN' : 'en');

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (root.getAttribute('data-type') === 'software' && !reduceMotion) {
    root.classList.add('m-enter');
    window.setTimeout(() => {
      root.classList.add('m-enter-done');
    }, 700);
  }
})();

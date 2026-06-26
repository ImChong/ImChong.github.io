/* 🛡️ Sentinel: Mitigate Clickjacking */
/* Since frame-ancestors CSP directive is ignored in <meta> tags, use frame-busting JS */
if (window.self !== window.top) {
  window.top.location = window.self.location;
  // Prevent rendering if top.location is blocked (e.g., via sandbox="allow-scripts")
  document.documentElement.style.display = 'none';
}

/* Apply saved theme before first paint to avoid a light flash. */
(function () {
  const KEY = 'cl-theme';
  const saved = localStorage.getItem(KEY);
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
})();

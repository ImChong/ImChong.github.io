/* Apply saved theme before first paint to avoid a light flash. */
(function () {
  const KEY = 'cl-theme';
  const saved = localStorage.getItem(KEY);
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
})();

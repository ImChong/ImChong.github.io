/* ─── Theme (Dark / Light) ──────────────────────────────── */
const THEME_KEY = 'cl-theme';
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Init theme
(function () {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
})();

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') { e.preventDefault(); toggleTheme(); }
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
});

/* ─── Language Toggle ──────────────────────────────────── */
const LANG_KEY = 'cl-lang';
const LANG_MODES = ['en', 'zh', 'both'];
const langBtn = document.getElementById('langToggle');
const langLabel = langBtn ? langBtn.querySelector('.lang-label') : null;

function applyLangMode(mode) {
  root.setAttribute('data-lang-mode', mode);
  localStorage.setItem(LANG_KEY, mode);
  if (langLabel) {
    langLabel.textContent = mode === 'en' ? 'EN' : mode === 'zh' ? '中' : '中·EN';
  }
}

function cycleLang() {
  const cur = root.getAttribute('data-lang-mode') || 'both';
  const idx = LANG_MODES.indexOf(cur);
  applyLangMode(LANG_MODES[(idx + 1) % LANG_MODES.length]);
}

// Init
(function () {
  const saved = localStorage.getItem(LANG_KEY);
  applyLangMode(saved && LANG_MODES.includes(saved) ? saved : 'both');
})();

if (langBtn) langBtn.addEventListener('click', cycleLang);

/* ─── Active Nav Highlight on Scroll ───────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.main-nav a');

function updateActiveNav() {
  const scrollY = window.scrollY + 80;
  let active = null;
  sections.forEach((sec) => { if (sec.offsetTop <= scrollY) active = sec.id; });
  navLinks.forEach((link) => {
    const href = link.getAttribute('href').slice(1);
    link.classList.toggle('active', href === active);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ─── Smooth Scroll ────────────────────────────────────── */
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

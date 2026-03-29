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

var themeBtn = document.getElementById('themeToggle');
if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') { e.preventDefault(); toggleTheme(); }
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
  if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
});

/* ─── Language Toggle ──────────────────────────────────── */
var LANG_MODES = ['en', 'zh', 'both'];
var langBtn = document.getElementById('langToggle');
var langLabel = langBtn ? langBtn.querySelector('.lang-label') : null;

function applyLangMode(mode) {
  root.setAttribute('data-lang-mode', mode);
  localStorage.setItem('cl-lang', mode);
  if (langLabel) {
    langLabel.textContent = mode === 'en' ? 'EN' : mode === 'zh' ? '中' : '中·EN';
  }
}

function cycleLang() {
  var cur = root.getAttribute('data-lang-mode') || 'both';
  var idx = LANG_MODES.indexOf(cur);
  applyLangMode(LANG_MODES[(idx + 1) % LANG_MODES.length]);
}

(function () {
  var saved = localStorage.getItem('cl-lang');
  applyLangMode(saved && LANG_MODES.indexOf(saved) !== -1 ? saved : 'both');
})();

if (langBtn) langBtn.addEventListener('click', cycleLang);

/* ─── Active Nav Highlight on Scroll ───────────────────── */
var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.main-nav a');

function updateActiveNav() {
  var scrollY = window.scrollY + 80;
  var active = null;
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].offsetTop <= scrollY) active = sections[i].id;
  }
  for (var j = 0; j < navLinks.length; j++) {
    var href = navLinks[j].getAttribute('href').slice(1);
    if (href === active) navLinks[j].classList.add('active');
    else navLinks[j].classList.remove('active');
  }
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ─── Smooth Scroll ────────────────────────────────────── */
for (var k = 0; k < navLinks.length; k++) {
  navLinks[k].addEventListener('click', function (e) {
    var targetId = this.getAttribute('href').slice(1);
    var target = document.getElementById(targetId);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
}

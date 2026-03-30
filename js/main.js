/* ─── Theme (Dark / Light) ──────────────────────────────── */
var THEME_KEY = 'cl-theme';
var root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  var current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

(function () {
  var saved = localStorage.getItem(THEME_KEY);
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
var langBtn = document.getElementById('langToggle');
var langLabel = langBtn ? langBtn.querySelector('.lang-label') : null;

function applyLangMode(mode) {
  root.setAttribute('data-lang-mode', mode);
  localStorage.setItem('cl-lang', mode);
  if (langLabel) {
    langLabel.textContent = mode === 'zh' ? 'English' : '中文';
  }
  updateActiveNav();
}

function toggleLang() {
  var cur = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(cur === 'en' ? 'zh' : 'en');
}

(function () {
  var saved = localStorage.getItem('cl-lang');
  var initial = (saved === 'zh') ? 'zh' : 'en';
  applyLangMode(initial);
})();

if (langBtn) langBtn.addEventListener('click', toggleLang);

/* ─── Active Nav Highlight on Scroll ───────────────────── */
function getActiveSections() {
  var mode = root.getAttribute('data-lang-mode') || 'en';
  var container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  return container ? container.querySelectorAll('section[id]') : [];
}

function getActiveNavLinks() {
  return document.querySelectorAll('.main-nav a');
}

function updateActiveNav() {
  var sections = getActiveSections();
  var navLinks = getActiveNavLinks();
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
function bindNavClicks() {
  var navLinks = getActiveNavLinks();
  for (var k = 0; k < navLinks.length; k++) {
    navLinks[k].addEventListener('click', function (e) {
      var targetId = this.getAttribute('href').slice(1);
      var sections = getActiveSections();
      var target = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].id === targetId) { target = sections[i]; break; }
      }
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  }
}
bindNavClicks();

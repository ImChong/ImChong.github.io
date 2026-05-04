/* ─── Reusable Footer ───────────────────────────────────── */
function renderSiteFooters() {
  var footers = document.querySelectorAll('.site-footer[data-footer-lang]');
  footers.forEach((footer) => {
    var lang = footer.getAttribute('data-footer-lang');
    var copy = lang === 'zh' ? '© 刘冲 2026' : '&copy; Chong Liu 2026';
    footer.innerHTML = [
      '<div class="container footer-inner">',
      '  <p class="footer-copy">' + copy + '</p>',
      '</div>',
    ].join('');
  });
}

renderSiteFooters();

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
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    toggleTheme();
  }
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
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
  var navLinks = document.querySelectorAll('.main-nav a');
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].textContent =
      mode === 'zh' ? navLinks[i].getAttribute('data-zh') : navLinks[i].getAttribute('data-en');
  }
  cachedSections = null;
  cachedNavLinks = null;
  updateActiveNav();
}

function toggleLang() {
  var cur = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(cur === 'en' ? 'zh' : 'en');
}

(function () {
  var saved = localStorage.getItem('cl-lang');
  var initial = saved === 'zh' ? 'zh' : 'en';
  applyLangMode(initial);
})();

if (langBtn) langBtn.addEventListener('click', toggleLang);

/* ─── Active Nav Highlight on Scroll ───────────────────── */
// ⚡ Bolt Optimization: Cache DOM queries and throttle scroll event with requestAnimationFrame
var cachedSections = null;
var cachedNavLinks = null;

function getActiveSections() {
  if (cachedSections) return cachedSections;
  var mode = root.getAttribute('data-lang-mode') || 'en';
  var container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  cachedSections = container ? container.querySelectorAll('section[id]') : [];
  return cachedSections;
}

function getActiveNavLinks() {
  if (cachedNavLinks) return cachedNavLinks;
  cachedNavLinks = document.querySelectorAll('.main-nav a');
  return cachedNavLinks;
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

var ticking = false;
window.addEventListener(
  'scroll',
  function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);
updateActiveNav();

/* ─── Smooth Scroll ────────────────────────────────────── */
function bindNavClicks() {
  var navLinks = getActiveNavLinks();
  for (var k = 0; k < navLinks.length; k++) {
    navLinks[k].addEventListener('click', (e) => {
      var targetId = e.currentTarget.getAttribute('href').slice(1);
      var sections = getActiveSections();
      var target = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].id === targetId) {
          target = sections[i];
          break;
        }
      }
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}
bindNavClicks();

/* ─── Publications Toggle ───────────────────────────────── */
function setupPubToggle(btnId, lang) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  var others = document.querySelectorAll(
    lang === 'zh'
      ? '#lang-zh .publication-card[data-related="other"]'
      : '#lang-en .publication-card[data-related="other"]'
  );

  btn.addEventListener('click', () => {
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded = !expanded;
    btn.setAttribute('aria-expanded', String(expanded));
    localStorage.setItem('cl-pubs-expanded', String(expanded));

    others.forEach((card) => {
      if (expanded) {
        card.classList.remove('collapsed');
      } else {
        card.classList.add('collapsed');
      }
    });

    if (lang === 'zh') {
      btn.textContent = expanded ? '收起非机器人相关论文 ▴' : '展开 7 篇非机器人相关论文 ▾';
    } else {
      btn.textContent = expanded
        ? 'Hide non-robotics publications ▴'
        : 'Show 7 non-robotics publications ▾';
    }
  });
}

setupPubToggle('pubToggleBtn', 'en');
setupPubToggle('pubToggleBtnZh', 'zh');

/* Also show non-robotics cards on load if already expanded via localStorage */
(function () {
  var savedExpanded = localStorage.getItem('cl-pubs-expanded');
  if (savedExpanded === 'true') {
    var enBtn = document.getElementById('pubToggleBtn');
    var zhBtn = document.getElementById('pubToggleBtnZh');
    var enOthers = document.querySelectorAll(
      '#non-robotics-pubs .publication-card[data-related="other"]'
    );
    var zhOthers = document.querySelectorAll(
      '#non-robotics-pubs-zh .publication-card[data-related="other"]'
    );
    if (enBtn) {
      enBtn.setAttribute('aria-expanded', 'true');
      enBtn.textContent = 'Hide non-robotics publications ▴';
    }
    if (zhBtn) {
      zhBtn.setAttribute('aria-expanded', 'true');
      zhBtn.textContent = '收起非机器人相关论文 ▴';
    }
    enOthers.forEach((c) => {
      c.classList.remove('collapsed');
    });
    zhOthers.forEach((c) => {
      c.classList.remove('collapsed');
    });
  }
})();

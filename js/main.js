/* ─── Constants ─────────────────────────────────────────── */
const THEME_KEY = 'cl-theme';
const LANG_KEY = 'cl-lang';
const PUBS_EXPANDED_KEY = 'cl-pubs-expanded';
const root = document.documentElement;

/* ─── Reusable Footer ───────────────────────────────────── */
function renderSiteFooters() {
  const footers = document.querySelectorAll('.site-footer[data-footer-lang]');
  footers.forEach((footer) => {
    const lang = footer.getAttribute('data-footer-lang');
    const copy = lang === 'zh' ? '© 刘冲 2026' : '© Chong Liu 2026';
    // Securely create DOM elements instead of using innerHTML
    footer.textContent = ''; // Clear existing content safely
    const container = document.createElement('div');
    container.className = 'container footer-inner';
    const p = document.createElement('p');
    p.className = 'footer-copy';
    p.textContent = copy; // Use textContent instead of innerHTML
    container.appendChild(p);
    footer.appendChild(container);
  });
}

renderSiteFooters();

/* ─── Theme (Dark / Light) ──────────────────────────────── */
function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
})();

const themeBtn = document.getElementById('themeToggle');
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
const langBtn = document.getElementById('langToggle');
const langLabel = langBtn ? langBtn.querySelector('.lang-label') : null;

// Cached collection of nav links. Invalidated whenever the language mode
// flips, since the visible/hidden state of the two language containers
// changes which link set IntersectionObserver should watch.
let cachedNavLinks = null;

// Declared up-front so that applyLangMode() — which is invoked by the
// initLang IIFE below — can safely reach setupNavObserver() without
// tripping the temporal dead zone on these `let` bindings.
let navObserver = null;

function applyLangMode(mode) {
  root.setAttribute('data-lang-mode', mode);
  // Keep <html lang> in sync so screen readers, browser translation, and
  // search engines see the correct language for the visible content.
  root.setAttribute('lang', mode === 'zh' ? 'zh-CN' : 'en');
  localStorage.setItem(LANG_KEY, mode);

  // Use the `hidden` attribute (in addition to the existing CSS rule) on
  // the inactive language container so its content is skipped by AT and
  // not surfaced in plain-text scrapers.
  const enContainer = document.getElementById('lang-en');
  const zhContainer = document.getElementById('lang-zh');
  if (enContainer) enContainer.hidden = mode === 'zh';
  if (zhContainer) zhContainer.hidden = mode !== 'zh';

  if (langLabel) {
    langLabel.textContent = mode === 'zh' ? 'English' : '中文';
  }
  if (langBtn) {
    langBtn.setAttribute('aria-label', mode === 'zh' ? 'Switch to English' : 'Switch to Chinese');
  }

  const navLinks = document.querySelectorAll('.main-nav a');
  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].textContent =
      mode === 'zh' ? navLinks[i].getAttribute('data-zh') : navLinks[i].getAttribute('data-en');
  }
  cachedNavLinks = null;
  setupNavObserver();
}

function toggleLang() {
  const cur = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(cur === 'en' ? 'zh' : 'en');
}

(function initLang() {
  const saved = localStorage.getItem(LANG_KEY);
  const initial = saved === 'zh' ? 'zh' : 'en';
  applyLangMode(initial);
})();

if (langBtn) langBtn.addEventListener('click', toggleLang);

/* ─── Active Nav Highlight with IntersectionObserver ────── */
// Replaced throttled scroll listener + offsetTop with IntersectionObserver
// to eliminate main-thread layout thrashing.
// (navObserver is declared near the top of the file so applyLangMode can
// reach setupNavObserver() during the initial language bootstrap without
// hitting a temporal-dead-zone ReferenceError.)

function getActiveNavLinks() {
  if (cachedNavLinks) return cachedNavLinks;
  cachedNavLinks = document.querySelectorAll('.main-nav a');
  return cachedNavLinks;
}

function setupNavObserver() {
  if (navObserver) navObserver.disconnect();
  const mode = root.getAttribute('data-lang-mode') || 'en';
  const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  if (!container) return;

  const sections = container.querySelectorAll('section[id]');
  const navLinks = getActiveNavLinks();

  navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          for (let j = 0; j < navLinks.length; j++) {
            const href = navLinks[j].getAttribute('href').slice(1);
            if (href === activeId) navLinks[j].classList.add('active');
            else navLinks[j].classList.remove('active');
          }
        }
      });
    },
    { rootMargin: '-80px 0px -40% 0px' }
  );

  for (let i = 0; i < sections.length; i++) {
    navObserver.observe(sections[i]);
  }
}

/* ─── Smooth Scroll ────────────────────────────────────── */
function bindNavClicks() {
  const navLinks = getActiveNavLinks();
  for (let k = 0; k < navLinks.length; k++) {
    navLinks[k].addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('href').slice(1);
      const mode = root.getAttribute('data-lang-mode') || 'en';
      const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
      const target = container ? container.querySelector('#' + CSS.escape(targetId)) : null;

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
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const others = document.querySelectorAll(
    lang === 'zh'
      ? '#lang-zh .publication-card[data-related="other"]'
      : '#lang-en .publication-card[data-related="other"]'
  );

  btn.addEventListener('click', () => {
    let expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded = !expanded;
    btn.setAttribute('aria-expanded', String(expanded));
    localStorage.setItem(PUBS_EXPANDED_KEY, String(expanded));

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
(function initPubsState() {
  const savedExpanded = localStorage.getItem(PUBS_EXPANDED_KEY);
  if (savedExpanded === 'true') {
    const enBtn = document.getElementById('pubToggleBtn');
    const zhBtn = document.getElementById('pubToggleBtnZh');
    const enOthers = document.querySelectorAll(
      '#non-robotics-pubs .publication-card[data-related="other"]'
    );
    const zhOthers = document.querySelectorAll(
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
    enOthers.forEach((c) => c.classList.remove('collapsed'));
    zhOthers.forEach((c) => c.classList.remove('collapsed'));
  }
})();

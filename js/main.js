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
  } else {
    applyTheme('dark');
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

/* ─── Language Toggle ──────────────────────────────────── */
const langBtn = document.getElementById('langToggle');
const langLabel = langBtn ? langBtn.querySelector('.lang-label') : null;

// Declared up-front so that applyLangMode() — which is invoked by the
// initLang IIFE below — can safely reach setupNavObserver() without
// tripping the temporal dead zone on these `let` bindings.
let navObserver = null;
let subpageTocCleanup = null;
let subpageMobileCleanup = null;

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
  navLinks.forEach((link) => {
    link.textContent = mode === 'zh' ? link.getAttribute('data-zh') : link.getAttribute('data-en');
  });
  setupNavObserver();
  setupSubpageTocMobileDrawer();
  setupSubpageTocObserver();
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

function setupNavObserver() {
  if (navObserver) navObserver.disconnect();
  const mode = root.getAttribute('data-lang-mode') || 'en';
  const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  if (!container) return;

  const sections = container.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a');

  navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href').slice(1);
            if (href === activeId) link.classList.add('active');
            else link.classList.remove('active');
          });
        }
      });
    },
    { rootMargin: '-80px 0px -40% 0px' }
  );

  sections.forEach((section) => {
    navObserver.observe(section);
  });
}

/* ─── Subpage TOC active section (scrollspy) ───────────── */
function setupSubpageTocObserver() {
  if (subpageTocCleanup) {
    subpageTocCleanup();
    subpageTocCleanup = null;
  }

  const mode = root.getAttribute('data-lang-mode') || 'en';
  const langBlock = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  if (!langBlock) return;

  const layout = langBlock.querySelector('.container.subpage-detail-layout');
  if (!layout) return;

  const tocNav = layout.querySelector('.page-toc nav');
  if (!tocNav) return;

  const linkEls = [...tocNav.querySelectorAll('a[href^="#"]')];
  if (!linkEls.length) return;

  const sections = [];
  linkEls.forEach((linkEl) => {
    const rawId = linkEl.getAttribute('href').slice(1);
    const target = langBlock.querySelector('#' + CSS.escape(rawId));
    if (target) sections.push({ id: rawId, el: target, link: linkEl });
  });
  if (!sections.length) return;

  // ⚡ Bolt Performance Optimization: Replace scroll listener and getBoundingClientRect
  // with IntersectionObserver to eliminate main-thread layout thrashing.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          sections.forEach((section) => {
            const on = section.id === activeId;
            section.link.classList.toggle('active', on);
            if (on) section.link.setAttribute('aria-current', 'location');
            else section.link.removeAttribute('aria-current');
          });
        }
      });
    },
    { rootMargin: '-10% 0px -40% 0px' }
  );

  sections.forEach((section) => {
    observer.observe(section.el);
  });

  subpageTocCleanup = () => {
    observer.disconnect();
  };
}

/* ─── Subpage TOC mobile drawer (floating button + off-canvas panel) ─ */
function setupSubpageTocMobileDrawer() {
  if (subpageMobileCleanup) {
    subpageMobileCleanup();
    subpageMobileCleanup = null;
  }

  const mode = root.getAttribute('data-lang-mode') || 'en';
  const langBlock = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  if (!langBlock) return;

  const layout = langBlock.querySelector('.container.subpage-detail-layout');
  const pageToc = layout?.querySelector('.page-toc');
  const tocNav = pageToc?.querySelector('nav');
  const tocLinks = tocNav ? [...tocNav.querySelectorAll('a[href^="#"]')] : [];
  if (!pageToc || tocLinks.length === 0) return;

  pageToc.id = mode === 'zh' ? 'subpage-page-toc-zh' : 'subpage-page-toc-en';

  const mq = window.matchMedia('(max-width: 1199px)');

  const overlay = document.createElement('div');
  overlay.className = 'subpage-toc-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'subpage-toc-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', pageToc.id);
  toggle.setAttribute(
    'aria-label',
    mode === 'zh' ? '打开或关闭本页目录' : 'Open or close table of contents'
  );

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
  svg.appendChild(path);
  toggle.appendChild(svg);

  document.body.appendChild(overlay);
  document.body.appendChild(toggle);

  const close = () => {
    pageToc.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const open = () => {
    pageToc.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const syncMq = () => {
    if (!mq.matches) {
      close();
      toggle.hidden = true;
    } else {
      toggle.hidden = false;
    }
  };

  const ac = new AbortController();
  const { signal } = ac;

  toggle.addEventListener(
    'click',
    (e) => {
      e.stopPropagation();
      if (pageToc.classList.contains('is-open')) close();
      else open();
    },
    { signal }
  );

  overlay.addEventListener('click', close, { signal });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && pageToc.classList.contains('is-open')) close();
    },
    { signal }
  );

  // ⚡ Bolt Performance Optimization: Use event delegation instead of attaching individual
  // click listeners to every table of contents link. This reduces memory footprint and
  // speeds up initialization.
  tocNav.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && mq.matches) close();
    },
    { signal }
  );

  mq.addEventListener('change', syncMq, { signal });
  syncMq();

  subpageMobileCleanup = () => {
    ac.abort();
    close();
    pageToc.classList.remove('is-open');
    toggle.remove();
    overlay.remove();
    document.body.style.overflow = '';
  };
}

/* ─── Smooth Scroll ────────────────────────────────────── */
function scrollToSection(targetId) {
  const mode = root.getAttribute('data-lang-mode') || 'en';
  const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  const target = container ? container.querySelector('#' + CSS.escape(targetId)) : null;

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  return false;
}

function bindNavClicks() {
  // ⚡ Bolt Performance Optimization: Use event delegation instead of attaching individual
  // click listeners to every main navigation link. This reduces memory footprint and
  // speeds up initialization.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.main-nav a');
    if (link) {
      const targetId = link.getAttribute('href').slice(1);
      if (scrollToSection(targetId)) e.preventDefault();
      return;
    }

    const siteTitle = e.target.closest('a.site-title[href="#hero"]');
    if (siteTitle) {
      e.preventDefault();
      if (!scrollToSection('hero')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });
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

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
  // ⚡ Bolt Performance Optimization: Prevent redundant DOM attribute and synchronous localStorage writes.
  if (root.getAttribute('data-theme') === theme) return;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ⚡ Bolt Performance Optimization: Removed initTheme IIFE to eliminate redundant synchronous localStorage I/O on page load. theme-init.js handles default theme assignment.
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
let homeSectionNavCleanup = null;

function applyLangMode(mode, isInit = false) {
  // ⚡ Bolt Performance Optimization: Prevent redundant DOM attribute and synchronous localStorage writes.
  if (!isInit && root.getAttribute('data-lang-mode') === mode) return;

  if (!isInit) {
    root.setAttribute('data-lang-mode', mode);
    // Keep <html lang> in sync so screen readers, browser translation, and
    // search engines see the correct language for the visible content.
    root.setAttribute('lang', mode === 'zh' ? 'zh-CN' : 'en');
    localStorage.setItem(LANG_KEY, mode);
  }

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
  setupHomeSectionNav();
  setupNavObserver();
  setupSubpageTocMobileDrawer();
  setupSubpageTocObserver();
}

function toggleLang() {
  const cur = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(cur === 'en' ? 'zh' : 'en');
}

(function initLang() {
  // ⚡ Bolt Performance Optimization: theme-init.js already applies the language state before initial paint.
  // Read the initial language state from DOM attribute to avoid redundant localStorage.getItem calls,
  // and pass `isInit = true` to skip redundant DOM mutations and localStorage.setItem writes.
  const mode = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(mode, true);
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
  // The mobile jump menu mirrors the header nav, so a section may own several links.
  const navLinks = document.querySelectorAll('.main-nav a, .home-nav-menu a');

  // ⚡ Bolt Performance Optimization: Skip IntersectionObserver instantiation on pages without main nav
  if (navLinks.length === 0) return;

  const linkMap = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const group = linkMap.get(id);
    if (group) group.push(link);
    else linkMap.set(id, [link]);
  });

  const markActive = (id, isActive) => {
    const group = linkMap.get(id);
    if (!group) return;
    group.forEach((link) => {
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  let activeNavId = null;

  navObserver = new IntersectionObserver(
    (entries) => {
      let isChanged = false;
      let newActiveId = activeNavId;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          newActiveId = entry.target.id;
          isChanged = true;
        }
      });

      if (isChanged && newActiveId !== activeNavId) {
        if (activeNavId) markActive(activeNavId, false);
        if (newActiveId) markActive(newActiveId, true);
        activeNavId = newActiveId;
      }
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
  // We use an O(1) Hash Map tracking pattern to prevent layout thrashing and redundant O(N) DOM update loops.
  const sectionMap = new Map();
  sections.forEach((s) => sectionMap.set(s.id, s.link));
  let currentActiveId = null;

  const observer = new IntersectionObserver(
    (entries) => {
      let isChanged = false;
      let newActiveId = currentActiveId;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          newActiveId = entry.target.id;
          isChanged = true;
        }
      });

      if (isChanged && newActiveId !== currentActiveId) {
        if (currentActiveId && sectionMap.has(currentActiveId)) {
          const prevLink = sectionMap.get(currentActiveId);
          prevLink.classList.remove('active');
          prevLink.removeAttribute('aria-current');
        }
        if (newActiveId && sectionMap.has(newActiveId)) {
          const newLink = sectionMap.get(newActiveId);
          newLink.classList.add('active');
          newLink.setAttribute('aria-current', 'location');
        }
        currentActiveId = newActiveId;
      }
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

/* ─── Keep floating buttons clear of the footer ─────────── */
// The TOC drawer button and the homepage section-jump FAB are position:fixed,
// so at the end of a page they used to sit on top of .site-footer. Measure how
// far the button reaches into the footer and hand that back to CSS as
// --fab-footer-lift, which is added to the button's `bottom` — keeping the
// safe-area inset inside the original calc().
function keepClearOfFooter(el, footer, measured = el) {
  if (!footer) return () => {};

  // Declared inside the function: this runs during the initial language
  // bootstrap, before module-level `const`s further down the file are
  // initialised (see the temporal-dead-zone note near navObserver).
  const FOOTER_CLEARANCE = 12;
  let lift = 0;
  let ticking = false;

  const apply = () => {
    const rect = measured.getBoundingClientRect();
    // Hidden on this breakpoint (or not laid out yet): nothing to lift.
    if (rect.height === 0) return;
    // rect already includes the current lift, so the delta is self-correcting:
    // positive means the button overlaps the footer, negative gives slack back
    // as the footer scrolls out of view.
    const next = Math.max(
      0,
      lift + rect.bottom + FOOTER_CLEARANCE - footer.getBoundingClientRect().top
    );
    if (Math.abs(next - lift) < 0.5) return;
    lift = next;
    el.style.setProperty('--fab-footer-lift', lift + 'px');
  };

  // ⚡ Bolt Performance Optimization: Throttle scroll/resize work with
  // requestAnimationFrame so the measurement runs at most once per frame.
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      apply();
    });
  };

  const ac = new AbortController();
  window.addEventListener('scroll', schedule, { passive: true, signal: ac.signal });
  window.addEventListener('resize', schedule, { signal: ac.signal });

  // The footer grows/shrinks with the viewport width; re-measure when it does.
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(footer);
  apply();

  return () => {
    ac.abort();
    resizeObserver.disconnect();
    el.style.removeProperty('--fab-footer-lift');
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

  const mq = window.matchMedia('(max-width: 1200px)');
  const TOC_LEFT_OUTSET = 300; // matches .page-toc width (260px) + margin gap (40px)
  const CONTAINER_PAD = 24;

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

  const isTocClipped = () => {
    const layoutRect = layout.getBoundingClientRect();
    return layoutRect.left + CONTAINER_PAD - TOC_LEFT_OUTSET < 0;
  };

  const shouldUseDrawer = () => mq.matches || isTocClipped();

  const syncDrawer = () => {
    const useDrawer = shouldUseDrawer();
    document.body.classList.toggle('subpage-toc-drawer-mode', useDrawer && !mq.matches);
    if (!useDrawer) {
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
      if (link && shouldUseDrawer()) close();
    },
    { signal }
  );

  mq.addEventListener('change', syncDrawer, { signal });

  // ⚡ Bolt Performance Optimization: Throttle frequent 'resize' events with requestAnimationFrame
  // to prevent DOM update thrashing and reduce main-thread blocking when window is resized.
  let resizeTicking = false;
  window.addEventListener(
    'resize',
    () => {
      if (!resizeTicking) {
        window.requestAnimationFrame(() => {
          syncDrawer();
          resizeTicking = false;
        });
        resizeTicking = true;
      }
    },
    { signal }
  );

  const resizeObserver = new ResizeObserver(syncDrawer);
  resizeObserver.observe(layout);
  syncDrawer();

  const releaseFooterClearance = keepClearOfFooter(toggle, langBlock.querySelector('.site-footer'));

  subpageMobileCleanup = () => {
    ac.abort();
    resizeObserver.disconnect();
    releaseFooterClearance();
    close();
    pageToc.classList.remove('is-open');
    document.body.classList.remove('subpage-toc-drawer-mode');
    toggle.remove();
    overlay.remove();
    document.body.style.overflow = '';
  };
}

/* ─── Home section jump FAB (mobile) ───────────────────── */
// The header nav collapses below 720px, so the homepage gets a floating
// button that opens a compact jump menu mirroring that nav (plus "Top").
// Built from the DOM so labels, order and targets stay in one place.
function homeSectionIcon(section) {
  const title = section.querySelector('.section-title');
  const first = title ? title.textContent.trim().split(/\s+/)[0] : '';
  // Section titles lead with an emoji ("🛠️ Projects"); skip a plain-text word.
  return first && !/[a-z0-9\u4e00-\u9fa5]/i.test(first) ? first : '';
}

function homeSectionFabIcon(kind) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'home-nav-fab__icon home-nav-fab__icon--' + kind);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('d', kind === 'close' ? 'M7 7l10 10M17 7L7 17' : 'M5 7h14M5 12h14M5 17h9');
  svg.appendChild(path);
  return svg;
}

function setupHomeSectionNav() {
  if (homeSectionNavCleanup) {
    homeSectionNavCleanup();
    homeSectionNavCleanup = null;
  }

  const mode = root.getAttribute('data-lang-mode') || 'en';
  const isZh = mode === 'zh';
  const langBlock = document.getElementById(isZh ? 'lang-zh' : 'lang-en');
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  // Subpages carry no .main-nav, so this is a no-op outside the homepage.
  if (!langBlock || navLinks.length === 0) return;

  const items = [];
  if (langBlock.querySelector('#hero')) {
    items.push({ id: 'hero', icon: '⬆️', label: isZh ? '顶部' : 'Top' });
  }
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = id ? langBlock.querySelector('#' + CSS.escape(id)) : null;
    if (!section) return;
    const label = (isZh ? link.getAttribute('data-zh') : link.getAttribute('data-en')) || '';
    items.push({ id, icon: homeSectionIcon(section), label: label || link.textContent.trim() });
  });
  if (items.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'home-nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const fab = document.createElement('div');
  fab.className = 'home-nav-fab';

  // Button first in DOM order so Tab moves from it into the menu it opens;
  // CSS (column-reverse) still paints the menu above the button.
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'home-nav-fab__toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'home-nav-menu');
  toggle.setAttribute(
    'aria-label',
    isZh ? '打开或关闭章节导航' : 'Open or close section navigation'
  );
  toggle.appendChild(homeSectionFabIcon('open'));
  toggle.appendChild(homeSectionFabIcon('close'));

  const menu = document.createElement('nav');
  menu.id = 'home-nav-menu';
  menu.className = 'home-nav-menu';
  menu.setAttribute('aria-label', isZh ? '章节导航' : 'Section navigation');

  const list = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + item.id;
    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'home-nav-menu__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.icon;
      link.appendChild(icon);
    }
    const label = document.createElement('span');
    label.className = 'home-nav-menu__label';
    label.textContent = item.label;
    link.appendChild(label);
    li.appendChild(link);
    list.appendChild(li);
  });
  menu.appendChild(list);

  fab.appendChild(toggle);
  fab.appendChild(menu);
  document.body.appendChild(overlay);
  document.body.appendChild(fab);

  const close = () => {
    if (!fab.classList.contains('is-open')) return;
    fab.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (menu.contains(document.activeElement)) toggle.focus();
  };

  const open = () => {
    fab.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const ac = new AbortController();
  const { signal } = ac;

  toggle.addEventListener(
    'click',
    (e) => {
      e.stopPropagation();
      if (fab.classList.contains('is-open')) close();
      else open();
    },
    { signal }
  );

  overlay.addEventListener('click', close, { signal });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') close();
    },
    { signal }
  );

  // The links themselves scroll via the delegated .main-nav handler; this
  // only dismisses the menu that launched them.
  menu.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('a[href^="#"]')) close();
    },
    { signal }
  );

  const releaseFooterClearance = keepClearOfFooter(
    fab,
    langBlock.querySelector('.site-footer'),
    toggle
  );

  // The FAB is hidden above 720px — never leave the page scroll-locked there.
  const mq = window.matchMedia('(max-width: 720px)');
  mq.addEventListener(
    'change',
    () => {
      if (!mq.matches) close();
    },
    { signal }
  );

  homeSectionNavCleanup = () => {
    ac.abort();
    releaseFooterClearance();
    close();
    fab.remove();
    overlay.remove();
    document.body.style.overflow = '';
  };
}

/* ─── Smooth Scroll ────────────────────────────────────── */
// `content-visibility: auto` keeps off-screen sections at their placeholder
// height, so a long jump used to land short: the sections scrolled past grew
// to full size mid-flight and pushed the target down. Re-aiming during the
// animation fixed the landing but stalled and restarted the scroll mid-way,
// which reads as a stutter. Instead, force every section to lay out *before*
// the jump so the target's position is final, then run one uninterrupted
// smooth scroll. `contain-intrinsic-size: auto` makes each section remember
// that measured height, so the override costs a single layout pass.
const JUMP_CLASS = 'is-section-jump';
const SCROLL_SETTLE_TIMEOUT = 2500;
const SCROLL_IDLE_FRAMES = 3;
// The browser can take a frame or two to start animating; don't mistake that
// for having arrived.
const SCROLL_START_GRACE = 250;

let scrollSettleAbort = null;
let scrollSettleRaf = null;
let scrollSettleTimer = null;

function stopScrollSettle() {
  if (scrollSettleRaf) {
    cancelAnimationFrame(scrollSettleRaf);
    scrollSettleRaf = null;
  }
  if (scrollSettleTimer) {
    clearTimeout(scrollSettleTimer);
    scrollSettleTimer = null;
  }
  if (scrollSettleAbort) {
    scrollSettleAbort.abort();
    scrollSettleAbort = null;
  }
  root.classList.remove(JUMP_CLASS);
}

function scrollToSection(targetId) {
  const mode = root.getAttribute('data-lang-mode') || 'en';
  const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  const target = container ? container.querySelector('#' + CSS.escape(targetId)) : null;
  if (!target) return false;

  stopScrollSettle();

  // Hand control straight back if the reader takes over mid-flight.
  scrollSettleAbort = new AbortController();
  ['wheel', 'touchstart', 'keydown'].forEach((type) => {
    window.addEventListener(type, stopScrollSettle, {
      passive: true,
      signal: scrollSettleAbort.signal,
    });
  });

  const headerOffset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Drop the placeholder heights and read the target once — the read flushes
  // layout for every section, so nothing shifts once the animation starts.
  root.classList.add(JUMP_CLASS);
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const aimAt = () =>
    Math.min(
      maxScroll(),
      Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - headerOffset))
    );
  const top = aimAt();

  window.scrollTo({ top, behavior: reduceMotion ? 'instant' : 'smooth' });

  // Keep the override in place until the scroll stops, then correct at most
  // once (dynamic content such as lazy images can still nudge the target).
  const startedAt = performance.now();
  let idleFrames = 0;
  let lastY = window.scrollY;
  let hasMoved = false;
  let corrected = false;

  const watch = () => {
    scrollSettleRaf = null;
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 1) {
      idleFrames += 1;
    } else {
      idleFrames = 0;
      hasMoved = true;
    }
    lastY = y;

    const settled =
      idleFrames >= SCROLL_IDLE_FRAMES &&
      (hasMoved || performance.now() - startedAt > SCROLL_START_GRACE);
    if (!settled) {
      scrollSettleRaf = requestAnimationFrame(watch);
      return;
    }

    // Compare against the clamped landing spot, so a target the page cannot
    // scroll far enough to reach (#hero at the top, the last section at the
    // bottom) counts as arrived instead of triggering a pointless correction.
    if (!corrected && Math.abs(window.scrollY - aimAt()) > 2) {
      corrected = true;
      idleFrames = 0;
      window.scrollTo({ top: aimAt(), behavior: reduceMotion ? 'instant' : 'smooth' });
      scrollSettleRaf = requestAnimationFrame(watch);
      return;
    }

    stopScrollSettle();
  };

  scrollSettleRaf = requestAnimationFrame(watch);
  scrollSettleTimer = setTimeout(stopScrollSettle, SCROLL_SETTLE_TIMEOUT);
  return true;
}

function bindNavClicks() {
  // ⚡ Bolt Performance Optimization: Use event delegation instead of attaching individual
  // click listeners to every main navigation link. This reduces memory footprint and
  // speeds up initialization.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.main-nav a, .home-nav-menu a');
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
  const enBtn = document.getElementById('pubToggleBtn');
  const zhBtn = document.getElementById('pubToggleBtnZh');

  // ⚡ Bolt Performance Optimization: Only read from localStorage if the target elements exist.
  // This prevents blocking the main thread with synchronous I/O on pages where publications don't exist.
  if (!enBtn && !zhBtn) return;

  const savedExpanded = localStorage.getItem(PUBS_EXPANDED_KEY);
  if (savedExpanded === 'true') {
    const enOthers = document.querySelectorAll('#lang-en .publication-card[data-related="other"]');
    const zhOthers = document.querySelectorAll('#lang-zh .publication-card[data-related="other"]');
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

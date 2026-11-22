/* ─── Constants ─────────────────────────────────────────── */
const THEME_KEY = 'cl-theme';
const LANG_KEY = 'cl-lang';
const PUBS_EXPANDED_KEY = 'cl-pubs-expanded';
const root = document.documentElement;

/* ─── Reusable Footer ───────────────────────────────────── */
function createFooterLink(href, text, isExternal) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  if (isExternal) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
}

function renderSiteFooters() {
  const isHome = root.getAttribute('data-type') === 'software';
  const footers = document.querySelectorAll('.site-footer[data-footer-lang]');

  footers.forEach((footer) => {
    const lang = footer.getAttribute('data-footer-lang');
    const isZh = lang === 'zh';
    footer.textContent = '';

    const container = document.createElement('div');
    container.className = 'footer-inner';

    const copy = document.createElement('p');
    copy.className = 'footer-copy';
    copy.textContent = isZh ? '© 2026 刘冲' : '© 2026 Chong Liu';

    const links = document.createElement('div');
    links.className = 'footer-links';
    links.appendChild(createFooterLink('https://github.com/ImChong', 'GitHub', true));
    links.appendChild(
      createFooterLink(
        'https://scholar.google.com/citations?user=-VDCGIwAAAAJ&hl=en&oi=sra',
        'Google Scholar',
        true
      )
    );
    links.appendChild(
      createFooterLink('mailto:chongliu2021@163.com', isZh ? '邮箱' : 'Email', false)
    );

    if (isHome) {
      const topLink = createFooterLink('#hero', isZh ? '↑ 顶部' : '↑ Top', false);
      topLink.className = 'footer-top';
      links.appendChild(topLink);
    }

    container.appendChild(copy);
    container.appendChild(links);
    footer.appendChild(container);
  });
}

renderSiteFooters();

/* ─── Theme (Dark Default / Swiss Light) ────────────────── */
function applyTheme(theme) {
  if (root.getAttribute('data-theme') === theme) return;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', theme === 'light' ? '#f5f4f0' : '#0a0b0d');
  }
}

function toggleTheme() {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

const themeBtn = document.getElementById('themeToggle');

function toggleThemeWithReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof document.startViewTransition !== 'function' || reduceMotion || !themeBtn) {
    toggleTheme();
    return;
  }

  const rect = themeBtn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  root.classList.add('is-theme-switching');
  const transition = document.startViewTransition(toggleTheme);
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 560,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => {
      // Transition skipped: theme still toggled cleanly.
    });
  transition.finished.finally(() => root.classList.remove('is-theme-switching'));
}

if (themeBtn) themeBtn.addEventListener('click', toggleThemeWithReveal);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    toggleThemeWithReveal();
  }
});

/* ─── Language Toggle ──────────────────────────────────── */
const langBtn = document.getElementById('langToggle');
const langLabel = langBtn ? langBtn.querySelector('.lang-label') : null;

let navObserver = null;
let subpageTocCleanup = null;
let subpageMobileCleanup = null;
let mobileNavCleanup = null;

function applyLangMode(mode, isInit = false) {
  if (!isInit && root.getAttribute('data-lang-mode') === mode) return;

  if (!isInit) {
    root.setAttribute('data-lang-mode', mode);
    root.setAttribute('lang', mode === 'zh' ? 'zh-CN' : 'en');
    localStorage.setItem(LANG_KEY, mode);
  }

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

  const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav-sheet a, .version-toggle');
  navLinks.forEach((link) => {
    const labelEl = link.querySelector('[data-nav-label]') || link;
    const text = mode === 'zh' ? link.getAttribute('data-zh') : link.getAttribute('data-en');
    if (text) labelEl.textContent = text;
  });

  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.href = mode === 'zh' ? '#lang-zh' : '#lang-en';
    skipLink.textContent = skipLink.getAttribute(mode === 'zh' ? 'data-zh' : 'data-en');
  }

  setupMobileNavSheet();
  setupNavObserver();
  setupSubpageTocMobileDrawer();
  setupSubpageTocObserver();

  if (!isInit) {
    window.dispatchEvent(new CustomEvent('cl:langchange', { detail: { mode } }));
  }
}

function toggleLang() {
  const cur = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(cur === 'en' ? 'zh' : 'en');
}

(function initLang() {
  const mode = root.getAttribute('data-lang-mode') || 'en';
  applyLangMode(mode, true);
})();

if (langBtn) langBtn.addEventListener('click', toggleLang);

/* ─── Mobile Full-Screen Navigation Sheet (Homepage) ───── */
function setupMobileNavSheet() {
  if (mobileNavCleanup) {
    mobileNavCleanup();
    mobileNavCleanup = null;
  }

  const toggle = document.getElementById('mobileMenuToggle');
  const sheet = document.getElementById('mobileNavSheet');
  if (!toggle || !sheet) return;

  const isZh = (root.getAttribute('data-lang-mode') || 'en') === 'zh';
  toggle.setAttribute('aria-label', isZh ? '打开或关闭导航菜单' : 'Open or close navigation menu');

  const menuIcon = toggle.querySelector('.icon');

  const close = () => {
    if (!sheet.classList.contains('is-open')) return;
    sheet.classList.remove('is-open');
    sheet.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (menuIcon) menuIcon.className = 'icon icon-list';
    document.body.style.overflow = '';
    if (sheet.contains(document.activeElement)) toggle.focus();
  };

  const open = () => {
    sheet.hidden = false;
    sheet.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    if (menuIcon) menuIcon.className = 'icon icon-x';
    document.body.style.overflow = 'hidden';
  };

  const ac = new AbortController();
  const { signal } = ac;

  toggle.addEventListener(
    'click',
    () => {
      if (sheet.classList.contains('is-open')) close();
      else open();
    },
    { signal }
  );

  sheet.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('a[href^="#"]')) close();
    },
    { signal }
  );

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') close();
    },
    { signal }
  );

  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener(
    'change',
    () => {
      if (mq.matches) close();
    },
    { signal }
  );

  mobileNavCleanup = () => {
    ac.abort();
    close();
  };
}

/* ─── Active Nav Highlight with IntersectionObserver ────── */
function setupNavObserver() {
  if (navObserver) navObserver.disconnect();
  const mode = root.getAttribute('data-lang-mode') || 'en';
  const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  if (!container) return;

  const sections = container.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav-sheet a');
  if (navLinks.length === 0) return;

  const linkMap = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const id = href.startsWith('#') ? href.slice(1) : '';
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
    { rootMargin: '-80px 0px -45% 0px' }
  );

  sections.forEach((section) => {
    navObserver.observe(section);
  });
}

/* ─── Subpage TOC Active Section (Scrollspy) ────────────── */
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

/* ─── Keep Floating Subpage TOC Button Clear of Footer ─── */
function keepClearOfFooter(el, footer, measured = el) {
  if (!footer) return () => {};

  const FOOTER_CLEARANCE = 12;
  let lift = 0;
  let ticking = false;

  const apply = () => {
    const rect = measured.getBoundingClientRect();
    if (rect.height === 0) return;
    const next = Math.max(
      0,
      lift + rect.bottom + FOOTER_CLEARANCE - footer.getBoundingClientRect().top
    );
    if (Math.abs(next - lift) < 0.5) return;
    lift = next;
    el.style.setProperty('--fab-footer-lift', lift + 'px');
  };

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      apply();
    });
  };

  const ac = new AbortController();
  window.addEventListener('resize', schedule, { signal: ac.signal });

  let scrollAc = null;
  const footerObserver = new IntersectionObserver((entries) => {
    const visible = entries[entries.length - 1].isIntersecting;
    if (visible && !scrollAc) {
      scrollAc = new AbortController();
      window.addEventListener('scroll', schedule, { passive: true, signal: scrollAc.signal });
    } else if (!visible && scrollAc) {
      scrollAc.abort();
      scrollAc = null;
    }
    schedule();
  });
  footerObserver.observe(footer);

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(footer);
  apply();

  return () => {
    ac.abort();
    if (scrollAc) scrollAc.abort();
    footerObserver.disconnect();
    resizeObserver.disconnect();
    el.style.removeProperty('--fab-footer-lift');
  };
}

/* ─── Subpage TOC Mobile Drawer ─────────────────────────── */
function iconSpan(name) {
  const icon = document.createElement('span');
  icon.className = 'icon icon-' + name;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function setupSubpageTocMobileDrawer() {
  if (subpageMobileCleanup) {
    subpageMobileCleanup();
    subpageMobileCleanup = null;
  }

  const mode = root.getAttribute('data-lang-mode') || 'en';
  const langBlock = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  if (!langBlock) return;

  const layout = langBlock.querySelector('.container.subpage-detail-layout');
  const pageToc = layout ? layout.querySelector('.page-toc') : null;
  const tocNav = pageToc ? pageToc.querySelector('nav') : null;
  const tocLinks = tocNav ? [...tocNav.querySelectorAll('a[href^="#"]')] : [];
  if (!pageToc || tocLinks.length === 0) return;

  pageToc.id = mode === 'zh' ? 'subpage-page-toc-zh' : 'subpage-page-toc-en';

  const mq = window.matchMedia('(max-width: 1200px)');
  const TOC_LEFT_OUTSET = 300;
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
  toggle.appendChild(iconSpan('toc'));

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

  tocNav.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && shouldUseDrawer()) close();
    },
    { signal }
  );

  mq.addEventListener('change', syncDrawer, { signal });

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

  const releaseFooterClearance = keepClearOfFooter(
    document.body,
    langBlock.querySelector('.site-footer'),
    toggle
  );

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

/* ─── Smooth Section Navigation ─────────────────────────── */
function scrollToSection(targetId) {
  const mode = root.getAttribute('data-lang-mode') || 'en';
  const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  const target = container ? container.querySelector('#' + CSS.escape(targetId)) : null;
  if (!target) return false;

  const headerOffset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 65;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top =
    targetId === 'hero'
      ? 0
      : Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - headerOffset));

  window.scrollTo({ top, behavior: reduceMotion ? 'instant' : 'smooth' });
  return true;
}

function bindNavClicks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest(
      '.main-nav a, .mobile-nav-sheet a, .hero-cta[href^="#"], .footer-top[href^="#"]'
    );
    if (link) {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#') && href.length > 1) {
        if (scrollToSection(href.slice(1))) e.preventDefault();
      }
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
function updatePubBtnText(btn, lang, expanded) {
  const labelEl = btn.querySelector('[data-pub-label]') || btn;
  const iconEl = btn.querySelector('[data-pub-caret]');
  if (lang === 'zh') {
    labelEl.textContent = expanded
      ? '收起非机器人相关论文'
      : '展开 7 篇非机器人相关论文（2018–2019 · 微电火花加工）';
  } else {
    labelEl.textContent = expanded
      ? 'Hide non-robotics publications'
      : 'Show 7 non-robotics publications (2018–2019 · Micro-EDM)';
  }
  if (iconEl) {
    iconEl.textContent = expanded ? '▴' : '▾';
  }
}

function setupPubToggle(btnId, lang) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const selector =
    lang === 'zh'
      ? '#lang-zh .publication-row[data-related="other"]'
      : '#lang-en .publication-row[data-related="other"]';
  const others = document.querySelectorAll(selector);

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(expanded));
    localStorage.setItem(PUBS_EXPANDED_KEY, String(expanded));

    others.forEach((row) => {
      row.classList.toggle('collapsed', !expanded);
    });

    updatePubBtnText(btn, lang, expanded);
  });
}

setupPubToggle('pubToggleBtn', 'en');
setupPubToggle('pubToggleBtnZh', 'zh');

(function initPubsState() {
  const enBtn = document.getElementById('pubToggleBtn');
  const zhBtn = document.getElementById('pubToggleBtnZh');
  if (!enBtn && !zhBtn) return;

  const savedExpanded = localStorage.getItem(PUBS_EXPANDED_KEY);
  if (savedExpanded === 'true') {
    const enOthers = document.querySelectorAll('#lang-en .publication-row[data-related="other"]');
    const zhOthers = document.querySelectorAll('#lang-zh .publication-row[data-related="other"]');
    if (enBtn) {
      enBtn.setAttribute('aria-expanded', 'true');
      updatePubBtnText(enBtn, 'en', true);
    }
    if (zhBtn) {
      zhBtn.setAttribute('aria-expanded', 'true');
      updatePubBtnText(zhBtn, 'zh', true);
    }
    enOthers.forEach((c) => c.classList.remove('collapsed'));
    zhOthers.forEach((c) => c.classList.remove('collapsed'));
  }
})();

/* ─── Scroll Reveal ─────────────────────────────────────── */
// Below-the-fold blocks fade in and slide up as they enter the viewport;
// items revealed in the same batch are staggered.
//
// Ported from ImChong/Robot_Learning_Paper_Notebooks assets/js/scroll-reveal.js.
// - Only elements entirely below the viewport when registered are hidden, so the
//   first screen never flashes and content stays visible if this script fails.
// - Elements that appear later (language switch, expanded publications) are
//   registered by a MutationObserver.
// - A pending element that holds an in-page anchor target is shown at once, so
//   its 16px offset never shifts the scroll landing point (TOC links, #hash).
// - Skipped entirely under prefers-reduced-motion or without IntersectionObserver.
(function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const mains = document.querySelectorAll('main');
  if (!mains.length) return;

  const REVEAL_MS = 700;
  const STAGGER_MS = 70;
  const SELECTOR = [
    // Home: section titles / subtitles, then cards one by one
    '.section > .container:not(.subpage-detail-layout) > :not(.card-list)',
    '.card-list > :not(.card-list)',
    // Detail pages: each top-level block of the article
    '.subpage-detail-main > *',
  ].join(', ');

  const seen = new WeakSet();

  function finish(el) {
    el.classList.remove('scroll-reveal', 'is-revealed');
    el.style.removeProperty('--reveal-delay');
  }

  // The bottom edge is not inset: blocks at the very end of a page may never
  // get far enough above the viewport bottom to cross a shrunken threshold.
  const observer = new IntersectionObserver((entries) => {
    let batch = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = Math.min(batch++, 4) * STAGGER_MS;
      observer.unobserve(el);
      el.style.setProperty('--reveal-delay', delay + 'ms');
      el.classList.add('is-revealed');
      // Drop the classes once done so cards get their own hover transition back
      setTimeout(finish, REVEAL_MS + delay + 50, el);
    });
  });

  function anchorTarget(hash) {
    if (!hash || hash.length < 2) return null;
    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return null;
    }
    // Ids repeat across #lang-en / #lang-zh; pick the visible one
    const mode = document.documentElement.getAttribute('data-lang-mode') || 'en';
    const block = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
    return (block && block.querySelector('#' + CSS.escape(id))) || document.getElementById(id);
  }

  function revealNow(target) {
    const pending = target && target.closest('.scroll-reveal');
    if (!pending) return;
    observer.unobserve(pending);
    // Skip the element's own transform transition (.card has one), otherwise
    // the scroll target is measured while it is still offset.
    pending.style.transition = 'none';
    finish(pending);
    pending.getBoundingClientRect();
    pending.style.removeProperty('transition');
  }

  function register() {
    const fold = window.innerHeight || document.documentElement.clientHeight;
    const hashTarget = anchorTarget(location.hash);
    const sectionTops = new Map();
    const below = [];

    // Read all layout first, then write classes: interleaving the two would
    // force a reflow on every read.
    mains.forEach((main) => {
      main.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        // Not rendered yet (hidden language block, collapsed card): register
        // once it shows up.
        if (!el.getClientRects().length) return;
        seen.add(el);
        if (hashTarget && el.contains(hashTarget)) return;

        // Sections use content-visibility: auto, so read the section's own box
        // first and only lay out its children when it reaches the fold.
        const section = el.closest('.section');
        if (section) {
          if (!sectionTops.has(section)) {
            sectionTops.set(section, section.getBoundingClientRect().top);
          }
          if (sectionTops.get(section) >= fold) {
            below.push(el);
            return;
          }
        }
        if (el.getBoundingClientRect().top >= fold) below.push(el);
      });
    });

    below.forEach((el) => {
      if (el.parentElement && el.parentElement.closest('.scroll-reveal')) return;
      el.classList.add('scroll-reveal');
      observer.observe(el);
    });
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      register();
    });
  }

  register();

  // hidden toggles the language blocks; class toggles collapsed publications
  const mutationObserver = new MutationObserver(schedule);
  const roots = document.querySelectorAll('#lang-en, #lang-zh');
  (roots.length ? roots : mains).forEach((rootEl) => {
    mutationObserver.observe(rootEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'class', 'style', 'open'],
    });
  });

  // Capture phase: runs before the browser (or main.js) scrolls to the target
  document.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) revealNow(anchorTarget(link.getAttribute('href')));
    },
    true
  );
  window.addEventListener('hashchange', () => revealNow(anchorTarget(location.hash)));
})();

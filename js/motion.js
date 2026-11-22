/* ─── GSAP Motion Choreography (Hero Entrance + Scoped #projects Moment) ─── */
(function initSiteMotion() {
  'use strict';

  const root = document.documentElement;
  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  function finishPrePaint() {
    root.classList.add('m-enter-done');
    root.classList.remove('m-enter');
  }

  if (!gsap || reduceMotion) {
    finishPrePaint();
    return;
  }

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }
  gsap.ticker.lagSmoothing(0);

  function activeContainer() {
    const mode = root.getAttribute('data-lang-mode') || 'en';
    return document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
  }

  /* 1. Hero single-shot load entrance (≤ 1.05s, never replays on scroll) */
  function runHeroEntrance() {
    const container = activeContainer();
    if (!container) {
      finishPrePaint();
      return;
    }
    const hero = container.querySelector('#hero');
    if (!hero) {
      finishPrePaint();
      return;
    }

    const lines = [...hero.querySelectorAll('.hero-line-inner')];
    const staggers = [...hero.querySelectorAll('.hero-stagger')];
    const viewport = hero.querySelector('.hero-viewport');

    // Clear CSS pre-paint transform before GSAP reads initial matrix, avoiding stacked translateY
    finishPrePaint();

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        gsap.set([...lines, ...staggers, viewport].filter(Boolean), {
          clearProps: 'transform,opacity',
        });
      },
    });

    if (lines.length) {
      tl.fromTo(
        lines,
        { yPercent: 105, y: 0 },
        { yPercent: 0, y: 0, duration: 0.65, stagger: 0.08 },
        0
      );
    }

    if (staggers.length) {
      tl.fromTo(
        staggers,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 },
        lines.length ? '-=0.35' : 0
      );
    }

    if (viewport) {
      tl.fromTo(
        viewport,
        { scale: 0.985, opacity: 0.92 },
        { scale: 1, opacity: 1, duration: 0.72 },
        0.08
      );
    }

    if (!lines.length && !staggers.length && !viewport) {
      finishPrePaint();
    }
  }

  /* 2. Scoped #projects ScrollTrigger Moment (progress rail + flagship index, no card motion) */
  let activeTriggers = [];

  function clearProjectMoment() {
    activeTriggers.forEach((st) => st.kill());
    activeTriggers = [];
  }

  function setupProjectMoment() {
    clearProjectMoment();
    if (!ScrollTrigger) return;

    const container = activeContainer();
    if (!container) return;

    const matrix = container.querySelector('#projects .flagship-matrix');
    const fill = container.querySelector('.projects-progress-fill');
    const badge = container.querySelector('[data-projects-index]');
    if (!matrix || !fill || !badge) return;

    const st = ScrollTrigger.create({
      trigger: matrix,
      start: 'top 75%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(fill, { scaleX: 0.33 + 0.67 * p });
        const step = p < 0.33 ? '01' : p < 0.72 ? '02' : '03';
        const nextText = `${step} / 03`;
        if (badge.textContent !== nextText) {
          badge.textContent = nextText;
        }
      },
    });
    activeTriggers.push(st);
  }

  runHeroEntrance();
  setupProjectMoment();

  window.addEventListener('cl:langchange', () => {
    finishPrePaint();
    window.requestAnimationFrame(() => {
      setupProjectMoment();
      if (ScrollTrigger) ScrollTrigger.refresh();
    });
  });
})();

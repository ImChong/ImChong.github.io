/* ─── Pointer Effects ───────────────────────────────────── */
// Two small mouse-only touches. Both stay off for touch screens and under
// prefers-reduced-motion; html.has-pointer-fx marks when they are live.
// - Card spotlight: a soft accent glow follows the pointer inside a .card and
//   lights the nearest stretch of its border. css/style.css draws it; this
//   script only feeds the pointer position in as --spot-x / --spot-y.
// - Magnetic controls: the header buttons and hero links lean toward a nearby
//   pointer (18% of the offset, at most 6px so the header buttons stay inside
//   the header bar) and spring back when it moves away. It sets the `translate`
//   property, so a control's own `transform` (the :active press) still applies.
(function initPointerEffects() {
  const mq = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
  );
  const root = document.documentElement;

  const PULL = 0.18;
  const MAX_SHIFT = 6;
  const REACH = 28;
  const magnets = Array.from(
    document.querySelectorAll('.theme-toggle, .lang-toggle, .hero-links a')
  );

  let enabled = false;
  let pointer = null;
  let frame = 0;

  function clampShift(v) {
    return Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, v * PULL));
  }

  // The live (mid-transition) shift, so the resting centre can be recovered
  // from the measured box without feedback.
  function currentShift(el) {
    const t = getComputedStyle(el).translate;
    if (!t || t === 'none') return [0, 0];
    const parts = t.split(' ');
    return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0];
  }

  function releaseAll() {
    magnets.forEach((el) => el.style.removeProperty('translate'));
  }

  function update() {
    frame = 0;
    if (!enabled || !pointer) return;
    const { x, y } = pointer;

    // Read everything first, then write, so the frame lays out once.
    const hit = document.elementFromPoint(x, y);
    const card = hit ? hit.closest('.card') : null;
    const cardBox = card ? card.getBoundingClientRect() : null;

    const shifts = magnets.map((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return null;
      const near = REACH + MAX_SHIFT;
      if (x < r.left - near || x > r.right + near || y < r.top - near || y > r.bottom + near) {
        return null;
      }
      const [sx, sy] = currentShift(el);
      const dx = x - (r.left - sx + r.width / 2);
      const dy = y - (r.top - sy + r.height / 2);
      if (Math.abs(dx) > r.width / 2 + REACH || Math.abs(dy) > r.height / 2 + REACH) return null;
      return `${clampShift(dx).toFixed(1)}px ${clampShift(dy).toFixed(1)}px`;
    });

    if (card) {
      card.style.setProperty('--spot-x', `${(x - cardBox.left).toFixed(1)}px`);
      card.style.setProperty('--spot-y', `${(y - cardBox.top).toFixed(1)}px`);
    }
    magnets.forEach((el, i) => {
      if (shifts[i]) el.style.translate = shifts[i];
      else el.style.removeProperty('translate');
    });
  }

  function schedule() {
    if (enabled && pointer && !frame) frame = requestAnimationFrame(update);
  }

  function setEnabled(on) {
    enabled = on;
    root.classList.toggle('has-pointer-fx', on);
    if (!on) {
      pointer = null;
      releaseAll();
    }
  }

  document.addEventListener(
    'pointermove',
    (e) => {
      if (!enabled || e.pointerType === 'touch') return;
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    },
    { passive: true }
  );
  // Content moves under a still pointer while scrolling.
  window.addEventListener('scroll', schedule, { passive: true });
  // relatedTarget is null once the pointer has left the window.
  document.addEventListener('pointerout', (e) => {
    if (e.relatedTarget) return;
    pointer = null;
    releaseAll();
  });
  window.addEventListener('blur', () => {
    pointer = null;
    releaseAll();
  });

  setEnabled(mq.matches);
  mq.addEventListener('change', (e) => setEnabled(e.matches));
})();

/* ─── Pointer Effects ───────────────────────────────────── */
// Card spotlight: a soft accent glow follows the pointer inside a .card and
// lights the nearest stretch of its border. css/style.css draws it; this
// script only feeds the pointer position in as --spot-x / --spot-y.
// It stays off for touch screens and under prefers-reduced-motion;
// html.has-pointer-fx marks when it is live.
(function initPointerEffects() {
  const mq = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
  );
  const root = document.documentElement;

  let enabled = false;
  let pointer = null;
  let frame = 0;

  function update() {
    frame = 0;
    if (!enabled || !pointer) return;
    const { x, y } = pointer;
    const hit = document.elementFromPoint(x, y);
    const card = hit ? hit.closest('.card') : null;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${(x - box.left).toFixed(1)}px`);
    card.style.setProperty('--spot-y', `${(y - box.top).toFixed(1)}px`);
  }

  function schedule() {
    if (enabled && pointer && !frame) frame = requestAnimationFrame(update);
  }

  function setEnabled(on) {
    enabled = on;
    root.classList.toggle('has-pointer-fx', on);
    if (!on) pointer = null;
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
    if (!e.relatedTarget) pointer = null;
  });

  setEnabled(mq.matches);
  mq.addEventListener('change', (e) => setEnabled(e.matches));
})();

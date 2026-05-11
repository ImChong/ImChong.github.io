/* ─── Lightbox ──────────────────────────────────────────────
   Shared by marriage.html and experience/pcv/*.html.
   Attach `data-lightbox` to any <img> you want to be zoomable.
   ─────────────────────────────────────────────────────────── */
(function () {
  /* Build DOM */
  const lb = document.createElement('div');
  lb.id = 'lightbox';

  const lbClose = document.createElement('span');
  lbClose.id = 'lightbox-close';
  lbClose.setAttribute('role', 'button');
  lbClose.setAttribute('aria-label', 'Close lightbox');
  lbClose.setAttribute('tabindex', '0');
  lbClose.textContent = '×';

  const lbImg = document.createElement('img');
  lbImg.id = 'lb-img';
  lbImg.src = '';
  lbImg.alt = '';

  const lbControls = document.createElement('div');
  lbControls.id = 'lb-controls';

  const btnZoomOut = document.createElement('button');
  btnZoomOut.type = 'button';
  btnZoomOut.id = 'lb-zoom-out';
  btnZoomOut.title = '缩小 (-)';
  btnZoomOut.textContent = '−';

  const zoomLabel = document.createElement('span');
  zoomLabel.id = 'lb-zoom-label';
  zoomLabel.textContent = '100%';

  const btnZoomIn = document.createElement('button');
  btnZoomIn.type = 'button';
  btnZoomIn.id = 'lb-zoom-in';
  btnZoomIn.title = '放大 (+)';
  btnZoomIn.textContent = '+';

  const btnZoomReset = document.createElement('button');
  btnZoomReset.type = 'button';
  btnZoomReset.id = 'lb-zoom-reset';
  btnZoomReset.title = '重置 (0)';
  btnZoomReset.className = 'lb-zoom-reset';
  btnZoomReset.textContent = '重置';

  lbControls.append(btnZoomOut, zoomLabel, btnZoomIn, btnZoomReset);
  lb.append(lbClose, lbImg, lbControls);
  document.body.appendChild(lb);

  /* Zoom state */
  const STEP = 0.25,
    MIN = 0.25,
    MAX = 5;
  let scale = 1;

  function setScale(s) {
    scale = Math.min(MAX, Math.max(MIN, s));
    lbImg.style.transform = `scale(${scale})`;
    zoomLabel.textContent = Math.round(scale * 100) + '%';
  }

  function openLb(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    setScale(1);
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* Attach to all [data-lightbox] images */
  document.querySelectorAll('[data-lightbox]').forEach((img) => {
    img.addEventListener('click', () => openLb(img.src, img.alt));
  });

  /* Controls */
  lbClose.addEventListener('click', closeLb);
  lbClose.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') closeLb();
  });
  btnZoomIn.addEventListener('click', (e) => {
    e.stopPropagation();
    setScale(scale + STEP);
  });
  btnZoomOut.addEventListener('click', (e) => {
    e.stopPropagation();
    setScale(scale - STEP);
  });
  btnZoomReset.addEventListener('click', (e) => {
    e.stopPropagation();
    setScale(1);
  });
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLb();
  });

  let ticking = false;
  // ⚡ Bolt Performance Optimization: Throttle frequent 'wheel' events with requestAnimationFrame
  // to prevent DOM update thrashing and reduce main-thread blocking when zooming.
  lb.addEventListener(
    'wheel',
    (e) => {
      if (!lb.classList.contains('active')) return;
      e.preventDefault();
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScale(scale + (e.deltaY < 0 ? STEP : -STEP));
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: false }
  );

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === '+' || e.key === '=') setScale(scale + STEP);
    if (e.key === '-') setScale(scale - STEP);
    if (e.key === '0') setScale(1);
  });
})();

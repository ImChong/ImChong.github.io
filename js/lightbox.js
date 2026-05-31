/* ─── Lightbox ──────────────────────────────────────────────
   Shared by marriage.html and experience/pcv/*.html.
   Attach `data-lightbox` to any <img> you want to be zoomable.
   ─────────────────────────────────────────────────────────── */
(function () {
  let lb, lbImg, zoomLabel;
  let isBuilt = false;

  /* Zoom state */
  const STEP = 0.25,
    MIN = 0.25,
    MAX = 5;
  let scale = 1;

  // ⚡ Bolt Performance Optimization: Lazy initialization of the lightbox DOM.
  // We only create and append the lightbox DOM elements the first time an image is clicked.
  // This reduces the initial DOM size and avoids blocking the main thread during page load.
  function buildLightbox() {
    if (isBuilt) return;
    isBuilt = true;

    /* Build DOM */
    lb = document.createElement('div');
    lb.id = 'lightbox';

    const lbClose = document.createElement('span');
    lbClose.id = 'lightbox-close';
    lbClose.setAttribute('role', 'button');
    lbClose.setAttribute('aria-label', 'Close lightbox');
    lbClose.setAttribute('tabindex', '0');
    lbClose.textContent = '×';

    lbImg = document.createElement('img');
    lbImg.id = 'lb-img';
    lbImg.src = '';
    lbImg.alt = '';
    lbImg.decoding = 'async'; // ⚡ Bolt Performance Optimization: Decode large lightbox images off the main thread

    const lbControls = document.createElement('div');
    lbControls.id = 'lb-controls';

    const btnZoomOut = document.createElement('button');
    btnZoomOut.type = 'button';
    btnZoomOut.id = 'lb-zoom-out';
    btnZoomOut.title = '缩小 (-)';
    btnZoomOut.textContent = '−';

    zoomLabel = document.createElement('span');
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
  }

  function setScale(s) {
    if (!isBuilt) return;
    scale = Math.min(MAX, Math.max(MIN, s));
    lbImg.style.transform = `scale(${scale})`;
    zoomLabel.textContent = Math.round(scale * 100) + '%';
  }

  function openLb(src, alt) {
    buildLightbox();
    lbImg.src = src;
    lbImg.alt = alt || '';
    setScale(1);
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    if (!isBuilt) return;
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* Attach to all [data-lightbox] images */
  document.addEventListener('click', (e) => {
    // ⚡ Bolt Performance Optimization: Use event delegation instead of attaching individual
    // click listeners to every [data-lightbox] image. This reduces memory footprint and
    // speeds up initialization.
    const img = e.target.closest('img[data-lightbox]');
    if (img) {
      openLb(img.src, img.alt);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!isBuilt || !lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === '+' || e.key === '=') setScale(scale + STEP);
    if (e.key === '-') setScale(scale - STEP);
    if (e.key === '0') setScale(1);
  });
})();

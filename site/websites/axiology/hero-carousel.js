/* =============================================================================
   AXIOLOGY — Hero 3-Banner Carousel
   • Auto-advances every 7s
   • Three transition variants cycle: liquid → curtain → flip → liquid …
   • Manual nav: pagers / arrows / drag
   • 3D mouse parallax on .hero__content children via z-layers + tilt
   ========================================================================== */

(function () {
  'use strict';

  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const slides   = Array.from(hero.querySelectorAll('.hero__slide'));
  const pagers   = Array.from(hero.querySelectorAll('.hero__pager-btn'));
  const fill     = hero.querySelector('[data-progress-fill]');
  const total    = slides.length;
  if (total < 2) return;

  const TRANSITIONS = ['liquid', 'curtain', 'flip'];
  const DURATION    = 3500;     // ms between auto-advances
  const TICK        = 40;       // ms progress tick

  let current = 0;
  let nextIdx = 0;
  let timer = null;
  let progressTimer = null;
  let elapsed = 0;
  let isAnimating = false;
  let isPaused = false;

  function go(to, direction) {
    if (isAnimating || to === current) return;
    isAnimating = true;

    const transitionVariant = TRANSITIONS[current % TRANSITIONS.length];
    const leavingClass  = `is-leaving-${transitionVariant}`;
    const enteringClass = `is-entering-${transitionVariant}`;

    const leaving = slides[current];
    const entering = slides[to];

    // Reset all
    slides.forEach((s) => {
      s.classList.remove(
        'is-leaving-liquid', 'is-entering-liquid',
        'is-leaving-curtain', 'is-entering-curtain',
        'is-leaving-flip', 'is-entering-flip'
      );
    });

    leaving.classList.add(leavingClass);
    entering.classList.add('is-active', enteringClass);

    // Replay the title letter-split animation on the entering slide
    const enteringTitle = entering.querySelector('.hero__title');
    if (enteringTitle) {
      // Force CSS animation to re-run by removing and re-adding the .char class
      enteringTitle.querySelectorAll('.char').forEach((ch) => {
        ch.style.animation = 'none';
        // Trigger reflow
        void ch.offsetWidth;
        ch.style.animation = '';
      });
    }

    // Update pagers
    pagers.forEach((p, i) => {
      p.classList.toggle('is-active', i === to);
      if (i === to) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });

    // Cleanup after animation
    setTimeout(() => {
      leaving.classList.remove('is-active', leavingClass);
      entering.classList.remove(enteringClass);
      hero.dataset.activeSlide = String(to);
      current = to;
      isAnimating = false;
      resetProgress();
    }, 1700);
  }

  function next() {
    const to = (current + 1) % total;
    go(to, +1);
  }
  function prev() {
    const to = (current - 1 + total) % total;
    go(to, -1);
  }

  function resetProgress() {
    elapsed = 0;
    if (fill) fill.style.width = '0%';
  }
  function startProgress() {
    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (isPaused || isAnimating) return;
      elapsed += TICK;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      if (fill) fill.style.width = pct + '%';
      if (elapsed >= DURATION) next();
    }, TICK);
  }

  function start() { hero.setAttribute('data-carousel-state', 'playing'); startProgress(); }
  function stop()  { hero.setAttribute('data-carousel-state', 'paused'); clearInterval(progressTimer); }

  // Manual play/pause toggle
  const toggleBtn = hero.querySelector('[data-carousel-toggle]');
  let userPaused = false;
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userPaused = !userPaused;
      if (userPaused) { stop(); toggleBtn.setAttribute('aria-label', 'Play carousel'); }
      else            { resetProgress(); start(); toggleBtn.setAttribute('aria-label', 'Pause carousel'); }
    });
  }

  // pager buttons
  pagers.forEach((p) => {
    p.addEventListener('click', () => {
      const to = parseInt(p.dataset.goSlide, 10);
      if (!isNaN(to)) go(to, to > current ? 1 : -1);
    });
  });

  // pause on hover
  hero.addEventListener('mouseenter', () => { isPaused = true; });
  hero.addEventListener('mouseleave', () => { isPaused = false; });

  // keyboard arrows
  window.addEventListener('keydown', (e) => {
    const inView = window.scrollY < window.innerHeight * 0.8;
    if (!inView) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); resetProgress(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); resetProgress(); }
  });

  // drag / swipe
  let dragStart = null;
  function pointerDown(e) {
    dragStart = { x: (e.touches ? e.touches[0].clientX : e.clientX), t: Date.now() };
  }
  function pointerUp(e) {
    if (!dragStart) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = endX - dragStart.x;
    const dt = Date.now() - dragStart.t;
    if (Math.abs(dx) > 60 && dt < 700) {
      if (dx < 0) { next(); } else { prev(); }
      resetProgress();
    }
    dragStart = null;
  }
  hero.addEventListener('mousedown',  pointerDown);
  hero.addEventListener('mouseup',    pointerUp);
  hero.addEventListener('touchstart', pointerDown, { passive: true });
  hero.addEventListener('touchend',   pointerUp,   { passive: true });

  // visibility — pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  /* ===================== 3D Mouse Parallax (Tilt) ===================== */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (!reduceMotion && !isTouch) {
    const target = { rx: 0, ry: 0, tx: 0, ty: 0 };
    const cur    = { rx: 0, ry: 0, tx: 0, ty: 0 };

    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1..1
      const py = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      target.ry = px * 3;     // rotateY degrees
      target.rx = -py * 2.5;  // rotateX degrees
      target.tx = -px * 18;
      target.ty = -py * 12;
    });
    hero.addEventListener('mouseleave', () => {
      target.rx = target.ry = target.tx = target.ty = 0;
    });

    function tilt() {
      cur.rx += (target.rx - cur.rx) * 0.06;
      cur.ry += (target.ry - cur.ry) * 0.06;
      cur.tx += (target.tx - cur.tx) * 0.06;
      cur.ty += (target.ty - cur.ty) * 0.06;

      // Apply to ALL slides (active + others) so transitions inherit tilt
      slides.forEach((s) => {
        const media = s.querySelector('.hero__media');
        const content = s.querySelector('.hero__content');
        if (media)   media.style.transform   = `translateZ(-120px) scale(1.18) translate3d(${cur.tx}px, ${cur.ty}px, 0)`;
        if (content) content.style.transform = `rotateX(${cur.rx}deg) rotateY(${cur.ry}deg) translate3d(${cur.tx * 0.3}px, ${cur.ty * 0.3}px, 0)`;
      });
      requestAnimationFrame(tilt);
    }
    tilt();
  }

  // Boot: wait for loader to clear so user actually sees the first transition.
  // Falls back to 1.5s if the loaded event never fires.
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    resetProgress();
    start();
  }
  if (document.querySelector('.loader.is-done')) {
    boot();
  } else {
    window.addEventListener('axiology:loaded', boot, { once: true });
    setTimeout(boot, 1500); // safety
  }
})();

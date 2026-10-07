/* KHAYAL — Furniture / Interior / 3D Showcase animations + interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ========== FURNITURE ========== */
  if (hasGSAP && !prefersReduced) {
    gsap.from('.furniture__intro .eyebrow, .furniture__intro h2', {
      autoAlpha: 0, y: 28, duration: 1.0, stagger: .1, ease: 'expo.out',
      scrollTrigger: { trigger: '.furniture__intro', start: 'top 80%' }
    });
    gsap.from('.furniture__intro p', {
      autoAlpha: 0, y: 22, duration: .9,
      scrollTrigger: { trigger: '.furniture__intro p', start: 'top 85%' }
    });

    $$('.furn-piece').forEach((piece, i) => {
      const isEven = (i % 2 === 1);
      gsap.from(piece.querySelector('.furn-piece__image'), {
        autoAlpha: 0,
        x: isEven ? 40 : -40,
        duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: piece, start: 'top 75%' }
      });
      gsap.from(piece.querySelectorAll('.furn-piece__info > *'), {
        autoAlpha: 0, y: 24, duration: .9, stagger: .08, ease: 'expo.out',
        scrollTrigger: { trigger: piece, start: 'top 75%' }
      });

      // image parallax on scroll
      gsap.to(piece.querySelector('.furn-piece__image img'), {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: piece, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ========== INTERIOR ========== */
  if (hasGSAP && !prefersReduced) {
    gsap.from('.interior__intro > *', {
      autoAlpha: 0, y: 28, duration: 1.0, stagger: .1, ease: 'expo.out',
      scrollTrigger: { trigger: '.interior__intro', start: 'top 78%' }
    });
    gsap.from('.int-card', {
      autoAlpha: 0, y: 40, duration: 1.0, stagger: .15, ease: 'expo.out',
      scrollTrigger: { trigger: '.interior__grid', start: 'top 75%' }
    });
    $$('.int-card').forEach(card => {
      gsap.to(card.querySelector('.int-card__image img'), {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ========== 3D SHOWCASE ========== */
  const stage = document.getElementById('showcaseStage');
  const layer = document.getElementById('showcaseLayer');
  const spotsWrap = document.getElementById('showcaseSpots');
  const resetBtn = document.getElementById('showcaseReset');

  // Detect touch / coarse pointer — disable parallax tilt on those devices
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (stage && layer && !isTouchDevice) {

    // === Tilt parallax (mouse + auto idle) ===
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const MAX = 8; // max tilt degrees
    let raf = null;
    let lastMouseMs = 0;
    let isDragging = false;
    let dragStart = null;
    let dragOffset = { x: 0, y: 0 };

    const apply = () => {
      // ease tx/ty toward x/y
      tilt.tx += (tilt.x - tilt.tx) * 0.08;
      tilt.ty += (tilt.y - tilt.ty) * 0.08;
      layer.style.transform = `rotateY(${tilt.tx}deg) rotateX(${-tilt.ty}deg) scale(1.04) translateZ(0)`;
      // also push spots slightly more (creates depth)
      if (spotsWrap) {
        spotsWrap.style.transform = `rotateY(${tilt.tx * 1.18}deg) rotateX(${-tilt.ty * 1.18}deg) translateZ(20px)`;
      }
      raf = requestAnimationFrame(apply);
    };

    const onMove = (e) => {
      if (isDragging) return;
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1
      tilt.x = (px - 0.5) * MAX * 2;
      tilt.y = (py - 0.5) * MAX * 2;
      lastMouseMs = performance.now();
    };

    const onLeave = () => {
      tilt.x = 0;
      tilt.y = 0;
    };

    const onDragStart = (e) => {
      isDragging = true;
      stage.classList.add('is-dragging');
      const pt = (e.touches?.[0]) || e;
      dragStart = { x: pt.clientX, y: pt.clientY };
      dragOffset = { x: tilt.x, y: tilt.y };
    };
    const onDragMove = (e) => {
      if (!isDragging || !dragStart) return;
      const pt = (e.touches?.[0]) || e;
      const dx = pt.clientX - dragStart.x;
      const dy = pt.clientY - dragStart.y;
      tilt.x = Math.max(-MAX * 2, Math.min(MAX * 2, dragOffset.x + dx * 0.18));
      tilt.y = Math.max(-MAX * 2, Math.min(MAX * 2, dragOffset.y + dy * 0.18));
      tilt.tx = tilt.x; tilt.ty = tilt.y;
      layer.style.transform = `rotateY(${tilt.tx}deg) rotateX(${-tilt.ty}deg) scale(1.04)`;
      if (spotsWrap) spotsWrap.style.transform = `rotateY(${tilt.tx * 1.18}deg) rotateX(${-tilt.ty * 1.18}deg) translateZ(20px)`;
    };
    const onDragEnd = () => {
      isDragging = false;
      stage.classList.remove('is-dragging');
      dragStart = null;
    };

    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    stage.addEventListener('mousedown', onDragStart);
    stage.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: true });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

    // gentle idle drift if mouse hasn't moved
    setInterval(() => {
      if (!isDragging && (performance.now() - lastMouseMs) > 1500) {
        const t = performance.now() / 1000;
        tilt.x = Math.sin(t * 0.3) * 1.2;
        tilt.y = Math.cos(t * 0.25) * 0.8;
      }
    }, 1000 / 30);

    raf = requestAnimationFrame(apply);

    resetBtn?.addEventListener('click', () => {
      tilt.x = 0; tilt.y = 0;
    });
  }

  // On touch devices, still wire chip↔spot syncing + reset for tabs/animations
  if (stage && layer) {
    // === Chip ↔ Spot syncing ===
    const chips = $$('.showcase__chip');
    const spots = $$('.showcase__spot');

    const activate = (key) => {
      chips.forEach(c => c.classList.toggle('is-active', c.dataset.target === key));
      spots.forEach(s => s.classList.toggle('is-active', s.dataset.spot === key));
    };

    chips.forEach(chip => {
      chip.addEventListener('click', () => activate(chip.dataset.target));
      chip.addEventListener('mouseenter', () => activate(chip.dataset.target));
    });
    spots.forEach(spot => {
      spot.addEventListener('click', () => activate(spot.dataset.spot));
    });

    // === Animations on enter ===
    if (hasGSAP && !prefersReduced) {
      gsap.from('.showcase__intro > div > *', {
        autoAlpha: 0, y: 26, duration: 1.0, stagger: .08, ease: 'expo.out',
        scrollTrigger: { trigger: '.showcase__intro', start: 'top 80%' }
      });
      gsap.from('.showcase__tab', {
        autoAlpha: 0, y: 18, duration: .7, stagger: .08, ease: 'expo.out',
        scrollTrigger: { trigger: '.showcase__tabs', start: 'top 85%' }
      });
      gsap.from('.showcase__stage', {
        autoAlpha: 0, y: 40, scale: .98, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: '.showcase__viewer', start: 'top 78%' }
      });
      gsap.from('.showcase__spot', {
        autoAlpha: 0, scale: 0, duration: .5, stagger: .08, ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '.showcase__viewer', start: 'top 70%' }
      });
      gsap.from('.showcase__bar > *', {
        autoAlpha: 0, y: 12, duration: .7, stagger: .08, ease: 'expo.out',
        scrollTrigger: { trigger: '.showcase__bar', start: 'top 90%' }
      });
      gsap.from('.showcase__materials h4, .showcase__chip', {
        autoAlpha: 0, y: 16, duration: .7, stagger: .04, ease: 'expo.out',
        scrollTrigger: { trigger: '.showcase__materials', start: 'top 85%' }
      });
      gsap.from('.proj-meta > div', {
        autoAlpha: 0, y: 16, duration: .6, stagger: .05, ease: 'expo.out',
        scrollTrigger: { trigger: '.proj-meta', start: 'top 90%' }
      });
    }
  }

  /* ========== TAB SWITCHER ========== */
  const tabs = $$('.showcase__tab');
  const panes = $$('.showcase__pane');
  if (tabs.length && panes.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.pane;
        tabs.forEach(t => t.classList.toggle('is-active', t === tab));
        panes.forEach(p => p.classList.toggle('is-active', p.id === `pane-${target}`));
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  }

  /* ========== BEFORE/AFTER SLIDER ========== */
  const compareStage = document.getElementById('compareStage');
  const compareHandle = document.getElementById('compareHandle');
  const compareBefore = document.getElementById('compareBeforeLayer');
  const compareValue = document.getElementById('compareValue');

  if (compareStage && compareHandle && compareBefore) {
    let cmpDragging = false;

    const setCompare = (pct) => {
      const p = Math.max(0, Math.min(100, pct));
      compareBefore.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      compareHandle.style.left = `${p}%`;
      compareHandle.setAttribute('aria-valuenow', String(Math.round(p)));
      if (compareValue) compareValue.textContent = String(Math.round(p));
    };

    const handleCmpPointer = (e) => {
      const rect = compareStage.getBoundingClientRect();
      const pt = (e.touches?.[0]) || e;
      const x = pt.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setCompare(pct);
    };

    compareHandle.addEventListener('mousedown', (e) => { cmpDragging = true; e.preventDefault(); });
    compareHandle.addEventListener('touchstart', () => { cmpDragging = true; }, { passive: true });
    compareStage.addEventListener('mousedown', (e) => {
      cmpDragging = true;
      handleCmpPointer(e);
    });
    compareStage.addEventListener('touchstart', (e) => {
      cmpDragging = true;
      handleCmpPointer(e);
    }, { passive: true });
    window.addEventListener('mousemove', (e) => { if (cmpDragging) handleCmpPointer(e); });
    window.addEventListener('touchmove', (e) => { if (cmpDragging) handleCmpPointer(e); }, { passive: true });
    window.addEventListener('mouseup', () => { cmpDragging = false; });
    window.addEventListener('touchend', () => { cmpDragging = false; });

    // keyboard
    compareHandle.addEventListener('keydown', (e) => {
      const v = parseFloat(compareHandle.getAttribute('aria-valuenow') || '50');
      if (e.key === 'ArrowLeft') { setCompare(v - 2); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setCompare(v + 2); e.preventDefault(); }
    });

    // initial
    setCompare(50);
  }

  /* ========== DAY/NIGHT TOGGLE ========== */
  const dnStage = document.getElementById('dnStage');
  const dnTrack = document.getElementById('dnTrack');
  const dnKnob = document.getElementById('dnKnob');
  const dnSun = document.getElementById('dnSun');
  const dnTime = document.getElementById('dnTime');
  const dnLblDay = document.getElementById('dnLblDay');
  const dnLblNight = document.getElementById('dnLblNight');
  const dnImgDay = dnStage?.querySelector('.dn__img[data-mode="day"]');
  const dnImgNight = dnStage?.querySelector('.dn__img[data-mode="night"]');

  if (dnTrack && dnKnob && dnImgDay && dnImgNight) {
    let dnDragging = false;

    // Hours range: 07:00 → 22:00 (15-hour day)
    const formatTime = (pct) => {
      const minutes = 7 * 60 + (pct / 100) * (15 * 60);
      const h = Math.floor(minutes / 60);
      const m = Math.floor(minutes % 60);
      return `${String(h).padStart(2,'0')}:${String(Math.round(m/15)*15 % 60).padStart(2,'0')}`;
    };

    // Sun position — sun arcs across top half of stage (day) → moon at right (night)
    const positionSun = (pct) => {
      if (!dnSun || !dnStage) return;
      // x: 8% → 92%
      const x = 8 + (pct / 100) * 84;
      // y: arc — at pct 50, y is lowest (10%); at pct 0/100, y is 50%
      const arc = Math.sin((pct / 100) * Math.PI);
      const y = 60 - arc * 50; // 60 at edges, 10 at center
      dnSun.style.left = `${x}%`;
      dnSun.style.top = `${y}%`;
      // Night mode after 60%
      dnSun.classList.toggle('is-night', pct > 60);
    };

    const setDN = (pct) => {
      const p = Math.max(0, Math.min(100, pct));
      dnTrack.style.setProperty('--p', `${p}%`);
      dnKnob.style.left = `${p}%`;
      dnKnob.setAttribute('aria-valuenow', String(Math.round(p)));

      // Crossfade
      const dayOpacity = Math.max(0, 1 - (p / 70));
      const nightOpacity = Math.max(0, (p - 30) / 70);
      dnImgDay.style.opacity = dayOpacity.toFixed(2);
      dnImgNight.style.opacity = nightOpacity.toFixed(2);

      positionSun(p);

      if (dnTime) dnTime.textContent = formatTime(p);
      dnLblDay?.classList.toggle('is-active', p < 50);
      dnLblNight?.classList.toggle('is-active', p >= 50);
    };

    const handleDNPointer = (e) => {
      const rect = dnTrack.getBoundingClientRect();
      const pt = (e.touches?.[0]) || e;
      const x = pt.clientX - rect.left;
      setDN((x / rect.width) * 100);
    };

    dnKnob.addEventListener('mousedown', (e) => { dnDragging = true; e.preventDefault(); });
    dnKnob.addEventListener('touchstart', () => { dnDragging = true; }, { passive: true });
    dnTrack.addEventListener('mousedown', (e) => {
      dnDragging = true;
      handleDNPointer(e);
    });
    dnTrack.addEventListener('touchstart', (e) => {
      dnDragging = true;
      handleDNPointer(e);
    }, { passive: true });
    window.addEventListener('mousemove', (e) => { if (dnDragging) handleDNPointer(e); });
    window.addEventListener('touchmove', (e) => { if (dnDragging) handleDNPointer(e); }, { passive: true });
    window.addEventListener('mouseup', () => { dnDragging = false; });
    window.addEventListener('touchend', () => { dnDragging = false; });

    dnKnob.addEventListener('keydown', (e) => {
      const v = parseFloat(dnKnob.getAttribute('aria-valuenow') || '0');
      if (e.key === 'ArrowLeft') { setDN(v - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setDN(v + 5); e.preventDefault(); }
    });

    // Click labels to jump to extremes
    dnLblDay?.addEventListener('click', () => setDN(0));
    dnLblNight?.addEventListener('click', () => setDN(100));

    // Initial state
    setDN(0);
  }
})();

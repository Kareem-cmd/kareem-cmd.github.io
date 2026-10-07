/* =============================================================================
   AXIOLOGY — Motion choreography v2
   Proper Lenis ↔ ScrollTrigger integration. Dramatic, visible scroll motion.
   ========================================================================== */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (!window.gsap) {
    console.error('GSAP missing — falling back to static layout');
    document.documentElement.classList.remove('js-motion');
    // Dismiss loader so user isn't stuck on splash
    const ld = document.querySelector('[data-loader]');
    if (ld) ld.classList.add('is-done');
    document.documentElement.classList.remove('is-loading');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ============================ Lenis ↔ ScrollTrigger ==================== */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.6,
      lerp: 0.1
    });
    // Drive Lenis off GSAP's ticker so ScrollTrigger stays perfectly in sync.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  /* ============================ loader =================================== */
  const loader = document.querySelector('[data-loader]');
  const bar = loader && loader.querySelector('.loader__bar span');
  document.documentElement.classList.add('is-loading');
  if (lenis) lenis.stop();

  function dismissLoader() {
    if (!loader) return;
    if (bar) bar.style.width = '100%';
    setTimeout(() => {
      loader.classList.add('is-done');
      document.documentElement.classList.remove('is-loading');
      if (lenis) lenis.start();
      playHero();
      ScrollTrigger.refresh();
      // Tell carousel + any other deferred systems they can start now
      window.dispatchEvent(new CustomEvent('axiology:loaded'));
    }, 450);
  }

  if (bar) {
    let p = 0;
    const ramp = setInterval(() => {
      p = Math.min(88, p + 6 + Math.random() * 10);
      bar.style.width = p + '%';
    }, 140);
    window.addEventListener('load', () => { clearInterval(ramp); setTimeout(dismissLoader, 600); });
    setTimeout(() => { clearInterval(ramp); dismissLoader(); }, 3800);
  } else {
    window.addEventListener('load', dismissLoader);
  }

  /* ============================ custom cursor ============================ */
  const cursor = document.querySelector('[data-cursor]');
  const trail  = document.querySelector('[data-cursor-trail]');
  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const cursorPos = { x: pos.x, y: pos.y };
  const trailPos  = { x: pos.x, y: pos.y };

  if (cursor && trail && !isTouch && !reduceMotion) {
    window.addEventListener('mousemove', (e) => { pos.x = e.clientX; pos.y = e.clientY; });

    function tickCursor() {
      cursorPos.x += (pos.x - cursorPos.x) * 0.35;
      cursorPos.y += (pos.y - cursorPos.y) * 0.35;
      trailPos.x  += (pos.x - trailPos.x)  * 0.14;
      trailPos.y  += (pos.y - trailPos.y)  * 0.14;
      cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0) translate(-50%, -50%)`;
      trail.style.transform  = `translate3d(${trailPos.x}px,  ${trailPos.y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tickCursor);
    }
    tickCursor();

    document.querySelectorAll('a, button, [data-magnetic], [data-card]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-link'));
    });
  }

  /* ============================ magnetic CTAs ============================ */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.32;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top  - r.height / 2) * strength;
        gsap.to(el, { x, y, duration: 0.45, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)' }));
    });
  }

  /* ============================ smooth anchors =========================== */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ============================ hero letter split (all slides) =========== */
  function splitTitles() {
    const titles = document.querySelectorAll('.hero__title[data-split-letters]');
    const lang = document.documentElement.getAttribute('data-lang') || 'en';
    const splitMode = lang === 'ar' ? 'word' : 'char';

    titles.forEach((title) => {
      if (title.dataset.splitDone === '1') return;

      let idx = 0;
      const walk = (node) => {
        if (node.nodeType === 3) {
          const text = node.textContent;
          const frag = document.createDocumentFragment();
          if (splitMode === 'word') {
            const words = text.split(/(\s+)/);
            for (const w of words) {
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); continue; }
              if (!w) continue;
              const sp = document.createElement('span');
              sp.className = 'char';
              sp.textContent = w;
              sp.style.setProperty('--i', idx++);
              frag.appendChild(sp);
            }
          } else {
            for (const ch of text) {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); idx++; }
              else if (ch === '\n' || ch === '\t') { frag.appendChild(document.createTextNode(' ')); }
              else {
                const sp = document.createElement('span');
                sp.className = 'char';
                sp.textContent = ch;
                sp.style.setProperty('--i', idx++);
                frag.appendChild(sp);
              }
            }
          }
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && !node.classList.contains('char')) {
          Array.from(node.childNodes).forEach(walk);
        }
      };
      Array.from(title.childNodes).forEach(walk);
      title.dataset.splitDone = '1';
      requestAnimationFrame(() => title.classList.add('is-in'));
    });
  }

  splitTitles();
  window.addEventListener('axiology:langchange', () => {
    document.querySelectorAll('.hero__title[data-split-letters]').forEach((t) => {
      delete t.dataset.splitDone;
      t.classList.remove('is-in');
    });
    splitTitles();
  });

  /* ============================ hero intro (active slide only) =========== */
  function playHero() {
    const active = document.querySelector('.hero__slide.is-active');
    if (!active) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo(active.querySelector('.hero__media'), { scale: 1.28 }, { scale: 1.18, duration: 2.0, ease: 'power3.out' }, 0)
      .fromTo('.hero__veil',  { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .fromTo('.hero__canvas',{ opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.4)
      .fromTo(active.querySelector('.hero__eyebrow'),     { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.0 }, 0.35)
      .fromTo(active.querySelector('.hero__lede'),        { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1 }, 0.95)
      .fromTo(active.querySelector('.hero__cta-row'),     { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.0 }, 1.15)
      .fromTo(active.querySelector('.hero__support-row'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 1.35)
      .fromTo('.hero__scroll', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9 }, 1.55)
      .fromTo('.hero__nav',    { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.9 }, 1.4);
  }

  /* ============================ hero parallax now lives in hero-carousel.js */

  /* ============================ scroll progress ========================== */
  const progress = document.querySelector('[data-scroll-progress] span');
  if (progress) {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (st) => { progress.style.width = (st.progress * 100).toFixed(2) + '%'; }
    });
  }

  /* ============================ cursor oil drop ========================== */
  const dropEl = document.querySelector('[data-cursor-drop]');
  const dropPos = { x: pos.x, y: pos.y };
  if (dropEl && !isTouch && !reduceMotion) {
    let lastMove = performance.now();
    let visible = false;
    window.addEventListener('mousemove', () => { lastMove = performance.now(); });
    function tickDrop() {
      dropPos.x += (pos.x - dropPos.x) * 0.06;
      dropPos.y += (pos.y - dropPos.y + 18) * 0.06; // drift slightly down
      const idle = performance.now() - lastMove > 1200;
      if (idle && !visible) { dropEl.classList.add('is-visible'); visible = true; }
      if (!idle && visible) { dropEl.classList.remove('is-visible'); visible = false; }
      dropEl.style.transform = `translate3d(${dropPos.x}px, ${dropPos.y}px, 0) translate(-50%, -50%) rotate(${(pos.x - dropPos.x) * 0.5}deg)`;
      requestAnimationFrame(tickDrop);
    }
    tickDrop();
  }

  /* ============================ dark-section cursor swap ================ */
  // Swap cursor color over dark sections
  document.querySelectorAll('[data-section]').forEach((sec) => {
    const isDark = ['hero', 'story', 'trust', 'bottle3d', 'narrative'].includes(sec.dataset.section);
    if (!isDark) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top center',
      end: 'bottom center',
      onEnter:    () => { cursor && cursor.classList.add('is-on-dark'); trail && trail.classList.add('is-on-dark'); },
      onLeave:    () => { cursor && cursor.classList.remove('is-on-dark'); trail && trail.classList.remove('is-on-dark'); },
      onEnterBack:() => { cursor && cursor.classList.add('is-on-dark'); trail && trail.classList.add('is-on-dark'); },
      onLeaveBack:() => { cursor && cursor.classList.remove('is-on-dark'); trail && trail.classList.remove('is-on-dark'); }
    });
  });

  /* ============================ product card 3D tilt ===================== */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('.product-card').forEach((card) => {
      const media = card.querySelector('.product-card__media');
      if (!media) return;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        gsap.to(media, {
          rotateY: x * 9,
          rotateX: -y * 9,
          duration: 0.5, ease: 'power3.out'
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(media, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ============================ nav state ================================ */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    ScrollTrigger.create({
      start: 'top top-=10',
      end: 99999,
      onUpdate: (st) => { if (st.scroll() > 24) nav.classList.add('is-stuck'); else nav.classList.remove('is-stuck'); }
    });
    document.querySelectorAll('[data-section]').forEach((sec) => {
      const dark = sec.dataset.section === 'hero' || sec.dataset.section === 'trust';
      ScrollTrigger.create({
        trigger: sec,
        start: 'top top+=40',
        end: 'bottom top+=40',
        onToggle: (st) => { if (st.isActive) { if (dark) nav.classList.add('is-dark'); else nav.classList.remove('is-dark'); } }
      });
    });
  }

  /* ============================ marquee continuous ======================= */
  // pure CSS animation already drives it; no JS needed.

  /* ============================ PRODUCTS: stagger reveal ================= */
  gsap.set('.product-card', { y: 80, opacity: 0 });
  ScrollTrigger.batch('.product-card', {
    start: 'top 85%',
    onEnter: (els) => gsap.to(els, {
      y: 0, opacity: 1, duration: 1.0, stagger: 0.12, ease: 'expo.out', overwrite: true
    })
  });

  // products head — title + sub
  gsap.set('.products__title, .products__sub', { y: 50, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.products',
    start: 'top 75%',
    onEnter: () => gsap.to('.products__title, .products__sub', {
      y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'expo.out'
    })
  });

  /* ============================ COLLECTIONS: tile drop ===================*/
  gsap.set('.collection-tile', { y: 70, opacity: 0, scale: 0.97 });
  ScrollTrigger.batch('.collection-tile', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, {
      y: 0, opacity: 1, scale: 1,
      duration: 1.0, stagger: 0.08, ease: 'expo.out', overwrite: true
    })
  });

  // collections heading
  gsap.set('.collections__head > *', { y: 40, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.collections',
    start: 'top 80%',
    onEnter: () => gsap.to('.collections__head > *', {
      y: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: 'expo.out'
    })
  });

  // gentle parallax inside tiles
  gsap.utils.toArray('.collection-tile img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.closest('.collection-tile'), start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ============================ FEATURE: image scrub ===================== */
  const featureImg = document.querySelector('.feature__media img');
  if (featureImg) {
    gsap.fromTo(featureImg, { scale: 1.2 }, {
      scale: 1.0, ease: 'none',
      scrollTrigger: { trigger: '.feature', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }
  gsap.set('.feature__copy > *', { y: 50, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.feature__copy',
    start: 'top 78%',
    onEnter: () => gsap.to('.feature__copy > *', {
      y: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: 'expo.out'
    })
  });

  /* ============================ RITUAL: cards bounce in ================== */
  gsap.set('.ritual__head > *, .ritual-item', { y: 60, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.ritual',
    start: 'top 75%',
    onEnter: () => {
      gsap.to('.ritual__head > *', { y: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: 'expo.out' });
      gsap.to('.ritual-item', { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'expo.out', delay: 0.25 });
    }
  });

  /* ============================ TRUST: metrics + count-up =============== */
  gsap.set('.trust__head > *, .metric', { y: 60, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.trust',
    start: 'top 72%',
    onEnter: () => {
      gsap.to('.trust__head > *', { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'expo.out' });
      gsap.to('.metric', { y: 0, opacity: 1, duration: 1.0, stagger: 0.15, ease: 'expo.out', delay: 0.2 });

      // count-up
      document.querySelectorAll('[data-count]').forEach((el) => {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.querySelector('em') ? el.querySelector('em').outerHTML : '';
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: 'expo.out',
          onUpdate: () => {
            const n = Math.round(obj.v);
            const formatted = target >= 1000 ? n.toLocaleString() : n;
            el.innerHTML = formatted + suffix;
          }
        });
      });
    }
  });

  /* ============================ TESTIMONIALS: portraits drop ============= */
  gsap.set('.portrait--left .portrait__img', { clipPath: 'inset(0 0 100% 0)' });
  gsap.set('.portrait--right .portrait__img', { clipPath: 'inset(100% 0 0 0)' });
  gsap.set('.portrait figcaption, .pullquote .mark, .pullquote p, .testimonials__eyebrow', { opacity: 0, y: 24 });

  ScrollTrigger.create({
    trigger: '.testimonials',
    start: 'top 70%',
    onEnter: () => {
      gsap.to('.testimonials__eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
      gsap.to('.portrait--left .portrait__img',  { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'expo.out', delay: 0.15 });
      gsap.to('.portrait--right .portrait__img', { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.out', delay: 0.30 });
      gsap.to('.portrait figcaption', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out', delay: 0.6 });
      gsap.to('.pullquote .mark', { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'back.out(1.6)', delay: 0.3 });
      gsap.to('.pullquote p', { opacity: 1, y: 0, duration: 1.0, ease: 'expo.out', delay: 0.5 });
    }
  });

  /* ============================ CTA ====================================== */
  gsap.set('.cta__eyebrow, .cta__title, .cta .btn, .cta__support', { y: 50, opacity: 0 });
  gsap.set('.cta__drop', { opacity: 0, y: -140, rotate: -8 });

  ScrollTrigger.create({
    trigger: '.cta',
    start: 'top 75%',
    onEnter: () => {
      gsap.to('.cta__eyebrow, .cta__title, .cta .btn, .cta__support', {
        y: 0, opacity: 1, duration: 1.0, stagger: 0.12, ease: 'expo.out'
      });
      gsap.to('.cta__drop', {
        opacity: 1, y: 0, rotate: 0, duration: 1.6, ease: 'expo.out', delay: 0.2
      });
    }
  });

  /* ============================ STORY (NEW) ============================= */
  const storyBg = document.querySelector('.story__bg');
  if (storyBg) {
    gsap.fromTo(storyBg, { scale: 1.18, yPercent: -8 }, {
      scale: 1.0, yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }
  gsap.set('.story__copy > *, .story__signature > *', { y: 50, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.story',
    start: 'top 70%',
    onEnter: () => {
      gsap.to('.story__copy > *', { y: 0, opacity: 1, duration: 1.0, stagger: 0.12, ease: 'expo.out' });
      gsap.to('.story__signature > *', { y: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: 'expo.out', delay: 0.5 });
    }
  });

  /* ============================ PRESS (NEW) ============================= */
  gsap.set('.press__eyebrow, .press__name', { y: 30, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.press',
    start: 'top 80%',
    onEnter: () => {
      gsap.to('.press__eyebrow', { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' });
      gsap.to('.press__name', { y: 0, opacity: 0.7, duration: 0.8, stagger: 0.08, ease: 'expo.out', delay: 0.15 });
    }
  });

  /* ============================ NEWSLETTER (NEW) ======================== */
  const newsBg = document.querySelector('.newsletter__media');
  if (newsBg) {
    gsap.fromTo(newsBg, { scale: 1.12 }, {
      scale: 1.0, ease: 'none',
      scrollTrigger: { trigger: '.newsletter', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }
  gsap.set('.newsletter__copy > *', { y: 40, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.newsletter',
    start: 'top 70%',
    onEnter: () => gsap.to('.newsletter__copy > *', {
      y: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: 'expo.out'
    })
  });

  // Newsletter form fake submit
  const form = document.querySelector('[data-newsletter]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const btn = form.querySelector('button span');
      const lang = document.documentElement.getAttribute('data-lang') || 'en';
      if (!input.value || !/^[^@]+@[^@]+\.[^@]+$/.test(input.value)) {
        input.focus();
        gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
        return;
      }
      btn.textContent = lang === 'ar' ? 'تم ✓' : 'Done ✓';
      input.value = '';
      input.placeholder = lang === 'ar' ? 'كود الخصم في طريقه...' : 'Your code is on the way…';
      setTimeout(() => { btn.textContent = lang === 'ar' ? 'اشترك' : 'Subscribe'; }, 3500);
    });
  }

  /* ============================ MOBILE MENU ============================== */
  const menuBtn = document.querySelector('[data-menu-toggle]');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.documentElement.classList.toggle('is-menu-open');
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
    document.querySelectorAll('.drawer__link').forEach((a) => {
      a.addEventListener('click', () => {
        document.documentElement.classList.remove('is-menu-open');
        if (lenis) lenis.start();
      });
    });
  }

  /* ============================ HORIZONTAL SCROLL (pinned) ============== */
  const hscrollSec = document.querySelector('[data-hscroll]');
  const hscrollTrack = document.querySelector('[data-hscroll-track]');
  const hscrollFill = document.querySelector('[data-hscroll-fill]');
  if (hscrollSec && hscrollTrack && !isTouch) {
    const calcDistance = () => Math.max(0, hscrollTrack.scrollWidth - window.innerWidth + 80);
    let distance = calcDistance();
    window.addEventListener('resize', () => { distance = calcDistance(); ScrollTrigger.refresh(); });

    gsap.to(hscrollTrack, {
      x: () => -calcDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: hscrollSec,
        start: 'top top',
        end: () => `+=${calcDistance() + window.innerHeight * 0.6}`,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (st) => {
          if (hscrollFill) hscrollFill.style.width = (st.progress * 100).toFixed(2) + '%';
        }
      }
    });

    // Stagger panel reveal as they enter
    gsap.utils.toArray('.hscroll__panel .hscroll__caption').forEach((cap) => {
      gsap.from(cap.children, {
        opacity: 0, y: 30, duration: 0.8, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: cap.closest('.hscroll__panel'), start: 'left 60%', containerAnimation: ScrollTrigger.getById('hscroll-anim') || undefined }
      });
    });
  }

  /* ============================ PINNED NARRATIVE ======================== */
  const narrativeSec = document.querySelector('[data-narrative]');
  if (narrativeSec) {
    const chapters = gsap.utils.toArray('.narrative__chapter', narrativeSec);
    const frames   = gsap.utils.toArray('.narrative__frame', narrativeSec);

    function setActive(idx) {
      chapters.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      frames.forEach((f, i)   => f.classList.toggle('is-active', i === idx));
    }
    setActive(0);

    chapters.forEach((ch, i) => {
      ScrollTrigger.create({
        trigger: ch,
        start: 'top center',
        end:   'bottom center',
        onEnter:     () => setActive(i),
        onEnterBack: () => setActive(i)
      });
    });
  }

  /* ============================ OIL SWEEP TRANSITIONS =================== */
  // Add .is-sweep when section enters viewport — triggers the golden edge
  document.querySelectorAll('[data-section]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 92%',
      onEnter: () => sec.classList.add('is-sweep'),
      onEnterBack: () => sec.classList.add('is-sweep')
    });
  });

  /* ============================ 3D BOTTLE SECTION REVEAL =============== */
  const bottle3dSec = document.querySelector('[data-section="bottle3d"]');
  if (bottle3dSec) {
    gsap.from('.bottle3d__copy > *', {
      opacity: 0, y: 36, duration: 1.0, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: { trigger: bottle3dSec, start: 'top 70%' }
    });
    gsap.from('.bottle3d__list li', {
      opacity: 0, x: -20, duration: 0.8, stagger: 0.08, ease: 'expo.out',
      scrollTrigger: { trigger: '.bottle3d__list', start: 'top 80%' }
    });
  }

  /* ============================ LANG CHANGE → refresh =================== */
  window.addEventListener('axiology:langchange', () => {
    // Allow CSS direction switch to settle, then recompute triggers
    setTimeout(() => ScrollTrigger.refresh(), 60);
  });

  /* ============================ refresh ================================== */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 1200);
})();

/* ════════════════════════════════════════════════════════════════
   CHAMELO — Main Script
   ──────────────────────────────────────────────────────────────
     - SPA routing (data-page switching)
     - Bilingual EN/AR toggle with RTL swap
     - Hero master GSAP timeline (Hunt Map)
     - Crosshair mouse-follow
     - Stat number counters
     - Live coordinate rotation
     - ScrollTrigger pin for Hero exit
     - Loader dismiss
   ════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ┌─ GSAP register ─────────────────────────────────────────────┐
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);
  }

  // ┌─ Helpers ───────────────────────────────────────────────────┐
  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ┌─ State ─────────────────────────────────────────────────────┐
  const state = {
    lang: 'en',
    route: 'home',
    crosshair: {
      el: null,
      x: 0, y: 0, tx: 0, ty: 0
    }
  };

  // ┌─ Multi-page router — 6 pages, each a group of section wrappers ─┐
  // Every .section--X wrapper is self-contained. A "page" shows its group
  // and hides the rest; sub-routes deep-link to a block within a page.
  const ALL_SECTION_IDS = ['home','about','approach','services','work','projects','chamstudio','insights','diagnostic','contact'];

  const PAGE_GROUPS = {
    home:       ['home'],
    about:      ['about', 'approach'],      // About + How We Work
    services:   ['services', 'insights'],   // Services + Insights
    work:       ['work', 'projects'],       // Featured deck + Projects archive
    chamstudio: ['chamstudio'],
    contact:    ['contact', 'diagnostic'],  // Contact form + brand-audit tool
  };

  // any data-route value (incl. legacy/deep links) → the page that owns it
  const ROUTE_TO_PAGE = {
    home: 'home',
    about: 'about', approach: 'about',
    services: 'services', insights: 'services',
    work: 'work', projects: 'work',
    chamstudio: 'chamstudio',
    contact: 'contact', diagnostic: 'contact',
  };
  // routes that point deeper than a page's first block scroll to this element
  const ROUTE_SUBTARGET = { approach: 'approach', insights: 'insights', projects: 'projects', diagnostic: 'diagnostic' };

  const PAGE_ACCENT = { home: 'red', about: 'red', services: 'amber', work: 'red', chamstudio: 'amber', contact: 'teal' };

  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentPage = null;

  function setActiveNav(page) {
    state.route = page;
    document.documentElement.dataset.accent = PAGE_ACCENT[page] || 'red';
    document.querySelectorAll('.nav__menu a[data-route], .mobile-menu__nav a[data-route]').forEach(link => {
      link.dataset.active = (ROUTE_TO_PAGE[link.dataset.route] === page).toString();
    });
  }

  // One-time: move #diagnostic to sit AFTER #contact so the Contact page leads
  // with the form, then the brand-audit tool below it.
  function orderContactPage() {
    const diag = document.getElementById('diagnostic');
    const contact = document.getElementById('contact');
    if (!diag || !contact) return;
    if (diag.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING) {
      contact.parentNode.insertBefore(diag, contact.nextSibling);
    }
  }

  // Full-screen scan-wipe — the "dossier cut" between pages.
  let pageWipe = null;
  function ensureWipe() {
    if (pageWipe) return pageWipe;
    pageWipe = document.createElement('div');
    pageWipe.id = 'pageWipe';
    pageWipe.setAttribute('aria-hidden', 'true');
    pageWipe.innerHTML =
      '<span class="page-wipe__edge"></span>' +
      '<div class="page-wipe__plate">' +
        '<span class="page-wipe__meta">OPENING FILE</span>' +
        '<span class="page-wipe__name"><b class="page-wipe__num">00</b> <span class="page-wipe__title">HOME</span></span>' +
      '</div>';
    document.body.appendChild(pageWipe);
    return pageWipe;
  }

  const PAGE_LABEL = {
    home:       { n: '01', t: 'HOME' },
    about:      { n: '02', t: 'ABOUT' },
    services:   { n: '03', t: 'SERVICES' },
    work:       { n: '04', t: 'WORK' },
    chamstudio: { n: '05', t: 'CHAMSTUDIO' },
    contact:    { n: '06', t: 'CONTACT' },
  };
  function setWipeLabel(page) {
    if (!pageWipe) return;
    const lbl = PAGE_LABEL[page] || { n: '00', t: '' };
    const num = pageWipe.querySelector('.page-wipe__num');
    const title = pageWipe.querySelector('.page-wipe__title');
    if (num) num.textContent = lbl.n;
    if (title) title.textContent = lbl.t;
  }

  function scrollTopNow() {
    if (window.lenis) { try { window.lenis.scrollTo(0, { immediate: true }); } catch (e) {} }
    window.scrollTo(0, 0);
  }
  function scrollToEl(id) {
    const el = document.getElementById(id);
    if (!el) return;
    requestAnimationFrame(() => {
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 76);
      if (window.lenis) window.lenis.scrollTo(top, { duration: 0.9 });
      else window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  function applyPageDisplay(page) {
    const group = PAGE_GROUPS[page] || ['home'];
    ALL_SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = group.includes(id) ? '' : 'none';
      el.classList.remove('page-lead');
    });
    const lead = document.getElementById(group[0]);
    if (lead) lead.classList.add('page-lead');
  }

  // After a swap: recompute scroll metrics + force any in-view reveal visible.
  function settlePage(page) {
    if (window.lenis && typeof window.lenis.resize === 'function') { try { window.lenis.resize(); } catch (e) {} }
    if (typeof ScrollTrigger !== 'undefined') { try { ScrollTrigger.refresh(); } catch (e) {} }
    (PAGE_GROUPS[page] || []).forEach(id => {
      const sec = document.getElementById(id);
      if (!sec) return;
      sec.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) {
          el.style.opacity = ''; el.style.transform = '';
        }
      });
    });
  }

  // Light staggered intro for a freshly shown page's leading block.
  function playPageIntro(page) {
    if (prefersReduced() || typeof gsap === 'undefined') return;
    if (page === 'home') return;            // hero owns its own intro
    const group = PAGE_GROUPS[page] || [];
    const first = document.getElementById(group[0]);
    if (!first) return;
    const hero = first.querySelector('.about-hero, .chamstudio-hero, .diagnostic-hero') || first;
    const kids = hero.children;
    if (!kids || !kids.length) return;
    gsap.killTweensOf(kids);
    gsap.fromTo(kids, { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.06, overwrite: 'auto' });
  }

  function showPage(page, opts = {}) {
    if (!PAGE_GROUPS[page]) page = 'home';
    const sub = opts.sub || null;
    if (page === currentPage) {             // already here → just move within it
      if (sub) scrollToEl(sub); else scrollTopNow();
      return;
    }
    const commit = () => {
      applyPageDisplay(page);
      scrollTopNow();
      setActiveNav(page);
      settlePage(page);
      if (sub) scrollToEl(sub);
      playPageIntro(page);
      currentPage = page;
      document.dispatchEvent(new CustomEvent('chamelo:pagechange', { detail: { page } }));
    };
    if (opts.instant || prefersReduced() || typeof gsap === 'undefined') { commit(); return; }
    const wipe = ensureWipe();
    setWipeLabel(page);
    const plate = wipe.querySelector('.page-wipe__plate');
    // Visual wipe (best-effort — animation ticker may pause in a hidden tab)…
    gsap.timeline()
      .set(wipe, { autoAlpha: 1, scaleY: 0, transformOrigin: 'top center' })
      .set(plate, { autoAlpha: 0, y: 14, letterSpacing: '0.5em' })
      .to(wipe, { scaleY: 1, duration: 0.24, ease: 'power3.in' })
      .to(plate, { autoAlpha: 1, y: 0, letterSpacing: '0.34em', duration: 0.26, ease: 'power2.out' }, '-=0.08')
      .set(wipe, { transformOrigin: 'bottom center' })
      .to(plate, { autoAlpha: 0, duration: 0.18, ease: 'power1.in' }, '+=0.14')
      .to(wipe, { scaleY: 0, duration: 0.42, ease: 'power3.out' }, '-=0.04')
      .set(wipe, { autoAlpha: 0 });
    // …but commit the swap on a real timer so it never depends on the ticker.
    setTimeout(commit, 250);
  }

  function renderRoute(route) {
    const page = ROUTE_TO_PAGE[route] || 'home';
    showPage(page, { sub: ROUTE_SUBTARGET[route] || null });
  }

  function navigate(route) {
    if (location.hash.slice(1) !== route) location.hash = route;  // fires hashchange → render
    else renderRoute(route);                                      // unchanged → render directly
  }

  function initRouting() {
    orderContactPage();
    ensureWipe();

    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (!link) return;
      const route = link.dataset.route;
      if (!ROUTE_TO_PAGE[route]) return;
      e.preventDefault();
      navigate(route);
    });

    window.addEventListener('hashchange', () => {
      const route = location.hash.slice(1);
      renderRoute(ROUTE_TO_PAGE[route] ? route : 'home');
    });

    // Initial paint — resolve hash (or home), no transition.
    const initial = location.hash.slice(1);
    const route = ROUTE_TO_PAGE[initial] ? initial : 'home';
    showPage(ROUTE_TO_PAGE[route], { sub: ROUTE_SUBTARGET[route] || null, instant: true });
  }

  // Scroll-spy is obsolete in paged mode (one page visible at a time).
  function initScrollSpy() { /* no-op — active nav is set on page change */ }

  // ┌─ Language Toggle ───────────────────────────────────────────┐
  function setLanguage(lang) {
    state.lang = lang;
    const html = document.documentElement;
    html.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('data-lang', lang);

    // Swap bilingual text in [data-en][data-ar] nodes
    $$('[data-en], [data-ar]').forEach(el => {
      const en = el.getAttribute('data-en');
      const ar = el.getAttribute('data-ar');
      if (lang === 'ar' && ar !== null) el.textContent = ar;
      else if (en !== null) el.textContent = en;
    });

    // Toggle button labels
    const current = $('#langCurrent');
    const other   = $('#langOther');
    if (current && other) {
      current.textContent = lang.toUpperCase();
      other.textContent = lang === 'ar' ? 'EN' : 'AR';
    }

    // Let interactive modules (e.g. brand slider) re-anchor to the new direction
    document.dispatchEvent(new CustomEvent('chamelo:langchange', { detail: { lang } }));
  }

  function initLanguageToggle() {
    const btn = $('#langToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      setLanguage(state.lang === 'en' ? 'ar' : 'en');
    });
  }

  // ┌─ Theme toggle (dark / light) ──────────────────────────────┐
  const THEME_KEY = 'chamelo:theme';
  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    state.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    // Update browser chrome colour
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f5f1e8' : '#0a0a0a');
  }
  function initThemeToggle() {
    // Dark theme only — light mode removed.
    applyTheme('dark');
  }

  // ┌─ Loader: animate progress + dismiss when ready ─────────────┐
  function dismissLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const fill = document.getElementById('loaderBarFill');
    const pct  = document.getElementById('loaderPercent');

    // Phase 1: animate progress to 90% over 1.4s (regardless of real load state)
    let percent = 0;
    const target1 = 90;
    const step = () => {
      if (percent < target1) {
        // Ease-out: bigger steps early, slower near target
        const delta = Math.max(0.6, (target1 - percent) * 0.06);
        percent = Math.min(target1, percent + delta);
        if (fill) fill.style.width = percent + '%';
        if (pct)  pct.textContent  = Math.round(percent) + '%';
        requestAnimationFrame(step);
      }
    };
    step();

    // Phase 2: when window has fully loaded (or after a max wait), finish to 100% and fade out
    const finish = () => {
      let p = percent;
      const finalStep = () => {
        if (p < 100) {
          p = Math.min(100, p + 2.5);
          if (fill) fill.style.width = p + '%';
          if (pct)  pct.textContent  = Math.round(p) + '%';
          requestAnimationFrame(finalStep);
        } else {
          setTimeout(() => loader.setAttribute('data-done', 'true'), 300);
        }
      };
      finalStep();
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 1400);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 700), { once: true });
      // Safety fallback in case load event never fires
      setTimeout(finish, 4500);
    }
  }

  // ┌─ Three.js Hero Mount ───────────────────────────────────────┐
  // The Three.js scene was the legacy "Hunt Map" hero. We now use a static
  // master image, so the canvas is hidden via the `hidden` attribute on
  // #heroCanvas. Skip mounting entirely to save GPU/CPU.
  function mountHero() {
    const mount = $('#heroCanvas');
    if (!mount || mount.hidden) return;     // skip — master image is the hero
    if (!window.ChameloHero) return;
    window.ChameloHero.init(mount);
  }

  // ┌─ Crosshair Mouse Follow ────────────────────────────────────┐
  function initCrosshair() {
    const el = $('#crosshairWrap');
    if (!el) return;
    state.crosshair.el = el;

    // Base position from current CSS
    const rect = el.getBoundingClientRect();
    state.crosshair.x = state.crosshair.tx = rect.left + rect.width / 2;
    state.crosshair.y = state.crosshair.ty = rect.top + rect.height / 2;

    // Capture offset from base when mouse moves
    const heroEl = $('#hero');
    if (!heroEl) return;

    heroEl.addEventListener('mousemove', (e) => {
      const heroRect = heroEl.getBoundingClientRect();
      // Original anchor in % terms (from CSS: right: 24%, top: 50%)
      const isRtl = document.documentElement.dir === 'rtl';
      const anchorX = isRtl
        ? heroRect.left + heroRect.width * 0.24
        : heroRect.left + heroRect.width * 0.76;
      const anchorY = heroRect.top + heroRect.height * 0.50;

      // Offset (max ±60px)
      const dx = (e.clientX - anchorX) * 0.06;
      const dy = (e.clientY - anchorY) * 0.06;
      state.crosshair.tx = Math.max(-60, Math.min(60, dx));
      state.crosshair.ty = Math.max(-50, Math.min(50, dy));
    });

    // Animation loop
    function tick() {
      state.crosshair.x = lerp(state.crosshair.x, state.crosshair.tx, 0.08);
      state.crosshair.y = lerp(state.crosshair.y, state.crosshair.ty, 0.08);
      el.style.transform = `translate(${state.crosshair.x}px, calc(-50% + ${state.crosshair.y}px))`;
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ┌─ Tracking Chameleon Eye ────────────────────────────────────┐
  //   The 360° turret eye: pupil + iris follow the cursor with a
  //   parallax lerp (pupil travels further than the iris). It watches
  //   before it moves — the single precise strike.
  function initHeroEye() {
    const eye = $('#heroEye');
    if (!eye) return;
    const pupil = eye.querySelector('.hero-eye__pupil');
    const iris  = eye.querySelector('.hero-eye__iris');
    if (!pupil || !iris) return;

    // Honour reduced-motion: leave the eye centred and still.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const MAX_PUPIL = 20;   // svg user units the pupil may stray
    const MAX_IRIS  = 9;    // iris drifts less → depth
    let tx = 0, ty = 0;     // target offset, normalised to unit circle
    let px = 0, py = 0;     // current offset, lerped

    window.addEventListener('mousemove', (e) => {
      const r = eye.getBoundingClientRect();
      let nx = (e.clientX - (r.left + r.width  / 2)) / (r.width  * 1.6);
      let ny = (e.clientY - (r.top  + r.height / 2)) / (r.height * 1.6);
      const mag = Math.hypot(nx, ny);
      if (mag > 1) { nx /= mag; ny /= mag; }   // clamp into the unit circle
      tx = nx; ty = ny;
    }, { passive: true });

    (function tick() {
      px = lerp(px, tx, 0.12);
      py = lerp(py, ty, 0.12);
      iris.style.transform  = `translate(${px * MAX_IRIS}px, ${py * MAX_IRIS}px)`;
      pupil.style.transform = `translate(${px * MAX_PUPIL}px, ${py * MAX_PUPIL}px)`;
      requestAnimationFrame(tick);
    })();
  }

  // ┌─ Stat Number Counters ──────────────────────────────────────┐
  function animateStatNumbers() {
    if (typeof gsap === 'undefined') return;
    $$('.stat__value[data-target]').forEach(el => {
      const target = parseFloat(el.dataset.target);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        delay: 3.0,
        onUpdate: () => {
          el.textContent = prefix + obj.val.toFixed(1) + suffix;
        }
      });
    });
  }

  // ┌─ Live Coordinate Rotation ──────────────────────────────────┐
  const coordPools = {
    nw: ['38.4°N · 12.7°E', '41.9°N · 8.6°W', '34.0°N · 18.4°E', '36.7°N · 3.1°W', '40.1°N · 22.4°E'],
    ne: ['58°N · 27°W', '52°N · 14°E', '47°N · 39°E', '61°N · 2°W', '55°N · 18°E'],
    sw: ['51.5°N · 0.1°W', '48.9°N · 2.4°E', '50.1°N · 8.7°E', '52.3°N · 13.4°E', '45.4°N · 9.2°E'],
    se: ['12.5°N · 75.3°E', '24.7°N · 46.7°E', '30.0°N · 31.2°E', '18.1°N · 56.4°E', '21.4°N · 39.8°E']
  };
  function rotateCoordinates() {
    setInterval(() => {
      ['coordTL', 'coordTR', 'coordBL', 'coordBR'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const seed = el.dataset.coordSeed;
        const pool = coordPools[seed];
        if (!pool) return;
        const current = el.textContent;
        let next = current;
        // Pick a different value
        while (next === current) next = pool[Math.floor(Math.random() * pool.length)];
        // Flicker swap
        if (typeof gsap !== 'undefined') {
          gsap.to(el, {
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
              el.textContent = next;
              gsap.to(el, { opacity: 1, duration: 0.3 });
            }
          });
        } else {
          el.textContent = next;
        }
      });
    }, 7000);
  }

  // ┌─ Hero Master GSAP Timeline ─────────────────────────────────┐
  function runHeroIntro() {
    if (typeof gsap === 'undefined') return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 0.0 - Canvas fade in
    tl.from('#heroCanvas', { opacity: 0, duration: 0.6 }, 0)
      // 0.3 - Grain
      .to('.hero__grain', { opacity: 0.18, duration: 1.2 }, 0.3)
      // 0.4 - Grid materializes (via uniform)
      .to({}, {
        duration: 1.2,
        onStart: () => {
          if (!window.ChameloHero || !window.ChameloHero.uniforms.grid) return;
          gsap.to(window.ChameloHero.uniforms.grid.uOpacity, {
            value: 0.32,
            duration: 1.4,
            ease: 'power2.out'
          });
        }
      }, 0.4)
      // 0.8 - Compasses
      .from('.compass', {
        opacity: 0,
        scale: 0.6,
        stagger: 0.12,
        duration: 0.8,
        ease: 'back.out(1.6)'
      }, 0.8)
      // 1.0 - Header strip + coordinates
      .from('.hero__strip--top > *', { opacity: 0, y: -10, stagger: 0.08, duration: 0.5 }, 1.0)
      .from('.hero__strip--bottom > *', { opacity: 0, y: 10, stagger: 0.08, duration: 0.5 }, 1.1)
      .from('.coord-cluster .coord-readout', { opacity: 0, x: -10, stagger: 0.1, duration: 0.5 }, 1.2)
      // 1.4 - Chameleon enters
      .to({}, {
        duration: 1.2,
        onStart: () => {
          if (!window.ChameloHero) return;
          // Animate chameleon material opacity + scale-in
          gsap.fromTo(window.ChameloHero.uniforms.chameleon.uOpacity,
            { value: 0 }, { value: 1, duration: 1.0, ease: 'power2.out' });
          gsap.fromTo(window.ChameloHero.target,
            { chameleonScale: 0.5 },
            { chameleonScale: 1.0, duration: 1.2, ease: 'back.out(1.4)' });
          // Eye pupils fade in a touch after the chameleon body
          if (window.ChameloHero.eyes) {
            gsap.fromTo(window.ChameloHero.eyes,
              { opacity: 0 },
              { opacity: 1, duration: 0.8, delay: 0.4, ease: 'power2.out' });
          }
          // Particles stay invisible — clean grid look (per moodboard).
          // To bring them back: set value to 0.45 here.
          gsap.set(window.ChameloHero.uniforms.particles.uOpacity, { value: 0 });
        }
      }, 1.4)
      // 1.8 - Crosshair draws in
      .from('.crosshair-wrap', { opacity: 0, scale: 0.7, duration: 0.9 }, 1.8)
      .from('.crosshair__ring', { strokeDashoffset: 800, duration: 1.0, ease: 'power2.inOut' }, 1.9)
      .from('.crosshair__line', { scaleX: 0, scaleY: 0, transformOrigin: 'center', stagger: 0.08, duration: 0.4 }, 2.0)
      .from('.crosshair__tag', { opacity: 0, stagger: 0.1, duration: 0.4 }, 2.3)
      // 2.2 - Main heading
      .from('.hero__h1 .word', {
        yPercent: 100,
        opacity: 0,
        stagger: 0.08,
        duration: 0.9,
        ease: 'power4.out'
      }, 2.2)
      // 2.7 - Arabic heading
      .from('.hero__h1-ar .word, .hero__h1-ar .bullet', {
        x: -30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7
      }, 2.7)
      // 2.9 - Stats column
      .from('.stat', { x: 30, opacity: 0, stagger: 0.12, duration: 0.6 }, 2.9)
      .from('.stat__bars span', {
        height: 0,
        stagger: { each: 0.04, from: 'start' },
        duration: 0.5,
        ease: 'power2.out'
      }, 3.0)
      // 3.4 - CTA
      .from('.hero__cta', { y: 20, opacity: 0, scale: 0.9, duration: 0.6 }, 3.4)
      .from('.hero__scroll-cue', { opacity: 0, duration: 0.5 }, 3.6);

    // After the intro, start stat counters
    animateStatNumbers();
  }

  // ┌─ ScrollTrigger Hero Pin ────────────────────────────────────┐
  function initScrollTrigger() {
    if (typeof ScrollTrigger === 'undefined') return;
    if (prefersReduced()) return;            // a11y: reduced-motion → no hero pin/scrub
    const hero = $('#hero');
    if (!hero) return;

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=80%',
      pin: true,
      pinSpacing: true,
      scrub: 1,
      animation: gsap.timeline()
        .to('.hero__content',       { opacity: 0.2, y: -40, scale: 0.94 }, 0)
        .to('.crosshair-wrap',      { opacity: 0.0, scale: 1.6 }, 0)
        .to('.stats',               { opacity: 0.2, x: 30 }, 0)
        .to('.compass',             { opacity: 0.2, scale: 0.85 }, 0)
        .to('.hero__strip',         { opacity: 0.2 }, 0)
        .to('.coord-cluster',       { opacity: 0.2 }, 0)
        .to('.hero__cta',           { opacity: 0.0, y: 20 }, 0)
        .to('.hero__scroll-cue',    { opacity: 0 }, 0)
        .add(() => {
          if (window.ChameloHero && window.ChameloHero.uniforms.grid) {
            gsap.to(window.ChameloHero.uniforms.grid.uScale, { value: 2.4, duration: 0.6, overwrite: true });
          }
        }, 0)
    });
  }

  // ┌─ Services Reel (interactive spotlight) ───────────────────┐
  // 7 glyph variants — each service gets its own SVG decoration overlaid
  // on the stage. Drawn directly into #glyphMarks.
  const SVC_GLYPHS = {
    '01': '<g><path d="M300 80 L300 520" stroke="currentColor"/><path d="M80 300 L520 300" stroke="currentColor"/><circle cx="300" cy="300" r="40" stroke="currentColor" fill="none" stroke-width="2"/></g>',
    '02': '<g><circle cx="180" cy="180" r="40" fill="currentColor"/><circle cx="420" cy="180" r="40" fill="currentColor"/><circle cx="300" cy="420" r="40" fill="currentColor"/><path d="M180 180 L420 180 L300 420 Z" stroke="currentColor" fill="none"/></g>',
    '03': '<g><rect x="200" y="200" width="200" height="200" stroke="currentColor" fill="none"/><rect x="160" y="160" width="200" height="200" stroke="currentColor" fill="none" opacity="0.6"/><rect x="240" y="240" width="200" height="200" stroke="currentColor" fill="none" opacity="0.3"/></g>',
    '04': '<g><polygon points="240,200 360,300 240,400" fill="currentColor"/><circle cx="430" cy="300" r="6" fill="currentColor"/><circle cx="170" cy="300" r="6" fill="currentColor"/></g>',
    '05': '<g><circle cx="300" cy="300" r="100" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="300" cy="300" r="30" stroke="currentColor" fill="none"/><rect x="240" y="200" width="120" height="20" fill="currentColor"/></g>',
    '06': '<g><path d="M120 420 L200 320 L260 360 L340 240 L420 320 L480 220" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="200" cy="320" r="4" fill="currentColor"/><circle cx="260" cy="360" r="4" fill="currentColor"/><circle cx="340" cy="240" r="4" fill="currentColor"/><circle cx="420" cy="320" r="4" fill="currentColor"/></g>',
    '07': '<g><rect x="220" y="220" width="160" height="160" stroke="currentColor" stroke-width="2" fill="none"/><path d="M220 300 L380 300" stroke="currentColor"/><path d="M300 220 L300 380" stroke="currentColor"/></g>',
  };

  function setActiveService(id) {
    const reel = document.getElementById('servicesReel');
    if (!reel) return;
    reel.querySelectorAll('.reel__item').forEach(b => {
      const on = b.dataset.svc === id;
      b.dataset.active = on ? 'true' : 'false';
      b.setAttribute('aria-selected', String(on));
    });
    reel.querySelectorAll('.reel__panel').forEach(p => {
      const on = p.dataset.svc === id;
      // Re-trigger CSS animation by toggling off then on
      if (on) {
        p.dataset.active = 'false';
        requestAnimationFrame(() => { p.dataset.active = 'true'; });
      } else {
        p.dataset.active = 'false';
      }
    });
    // Background numeral
    const ghost = document.getElementById('reelGhostNum');
    if (ghost) ghost.textContent = id;
    // Morph glyph
    const marks = document.getElementById('glyphMarks');
    if (marks) marks.innerHTML = SVC_GLYPHS[id] || '';
  }

  function initServicesReel() {
    const reel = document.getElementById('servicesReel');
    if (!reel) return;
    reel.querySelectorAll('.reel__item').forEach(btn => {
      btn.addEventListener('click', () => setActiveService(btn.dataset.svc));
      btn.addEventListener('mouseenter', () => setActiveService(btn.dataset.svc));
    });
    // Seed the initial glyph + ghost number
    setActiveService('01');
  }

  // ┌─ Reveal safety net ───────────────────────────────────────┐
  // GSAP's from() pre-sets the initial state (opacity:0). If a ScrollTrigger
  // never fires (e.g. tab was hidden during init, or Lenis sync lag), elements
  // stay invisible. This safety net forces visibility on any GSAP-managed
  // element that's already past the viewport top after the page is settled.
  function revealSafetyNet() {
    if (typeof ScrollTrigger === 'undefined') return;
    setTimeout(() => {
      try { ScrollTrigger.refresh(true); } catch {}
    }, 600);
    // After 2s, force any still-invisible-but-in-or-above-viewport elements visible
    setTimeout(() => {
      document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]').forEach(el => {
        const r = el.getBoundingClientRect();
        const inOrAbove = r.top < window.innerHeight * 1.2;
        if (inOrAbove) {
          el.style.opacity = '';
          el.style.transform = '';
          el.style.translate = '';
          el.style.rotate = '';
          el.style.scale = '';
        }
      });
      // Critical: ensure footer is always visible regardless
      document.querySelectorAll('.footer__col, .footer__grid, .footer__bottom, .footer').forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.visibility = 'visible';
      });
    }, 2000);
  }

  // ┌─ Section reveals (single-page polish) ────────────────────┐
  // For each major section, fade in the eyebrow/header + stagger first-level
  // content when the section enters the viewport.
  function initSectionReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (prefersReduced()) return;            // a11y: reduced-motion → content stays visible, no reveal motion

    // Section headers: subtle slide-in
    document.querySelectorAll('.section .section-header').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0, y: 20, duration: 0.7, ease: 'power3.out'
      });
    });

    // Section dossier headers (the "02 / DOSSIER" strip at the top of each section)
    document.querySelectorAll('.dossier-header').forEach(el => {
      gsap.from(el.children, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        opacity: 0, y: -10, stagger: 0.08, duration: 0.5
      });
    });

    // Generic .reveal class — opt-in fade-up for any element
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        opacity: 0, y: 30, duration: 0.7, ease: 'power3.out'
      });
    });

    // Parallax on the symbol mark (about section)
    const symbolMark = document.querySelector('.symbol-mark');
    if (symbolMark) {
      gsap.to(symbolMark, {
        scrollTrigger: { trigger: symbolMark, start: 'top bottom', end: 'bottom top', scrub: 1 },
        y: -40
      });
    }

    // Subtle parallax on each strip background gradient (services + diagnostic)
    document.querySelectorAll('.about-promise').forEach(el => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        backgroundPositionY: '60%'
      });
    });

    // Refresh after init so initial states are correct
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  // ┌─ Portfolio Deck (Work page) ───────────────────────────────┐
  // Covers served locally; each card links out to the live project page on
  // the designer's portfolio so visitors can read the full case study.
  const PORTFOLIO_BASE = 'https://kareemabdelaziz.myportfolio.com';
  const localImg = (id) => `assets/work/cf-${id}.webp`;
  const url = (slug) => `${PORTFOLIO_BASE}/${slug}`;

  const PORTFOLIO = [
    { id: '01', title: 'Chamelo · Creative Agency', sector: 'AGENCY',     year: '2026', img: localImg('01'), url: url('chamelo-creative-agency') },
    { id: '02', title: 'Linepack · Branding',        sector: 'BRANDING',   year: '2026', img: localImg('02'), url: url('linepack-branding') },
    { id: '03', title: 'FORK Agency · Branding',     sector: 'AGENCY',     year: '2026', img: localImg('03'), url: url('fork-agency-branding') },
    { id: '04', title: 'DRAX',                       sector: 'BRANDING',   year: '2026', img: localImg('04'), url: url('drax') },
    { id: '05', title: 'VLORA',                      sector: 'BRANDING',   year: '2025', img: localImg('05'), url: url('vlora') },
    { id: '06', title: 'Meow Shop · Social Vol.',    sector: 'SOCIAL',     year: '2025', img: localImg('06'), url: url('meow-shop-social-media-vol') },
    { id: '07', title: 'Irtiqaa',                    sector: 'BRANDING',   year: '2025', img: localImg('07'), url: url('irtiqaa') },
    { id: '08', title: 'TAR · Company',              sector: 'BRANDING',   year: '2025', img: localImg('08'), url: url('tar-company') },
    { id: '09', title: 'Nano Shield',                sector: 'BRANDING',   year: '2025', img: localImg('09'), url: url('nano-shield') },
    { id: '10', title: 'Narmer',                     sector: 'BRANDING',   year: '2025', img: localImg('10'), url: url('narmer') },
    { id: '11', title: 'Tharad Tech',                sector: 'TECH',       year: '2025', img: localImg('11'), url: url('tharad-tech') },
    { id: '12', title: 'ORA · Dental Clinic',        sector: 'HEALTH',     year: '2025', img: localImg('12'), url: url('ora-dental-clinic') },
    { id: '13', title: 'Novix',                      sector: 'BRANDING',   year: '2025', img: localImg('13'), url: url('novix') },
    { id: '14', title: 'E-Cart',                     sector: 'E-COMMERCE', year: '2025', img: localImg('14'), url: url('e-cart') },
    { id: '15', title: 'Velura · Branding',          sector: 'LIFESTYLE',  year: '2025', img: localImg('15'), url: url('velura-branding') },
    { id: '16', title: 'Convert X · Branding',       sector: 'TECH',       year: '2025', img: localImg('16'), url: url('convert-x-branding') },
    { id: '17', title: 'LORA · Cosmetics',           sector: 'COSMETICS',  year: '2025', img: localImg('17'), url: url('lora-cosmetics') },
    { id: '18', title: 'NAQAA · Branding',           sector: 'BRANDING',   year: '2025', img: localImg('18'), url: url('naqaa-branding') },
    { id: '19', title: 'CHICK · Fried Chicken',      sector: 'F&B',        year: '2025', img: localImg('19'), url: url('chick-fried-chicken') },
    { id: '20', title: 'Koronfulah · Brand',         sector: 'BRANDING',   year: '2025', img: localImg('20'), url: url('koronfulah-brand') },
    { id: '21', title: 'AREEZA · Cosmetics',         sector: 'COSMETICS',  year: '2025', img: localImg('21'), url: url('areeza-cosmetics') },
    { id: '22', title: 'Funny Brands',               sector: 'BRANDING',   year: '2025', img: localImg('22'), url: url('funny-brands') },
    { id: '23', title: 'Path · Pharmacy',            sector: 'HEALTH',     year: '2025', img: localImg('23'), url: url('pharmacy-brand-path') },
    { id: '24', title: 'Multi-Brand Abaya',          sector: 'FASHION',    year: '2025', img: localImg('24'), url: url('tallah-fashion') },
    { id: '25', title: 'Murjan · Adventure',         sector: 'PLATFORM',   year: '2025', img: localImg('25'), url: url('murjan-adventure-platform') },
    { id: '26', title: 'Sneakers Brand',             sector: 'FASHION',    year: '2025', img: localImg('26'), url: url('visuals') },
    { id: '27', title: 'SCOOP · Supplements',        sector: 'HEALTH',     year: '2024', img: localImg('27'), url: url('scoop-supplements-brand-identity') },
    { id: '28', title: "Mutma'inna · Salon",         sector: 'LIFESTYLE',  year: '2024', img: localImg('28'), url: url('mutmainna-salon') },
    { id: '29', title: 'Al-Sham Roastery · Social',  sector: 'SOCIAL',     year: '2024', img: localImg('29'), url: url('social-media-coffee-and-al-sham-roastery') },
    { id: '30', title: 'GROOVY · Restaurant Social', sector: 'F&B',        year: '2023', img: localImg('30'), url: url('social-media-2023-groovy-restaurant') },
    { id: '31', title: 'Arabic Calligraphy',         sector: 'TYPE',       year: '2022', img: localImg('31'), url: url('arabic-calligraphy-kht-aarby') },
    { id: '32', title: 'Bionic · Recruitment',       sector: 'HR',         year: '2022', img: localImg('32'), url: url('bionic-recruitment') },
    { id: '33', title: 'Eid Al-Adha El Mubarak',     sector: 'CAMPAIGN',   year: '2022', img: localImg('33'), url: url('eid-al-adha-el-mubarak') },
  ];

  const Deck = {
    active: 0,
    locked: false,
    initialised: false,
  };

  function renderDeck() {
    const cardsEl = document.getElementById('deckCards');
    if (!cardsEl) return;
    cardsEl.innerHTML = PORTFOLIO.map((p, i) => `
      <article class="card" data-idx="${i}" data-flipped="false" role="option">
        <div class="card__inner">
          <div class="card__face card__face--front" style="background-image:url('${p.img}')">
            <span class="card__code">CF · ${p.id}</span>
            <span class="card__year">${p.year}</span>
            <div class="card__title-row">
              <h3 class="card__title">${p.title}</h3>
              <span class="card__sector">${p.sector}</span>
            </div>
            <a class="card__view"
               href="${p.url}"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Open ${p.title} on the portfolio (new tab)">
              <span data-en="VIEW PROJECT" data-ar="افتح المشروع">VIEW PROJECT</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
            </a>
          </div>
          <div class="card__face card__face--back">
            <div class="card-back__head">
              <span style="color:var(--red-vivid)">CF · ${p.id}</span>
              <span>${p.year}</span>
            </div>
            <h3 class="card-back__title">${p.title}</h3>
            <div class="card-back__meta">
              <div><span class="key">SECTOR</span><span>${p.sector}</span></div>
              <div><span class="key">FILE</span><span>${p.id} / 033</span></div>
              <div><span class="key">STATUS</span><span style="color:var(--red-vivid)">DECLASSIFIED</span></div>
            </div>
            <a class="card-back__open"
               href="${p.url}"
               target="_blank"
               rel="noopener noreferrer">
              <span data-en="OPEN CASE FILE" data-ar="افتح الملف">OPEN CASE FILE</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
            </a>
          </div>
        </div>
      </article>
    `).join('');

    // Card click logic:
    //  - Side card  → jump to it (becomes active)
    //  - Active card click → open project URL (the "VIEW PROJECT" link handles this)
    cardsEl.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(card.dataset.idx, 10);
        // VIEW PROJECT / OPEN CASE FILE → open the in-site case panel
        // (href stays as a middle-click / no-JS fallback to the live project)
        if (e.target.closest('.card__view, .card-back__open')) {
          e.preventDefault();
          openCaseStudy(idx);
          return;
        }
        if (idx !== Deck.active) {
          e.preventDefault();
          deckGoTo(idx);
        }
        // Active card stays — flip is handled by CSS hover
      });
    });
    Deck.initialised = true;
  }

  function updateDeck() {
    const cards = document.querySelectorAll('#deckCards .card');
    cards.forEach((card, i) => {
      const offset = i - Deck.active;
      card.dataset.offset = String(offset);
      // Reset flipped state on non-active cards
      if (offset !== 0) card.dataset.flipped = 'false';
    });
    const total = PORTFOLIO.length;
    const stepEl   = document.getElementById('deckStep');
    const barEl    = document.getElementById('deckBar');
    const titleEl  = document.getElementById('deckActiveTitle');
    const yearEl   = document.getElementById('deckActiveYear');
    if (stepEl)  stepEl.textContent = String(Deck.active + 1).padStart(2, '0');
    if (barEl)   barEl.style.width = (((Deck.active + 1) / total) * 100) + '%';
    if (titleEl) titleEl.textContent = PORTFOLIO[Deck.active].title;
    if (yearEl)  yearEl.textContent  = PORTFOLIO[Deck.active].year;
  }

  function deckGoTo(idx) {
    const total = PORTFOLIO.length;
    Deck.active = Math.max(0, Math.min(total - 1, idx));
    updateDeck();
  }
  function deckNext() { if (Deck.active < PORTFOLIO.length - 1) deckGoTo(Deck.active + 1); }
  function deckPrev() { if (Deck.active > 0) deckGoTo(Deck.active - 1); }

  // Auto-cycle: every N seconds advance one card; pause on hover, swipe, or focus.
  function startDeckAutoplay(stage) {
    const INTERVAL_MS = 4200;
    let timer = null;
    let userPaused = false;

    const tick = () => {
      if (userPaused) return;
      if (document.hidden) return;
      const total = PORTFOLIO.length;
      // Wrap around to the first card after the last
      Deck.active = (Deck.active + 1) % total;
      updateDeck();
    };

    const start = () => { stop(); timer = setInterval(tick, INTERVAL_MS); };
    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
    const pauseTemporary = (ms = 8000) => {
      userPaused = true; stop();
      setTimeout(() => { userPaused = false; start(); }, ms);
    };

    // Pause while pointer is over the stage; resume on leave
    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    stage.addEventListener('touchstart', () => pauseTemporary(10000), { passive: true });
    // Pause when user manually clicks the prev/next buttons too
    document.getElementById('deckPrev')?.addEventListener('click', () => pauseTemporary());
    document.getElementById('deckNext')?.addEventListener('click', () => pauseTemporary());

    // Restart loop when tab becomes visible again
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); else stop(); });

    start();
    Deck.autoplayStop = stop;
    Deck.autoplayStart = start;
  }

  function initDeck() {
    const stage = document.getElementById('deckStage');
    if (!stage) return;
    renderDeck();
    updateDeck();
    startDeckAutoplay(stage);

    const prev = document.getElementById('deckPrev');
    const next = document.getElementById('deckNext');
    if (prev) prev.addEventListener('click', deckPrev);
    if (next) next.addEventListener('click', deckNext);

    // ── Scroll-wheel hijack: rotate the deck instead of scrolling page ──
    let wheelLock = false;
    stage.addEventListener('wheel', (e) => {
      // Only hijack while pointer is over the stage and there's somewhere to go.
      const goingDown = e.deltaY > 0;
      const canGo = goingDown ? Deck.active < PORTFOLIO.length - 1 : Deck.active > 0;
      if (!canGo) return; // let page scroll naturally at deck ends
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      goingDown ? deckNext() : deckPrev();
      setTimeout(() => { wheelLock = false; }, 480);
    }, { passive: false });

    // ── Touch / drag swipe ──
    let startX = 0, startY = 0, dragging = false;
    const onStart = (x, y) => { startX = x; startY = y; dragging = true; };
    const onEnd = (x, y) => {
      if (!dragging) return;
      dragging = false;
      const dx = x - startX, dy = y - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      const isRtl = document.documentElement.dir === 'rtl';
      if (dx < 0) isRtl ? deckPrev() : deckNext();
      else        isRtl ? deckNext() : deckPrev();
    };
    stage.addEventListener('mousedown',  e => onStart(e.clientX, e.clientY));
    stage.addEventListener('mouseup',    e => onEnd(e.clientX, e.clientY));
    stage.addEventListener('mouseleave', () => { dragging = false; });
    stage.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    stage.addEventListener('touchend',   e => {
      const t = e.changedTouches[0];
      onEnd(t.clientX, t.clientY);
    });

    // ── Keyboard ──
    document.addEventListener('keydown', (e) => {
      // Only act when the Work section is the active route
      if (state.route !== 'work') return;
      const isRtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') isRtl ? deckPrev() : deckNext();
      if (e.key === 'ArrowLeft')  isRtl ? deckNext() : deckPrev();
      if (e.key === ' ' || e.key === 'Enter') {
        const card = document.querySelector('.card[data-offset="0"]');
        if (card) card.dataset.flipped = card.dataset.flipped === 'true' ? 'false' : 'true';
      }
    });
  }

  // ┌─ Projects by Category (filterable grid) ──────────────────┐
  // Categories with EN/AR labels — also assigned to each project below.
  const CATEGORIES = [
    { key: 'all',      en: 'All',              ar: 'الكل' },
    { key: 'identity', en: 'Brand Identity',   ar: 'هويات بصرية' },
    { key: 'social',   en: 'Social & Content', ar: 'سوشيال ومحتوى' },
    { key: 'beauty',   en: 'Beauty & Wellness',ar: 'تجميل وصحة' },
    { key: 'tech',     en: 'Tech & Commerce',  ar: 'تكنولوجيا وتجارة' },
    { key: 'culture',  en: 'Food & Lifestyle', ar: 'مأكولات ولايف ستايل' },
  ];

  // Map sector → one of the 6 consolidated category keys
  function categoryForProject(p) {
    const s = p.sector.toUpperCase();
    if (s === 'BRANDING' || s === 'AGENCY' || s === 'TYPE') return 'identity';
    if (s === 'SOCIAL' || s === 'CAMPAIGN')                 return 'social';
    if (s === 'COSMETICS' || s === 'HEALTH')                return 'beauty';
    if (s === 'TECH' || s === 'E-COMMERCE' || s === 'PLATFORM' || s === 'HR') return 'tech';
    return 'culture'; // F&B, FASHION, LIFESTYLE + fallback
  }

  function renderProjects() {
    const filterEl = document.getElementById('projectsFilter');
    const gridEl   = document.getElementById('projectsGrid');
    if (!filterEl || !gridEl) return;

    // Count projects per category for the tab badges
    const counts = { all: PORTFOLIO.length };
    PORTFOLIO.forEach(p => {
      const c = categoryForProject(p);
      counts[c] = (counts[c] || 0) + 1;
    });

    filterEl.innerHTML = CATEGORIES
      .filter(c => c.key === 'all' || counts[c.key])
      .map((c, i) => `
        <button class="cat-tab" data-cat="${c.key}" data-active="${i === 0 ? 'true' : 'false'}" role="tab" aria-selected="${i === 0}">
          <span class="cat-tab__label" data-en="${c.en}" data-ar="${c.ar}">${state.lang === 'ar' ? c.ar : c.en}</span>
          <span class="cat-tab__count">${counts[c.key] || 0}</span>
        </button>
      `).join('');

    gridEl.innerHTML = PORTFOLIO.map(p => {
      const cat = categoryForProject(p);
      return `
        <a class="proj-card"
           href="${p.url}"
           target="_blank"
           rel="noopener noreferrer"
           data-cat="${cat}"
           data-id="${p.id}"
           data-active="true"
           aria-label="${p.title}">
          <div class="proj-card__cover" style="background-image:url('${p.img}')"></div>
          <div class="proj-card__overlay">
            <span class="proj-card__code">CF · ${p.id}</span>
            <span class="proj-card__year">${p.year}</span>
          </div>
          <div class="proj-card__meta">
            <h3 class="proj-card__title">${p.title}</h3>
            <span class="proj-card__sector">${p.sector}</span>
          </div>
        </a>
      `;
    }).join('');

    // Initial bento sizing across the full set
    assignBento(Array.from(gridEl.querySelectorAll('.proj-card')));

    // Wire up the tabs
    filterEl.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => filterProjects(btn.dataset.cat));
    });
  }

  // Editorial bento rhythm — assign feature/wide/tall spans by position in
  // the *visible* set so the mosaic stays balanced after every filter.
  function assignBento(cards) {
    cards.forEach((card, i) => {
      card.classList.remove('proj-card--feature', 'proj-card--wide', 'proj-card--tall');
      const m = i % 6;
      if (m === 0)      card.classList.add('proj-card--feature'); // 2×2 anchor
      else if (m === 3) card.classList.add('proj-card--wide');    // 2×1
      else if (m === 5) card.classList.add('proj-card--tall');    // 1×2
    });
  }

  function filterProjects(cat) {
    const filterEl = document.getElementById('projectsFilter');
    const gridEl   = document.getElementById('projectsGrid');
    const countEl  = document.getElementById('projectsCount');
    const emptyEl  = document.getElementById('projectsEmpty');
    if (!filterEl || !gridEl) return;

    filterEl.querySelectorAll('.cat-tab').forEach(b => {
      const on = b.dataset.cat === cat;
      b.dataset.active = on ? 'true' : 'false';
      b.setAttribute('aria-selected', String(on));
    });

    const allCards = Array.from(gridEl.querySelectorAll('.proj-card'));
    const hasFlip  = typeof window.Flip !== 'undefined' && typeof gsap !== 'undefined';
    const state    = hasFlip ? Flip.getState(allCards) : null;

    // Decide visibility, then re-balance the bento across the visible subset
    const visibleCards = [];
    allCards.forEach(card => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.dataset.active = show ? 'true' : 'false';
      card.style.display  = show ? '' : 'none';
      if (show) visibleCards.push(card);
    });
    assignBento(visibleCards);

    if (hasFlip) {
      Flip.from(state, {
        duration: 0.65,
        ease: 'power3.inOut',
        scale: true,
        absolute: true,
        stagger: 0.025,
        onEnter: els => gsap.fromTo(els,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.025 }),
        onLeave: els => gsap.to(els,
          { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power2.in' }),
      });
    }

    if (countEl) countEl.textContent = visibleCards.length;
    if (emptyEl) emptyEl.hidden = visibleCards.length > 0;
  }

  function initProjects() {
    if (document.getElementById('projectsFilter')) {
      renderProjects();
      initProjectsReveal();
    }
  }

  // First-view stagger reveal of the project mosaic
  function initProjectsReveal() {
    const gridEl = document.getElementById('projectsGrid');
    if (!gridEl || typeof gsap === 'undefined' || !gsap.registerPlugin) return;
    if (prefersReduced()) return;            // a11y: reduced-motion → no grid stagger
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = Array.from(gridEl.querySelectorAll('.proj-card'));
    if (!cards.length) return;
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: gridEl,
        start: 'top 80%',
        once: true,
        onEnter: () => gsap.fromTo(cards,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04 }),
      });
    }
  }

  // ┌─ Brand Anatomy Slider ─────────────────────────────────────┐
  // Full-bleed brand boards, themed to the dark site via CSS
  // invert + hue-rotate (white→black, black ink→white, red stays red).
  const BRAND_SLIDES = [
    { img: 'assets/brand-silence.webp',     en: 'The Hunt',    ar: 'الصيد' },
    { img: 'assets/method-target.webp',     en: 'The Strike',  ar: 'الضربة' },
    { img: 'assets/brand-ink.webp',         en: 'The Mark',    ar: 'العلامة' },
  ];

  function initBrandSlider() {
    const root  = document.getElementById('brandSlider');
    const track = document.getElementById('brandSliderTrack');
    const dotsEl= document.getElementById('brandSliderDots');
    const prev  = document.getElementById('brandSliderPrev');
    const next  = document.getElementById('brandSliderNext');
    if (!root || !track || !dotsEl) return;

    let idx = 0;
    let timer = null;
    const INTERVAL_MS = 5200;

    track.innerHTML = BRAND_SLIDES.map((s, i) => `
      <figure class="brand-slide" data-i="${i}" aria-hidden="${i === 0 ? 'false' : 'true'}">
        <img class="brand-slide__img" src="${s.img}" alt="${s.en}" loading="lazy" decoding="async">
        <figcaption class="brand-slide__cap">
          <span class="brand-slide__num">${String(i + 1).padStart(2, '0')} / ${String(BRAND_SLIDES.length).padStart(2, '0')}</span>
          <span class="brand-slide__label" data-en="${s.en}" data-ar="${s.ar}">${state.lang === 'ar' ? s.ar : s.en}</span>
        </figcaption>
      </figure>
    `).join('');

    dotsEl.innerHTML = BRAND_SLIDES.map((s, i) => `
      <button class="brand-slider__dot" data-i="${i}" data-active="${i === 0 ? 'true' : 'false'}"
              role="tab" aria-selected="${i === 0}" aria-label="${s.en}" type="button"></button>
    `).join('');

    const slides = Array.from(track.querySelectorAll('.brand-slide'));
    const dots   = Array.from(dotsEl.querySelectorAll('.brand-slider__dot'));

    function go(n) {
      idx = (n + BRAND_SLIDES.length) % BRAND_SLIDES.length;
      track.style.transform = `translateX(${(state.lang === 'ar' ? 1 : -1) * idx * 100}%)`;
      slides.forEach((sl, i) => sl.setAttribute('aria-hidden', String(i !== idx)));
      dots.forEach((d, i) => {
        d.dataset.active = i === idx ? 'true' : 'false';
        d.setAttribute('aria-selected', String(i === idx));
      });
    }
    function nextSlide() { go(idx + 1); }
    function prevSlide() { go(idx - 1); }

    function start() { stop(); timer = setInterval(nextSlide, INTERVAL_MS); }
    function stop()  { if (timer) { clearInterval(timer); timer = null; } }

    if (next) next.addEventListener('click', () => { nextSlide(); start(); });
    if (prev) prev.addEventListener('click', () => { prevSlide(); start(); });
    dots.forEach(d => d.addEventListener('click', () => { go(+d.dataset.i); start(); }));

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    // Re-anchor transform direction when language flips
    document.addEventListener('chamelo:langchange', () => go(idx));

    go(0);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  }

  // ┌─ Home · Selected Work teaser (rendered from PORTFOLIO) ────┐
  function initHomeWork() {
    const grid = document.getElementById('homeWorkGrid');
    if (!grid || typeof PORTFOLIO === 'undefined') return;
    const featured = ['02', '04', '05', '10', '03', '13'];
    const items = featured.map(id => PORTFOLIO.find(p => p.id === id)).filter(Boolean);
    if (!items.length) return;
    grid.innerHTML = items.map(p => (
      '<a class="home-work-card reveal" href="#work" data-route="work" aria-label="' + p.title + '">' +
        '<span class="home-work-card__media"><img src="' + p.img + '" alt="' + p.title + '" loading="lazy" decoding="async"></span>' +
        '<span class="home-work-card__meta">' +
          '<span class="home-work-card__code">CF-' + p.id + '</span>' +
          '<span class="home-work-card__title">' + p.title + '</span>' +
          '<span class="home-work-card__sector">' + p.sector + ' · ' + p.year + '</span>' +
        '</span>' +
      '</a>'
    )).join('');
  }

  // ┌─ Chameleon Figure — seamless full-bleed, scroll reveal + pointer tilt ─┐
  function initChameleonFigure() {
    document.querySelectorAll('.chameleon').forEach(setupChameleon);
  }
  function setupChameleon(fig) {
    if (!fig) return;
    const fused  = fig.querySelector('.chameleon__fused');
    const plate  = fig.querySelector('.chameleon__plate');
    const scan   = fig.querySelector('.chameleon__scan');
    const copy   = fig.querySelector('.chameleon__copy');
    const ms     = fig.closest('.method-strip');
    const strike = ms ? ms.querySelector('.method-strip__img--strike') : null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGSAP = (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined');

    // 1 — scroll reveal: clip-path wipe + a red scan line sweeping the body
    if (hasGSAP && !reduce) {
      gsap.set(plate, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.to(plate, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: fig, start: 'top 80%' }
      });
      if (scan) gsap.fromTo(scan,
        { y: 0, opacity: 0.95 },
        { y: () => (plate ? plate.offsetHeight : 600), opacity: 0, duration: 1.5, ease: 'power2.inOut',
          scrollTrigger: { trigger: fig, start: 'top 80%' } });
      if (copy) gsap.from(copy.children, {
        y: 26, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: fig, start: 'top 68%' }
      });
      // gentle scrub parallax — figure settles from a slight zoom as it scrolls
      gsap.fromTo(plate, { scale: 1.07 }, {
        scale: 1.0, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
      // the strike lands with a sharper snap
      if (strike) gsap.from(strike, {
        y: 70, opacity: 0, scale: 1.05, duration: 0.7, ease: 'power4.out',
        scrollTrigger: { trigger: strike, start: 'top 82%' }
      });
    } else if (plate) {
      plate.style.clipPath = 'none';
    }

    // 2 — pointer tilt: the chameleon watches the cursor (desktop only)
    if (!reduce && fused && !window.matchMedia('(pointer: coarse)').matches) {
      let tx = 0, ty = 0, rx = 0, ry = 0, raf = 0, active = false;
      const lerp = (a, b, t) => a + (b - a) * t;
      const render = () => {
        rx = lerp(rx, tx, 0.09);
        ry = lerp(ry, ty, 0.09);
        fused.style.transform = 'perspective(1400px) rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)';
        if (active || Math.abs(rx - tx) > 0.01 || Math.abs(ry - ty) > 0.01) {
          raf = requestAnimationFrame(render);
        } else { raf = 0; }
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
      fig.addEventListener('pointermove', (e) => {
        const r = fig.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * 5.5; ty = px * 5.5; active = true; kick();
      });
      fig.addEventListener('pointerleave', () => { tx = 0; ty = 0; active = false; kick(); });
    }

    // 3 — scope reticle locks onto the cursor (home figure)
    const reticle = fig.querySelector('.chameleon__reticle');
    if (reticle && plate && !reduce && !window.matchMedia('(pointer: coarse)').matches) {
      fig.addEventListener('pointermove', (e) => {
        const r = plate.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
        reticle.style.left = x + '%';
        reticle.style.top = y + '%';
        reticle.dataset.on = 'true';
      });
      fig.addEventListener('pointerleave', () => { reticle.dataset.on = 'false'; });
    }
  }

  // ┌─ Diagnostic Tool ──────────────────────────────────────────┐
  const DIAG_QUESTIONS = [
    {
      key: 'industry',
      en: 'What sector is your brand in?', ar: 'في أي قطاع يعمل براندك؟',
      options: [
        { val: 'consumer', en: 'Consumer / E-commerce', ar: 'استهلاكي / تجارة إلكترونية' },
        { val: 'b2b',      en: 'B2B / Services',        ar: 'خدمات / أعمال إلى أعمال' },
        { val: 'tech',     en: 'Tech / SaaS',           ar: 'تكنولوجيا / SaaS' },
        { val: 'lifestyle',en: 'Lifestyle / Fashion',   ar: 'لايف ستايل / موضة' },
      ]
    },
    {
      key: 'age',
      en: 'How old is the brand?', ar: 'ما عمر البراند؟',
      options: [
        { val: 'new',   en: 'Pre-launch / Under 1 year', ar: 'قبل الإطلاق / أقل من سنة' },
        { val: 'early', en: '1–3 years',                  ar: '١–٣ سنوات' },
        { val: 'mid',   en: '3–7 years',                  ar: '٣–٧ سنوات' },
        { val: 'mature',en: '7+ years',                   ar: '٧+ سنوات' },
      ]
    },
    {
      key: 'weakness',
      en: 'Where is the current weakest link?', ar: 'أين الحلقة الأضعف حاليًا؟',
      options: [
        { val: 'visibility', en: 'Visibility / Awareness',  ar: 'الظهور / الوعي' },
        { val: 'sales',      en: 'Sales / Conversion',      ar: 'المبيعات / التحويل' },
        { val: 'position',   en: 'Positioning / Identity',  ar: 'التموضع / الهوية' },
        { val: 'consistency',en: 'Consistency / Operation', ar: 'الاتساق / التشغيل' },
      ]
    },
    {
      key: 'guidelines',
      en: 'Do you have a documented brand system?', ar: 'هل لديك نظام براند موثّق؟',
      options: [
        { val: 'full',    en: 'Yes — formal brand book',  ar: 'نعم — دليل براند رسمي' },
        { val: 'partial', en: 'Partial — basics only',     ar: 'جزئي — الأساسيات فقط' },
        { val: 'none',    en: 'No — nothing documented',   ar: 'لا — لا شيء موثّق' },
        { val: 'unsure',  en: 'Unsure',                    ar: 'غير متأكد' },
      ]
    },
    {
      key: 'budget',
      en: 'Monthly marketing investment range?', ar: 'نطاق الاستثمار التسويقي الشهري؟',
      options: [
        { val: 'starter',  en: '< 10K EGP',     ar: 'أقل من ١٠ آلاف ج' },
        { val: 'growth',   en: '10K — 30K EGP', ar: '١٠–٣٠ ألف ج' },
        { val: 'scale',    en: '30K — 100K EGP',ar: '٣٠–١٠٠ ألف ج' },
        { val: 'flagship', en: '100K+ EGP',     ar: '+١٠٠ ألف ج' },
      ]
    },
    {
      key: 'horizon',
      en: 'Biggest challenge in the next 90 days?', ar: 'أكبر تحدٍّ خلال ٩٠ يومًا؟',
      options: [
        { val: 'launch',    en: 'A launch / re-launch',    ar: 'إطلاق / إعادة إطلاق' },
        { val: 'growth',    en: 'Scale current revenue',   ar: 'توسيع الإيرادات الحالية' },
        { val: 'reposition',en: 'Reposition the brand',    ar: 'إعادة تموضع البراند' },
        { val: 'retain',    en: 'Defend market position',  ar: 'الدفاع عن الموقع' },
      ]
    },
    {
      key: 'audit',
      en: 'Have you done a strategic audit before?', ar: 'هل قمت بتدقيق استراتيجي من قبل؟',
      options: [
        { val: 'recent',  en: 'Yes — within 12 months',  ar: 'نعم — خلال ١٢ شهرًا' },
        { val: 'old',     en: 'Yes — but over a year ago', ar: 'نعم — لكن قبل أكثر من سنة' },
        { val: 'never',   en: 'Never',                     ar: 'مطلقًا' },
        { val: 'planned', en: 'Planned but never executed',ar: 'مخطّط له ولم يُنفّذ' },
      ]
    },
    {
      key: 'kpi',
      en: 'Which KPI matters most to you?', ar: 'أي مؤشّر هو الأهم لك؟',
      options: [
        { val: 'revenue', en: 'Revenue / Sales',          ar: 'الإيرادات / المبيعات' },
        { val: 'leads',   en: 'Qualified leads',          ar: 'العملاء المؤهَّلون' },
        { val: 'authority',en: 'Authority / Brand equity',ar: 'السلطة / قيمة البراند' },
        { val: 'retention',en: 'Customer retention',      ar: 'احتفاظ العملاء' },
      ]
    }
  ];

  const DiagState = {
    idx: 0,
    answers: {},
    rendered: false
  };

  function renderDiagQuestions() {
    const wrap = document.getElementById('diagQuestions');
    if (!wrap) return;
    const lang = state.lang;
    wrap.innerHTML = DIAG_QUESTIONS.map((q, i) => `
      <div class="diag-q" data-q="${q.key}" data-active="${i === 0 ? 'true' : 'false'}">
        <div class="diag-q__prompt" data-en="${q.en}" data-ar="${q.ar}">${lang === 'ar' ? q.ar : q.en}</div>
        <div class="diag-q__prompt-ar">${q.ar}</div>
        <div class="diag-options">
          ${q.options.map(o => `
            <button class="diag-option" data-val="${o.val}" data-q="${q.key}">
              <span class="diag-option__mark"></span>
              <span class="diag-option__labels">
                <span class="diag-option__label" data-en="${o.en}" data-ar="${o.ar}">${lang === 'ar' ? o.ar : o.en}</span>
                <span class="diag-option__label-ar">${o.ar}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Wire up option clicks
    wrap.querySelectorAll('.diag-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.q;
        const v = btn.dataset.val;
        DiagState.answers[q] = v;
        // Mark selection
        wrap.querySelectorAll(`.diag-option[data-q="${q}"]`).forEach(b => b.dataset.selected = 'false');
        btn.dataset.selected = 'true';
        // Enable next
        const nextBtn = document.getElementById('diagNext');
        if (nextBtn) nextBtn.disabled = false;
      });
    });
    DiagState.rendered = true;
  }

  function showDiagQuestion(i) {
    const wrap = document.getElementById('diagQuestions');
    if (!wrap) return;
    wrap.querySelectorAll('.diag-q').forEach((q, idx) => {
      q.dataset.active = (idx === i).toString();
    });
    const label = document.getElementById('diagStep');
    const bar   = document.getElementById('diagProgress');
    if (label) label.textContent = `QUESTION ${String(i+1).padStart(2,'0')} / ${String(DIAG_QUESTIONS.length).padStart(2,'0')}`;
    if (bar)   bar.style.width = (((i+1) / DIAG_QUESTIONS.length) * 100) + '%';

    const prevBtn = document.getElementById('diagPrev');
    const nextBtn = document.getElementById('diagNext');
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) {
      const q = DIAG_QUESTIONS[i];
      nextBtn.disabled = !DiagState.answers[q.key];
      const lastEn = (i === DIAG_QUESTIONS.length - 1) ? 'GENERATE REPORT →' : 'NEXT →';
      const lastAr = (i === DIAG_QUESTIONS.length - 1) ? 'أنشئ التقرير →' : 'التالي →';
      nextBtn.setAttribute('data-en', lastEn);
      nextBtn.setAttribute('data-ar', lastAr);
      nextBtn.textContent = state.lang === 'ar' ? lastAr : lastEn;
    }
  }

  function renderDiagReadout() {
    const readout = document.getElementById('diagReadout');
    if (!readout) return;
    const a = DiagState.answers;
    // Compute a simple "position" assessment
    const weakLabel = {
      visibility:  'Awareness gap',
      sales:       'Conversion bottleneck',
      position:    'Identity drift',
      consistency: 'Operational drift'
    }[a.weakness] || 'Mixed signals';
    const horizonLabel = {
      launch:     'Pre-launch readiness',
      growth:     'Scaling phase',
      reposition: 'Repositioning required',
      retain:     'Defensive operations'
    }[a.horizon] || 'Mixed';
    const auditLabel = {
      recent:  'Recent — refresh sufficient',
      old:     'Stale — re-diagnose advised',
      never:   'No baseline — diagnose required',
      planned: 'Stalled — execution gap'
    }[a.audit] || '—';

    const rows = [
      ['SECTOR',     (a.industry || '').toUpperCase()],
      ['STAGE',      (a.age || '').toUpperCase()],
      ['WEAK LINK',  weakLabel.toUpperCase()],
      ['SYSTEM',     (a.guidelines || '').toUpperCase()],
      ['INVESTMENT', (a.budget || '').toUpperCase()],
      ['HORIZON',    horizonLabel.toUpperCase()],
      ['AUDIT HX',   auditLabel.toUpperCase()],
      ['NORTH STAR', (a.kpi || '').toUpperCase()],
    ];
    readout.innerHTML = rows.map(([k,v]) => `
      <div class="diag-readout-row"><span class="key">${k}</span><span class="val">${v || '—'}</span></div>
    `).join('');
  }

  function diagNext() {
    if (DiagState.idx < DIAG_QUESTIONS.length - 1) {
      DiagState.idx++;
      showDiagQuestion(DiagState.idx);
    } else {
      // Show result
      const panel  = document.getElementById('diagnosticPanel');
      const result = document.getElementById('diagnosticResult');
      if (panel) panel.hidden = true;
      if (result) result.hidden = false;
      renderDiagReadout();
    }
  }
  function diagPrev() {
    if (DiagState.idx > 0) {
      DiagState.idx--;
      showDiagQuestion(DiagState.idx);
    }
  }

  function initDiagnostic() {
    const start = document.getElementById('diagnosticStart');
    const intro = document.getElementById('diagnosticIntro');
    const panel = document.getElementById('diagnosticPanel');
    if (!start) return;
    start.addEventListener('click', () => {
      if (intro) intro.hidden = true;
      if (panel) panel.hidden = false;
      if (!DiagState.rendered) renderDiagQuestions();
      showDiagQuestion(0);
    });
    const nextBtn = document.getElementById('diagNext');
    const prevBtn = document.getElementById('diagPrev');
    if (nextBtn) nextBtn.addEventListener('click', diagNext);
    if (prevBtn) prevBtn.addEventListener('click', diagPrev);
  }

  // ┌─ Lead delivery channels ──────────────────────────────────┐
  const CHAMELO_PHONE = '201013239544';
  const CHAMELO_EMAIL = 'chameloagency@gmail.com';

  function openWhatsAppWith(message) {
    const url = 'https://wa.me/' + CHAMELO_PHONE + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
  }

  window.ChameloDiag = {
    submitLead() {
      const ok = document.getElementById('diagLeadOk');
      const form = document.getElementById('diagLeadForm');
      const data = Object.fromEntries(new FormData(form).entries());
      const a = DiagState.answers;

      // Build a strategic-dossier-style WhatsApp message
      const lines = [
        '*[ CHAMELO · STRATEGIC DOSSIER REQUEST ]*',
        '',
        '── CONTACT ──',
        'Name: ' + (data.name || '—'),
        'Email: ' + (data.email || '—'),
        'Brand: ' + (data.brand || '—'),
        'Phone: ' + (data.phone || '—'),
        '',
        '── DIAGNOSTIC INTAKE ──',
        'Sector: ' + (a.industry || '—'),
        'Stage: ' + (a.age || '—'),
        'Weak link: ' + (a.weakness || '—'),
        'Brand system: ' + (a.guidelines || '—'),
        'Investment: ' + (a.budget || '—'),
        '90-day horizon: ' + (a.horizon || '—'),
        'Audit history: ' + (a.audit || '—'),
        'North-star KPI: ' + (a.kpi || '—'),
        '',
        '— sent via chamelo.agency · diagnostic'
      ].join('\n');

      openWhatsAppWith(lines);

      if (ok) ok.hidden = false;
      if (form) Array.from(form.querySelectorAll('input,button')).forEach(el => el.disabled = true);
    }
  };

  // ┌─ Contact form submit ──────────────────────────────────────┐
  window.ChameloContact = {
    submit() {
      const ok = document.getElementById('contactOk');
      const form = document.getElementById('contactForm');
      const d = Object.fromEntries(new FormData(form).entries());

      const lines = [
        '*[ CHAMELO · BRIEFING REQUEST ]*',
        '',
        '── CONTACT ──',
        'Name: ' + (d.name || '—'),
        'Email: ' + (d.email || '—'),
        'Brand: ' + (d.brand || '—'),
        'Industry: ' + (d.industry || '—'),
        'Engagement: ' + (d.engagement || '—'),
        '',
        '── BRIEF ──',
        d.brief || '—',
        '',
        '— sent via chamelo.agency · contact form'
      ].join('\n');

      openWhatsAppWith(lines);

      if (ok) ok.hidden = false;
      if (form) Array.from(form.querySelectorAll('input,textarea,select,button')).forEach(el => el.disabled = true);
    }
  };

  // ┌─ Custom cursor (desktop only) ─────────────────────────────┐
  function initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;
    // Only enable on fine pointers (desktop). Mobile/coarse pointers skip.
    if (!window.matchMedia('(pointer: fine)').matches) {
      document.body.classList.add('cursor-off');
      return;
    }
    // Only now — once the custom cursor is confirmed active — hide the system cursor.
    // If this script never runs, the native cursor stays visible (no dead pointer).
    document.body.classList.add('cursor-on');
    const dot  = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let rx = x, ry = y;

    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });

    function tick() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dot)  dot.style.transform  = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();

    const hoverSelector = 'a, button, [data-route], input, textarea, select, .pillar, .service-card, .contact-channel, .stage, .home-stage, .home-svc, .home-stat, .stat, .trait, .diag-option';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelector)) cursor.dataset.hover = 'true';
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelector)) cursor.dataset.hover = 'false';
    });
  }

  // ┌─ Page transition veil ─────────────────────────────────────┐
  function pageVeilIn() {
    const veil = document.getElementById('pageVeil');
    if (!veil) return Promise.resolve();
    veil.dataset.active = 'true';
    return new Promise(r => setTimeout(r, 380));
  }
  function pageVeilOut() {
    const veil = document.getElementById('pageVeil');
    if (!veil) return;
    setTimeout(() => { veil.dataset.active = 'false'; }, 80);
  }

  // ┌─ Stat counters (home strip) ───────────────────────────────┐
  function initHomeStats() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const stats = document.querySelectorAll('.home-stat__num[data-count]');
    if (!stats.length) return;
    stats.forEach(el => {
      const target = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v); }
      });
    });
    // Reveal the whole strip
    gsap.from('.home-stat', {
      scrollTrigger: { trigger: '.home-stats', start: 'top 80%' },
      opacity: 0, y: 30, stagger: 0.1, duration: 0.7
    });
  }

  // ┌─ Services + Approach + Home scroll reveals ────────────────┐
  function initSecondaryReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (prefersReduced()) return;            // a11y: reduced-motion → no secondary reveals

    // SERVICES page
    gsap.from('.service-card', {
      scrollTrigger: { trigger: '.services-grid', start: 'top 75%' },
      opacity: 0, y: 40, stagger: 0.05, duration: 0.7, ease: 'power3.out'
    });

    // APPROACH page — stages reveal alternately
    document.querySelectorAll('.stage').forEach((stage, i) => {
      gsap.from(stage, {
        scrollTrigger: { trigger: stage, start: 'top 80%' },
        opacity: 0,
        x: (i % 2 === 0) ? -40 : 40,
        duration: 0.9,
        ease: 'power3.out'
      });
      gsap.from(stage.querySelector('.stage__node'), {
        scrollTrigger: { trigger: stage, start: 'top 80%' },
        scale: 0, duration: 0.5, delay: 0.4, ease: 'back.out(2)'
      });
    });

    // HOME approach preview
    gsap.from('.home-stage', {
      scrollTrigger: { trigger: '.home-approach', start: 'top 80%' },
      opacity: 0, y: 40, stagger: 0.05, duration: 0.7
    });

    // HOME services rail
    gsap.from('.home-svc', {
      scrollTrigger: { trigger: '.home-services', start: 'top 85%' },
      opacity: 0, y: 20, stagger: 0.06, duration: 0.5
    });

    // FINAL CTA strip
    gsap.from('.home-final-cta__inner > *', {
      scrollTrigger: { trigger: '.home-final-cta', start: 'top 85%' },
      opacity: 0, y: 24, stagger: 0.06, duration: 0.7
    });

    // FOOTER reveal — use fromTo with explicit toggleActions and once
    gsap.fromTo('.footer__col',
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, stagger: 0.06, duration: 0.6,
        scrollTrigger: { trigger: '.footer', start: 'top 95%', once: true, toggleActions: 'play none none none' },
        immediateRender: false   /* important: don't pre-set opacity to 0 before scroll */
      }
    );
  }

  // ┌─ Camouflage reveal — chameleon "decloak" (desaturated → true colour) ──┐
  function initCamo() {
    if (!('IntersectionObserver' in window)) return;
    // Only elements NOT already driven by a GSAP reveal, to avoid transform conflicts.
    const targets = document.querySelectorAll('.insight-card, .contact-channel, .chamstudio-tile');
    if (!targets.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('camo--in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    targets.forEach(el => { el.classList.add('camo'); io.observe(el); });
  }

  // ┌─ Mobile menu (burger overlay) ─────────────────────────────┐
  function initMobileMenu() {
    const burger = document.getElementById('burger');
    const overlay = document.getElementById('mobileMenu');
    if (!burger || !overlay) return;

    const close = () => {
      overlay.dataset.open = 'false';
      burger.dataset.open = 'false';
      overlay.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    const open = () => {
      overlay.dataset.open = 'true';
      burger.dataset.open = 'true';
      overlay.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    burger.addEventListener('click', () => {
      const isOpen = overlay.dataset.open === 'true';
      isOpen ? close() : open();
    });

    overlay.querySelectorAll('[data-route], [data-results-open]').forEach(link => {
      link.addEventListener('click', close);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // ┌─ Newsletter signup (Insights coming soon) ─────────────────┐
  function initSignalForm() {
    document.querySelectorAll('.signal-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = input?.value?.trim();
        if (!email) return;
        openWhatsAppWith('Hi Chamelo, I\'d like access to the Insights archive when it opens.\n\nEmail: ' + email);
        input.value = '';
        input.placeholder = state.lang === 'ar' ? 'تم التسجيل ✓' : 'You\'re on the list ✓';
      });
    });
  }

  // ┌─ About page scroll reveals ────────────────────────────────┐
  function initAboutReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (prefersReduced()) return;            // a11y: reduced-motion → no about reveals
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;

    // Manifesto headline + lede — scoped to #about, revealed when it enters view
    const aboutHeroST = { trigger: '#about .about-hero', start: 'top 75%', toggleActions: 'play none none reverse' };
    gsap.from('#about .about-hero__eyebrow', { scrollTrigger: aboutHeroST, opacity: 0, y: 16, duration: 0.6 });
    gsap.from('#about .about-hero__h1 .word', { scrollTrigger: aboutHeroST, yPercent: 100, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power4.out', delay: 0.2 });
    gsap.from('#about .about-hero__h1-ar .word, #about .about-hero__h1-ar .bullet', { scrollTrigger: aboutHeroST, x: -30, opacity: 0, stagger: 0.06, duration: 0.7, delay: 0.7 });
    gsap.from('#about .about-hero__lede', { scrollTrigger: aboutHeroST, opacity: 0, y: 20, duration: 0.7, delay: 1.0 });
    gsap.from('#about .dossier-header > *', { scrollTrigger: aboutHeroST, opacity: 0, y: -10, stagger: 0.1, duration: 0.5 });

    // Section headers — each fades in as it enters
    document.querySelectorAll('.about-section').forEach(section => {
      gsap.from(section.querySelector('.section-header'), {
        scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' },
        opacity: 0, y: 20, duration: 0.6
      });
    });

    // Origin — staggered fade + data block types in
    gsap.from('.about-origin__copy p', {
      scrollTrigger: { trigger: '.about-origin', start: 'top 70%' },
      opacity: 0, y: 30, stagger: 0.12, duration: 0.8
    });
    gsap.from('.data-block', {
      scrollTrigger: { trigger: '.about-origin', start: 'top 70%' },
      opacity: 0, x: 40, duration: 0.8, delay: 0.3
    });
    gsap.from('.data-block__rows li', {
      scrollTrigger: { trigger: '.about-origin', start: 'top 65%' },
      opacity: 0, x: 10, stagger: 0.08, duration: 0.4, delay: 0.6
    });

    // Pillars — staggered cards + rules
    gsap.from('.pillar', {
      scrollTrigger: { trigger: '.about-pillars', start: 'top 75%' },
      opacity: 0, y: 50, stagger: 0.15, duration: 0.9, ease: 'power3.out'
    });
    gsap.from('.pillar__rule', {
      scrollTrigger: { trigger: '.about-pillars', start: 'top 70%' },
      scaleX: 0, stagger: 0.15, duration: 0.7, delay: 0.4, transformOrigin: 'left'
    });

    // Promise — quote reveal
    gsap.from('.promise-marks, .promise__en, .promise__ar, .promise-sig', {
      scrollTrigger: { trigger: '.about-promise', start: 'top 70%' },
      opacity: 0, y: 30, stagger: 0.18, duration: 0.9
    });

    // Symbol section
    gsap.from('.symbol-intro', {
      scrollTrigger: { trigger: '.about-symbol', start: 'top 70%' },
      opacity: 0, y: 20, duration: 0.7
    });
    gsap.from('.trait', {
      scrollTrigger: { trigger: '.about-symbol', start: 'top 65%' },
      opacity: 0, x: -20, stagger: 0.1, duration: 0.6, delay: 0.3
    });
    gsap.from('.symbol-mark', {
      scrollTrigger: { trigger: '.about-symbol', start: 'top 70%' },
      opacity: 0, scale: 0.85, duration: 1.0, ease: 'back.out(1.4)'
    });

    // Mission & Vision split
    gsap.from('.mv-col--mission', {
      scrollTrigger: { trigger: '.about-mv', start: 'top 70%' },
      opacity: 0, x: -30, duration: 0.8
    });
    gsap.from('.mv-col--vision', {
      scrollTrigger: { trigger: '.about-mv', start: 'top 70%' },
      opacity: 0, x: 30, duration: 0.8
    });
    gsap.from('.mv-divider', {
      scrollTrigger: { trigger: '.about-mv', start: 'top 70%' },
      scaleY: 0, duration: 1.0, delay: 0.3, transformOrigin: 'center'
    });

    // CTA strip
    gsap.from('.about-cta-strip__inner > *', {
      scrollTrigger: { trigger: '.about-cta-strip', start: 'top 85%' },
      opacity: 0, y: 20, stagger: 0.15, duration: 0.6
    });
  }

  // ┌─ Lenis smooth scroll ──────────────────────────────────────┐
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Snappier defaults — was 1.15s causing perceptible lag on scroll
    const lenis = new Lenis({
      duration: 0.85,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -8 * t)),
      smoothWheel: true,
      syncTouch: false,        /* native touch is faster on mobile */
      touchMultiplier: 1.2,
      wheelMultiplier: 1.1,
      lerp: 0.12,              /* faster catch-up */
    });
    window.lenis = lenis;
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      // Force one refresh AFTER first frame so ScrollTrigger picks up correct positions
      setTimeout(() => ScrollTrigger.refresh(), 100);
      setTimeout(() => ScrollTrigger.refresh(), 1000);
    }
    document.querySelectorAll('[data-lenis-prevent]').forEach(el => {
      el.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
    });
  }

  // ┌─ Case Study — in-site dossier detail panel ────────────────┐
  // Tailored copy for the featured files; the rest use a sector template.
  const CASE_FEATURED = {
    '02': {
      brief: 'Linepack needed a brand that reads precise and dependable in a category full of noise — packaging that signals order before a word is read.',
      approach: 'We built the identity around one structural line-system: logo, grid and pack architecture drawn from the same geometry. One rule, applied everywhere.',
      result: 'A system the shelf recognises instantly — and a toolkit the team can extend without breaking the logic.'
    },
    '04': {
      brief: 'DRAX wanted presence — a name that lands hard and holds in memory.',
      approach: 'A bold wordmark, high-contrast palette and a motion signature that keeps the mark kinetic across every surface.',
      result: 'An identity that punches above its category and stays unmistakable, in motion or still.'
    },
    '05': {
      brief: 'VLORA needed warmth and refinement without losing its edge — premium, but human.',
      approach: 'A softer serif voice paired with a disciplined layout system; texture and restraint doing the heavy lifting.',
      result: 'A brand that feels considered and quietly confident — recognised before the logo is even read.'
    },
    '10': {
      brief: 'Narmer carried heritage weight — the brand had to feel rooted yet contemporary.',
      approach: 'We distilled the story into a single emblem and a type system that balances monument and modernity.',
      result: 'An identity that honours the name and still moves comfortably in a modern market.'
    },
    '03': {
      brief: 'An agency brand has to prove the craft it sells. FORK needed to look like the work.',
      approach: 'A confident, type-led editorial system — grid-strict, with a flexible mark that performs across decks, social and site.',
      result: 'A brand that starts pitching before the meeting does.'
    },
    '13': {
      brief: 'Novix needed to look like the future it sells — clean, fast, credible.',
      approach: 'A precise, systemised identity: tight type, a sharp mark and UI-ready tokens so product and brand speak one language.',
      result: 'A tech brand that reads trustworthy at a glance and scales straight into product.'
    },
  };
  // Sector-aware templates — tailored to the kind of work, no invented metrics.
  const CASE_TEMPLATES = {
    identity: {
      brief: (t) => t + ' needed an identity with backbone — a system that reads consistent and intentional everywhere it lands.',
      approach: 'Diagnosis first, then the core: a considered mark, a typographic voice and a layout system drawn from one idea — so every touchpoint feels like the same brand.',
      result: (t) => 'A recognisable, ownable identity the audience clocks on sight — with a toolkit the team can extend without losing the thread.'
    },
    social: {
      brief: (t) => t + ' needed a content engine that earns attention without shouting — presence built post by post.',
      approach: 'We shaped a content system — pillars, formats and a visual rhythm tuned to the platform — then produced against it consistently.',
      result: (t) => 'A feed that looks deliberate and on-brand at a glance — the kind of consistency that compounds into recognition.'
    },
    beauty: {
      brief: (t) => t + ' needed a presence that feels premium and trustworthy in a category where perception is everything.',
      approach: 'We balanced warmth with restraint — a refined identity and content direction that signal quality before a claim is read.',
      result: (t) => 'A brand that looks the part on shelf and on screen, and reads credible to the people it is for.'
    },
    tech: {
      brief: (t) => t + ' needed to look as sharp and dependable as the product it ships.',
      approach: 'A precise, systemised identity — tight type, a clear mark and consistent components so brand and product speak one language.',
      result: (t) => 'A brand that reads modern and trustworthy at a glance, and scales cleanly into the interface.'
    },
    culture: {
      brief: (t) => t + ' needed character — a brand with a point of view people actually want to follow.',
      approach: 'We found the story, then built an identity and content direction with enough personality to travel and enough discipline to stay coherent.',
      result: (t) => 'A brand that feels alive and distinct — recognisable in a crowded, fast-moving space.'
    },
  };
  function caseCopy(p) {
    if (CASE_FEATURED[p.id]) return CASE_FEATURED[p.id];
    const cat = (typeof categoryForProject === 'function') ? categoryForProject(p) : 'identity';
    const t = CASE_TEMPLATES[cat] || CASE_TEMPLATES.identity;
    return { brief: t.brief(p.title), approach: t.approach, result: t.result(p.title) };
  }

  let casePanel = null;
  let caseIndex = 0;
  function ensureCasePanel() {
    if (casePanel) return casePanel;
    const el = document.createElement('div');
    el.id = 'caseStudy';
    el.className = 'case';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.dataset.open = 'false';
    el.innerHTML =
      '<div class="case__scrim" data-case-close></div>' +
      '<button class="case__close" data-case-close aria-label="Close case file">✕</button>' +
      '<article class="case__panel" data-lenis-prevent>' +
        '<div class="case__top"><span class="case__code"></span><span class="case__sector"></span></div>' +
        '<h2 class="case__title"></h2>' +
        '<div class="case__hero"><img class="case__hero-img" alt="" decoding="async" /></div>' +
        '<div class="case__cols">' +
          '<section class="case__block"><span class="case__label">THE BRIEF</span><p class="case__brief"></p></section>' +
          '<section class="case__block"><span class="case__label">APPROACH</span><p class="case__approach"></p></section>' +
        '</div>' +
        '<div class="case__gallery" data-empty="true"></div>' +
        '<section class="case__block case__resultblock"><span class="case__label">RESULT</span><p class="case__result-text"></p></section>' +
        '<footer class="case__foot">' +
          '<a class="case__live" target="_blank" rel="noopener noreferrer">VIEW LIVE <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg></a>' +
          '<div class="case__pager">' +
            '<button class="case__prev" type="button" aria-label="Previous case">←&nbsp;PREV</button>' +
            '<span class="case__counter"></span>' +
            '<button class="case__next" type="button" aria-label="Next case">NEXT&nbsp;→</button>' +
          '</div>' +
        '</footer>' +
      '</article>';
    document.body.appendChild(el);
    casePanel = el;
    el.querySelectorAll('[data-case-close]').forEach(b => b.addEventListener('click', closeCaseStudy));
    el.querySelector('.case__prev').addEventListener('click', () => openCaseStudy(caseIndex - 1));
    el.querySelector('.case__next').addEventListener('click', () => openCaseStudy(caseIndex + 1));
    return el;
  }

  // Auto-probe gallery: drop files at assets/work/cs/<id>/1.<ext> … 6.<ext>
  // (webp / jpg / png all work) and they appear in order; missing slots
  // remove themselves, and the whole gallery hides if none exist.
  const CASE_GALLERY_EXTS = ['webp', 'jpg', 'jpeg', 'png'];
  function buildCaseGallery(p) {
    const wrap = casePanel.querySelector('.case__gallery');
    wrap.innerHTML = '';
    wrap.dataset.empty = 'true';
    for (let n = 1; n <= 6; n++) {
      const fig = document.createElement('figure');
      fig.className = 'case__shot';
      const im = document.createElement('img');
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = p.title + ' — frame ' + n;
      let ext = 0;
      const tryNext = () => {
        if (ext >= CASE_GALLERY_EXTS.length) { fig.remove(); return; }
        im.src = 'assets/work/cs/' + p.id + '/' + n + '.' + CASE_GALLERY_EXTS[ext++];
      };
      im.onerror = tryNext;
      im.onload = () => { wrap.dataset.empty = 'false'; };
      fig.appendChild(im);
      wrap.appendChild(fig);
      tryNext();
    }
  }

  function openCaseStudy(idx) {
    if (typeof PORTFOLIO === 'undefined' || !PORTFOLIO.length) return;
    const N = PORTFOLIO.length;
    caseIndex = ((idx % N) + N) % N;
    const p = PORTFOLIO[caseIndex];
    const copy = caseCopy(p);
    ensureCasePanel();
    casePanel.querySelector('.case__code').textContent = 'CF · ' + p.id;
    casePanel.querySelector('.case__sector').textContent = p.sector + ' · ' + p.year;
    casePanel.querySelector('.case__title').textContent = p.title;
    const hero = casePanel.querySelector('.case__hero-img');
    hero.src = p.img; hero.alt = p.title;
    casePanel.querySelector('.case__brief').textContent = copy.brief;
    casePanel.querySelector('.case__approach').textContent = copy.approach;
    casePanel.querySelector('.case__result-text').textContent = copy.result;
    casePanel.querySelector('.case__live').href = p.url;
    casePanel.querySelector('.case__counter').textContent = p.id + ' / 033';
    buildCaseGallery(p);
    const panelEl = casePanel.querySelector('.case__panel');
    if (panelEl) panelEl.scrollTop = 0;
    casePanel.dataset.open = 'true';
    casePanel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.lenis && typeof window.lenis.stop === 'function') window.lenis.stop();
    const closeBtn = casePanel.querySelector('.case__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeCaseStudy() {
    if (!casePanel) return;
    casePanel.dataset.open = 'false';
    casePanel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();
  }

  function initCaseStudy() {
    ensureCasePanel();
    // Bento project cards open the panel (href kept as middle-click fallback)
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.proj-card[data-id]');
      if (!card) return;
      e.preventDefault();
      const idx = PORTFOLIO.findIndex(pp => pp.id === card.dataset.id);
      if (idx >= 0) openCaseStudy(idx);
    });
    document.addEventListener('keydown', (e) => {
      if (!casePanel || casePanel.dataset.open !== 'true') return;
      if (e.key === 'Escape') closeCaseStudy();
      else if (e.key === 'ArrowLeft') openCaseStudy(caseIndex - 1);
      else if (e.key === 'ArrowRight') openCaseStudy(caseIndex + 1);
    });
  }

  // ┌─ Results Wall — full-screen proof gallery (media-buying) ──┐
  const RESULTS_COUNT = 24;
  let resultsWall = null;
  function initResultsWall() {
    if (!resultsWall) {
      const w = document.createElement('div');
      w.id = 'resultsWall';
      w.className = 'rwall';
      w.dataset.open = 'false';
      w.setAttribute('aria-hidden', 'true');
      w.setAttribute('role', 'dialog');
      w.setAttribute('aria-modal', 'true');
      let shots = '';
      for (let n = 1; n <= RESULTS_COUNT; n++) {
        const id = String(n).padStart(2, '0');
        shots += '<figure class="rwall__shot"><img loading="lazy" decoding="async" src="assets/results/result-' + id + '.webp" alt="Campaign result ' + id + '"></figure>';
      }
      w.innerHTML =
        '<div class="rwall__scrim" data-rwall-close></div>' +
        '<button class="rwall__close" data-rwall-close aria-label="Close results">✕</button>' +
        '<div class="rwall__panel" data-lenis-prevent>' +
          '<header class="rwall__head">' +
            '<span class="rwall__eyebrow"><span class="status-dot"></span> FIELD RESULTS · UNRETOUCHED</span>' +
            '<h2 class="rwall__title">The receipts.</h2>' +
            '<p class="rwall__sub">Live dashboards from accounts we\'ve run — spend, ROAS and sales, screenshotted and untouched. Click any to enlarge.</p>' +
          '</header>' +
          '<div class="rwall__grid">' + shots + '</div>' +
        '</div>' +
        '<div class="rwall__zoom" data-rwall-zoomclose aria-hidden="true"><img alt="Result detail"></div>';
      document.body.appendChild(w);
      resultsWall = w;
      w.querySelectorAll('[data-rwall-close]').forEach(b => b.addEventListener('click', closeResultsWall));
      w.querySelector('.rwall__grid').addEventListener('click', (e) => {
        const img = e.target.closest('.rwall__shot img');
        if (!img) return;
        const z = w.querySelector('.rwall__zoom');
        z.querySelector('img').src = img.currentSrc || img.src;
        z.dataset.open = 'true';
      });
      w.querySelector('.rwall__zoom').addEventListener('click', () => {
        w.querySelector('.rwall__zoom').dataset.open = 'false';
      });
    }
    // Any element with [data-results-open] opens the wall
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-results-open]');
      if (!t) return;
      e.preventDefault();
      openResultsWall();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !resultsWall || resultsWall.dataset.open !== 'true') return;
      const z = resultsWall.querySelector('.rwall__zoom');
      if (z && z.dataset.open === 'true') z.dataset.open = 'false';
      else closeResultsWall();
    });
  }
  function openResultsWall() {
    if (!resultsWall) return;
    resultsWall.dataset.open = 'true';
    resultsWall.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.lenis && typeof window.lenis.stop === 'function') window.lenis.stop();
    const c = resultsWall.querySelector('.rwall__close');
    if (c) c.focus();
  }
  function closeResultsWall() {
    if (!resultsWall) return;
    resultsWall.dataset.open = 'false';
    resultsWall.setAttribute('aria-hidden', 'true');
    const z = resultsWall.querySelector('.rwall__zoom');
    if (z) z.dataset.open = 'false';
    document.body.style.overflow = '';
    if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();
  }

  // ┌─ Proof counters — count-up real numbers on reveal ─────────┐
  function initProofCounters() {
    const els = document.querySelectorAll('.proof-stat__num[data-to]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const fmt = (v, dec) => dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
    const run = (el) => {
      const to = parseFloat(el.dataset.to);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const dur = 1500, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(to * e, dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((ents) => {
      ents.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  // ┌─ Visual fingerprint — scroll-depth bar + magnetic CTAs ────┐
  function initScrollProgress() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let bar = document.getElementById('scrollProgress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollProgress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
    const set = (p) => { bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p || 0)) + ')'; };
    const compute = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      set(max > 0 ? window.scrollY / max : 0);
    };
    if (window.lenis && typeof window.lenis.on === 'function') {
      window.lenis.on('scroll', (e) => {
        const p = (e && e.progress != null) ? e.progress : (e && e.limit ? e.scroll / e.limit : null);
        if (p != null) set(p); else compute();
      });
    }
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    document.addEventListener('chamelo:pagechange', () => { set(0); setTimeout(compute, 80); });
    compute();
  }

  function initMagneticCTAs() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.hero__cta, .btn--primary, .nav__cta, .home-final-cta__btn').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (mx * 0.22).toFixed(1) + 'px, ' + (my * 0.3).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  // ┌─ 3D Infinite Gallery — vanilla Three.js port (Work page) ──┐
  // Ported from the React/@react-three-fiber component to plain THREE:
  // planes drift through z-space with cloth/flag vertex warp + fade/blur,
  // driven by drag · arrow keys · touch · auto-play. Renders only while the
  // Work page is active and the section is in view (perf-gated).
  function initInfiniteGallery() {
    const section = document.getElementById('gallery3d');
    const container = document.getElementById('gallery3dCanvas');
    if (!section || !container) return;

    const hasWebGL = (() => {
      try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
      catch (e) { return false; }
    })();
    const sources = (typeof PORTFOLIO !== 'undefined' ? PORTFOLIO.map(p => p.img) : []);

    // Fallback grid if THREE / WebGL unavailable
    if (typeof THREE === 'undefined' || !hasWebGL || !sources.length) {
      const fb = document.getElementById('gallery3dFallback');
      if (fb && typeof PORTFOLIO !== 'undefined') {
        fb.hidden = false;
        fb.innerHTML = PORTFOLIO.slice(0, 18).map(p => '<img src="' + p.img + '" alt="' + p.title + '" loading="lazy">').join('');
      }
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const totalImages = sources.length;
    const VISIBLE = 10, DEPTH = 50, MAX_H = 8, MAX_V = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const loader = new THREE.TextureLoader();
    const textures = new Array(totalImages).fill(null);
    let texturesRequested = false;
    function ensureTextures() {
      if (texturesRequested) return;
      texturesRequested = true;
      sources.forEach((src, i) => {
        loader.load(src, (tex) => {
          if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
          textures[i] = tex;
        }, undefined, () => {});
      });
    }

    function makeMaterial() {
      return new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          map: { value: null }, opacity: { value: 0 }, blurAmount: { value: 0 },
          scrollForce: { value: 0 }, time: { value: 0 }, isHovered: { value: 0 },
          resolution: { value: new THREE.Vector2(1000, 1000) },
        },
        vertexShader:
          'uniform float scrollForce; uniform float time; uniform float isHovered; varying vec2 vUv;' +
          'void main(){ vUv=uv; vec3 pos=position; float ci=scrollForce*0.3; float d=length(pos.xy);' +
          'float curve=d*d*ci; float r1=sin(pos.x*2.0+scrollForce*3.0)*0.02; float r2=sin(pos.y*2.5+scrollForce*2.0)*0.015;' +
          'float cloth=(r1+r2)*abs(ci)*2.0; float flag=0.0;' +
          'if(isHovered>0.5){ float ph=pos.x*3.0+time*8.0; float amp=sin(ph)*0.1; float damp=smoothstep(-0.5,0.5,pos.x);' +
          'flag=amp*damp+sin(pos.x*5.0+time*12.0)*0.03*damp; }' +
          'pos.z-=(curve+cloth+flag); gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0); }',
        fragmentShader:
          'uniform sampler2D map; uniform float opacity; uniform float blurAmount; uniform float scrollForce; uniform vec2 resolution; varying vec2 vUv;' +
          'void main(){ vec4 color=texture2D(map,vUv);' +
          'if(blurAmount>0.0){ vec2 texel=1.0/resolution; vec4 sum=vec4(0.0); float total=0.0;' +
          'for(float x=-2.0;x<=2.0;x+=1.0){ for(float y=-2.0;y<=2.0;y+=1.0){ vec2 off=vec2(x,y)*texel*blurAmount;' +
          'float w=1.0/(1.0+length(vec2(x,y))); sum+=texture2D(map,vUv+off)*w; total+=w; } } color=sum/total; }' +
          'float hl=abs(scrollForce)*0.05; color.rgb+=vec3(hl*0.1); gl_FragColor=vec4(color.rgb,color.a*opacity); }',
      });
    }

    const spatial = [];
    for (let i = 0; i < VISIBLE; i++) {
      const ha = (i * 2.618) % (Math.PI * 2), va = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);
      const hr = (i % 3) * 1.2, vr = ((i + 1) % 4) * 0.8;
      spatial.push({ x: Math.sin(ha) * hr * MAX_H / 3, y: Math.cos(va) * vr * MAX_V / 4 });
    }

    const geom = new THREE.PlaneGeometry(1, 1, 16, 16);
    const planes = [];
    for (let i = 0; i < VISIBLE; i++) {
      const mat = makeMaterial();
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(spatial[i].x, spatial[i].y, 0);
      scene.add(mesh);
      planes.push({ mesh, mat, z: ((DEPTH / VISIBLE) * i) % DEPTH, imageIndex: i % totalImages, lastImg: -1 });
    }

    let velocity = 0, autoPlay = !reduce, hovered = false, dragging = false, lastY = 0, inView = false;
    let lastInteract = (typeof performance !== 'undefined' ? performance.now() : 0);
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    function bump(v) { velocity += v; autoPlay = false; lastInteract = now(); start(); }

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', (e) => { dragging = true; lastY = e.clientY; section.classList.add('is-dragging'); try { dom.setPointerCapture(e.pointerId); } catch (x) {} });
    dom.addEventListener('pointermove', (e) => { if (!dragging) return; const dy = e.clientY - lastY; lastY = e.clientY; bump(-dy * 0.03); });
    const endDrag = () => { dragging = false; section.classList.remove('is-dragging'); };
    dom.addEventListener('pointerup', endDrag);
    dom.addEventListener('pointercancel', endDrag);
    dom.addEventListener('pointerenter', () => { hovered = true; });
    dom.addEventListener('pointerleave', () => { hovered = false; endDrag(); });
    document.addEventListener('keydown', (e) => {
      if (!inView) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') bump(-2);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') bump(2);
    });

    function resize() {
      const w = container.clientWidth || section.clientWidth || 1;
      const h = container.clientHeight || section.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }

    const clock = new THREE.Clock();
    let raf = 0, running = false;
    function frame() {
      if (!running) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      if (autoPlay) velocity += 0.3 * delta;
      velocity *= 0.95;
      if (!autoPlay && !reduce && now() - lastInteract > 3000) autoPlay = true;

      const half = DEPTH / 2;
      const imageAdvance = totalImages > 0 ? (VISIBLE % totalImages || totalImages) : 0;
      planes.forEach((p, i) => {
        let nz = p.z + velocity * delta * 10, wf = 0, wb = 0;
        if (nz >= DEPTH) { wf = Math.floor(nz / DEPTH); nz -= DEPTH * wf; }
        else if (nz < 0) { wb = Math.ceil(-nz / DEPTH); nz += DEPTH * wb; }
        if (wf > 0 && imageAdvance > 0) p.imageIndex = (p.imageIndex + wf * imageAdvance) % totalImages;
        if (wb > 0 && imageAdvance > 0) p.imageIndex = (((p.imageIndex - wb * imageAdvance) % totalImages) + totalImages) % totalImages;
        p.z = ((nz % DEPTH) + DEPTH) % DEPTH;
        const np = p.z / DEPTH;

        let opacity = 1;
        const fIs = 0.05, fIe = 0.25, fOs = 0.4, fOe = 0.43;
        if (np >= fIs && np <= fIe) opacity = (np - fIs) / (fIe - fIs);
        else if (np < fIs) opacity = 0;
        else if (np >= fOs && np <= fOe) opacity = 1 - (np - fOs) / (fOe - fOs);
        else if (np > fOe) opacity = 0;
        opacity = Math.max(0, Math.min(1, opacity));

        const maxBlur = 8.0, bIe = 0.1, bOs = 0.4, bOe = 0.43;
        let blur = 0;
        if (np <= bIe) blur = maxBlur * (1 - np / bIe);
        else if (np >= bOs && np <= bOe) blur = maxBlur * ((np - bOs) / (bOe - bOs));
        else if (np > bOe) blur = maxBlur;
        blur = Math.max(0, Math.min(maxBlur, blur));

        const tex = textures[p.imageIndex];
        const u = p.mat.uniforms;
        u.time.value = time; u.scrollForce.value = velocity; u.opacity.value = opacity;
        u.blurAmount.value = blur; u.isHovered.value = hovered ? 1.0 : 0.0;
        if (tex) {
          if (p.lastImg !== p.imageIndex && tex.image) {
            u.map.value = tex;
            u.resolution.value.set(tex.image.width || 1000, tex.image.height || 1000);
            const aspect = (tex.image.width || 1) / (tex.image.height || 1);
            if (aspect > 1) p.mesh.scale.set(2 * aspect, 2, 1); else p.mesh.scale.set(2, 2 / aspect, 1);
            p.lastImg = p.imageIndex;
          }
          if (!u.map.value) u.map.value = tex;
        } else { u.opacity.value = 0; }
        p.mesh.position.set(spatial[i].x, spatial[i].y, p.z - half);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; ensureTextures(); running = true; resize(); clock.getDelta(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    window.addEventListener('resize', () => { if (running) resize(); });

    function updateRun() {
      const should = (currentPage === 'work') && inView && !document.hidden;
      if (should) start(); else stop();
    }
    const io = new IntersectionObserver((ents) => { inView = ents[0].isIntersecting; updateRun(); }, { threshold: 0.05 });
    io.observe(section);
    document.addEventListener('chamelo:pagechange', updateRun);
    document.addEventListener('visibilitychange', updateRun);
    setTimeout(() => { resize(); updateRun(); }, 250);
  }

  // ┌─ Init ──────────────────────────────────────────────────────┐
  function runAllInits() {
    const safe = (fn, name) => { try { fn(); } catch (e) { console.error('['+name+']', e); } };
    safe(initCursor,            'cursor');
    safe(initCrosshair,         'crosshair');
    safe(initHeroEye,           'heroEye');
    safe(runHeroIntro,          'heroIntro');
    safe(rotateCoordinates,     'coords');
    safe(initScrollTrigger,     'scrollTrig');
    safe(initScrollSpy,         'scrollSpy');
    safe(initAboutReveals,      'aboutReveals');
    safe(initSecondaryReveals,  'secReveals');
    safe(initHomeStats,         'homeStats');
    safe(initDeck,              'deck');
    safe(initProjects,          'projects');
    safe(initBrandSlider,       'brandSlider');
    safe(initHomeWork,          'homeWork');
    safe(initChameleonFigure,   'chameleon');
    safe(initServicesReel,      'servicesReel');
    safe(initDiagnostic,        'diagnostic');
    safe(initSignalForm,        'signalForm');
    safe(initMobileMenu,        'mobileMenu');
    safe(initCamo,              'camo');
    safe(initCaseStudy,         'caseStudy');
    safe(initInfiniteGallery,   'gallery3d');
    safe(initResultsWall,       'resultsWall');
    safe(initProofCounters,     'proofCounters');
    safe(initSectionReveals,    'sectionReveals');
    safe(initScrollProgress,    'scrollProgress');
    safe(initMagneticCTAs,      'magneticCTAs');
    safe(revealSafetyNet,       'safetyNet');
  }

  function init() {
    initThemeToggle();   // first, before paint, to avoid flash
    initLenis();
    initRouting();
    initLanguageToggle();
    mountHero();
    // Schedule via microtask + small setTimeout — survives hidden-tab throttling
    // (requestAnimationFrame is paused while the tab is hidden, which would
    //  otherwise stall our whole init chain).
    Promise.resolve().then(() => {
      dismissLoader();
      setTimeout(runAllInits, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

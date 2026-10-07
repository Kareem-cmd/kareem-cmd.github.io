/* KHAYAL — main.js
   Phase 1 scaffold: nav scroll state, theme switch by surface,
   section rail tracking, reduced-motion guard, GSAP bootstrap.
*/
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- GSAP plugins ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'expo.out', duration: .9 });
  }

  /* ---------- Nav: scroll state + theme by surface ---------- */
  const nav = $('#nav');
  const sections = $$('main > section[data-rail]');

  const setNavTheme = (theme) => {
    if (!nav) return;
    nav.classList.toggle('theme-light', theme === 'light');
  };

  // detect current section surface to flip nav theme
  const surfaceToTheme = (el) => {
    if (el.classList.contains('surface-dark')) return 'dark';
    if (el.classList.contains('surface-light')) return 'light';
    if (el.classList.contains('surface-paper')) return 'light';
    return 'dark';
  };

  if (window.ScrollTrigger) {
    sections.forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 40%',
        end: 'bottom 40%',
        onEnter: () => {
          setNavTheme(surfaceToTheme(sec));
          activateRail(sec.dataset.rail);
        },
        onEnterBack: () => {
          setNavTheme(surfaceToTheme(sec));
          activateRail(sec.dataset.rail);
        },
      });
    });
  }

  // nav background after scroll
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 16);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Rail indicator ---------- */
  const railSteps = $$('.scroll-rail .rail-step');
  const navMenu   = $$('.nav-menu a');
  const activateRail = (id) => {
    if (!id) return;
    railSteps.forEach(s => s.classList.toggle('is-active', s.dataset.section === id));
    navMenu.forEach(a => {
      const href = (a.getAttribute('href') || '').replace('#','');
      a.classList.toggle('is-active', href === id);
    });
  };

  /* ---------- Smooth in-page links ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const t = id && document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      // close mobile drawer if open
      const drawer = $('#navMobile');
      if (drawer?.classList.contains('is-open')) closeMobileNav();
      t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- Mobile nav drawer ---------- */
  const navToggle = $('#navToggle');
  const navClose = $('#navClose');
  const navMobile = $('#navMobile');
  const openMobileNav = () => {
    navMobile?.classList.add('is-open');
    navMobile?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
  };
  const closeMobileNav = () => {
    navMobile?.classList.remove('is-open');
    navMobile?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
  };
  navToggle?.addEventListener('click', openMobileNav);
  navClose?.addEventListener('click', closeMobileNav);
  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMobile?.classList.contains('is-open')) closeMobileNav();
  });

  /* ---------- Reveal fallback (GSAP-driven phases will override) ---------- */
  if (!prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('reveal-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '-10% 0px -10% 0px', threshold: 0.01 });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('reveal-in'));
  }

  /* ---------- Reduced motion: disable ScrollTrigger animations ---------- */
  if (prefersReduced && window.ScrollTrigger) {
    ScrollTrigger.getAll().forEach(t => t.disable(false));
  }
})();

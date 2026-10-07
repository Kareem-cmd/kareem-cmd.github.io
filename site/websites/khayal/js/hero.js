/* KHAYAL — Hero + About animations
   Loaded after main.js. Assumes GSAP + ScrollTrigger registered.
*/
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  /* ---------- Hero entrance ---------- */
  const heroTitleSpans = document.querySelectorAll('.hero__title .line > span');
  const heroImg = document.querySelector('.hero__media img');
  const heroBrackets = document.querySelectorAll('.hero__brackets b');
  const heroSub = document.querySelector('.hero__sub-col');
  const heroMeta = document.querySelectorAll('.hero__meta > *');
  const heroBottom = document.querySelectorAll('.hero__bottom > *');

  // Pre-set states
  gsap.set(heroTitleSpans, { yPercent: 110 });
  gsap.set(heroSub,        { autoAlpha: 0, y: 24 });
  gsap.set(heroMeta,       { autoAlpha: 0, y: 12 });
  gsap.set(heroBottom,     { autoAlpha: 0, y: 12 });
  gsap.set(heroBrackets,   { autoAlpha: 0, scale: .6 });
  gsap.set(heroImg,        { scale: 1.18, autoAlpha: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(heroImg,       { autoAlpha: 1, scale: 1.06, duration: 2.0, ease: 'power3.out' })
    .to(heroMeta,      { autoAlpha: 1, y: 0, duration: .9, stagger: .08 }, '-=1.6')
    .to(heroTitleSpans,{ yPercent: 0, duration: 1.2, stagger: .12, ease: 'expo.out' }, '-=1.5')
    .to(heroSub,       { autoAlpha: 1, y: 0, duration: 1.0 }, '-=.9')
    .to(heroBrackets,  { autoAlpha: 1, scale: 1, duration: .8, stagger: .06 }, '-=.8')
    .to(heroBottom,    { autoAlpha: 1, y: 0, duration: .8, stagger: .08 }, '-=.7');

  /* ---------- Hero parallax + zoom out on scroll ---------- */
  gsap.to(heroImg, {
    yPercent: 14,
    scale: 1.02,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });
  gsap.to('.hero__inner', {
    yPercent: -8,
    autoAlpha: .35,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });

  /* ---------- About reveal ---------- */
  // Eyebrow + h2 split-ish
  gsap.from('#studio .about__head .eyebrow', {
    autoAlpha: 0, y: 18, duration: .9,
    scrollTrigger: { trigger: '#studio', start: 'top 70%' }
  });
  gsap.from('#studio .about__head h2', {
    autoAlpha: 0, y: 36, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: '#studio', start: 'top 70%' }
  });

  // Body paragraphs stagger
  gsap.from('#studio .about__body > p, #studio .about__body > blockquote', {
    autoAlpha: 0, y: 24, duration: 1.0, stagger: .14, ease: 'expo.out',
    scrollTrigger: { trigger: '#studio .about__body', start: 'top 78%' }
  });

  // Stats number count-up
  document.querySelectorAll('#studio .about__stat .num').forEach(el => {
    const target = parseInt(el.textContent, 10) || 0;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'expo.out',
          onUpdate: () => { el.textContent = String(Math.round(obj.v)).padStart(2, '0'); }
        });
      }
    });
  });

  // Pillars stagger
  gsap.from('#studio .about__pillar', {
    autoAlpha: 0, y: 28, duration: .9, stagger: .08, ease: 'expo.out',
    scrollTrigger: { trigger: '#studio .about__pillars', start: 'top 80%' }
  });

  /* ---------- Cinematic breaks (all .cinematic sections) ---------- */
  document.querySelectorAll('.cinematic').forEach((cinSection) => {
    const cinImg = cinSection.querySelector('.cinematic__media img');
    const cinQuote = cinSection.querySelectorAll('.cinematic__quote .word > span');
    const cinIndex = cinSection.querySelector('.cinematic__index');
    const cinAttr = cinSection.querySelector('.cinematic__attr');
    const cinBracks = cinSection.querySelectorAll('.cinematic__brackets b');

    gsap.set(cinIndex, { autoAlpha: 0, y: 16 });
    gsap.set(cinAttr,  { autoAlpha: 0, y: 16 });
    gsap.set(cinBracks,{ autoAlpha: 0, scale: .6 });
    gsap.set(cinImg,   { scale: 1.18, autoAlpha: 0 });

    const cTL = gsap.timeline({
      defaults: { ease: 'expo.out' },
      scrollTrigger: {
        trigger: cinSection,
        start: 'top 70%',
        toggleActions: 'play none none none',
      }
    });
    cTL.to(cinImg,    { autoAlpha: 1, scale: 1.12, duration: 1.8, ease: 'power3.out' })
       .to(cinIndex,  { autoAlpha: 1, y: 0, duration: .8 }, '-=1.3')
       .to(cinQuote,  { y: '0%', duration: 1.1, stagger: .045, ease: 'expo.out' }, '-=1.1')
       .to(cinAttr,   { autoAlpha: 1, y: 0, duration: .8 }, '-=.5')
       .to(cinBracks, { autoAlpha: 1, scale: 1, duration: .8, stagger: .05 }, '-=.6');

    // parallax on cin image
    gsap.to(cinImg, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: cinSection,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });
})();

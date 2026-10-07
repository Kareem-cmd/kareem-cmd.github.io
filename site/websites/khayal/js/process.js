/* KHAYAL — Process / Blueprint animations
   Draw the axis, mark stages sequentially, extend vertical lines,
   reveal content. Bottom dimension line draws on its own ScrollTrigger.
*/
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const proc = document.getElementById('processDiagram');
  if (!proc) return;

  // Reveal intro
  gsap.from('.process__intro .eyebrow, .process__intro h2', {
    autoAlpha: 0, y: 28, duration: 1.0, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '.process__intro', start: 'top 78%' }
  });
  gsap.from('.process__intro p, .process__intro .legend', {
    autoAlpha: 0, y: 22, duration: .9, stagger: .12, ease: 'expo.out',
    scrollTrigger: { trigger: '.process__intro p', start: 'top 82%' }
  });
  gsap.from('.process__draft-label', {
    autoAlpha: 0, x: -16, duration: .9,
    scrollTrigger: { trigger: '.process__draft-label', start: 'top 85%' }
  });

  if (prefersReduced) {
    // Set everything to its end-state with no motion
    proc.querySelectorAll('.stage__marker .dot').forEach(d => d.style.transform = 'scale(1)');
    proc.querySelectorAll('.stage__marker .vline').forEach(v => v.style.height = '64px');
    proc.querySelectorAll('.stage__marker .coord').forEach(c => c.style.opacity = '1');
    return;
  }

  /* ---------- Set initial states ---------- */
  const stages = proc.querySelectorAll('.stage');
  const dots = proc.querySelectorAll('.stage__marker .dot');
  const vlines = proc.querySelectorAll('.stage__marker .vline');
  const coords = proc.querySelectorAll('.stage__marker .coord');
  const axisPath = proc.querySelector('#axisPath');
  const axisArrow = proc.querySelector('#axisArrow');
  const dimLine = proc.querySelector('#dimLineMain');

  // Axis path setup — stroke-dashoffset technique
  if (axisPath) {
    const len = axisPath.getTotalLength();
    axisPath.style.strokeDasharray = `${len}`;
    axisPath.style.strokeDashoffset = `${len}`;
    axisPath.style.strokeDasharray = `6 6`; // override visible pattern after we animate
    // We'll instead animate a wrapper with clip-path width.
    axisPath.dataset.totalLength = len;
  }

  // We use a clip-path on the parent SVG to reveal axis left→right
  const axisSvg = document.getElementById('axisSvg');
  if (axisSvg) {
    axisSvg.style.clipPath = 'inset(0 100% 0 0)';
  }

  const dimSvg = document.getElementById('dimSvg');
  if (dimSvg) {
    dimSvg.style.clipPath = 'inset(0 100% 0 0)';
  }

  // Pre-fade stage content
  stages.forEach(stage => {
    const top = stage.querySelector('.stage__top');
    const bottom = stage.querySelector('.stage__bottom');
    if (top) gsap.set(top.children, { autoAlpha: 0, y: 24 });
    if (bottom) gsap.set(bottom.querySelectorAll('li'), { autoAlpha: 0, y: 16 });
  });

  /* ---------- Master timeline pinned-ish via scrubbed ScrollTrigger ---------- */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: proc,
      start: 'top 70%',
      end: 'bottom 70%',
      scrub: false,        // sequential, not scrubbed
      toggleActions: 'play none none none',
      once: true,
    }
  });

  // 1. axis line wipe across
  tl.to(axisSvg, { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'expo.inOut' });
  tl.to(axisArrow, { autoAlpha: 1, duration: .3 }, '-=.2');

  // 2. stages sequentially — dot pop + vline extend + coord fade + content reveal
  stages.forEach((stage, i) => {
    const dot = stage.querySelector('.stage__marker .dot');
    const vline = stage.querySelector('.stage__marker .vline');
    const coord = stage.querySelector('.stage__marker .coord');
    const topItems = stage.querySelectorAll('.stage__top > *');
    const liItems = stage.querySelectorAll('.stage__bottom li');

    tl.to(dot,    { scale: 1, duration: .45, ease: 'back.out(2.4)' }, i === 0 ? '-=1.4' : '-=.45');
    tl.to(vline,  { height: 64, duration: .35, ease: 'expo.out' }, '-=.35');
    tl.to(coord,  { autoAlpha: 1, duration: .35 }, '-=.2');
    tl.to(topItems, { autoAlpha: 1, y: 0, duration: .55, stagger: .06, ease: 'expo.out' }, '-=.3');
    tl.to(liItems,  { autoAlpha: 1, y: 0, duration: .5, stagger: .04, ease: 'expo.out' }, '-=.45');
  });

  // 3. bottom dimension line draw + dims row
  gsap.set('.process__dims-row span', { autoAlpha: 0, y: 12 });
  ScrollTrigger.create({
    trigger: '.process__dims',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to(dimSvg, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'expo.inOut' });
      gsap.to('.process__dims-row span', { autoAlpha: 1, y: 0, duration: .6, stagger: .08, ease: 'expo.out', delay: .8 });
    }
  });

  // 4. total band + outro cells
  gsap.from('.process__total > *', {
    autoAlpha: 0, y: 22, duration: .9, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '.process__total', start: 'top 85%' }
  });
  gsap.from('.process__outro-cell', {
    autoAlpha: 0, y: 28, duration: .9, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '.process__outro', start: 'top 80%' }
  });
})();

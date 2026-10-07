/* KHAYAL — Preloader: CSS-driven animation with JS for counter + exit
   Designed to be bulletproof: zero dependency on window.load,
   max-duration guarantee, no chance of black-screen lock. */
(() => {
  const pre = document.getElementById('preloader');
  if (!pre) return;

  // Lock scroll
  document.body.classList.add('lock');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Total preloader duration
  const TOTAL_MS = prefersReduced ? 400 : 3800;

  // Fire animations as soon as possible
  const start = () => {
    pre.classList.add('is-ready');

    // Progress count + bar
    const bar = document.getElementById('preBarFill');
    const count = document.getElementById('preCount');
    const progressStart = performance.now() + 600; // wait until logo starts drawing
    const progressDuration = TOTAL_MS - 1600;

    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - progressStart) / progressDuration));
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);
      if (bar) bar.style.width = pct + '%';
      if (count) count.textContent = String(pct).padStart(2, '0');
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const finish = () => {
    pre.classList.add('is-leaving');
    // Remove after curtain animation completes
    setTimeout(() => {
      if (pre.parentNode) pre.parentNode.removeChild(pre);
      document.body.classList.remove('lock');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 1300);
  };

  // Run start immediately; finish after total duration
  // Use rAF to ensure CSS class triggers properly
  requestAnimationFrame(() => {
    requestAnimationFrame(start);
  });
  setTimeout(finish, TOTAL_MS);

  // Safety net: in case anything goes wrong, force-remove preloader after 8s
  setTimeout(() => {
    if (document.getElementById('preloader')) {
      pre.classList.add('is-leaving');
      setTimeout(() => {
        if (pre.parentNode) pre.parentNode.removeChild(pre);
        document.body.classList.remove('lock');
      }, 1200);
    }
  }, 8000);
})();

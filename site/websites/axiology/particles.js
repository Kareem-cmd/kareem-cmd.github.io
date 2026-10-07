/* =============================================================================
   AXIOLOGY — Ambient Floating Particles
   Sitewide canvas of slow-rising gold oil droplets. Lightweight, no deps.
   ========================================================================== */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.querySelector('[data-ambient-particles]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const COUNT = window.matchMedia('(hover: none), (pointer: coarse)').matches ? 18 : 36;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0, height = 0;
  const particles = [];

  function resize() {
    width  = window.innerWidth;
    height = window.innerHeight;
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
    canvas.width  = Math.floor(width  * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeParticle(initial) {
    const r = rand(1.2, 3.6);
    return {
      x: rand(0, width),
      y: initial ? rand(0, height) : height + rand(20, 200),
      r,
      vy: rand(0.15, 0.55),         // upward speed
      vx: rand(-0.06, 0.06),        // horizontal drift
      phase: rand(0, Math.PI * 2),  // oscillation phase
      freq: rand(0.005, 0.018),
      amp:  rand(8, 28),
      alpha: rand(0.18, 0.6)
    };
  }

  function spawn() {
    particles.length = 0;
    for (let i = 0; i < COUNT; i++) particles.push(makeParticle(true));
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // motion
      p.y -= p.vy;
      p.x += p.vx + Math.sin(t * p.freq + p.phase) * 0.4;

      // wrap top → bottom
      if (p.y < -20) {
        Object.assign(p, makeParticle(false));
      }

      // draw a radial gradient droplet
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0,   `rgba(250, 213, 138, ${p.alpha})`);
      grad.addColorStop(0.5, `rgba(200, 154, 79, ${p.alpha * 0.6})`);
      grad.addColorStop(1,   `rgba(123, 87, 34, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fill();

      // bright core
      ctx.fillStyle = `rgba(255, 235, 180, ${p.alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(() => draw(performance.now()));
  }

  let raf = 0;
  function start() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => draw(performance.now()));
  }
  function stop() { cancelAnimationFrame(raf); }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  resize();
  spawn();
  start();
  window.addEventListener('resize', () => { resize(); spawn(); });
})();

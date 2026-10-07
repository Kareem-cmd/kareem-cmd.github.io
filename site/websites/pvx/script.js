/* ─────────────────────────────────────────────
   PvX Partners — hero entrance choreography
   ───────────────────────────────────────────── */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ──────────────  WAVES  ──────────────
     Simple horizontal flowing lines across the full hero width,
     fewer of them than before. Each line draws itself in
     (stroke-dashoffset → 0) like a slow sound wave, then drifts. */

  const VB_W   = 1600;
  const VB_H   = 900;
  const CY     = VB_H * 0.55;
  const COUNT  = 28;                         // fewer lines per latest brief
  const group  = document.getElementById("wave-group");
  const core   = document.querySelector(".wave-core");

  function buildPath(idx) {
    const t       = idx / (COUNT - 1);       // 0..1
    const v       = (t - 0.5) * 2;           // -1..1 vertical
    const baseY   = CY + v * 360;
    const amp     = 10 + Math.abs(v) * 32;
    const freq    = 1.3 + Math.abs(v) * 0.6;
    const phase   = idx * 0.55;

    const steps   = 60;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const u  = i / steps;
      const x  = u * VB_W;
      /* gentle attenuation at the very edges so paths don't touch the frame */
      const att = Math.sin(u * Math.PI);
      const y   = baseY + Math.sin((u - .5) * Math.PI * 2 * freq + phase) * amp * att;
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
    }
    return d;
  }

  const NS    = "http://www.w3.org/2000/svg";
  const frag  = document.createDocumentFragment();
  const paths = [];

  for (let i = 0; i < COUNT; i++) {
    const t    = i / (COUNT - 1);
    const off  = Math.abs(t - 0.5) * 2;       // 0 centre, 1 outer
    const p    = document.createElementNS(NS, "path");
    p.setAttribute("d", buildPath(i));
    p.setAttribute("class", "wave-path");
    p.style.opacity = 0;
    p.dataset.targetOpacity = (0.20 + off * 0.50).toFixed(2);
    frag.appendChild(p);
    paths.push(p);
  }
  group.appendChild(frag);

  /* prep each path for stroke-draw animation */
  paths.forEach(p => {
    const len = p.getTotalLength();
    p.style.strokeDasharray  = len;
    p.style.strokeDashoffset = len;
  });

  /* ──────────────  REDUCED-MOTION FALLBACK  ────────────── */

  if (reduced || !window.gsap) {
    document.querySelectorAll("[data-anim]").forEach(el => {
      el.style.opacity = 1;
      el.style.transform = "none";
      el.style.filter = "none";
    });
    paths.forEach(p => {
      p.style.opacity = p.dataset.targetOpacity;
      p.style.strokeDashoffset = 0;
    });
    if (core) core.style.opacity = 1;
    return;
  }

  /* ──────────────  GSAP TIMELINE  ────────────── */

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // 1 — nav slides down from top
  tl.to('[data-anim="nav"]', {
    opacity: 1, y: 0, duration: .9,
  }, 0.05);

  // 2 — pill fades + scales in
  tl.to('[data-anim="pill"]', {
    opacity: 1, y: 0, scale: 1, duration: .8,
  }, 0.30);

  // 3 — headline lines: blur + rise reveal
  tl.to('[data-anim="h-line"]', {
    opacity: 1, y: 0, filter: "blur(0px)",
    duration: 1.0, stagger: 0.12, ease: "expo.out",
  }, 0.45);

  // 4a — wave CORE glow pops first (single bright burst)
  if (core) {
    tl.fromTo(core,
      { opacity: 0, scale: 0.4, transformOrigin: "50% 55%" },
      { opacity: 1, scale: 1, duration: 1.0, ease: "expo.out" },
      0.55);
  }

  // 4b — wave PATHS draw themselves in, slowly + cinematically
  tl.to(paths, {
    strokeDashoffset: 0,
    duration: 2.4,
    ease: "power2.inOut",
    stagger: {
      each: 0.045,
      from: "center",
    },
  }, 0.55);

  // 4c — paths fade to their target opacity in parallel
  tl.to(paths, {
    opacity: (i, t) => parseFloat(t.dataset.targetOpacity),
    duration: 1.4,
    ease: "power2.out",
    stagger: { each: 0.045, from: "center" },
  }, 0.65);

  // 4d — spark
  const spark = document.querySelector('[data-anim="spark"]');
  if (spark) {
    gsap.set(spark, { opacity: 0, scale: 0 });
    tl.to(spark, {
      opacity: 1, scale: 1,
      duration: 1.0, ease: "expo.out",
    }, 1.6);
  }

  // 5 — sub-headline
  tl.to('[data-anim="sub"]', {
    opacity: 1, y: 0, duration: .8,
  }, 1.05);

  // 6 — CTAs
  tl.to('[data-anim="ctas"]', {
    opacity: 1, y: 0, duration: .7,
  }, 1.20);

  // 7 — Cards: BOTTOM → TOP, all three at the SAME time (synchronised).
  const cardEls = gsap.utils.toArray('[data-anim="card"]');
  const left    = cardEls.find(c => c.classList.contains("card--left"));
  const center  = cardEls.find(c => c.classList.contains("card--center"));
  const right   = cardEls.find(c => c.classList.contains("card--right"));

  /* all three start BELOW the frame, scaled down slightly */
  gsap.set(left,   { opacity: 0, y: 220, scale: .82 });
  gsap.set(right,  { opacity: 0, y: 220, scale: .82 });
  gsap.set(center, { opacity: 0, y: 240, scale: .76 });

  /* synchronised reveal — all three rise together with the same timing.
     center is the only one that overshoots (back.out) so it still feels
     featured. */
  tl.to([left, right], {
    opacity: 1, y: 0, scale: 1,
    duration: 1.6, ease: "expo.out",
  }, 1.30);

  tl.to(center, {
    opacity: 1, y: 0, scale: 1,
    duration: 1.7, ease: "back.out(1.15)",
    onComplete: startFloatLoop,
  }, 1.30);

  /* ──────────────  PERPETUAL FLOAT  ──────────────
     Kept minimal to avoid jank: only the cards + a slow group drift
     on the wave SVG. No per-path opacity loops. */
  function startFloatLoop() {
    const targets = [
      { sel: ".card--left",   y:  8, rot: -1.2, dur: 5.4, dly: 0    },
      { sel: ".card--center", y:  6, rot:  1.0, dur: 4.8, dly: 0.4  },
      { sel: ".card--right",  y:  8, rot:  1.2, dur: 5.2, dly: 0.8  },
    ];
    targets.forEach(t => {
      const el = document.querySelector(t.sel);
      if (!el) return;
      gsap.to(el, {
        y: `+=${t.y}`,
        rotate: `+=${t.rot}`,
        duration: t.dur,
        delay: t.dly,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    /* spark twinkles continuously */
    if (spark) {
      gsap.to(spark, {
        scale: 1.18,
        opacity: 0.7,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    /* SINGLE drift on the whole wave group — far cheaper than per-path loops */
    gsap.to("#wave-group", {
      x: 30,
      duration: 9,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  /* ──────────────  MAGNETIC CARDS  ──────────────
     Each card gets pulled TOWARD the cursor when the mouse enters its
     magnetic range (a generous radius around the card). The pull
     strength fades with distance, so the cards drift smoothly back
     to rest when the cursor moves away. */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    /* per-card state */
    const state = cardEls.map(c => ({
      el: c,
      tx: 0, ty: 0,     // target offset (px)
      cx: 0, cy: 0,     // current eased offset (px)
    }));
    let mouseX = -9999, mouseY = -9999;

    const PULL    = 0.32;   // how aggressively cards lean into the cursor
    const RANGE_M = 1.4;    // magnetic range multiplier (× card size)
    const EASE    = 0.12;

    window.addEventListener("pointermove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function loop() {
      state.forEach(s => {
        const r  = s.el.getBoundingClientRect();
        const ccx = r.left + r.width  / 2;
        const ccy = r.top  + r.height / 2;
        const dx = mouseX - ccx;
        const dy = mouseY - ccy;
        const dist  = Math.hypot(dx, dy);
        const range = Math.max(r.width, r.height) * RANGE_M;

        if (dist < range) {
          const k = (1 - dist / range) * PULL;
          s.tx = dx * k;
          s.ty = dy * k;
        } else {
          s.tx *= 0.85;
          s.ty *= 0.85;
        }

        s.cx += (s.tx - s.cx) * EASE;
        s.cy += (s.ty - s.cy) * EASE;
        s.el.style.setProperty("--mx", s.cx.toFixed(2) + "px");
        s.el.style.setProperty("--my", s.cy.toFixed(2) + "px");
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();

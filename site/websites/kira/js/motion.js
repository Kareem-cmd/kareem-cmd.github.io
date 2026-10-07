/* ============================================================
   KIRA — Motion engine
   GSAP + ScrollTrigger when available (rich, cinematic). Falls back
   to IntersectionObserver reveals. Respects reduced-motion + no-JS.
   ============================================================ */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // Split a headline into word-spans (each wrapped in an overflow:hidden mask)
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(function (node) {
      if (node.nodeName === 'BR') { el.appendChild(document.createElement('br')); return; }
      var isEm = node.nodeType === 1 && node.nodeName === 'EM';
      var parts = (node.textContent || '').split(/(\s+)/);
      parts.forEach(function (p) {
        if (p === '') return;
        if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        var wi = document.createElement('span'); wi.className = 'wi' + (isEm ? ' w-em' : '');
        wi.textContent = p; w.appendChild(wi); el.appendChild(w);
      });
    });
    return el.querySelectorAll('.wi');
  }

  var SOLO = '.section__head,.intro__label,.intro__body,.edge__list,.featured,' +
             '.creed__inner,.quote__inner,.cta__inner,.apply__panel,.join__panel,' +
             '.signature,.verdict-box,.svc-row,.contact-grid';
  var GROUPS = ['.services__grid', '.work__grid', '.feed', '.tenets', '.tiers',
                '.dispatch-grid', '.receive', '.terms__grid', '.stats-band__row', '.related__grid',
                '.s-stats'];
  var HEROES = '.hero__inner > *,.page-hero__inner > *,.article-hero__inner > *,.s-hero__inner > *';

  function header() {
    var bar = document.querySelector('.site-header-bar');
    if (!bar) return;
    var f = function () { bar.classList.toggle('is-scrolled', window.scrollY > 16); };
    f();
    window.addEventListener('scroll', f, { passive: true });
  }

  /* ---------- Fallback: no GSAP or reduced motion ---------- */
  function fallback() {
    var pre0 = document.getElementById('preloader'); if (pre0) pre0.setAttribute('hidden', '');
    var targets = qa(HEROES).concat(qa(SOLO));
    GROUPS.forEach(function (g) { targets = targets.concat(qa(g + ' > *')); });
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (e) { e.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-visible'); io.unobserve(x.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
      targets.forEach(function (e) { io.observe(e); });
      requestAnimationFrame(function () {
        var h = window.innerHeight || 800;
        targets.forEach(function (e) { if (e.getBoundingClientRect().top < h * 0.95) e.classList.add('is-visible'); });
      });
      setTimeout(function () { targets.forEach(function (e) { e.classList.add('is-visible'); }); }, 2400);
    }
    header();
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) { fallback(); return; }

  /* ---------- GSAP path ---------- */
  try {
    gsap.registerPlugin(ScrollTrigger);
    var E = 'power3.out';

    // Hero reveal (deferred until the preloader lifts, if present)
    var heroKids = qa(HEROES);
    var title = document.querySelector('.hero__title');
    var split = false;
    if (title) { try { split = splitWords(title).length > 0; } catch (e) { split = false; } }
    if (split) { heroKids = heroKids.filter(function (e) { return e !== title; }); gsap.set(title, { opacity: 1, y: 0 }); }

    var heroDone = false;
    function revealHero(delay) {
      if (heroDone) return; heroDone = true;
      delay = delay || 0;
      if (split) {
        gsap.from(title.querySelectorAll('.wi'), { yPercent: 120, opacity: 0,
          duration: 0.95, ease: 'power4.out', stagger: 0.05, delay: delay });
      }
      if (heroKids.length) {
        gsap.fromTo(heroKids, { opacity: 0, y: 52 }, { opacity: 1, y: 0,
          duration: 1.0, ease: 'power4.out', stagger: 0.1, delay: delay + 0.05 });
      }
      setTimeout(function () {
        if (title) title.querySelectorAll('.wi').forEach(function (w) { w.style.opacity = '1'; w.style.transform = 'none'; });
        heroKids.forEach(function (e) { e.style.opacity = '1'; e.style.transform = 'none'; });
      }, 3200);
    }

    // Preloader: apple fills + KIRA rises + bar completes, then curtain lifts
    var pre = document.getElementById('preloader');
    if (pre) {
      gsap.timeline()
        .from('.preloader__applewrap', { scale: 0.6, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0)
        .fromTo('.preloader__apple--fill', { clipPath: 'inset(100% 0 0 0)' },
          { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'power1.inOut' }, 0.3)
        .from('.preloader__word .l', { yPercent: 130, opacity: 0, stagger: 0.09, duration: 0.5, ease: 'power3.out' }, 0.55)
        .to('.preloader__bar > span', { scaleX: 1, duration: 1.0, ease: 'power1.inOut' }, 0.5)
        .add(function () { revealHero(0.1); }, 1.65)
        .to('.preloader', { yPercent: -100, duration: 0.9, ease: 'expo.inOut',
          onComplete: function () { pre.setAttribute('hidden', ''); } }, 1.75);
      setTimeout(function () { if (pre && !pre.hasAttribute('hidden')) pre.setAttribute('hidden', ''); }, 5200);
    } else {
      if (pre) pre.setAttribute('hidden', '');
      revealHero(0.12);
    }
    // rAF-independent fallback — hero reveals even if the preloader timeline stalls
    setTimeout(function () { revealHero(0); }, 2900);

    // Apple: dramatic scale-in + scroll parallax
    qa('.hero__apple,.page-hero__apple').forEach(function (a) {
      var target = parseFloat(getComputedStyle(a).opacity) || 0.06;
      gsap.fromTo(a, { opacity: 0, scale: 1.28 },
        { opacity: target, scale: 1, duration: 1.7, ease: 'power2.out', delay: 0.1 });
      var sec = a.closest('section') || a;
      gsap.to(a, { yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
    });
    qa('.cta__apple,.featured__apple').forEach(function (a) {
      gsap.to(a, { yPercent: -12, ease: 'none',
        scrollTrigger: { trigger: a.closest('section') || a, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Solo blocks — reveal on scroll
    qa(SOLO).forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.95, ease: E,
        scrollTrigger: { trigger: el, start: 'top 86%' } });
    });

    // Grouped items — staggered reveal
    GROUPS.forEach(function (sel) {
      var grid = document.querySelector(sel);
      if (!grid) return;
      var kids = qa(sel + ' > *');
      if (!kids.length) return;
      gsap.fromTo(kids, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.85, ease: E, stagger: 0.1,
        scrollTrigger: { trigger: grid, start: 'top 84%' } });
    });

    // ── Card-deck deal: work tiles + service cards fan into place ──
    ['.work-wall', '.s-services', '.values', '.process-steps'].forEach(function (sel) {
      var grid = document.querySelector(sel);
      if (!grid) return;
      var cards = qa(sel + ' > *');
      if (!cards.length) return;
      gsap.fromTo(cards,
        { opacity: 0, y: 120, scale: 0.8,
          rotationZ: function (i) { return (i % 2 ? 1 : -1) * (5 + (i * 2) % 9); },
          transformOrigin: '50% 140%' },
        { opacity: 1, y: 0, scale: 1, rotationZ: 0, duration: 0.9, ease: 'back.out(1.5)',
          stagger: 0.1, clearProps: 'transform',
          scrollTrigger: { trigger: grid, start: 'top 82%' } });
    });

    // ── Count-up stats ──
    qa('.s-stat__num').forEach(function (num) {
      var tn = num.firstChild;
      if (!tn || tn.nodeType !== 3) return;
      var target = parseInt((tn.nodeValue || '').replace(/[^0-9]/g, ''), 10);
      if (isNaN(target)) return;
      var finalText = tn.nodeValue, o = { v: 0 };
      ScrollTrigger.create({ trigger: num, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: target, duration: 1.5, ease: 'power2.out',
          onUpdate: function () { tn.nodeValue = String(Math.round(o.v)); },
          onComplete: function () { tn.nodeValue = finalText; } });
      } });
    });

    // ── Scroll-progress thread (storytelling) ──
    var prog = document.createElement('div'); prog.className = 'scroll-progress';
    document.body.appendChild(prog);
    gsap.fromTo(prog, { scaleX: 0 }, { scaleX: 1, ease: 'none',
      scrollTrigger: { start: 'top top', end: 'max', scrub: 0.3 } });

    // ── Parallax depth ──
    qa('.s-hero__bg .frame__art').forEach(function (a) {
      gsap.to(a, { yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: '.s-hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    qa('.work-tile .frame__art').forEach(function (a) {
      gsap.to(a, { yPercent: -9, ease: 'none',
        scrollTrigger: { trigger: a.closest('.work-tile'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Magnetic large buttons
    qa('.btn--lg').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25,
                     y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power2.out' });
      });
      b.addEventListener('mouseleave', function () {
        gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      });
    });

    header();
  } catch (err) {
    // Anything goes wrong → guarantee content is visible
    qa(HEROES).concat(qa(SOLO)).forEach(function (e) { e.classList.add('is-visible'); });
    GROUPS.forEach(function (g) { qa(g + ' > *').forEach(function (e) { e.classList.add('is-visible'); }); });
    header();
  }
})();

/* ── Work tiles → each opens its own project page (project.html?p=slug) ── */
(function () {
  var tiles = [].slice.call(document.querySelectorAll('.work-tile'));
  if (!tiles.length) return;
  tiles.forEach(function (t) {
    var slug = t.getAttribute('data-gallery');           // social projects carry the slug
    if (!slug) {                                          // Chamelo covers → derive cf-NN from the image src
      var im = t.querySelector('.frame__img');
      var m = im && (im.getAttribute('src') || '').match(/cf-\d+/);
      slug = m ? m[0] : '';
    }
    if (slug) t.setAttribute('href', 'project.html?p=' + encodeURIComponent(slug));
  });
})();

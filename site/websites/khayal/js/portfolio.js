/* KHAYAL — Portfolio horizontal scroll hijack
   Pins the .portfolio__pin, translates .portfolio__track horizontally
   on vertical scroll. Falls back to vertical stack < 1024px (CSS).
*/
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 1024px)').matches;
  if (prefersReduced || isMobile) {
    // CSS handles vertical fallback; still do simple reveals
    document.querySelectorAll('.kit-panel').forEach(el => el.classList.add('reveal-in'));
    return;
  }

  const pin = document.getElementById('portfolioPin');
  const track = document.getElementById('portfolioTrack');
  const panels = track ? Array.from(track.querySelectorAll('.kit-panel')) : [];
  const fill = document.getElementById('railFill');
  const railName = document.getElementById('railName');
  if (!pin || !track || panels.length === 0) return;

  const panelNames = panels.map(p => {
    const name = p.querySelector('.kit-panel__name')?.firstChild?.textContent?.trim() || '';
    const idx = p.querySelector('.kit-panel__head .idx')?.textContent?.trim() || '';
    return `${name} · ${idx.replace(/^\/ ?/, '')}`;
  });

  // Pre-set image scale for nicer in-view entrance
  gsap.set(track.querySelectorAll('.kit-panel__image-well img'), { scale: 1.12 });

  const distance = () => track.scrollWidth - window.innerWidth;

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: () => '+=' + distance(),
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (st) => {
        if (fill) fill.style.width = (st.progress * 100).toFixed(2) + '%';

        // active panel name tracking
        const idx = Math.min(panels.length - 1, Math.floor(st.progress * panels.length + .15));
        if (railName && railName.textContent !== panelNames[idx]) {
          railName.textContent = panelNames[idx];
        }
      }
    }
  });

  // Per-panel image parallax in/out of the viewport (inside horizontal track)
  panels.forEach((panel) => {
    const img = panel.querySelector('.kit-panel__image-well img');
    const info = panel.querySelector('.kit-panel__info');
    if (!img || !info) return;

    gsap.fromTo(img, { scale: 1.16, autoAlpha: .65 }, {
      scale: 1.0,
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: panel,
        containerAnimation: tween,
        start: 'left right',
        end: 'right left',
        scrub: true,
      }
    });

    // info column slide
    gsap.fromTo(info.children, { autoAlpha: 0, y: 28 }, {
      autoAlpha: 1, y: 0,
      duration: .8, stagger: .06, ease: 'expo.out',
      scrollTrigger: {
        trigger: panel,
        containerAnimation: tween,
        start: 'left 60%',
        toggleActions: 'play none none reverse',
      }
    });
  });

  /* ---------- Intro band reveal (above pin) ---------- */
  gsap.from('.portfolio__intro .eyebrow', {
    autoAlpha: 0, y: 18, duration: .9,
    scrollTrigger: { trigger: '.portfolio__intro', start: 'top 78%' }
  });
  gsap.from('.portfolio__intro h2', {
    autoAlpha: 0, y: 32, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.portfolio__intro', start: 'top 78%' }
  });
  gsap.from('.portfolio__intro p, .portfolio__intro .meta-row', {
    autoAlpha: 0, y: 22, duration: .9, stagger: .1,
    scrollTrigger: { trigger: '.portfolio__intro p', start: 'top 82%' }
  });

  /* ---------- Outro reveal ---------- */
  gsap.from('.portfolio__outro h3, .portfolio__outro p, .portfolio__outro .cta-row', {
    autoAlpha: 0, y: 26, duration: 1.0, stagger: .12, ease: 'expo.out',
    scrollTrigger: { trigger: '.portfolio__outro', start: 'top 78%' }
  });
})();

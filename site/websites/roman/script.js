/* ============================================================
   ROMAN DAHY — INTERACTIVE BRAND IDENTITY SYSTEM
   v1.0
   ============================================================ */

(() => {
  'use strict';

  /* ---------- Custom Cursor ---------- */
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  if (cursor && cursorRing && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top  = mouseY + 'px';
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top  = ringY + 'px';
      requestAnimationFrame(animateRing);
    };
    animateRing();

    const bindHover = () => {
      document.querySelectorAll('a, button, .swatch, .motif, .dl, input, .topic, .episode').forEach((el) => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = '1';
        el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
      });
    };
    bindHover();
  }

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  /* ---------- Clipboard ---------- */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
      return true;
    }
  };

  /* ---------- Color Swatch Click-to-Copy ---------- */
  document.querySelectorAll('.swatch').forEach((sw) => {
    sw.addEventListener('click', async () => {
      const hex = sw.dataset.hex;
      await copyToClipboard(hex);
      showToast(`✓ COPIED · ${hex}`);
      sw.style.transform = 'scale(0.97)';
      setTimeout(() => sw.style.transform = '', 200);
    });
  });

  /* ---------- Copy all CSS variables ---------- */
  window.copyAll = async () => {
    const css = `:root {
  --void:        #07050D;
  --cosmos:      #0F0A1F;
  --violet:      #5B2EFF;
  --violet-soft: #8B5CF6;
  --white:       #FFFFFF;
  --gold:        #F5C84C;
}`;
    await copyToClipboard(css);
    showToast('✓ CSS TOKENS COPIED');
  };

  /* ---------- Live Type Playground ---------- */
  const typeInput = document.getElementById('typeInput');
  if (typeInput) {
    const targets = document.querySelectorAll('.fs-sample[data-target]');
    const update = () => {
      const v = typeInput.value || 'Let\'s Breakdown The Internet';
      targets.forEach((t) => {
        const kind = t.dataset.target;
        if (kind === 'mono') {
          t.textContent = '// ' + v.toUpperCase();
        } else if (kind === 'arabic') {
          // Don't override Arabic — keep as fixed sample, but show user input below if not pure latin
          t.textContent = v;
        } else {
          t.textContent = v;
        }
      });
    };
    typeInput.addEventListener('input', update);
  }

  /* ---------- Scroll-aware Nav ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on Scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));

  /* ---------- Active Section Tracking ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[data-section]');
  const progress = document.querySelector('.progress');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  const sectionLabels = {
    cover: 'COVER',
    manifesto: '00 · MANIFESTO',
    logo: '01 · LOGO',
    color: '02 · COLOR',
    typography: '03 · TYPE',
    motifs: '04 · MOTIFS',
    composition: '05 · LAYOUT',
    rules: '06 · RULES',
    applications: '07 · APPS',
    library: '08 · LIBRARY',
    downloads: '09 · FILES'
  };

  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.body.dataset.section = id;

        navLinks.forEach((a) => {
          a.classList.toggle('active', a.dataset.section === id);
        });

        if (progressLabel) progressLabel.textContent = sectionLabels[id] || id.toUpperCase();
      }
    });
  }, { threshold: 0.3 });
  sections.forEach((s) => sectionIO.observe(s));

  // Progress fill based on scroll
  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = window.scrollY;
    const docHeight = doc.scrollHeight - doc.clientHeight;
    const pct = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    if (progressFill) progressFill.style.height = (pct * 100) + '%';
    if (progress && scrollTop > 200) progress.classList.add('show');
    else if (progress) progress.classList.remove('show');
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Star Particles Canvas ---------- */
  const starCanvas = document.getElementById('stars');
  if (starCanvas) {
    const ctx = starCanvas.getContext('2d');
    let stars = [];
    const STAR_COUNT = 100;

    const resize = () => {
      starCanvas.width  = window.innerWidth;
      starCanvas.height = window.innerHeight;
    };
    const initStars = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * starCanvas.width,
          y: Math.random() * starCanvas.height,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.6 + 0.2,
          twinkle: Math.random() * 0.015 + 0.003,
          dir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };
    const drawStars = () => {
      ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
      stars.forEach((s) => {
        s.a += s.twinkle * s.dir;
        if (s.a >= 0.85 || s.a <= 0.15) s.dir *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    };
    resize(); initStars(); drawStars();
    window.addEventListener('resize', () => { resize(); initStars(); });
  }

  /* ---------- Smooth-scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------- Mobile Burger ---------- */
  const burger = document.getElementById('burger');
  if (burger) {
    let overlay = null;
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-mobile-overlay';
        Object.assign(overlay.style, {
          position: 'fixed', inset: '0', background: 'rgba(7,5,13,0.97)',
          zIndex: '99', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: '20px',
          opacity: '0', pointerEvents: 'none', transition: 'opacity 0.4s'
        });
        overlay.innerHTML = `
          <a href="#manifesto"   style="color:#fff; font-size:24px;">00 Manifesto</a>
          <a href="#logo"        style="color:#fff; font-size:24px;">01 Logo</a>
          <a href="#color"       style="color:#fff; font-size:24px;">02 Color</a>
          <a href="#typography"  style="color:#fff; font-size:24px;">03 Type</a>
          <a href="#motifs"      style="color:#fff; font-size:24px;">04 Motifs</a>
          <a href="#composition" style="color:#fff; font-size:24px;">05 Layout</a>
          <a href="#rules"       style="color:#fff; font-size:24px;">06 Rules</a>
          <a href="#applications" style="color:#fff; font-size:24px;">07 Apps</a>
          <a href="#library"      style="color:#fff; font-size:24px;">08 Library</a>
          <a href="#downloads"   style="color:#fff; font-size:24px;">09 Files</a>
        `;
        document.body.appendChild(overlay);
        overlay.querySelectorAll('a').forEach((a) => {
          a.addEventListener('click', () => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            burger.classList.remove('open');
          });
        });
      }
      const isOpen = overlay.style.opacity === '1';
      overlay.style.opacity = isOpen ? '0' : '1';
      overlay.style.pointerEvents = isOpen ? 'none' : 'all';
    });
  }

  /* ---------- Lightbox ---------- */
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDl    = document.getElementById('lightboxDl');
  const lightboxClose = document.getElementById('lightboxClose');

  const openLightbox = (src, title) => {
    lightboxImg.src = src;
    lightboxImg.alt = title || '';
    lightboxTitle.textContent = title ? '// ' + title.toUpperCase() : '';
    lightboxDl.href = src;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 500);
  };

  // Bind clicks on library items
  document.querySelectorAll('[data-src]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Don't trigger if user clicked the download button
      if (e.target.closest('.lib-dl-btn')) return;
      const src   = el.dataset.src;
      const title = el.dataset.title || '';
      if (src) openLightbox(src, title);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-stage')) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  /* ---------- Brand Book PDF Generation ---------- */
  const BOARD_FILES = [
    { src: 'assets/boards/roman-dahy-brandbook-01-overview.png',     title: 'Overview Master Board',     num: '01' },
    { src: 'assets/boards/roman-dahy-brandbook-02-logo-system.png',  title: 'Logo & Signature System',   num: '02' },
    { src: 'assets/boards/roman-dahy-brandbook-03-color.png',        title: 'Color System Deep-Dive',    num: '03' },
    { src: 'assets/boards/roman-dahy-brandbook-04-typography.png',   title: 'Typography Specimen',       num: '04' },
    { src: 'assets/boards/roman-dahy-brandbook-05-motifs.png',       title: 'Visual Motifs Library',     num: '05' },
    { src: 'assets/boards/roman-dahy-brandbook-06-dos-donts.png',    title: "Do's & Don'ts",             num: '06' },
    { src: 'assets/boards/roman-dahy-brandbook-07-applications.png', title: 'Applications & Mockups',    num: '07' }
  ];

  const loadImageAsDataURL = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });

  const drawCoverPage = (pdf, pageW, pageH) => {
    // Background
    pdf.setFillColor(7, 5, 13);
    pdf.rect(0, 0, pageW, pageH, 'F');

    // Top mono labels
    pdf.setTextColor(139, 92, 246);
    pdf.setFontSize(8);
    pdf.setFont('courier', 'normal');
    pdf.text('// ROMAN DAHY — BRAND IDENTITY SYSTEM', 20, 18);
    pdf.text('// v1.0 · MAY 2026 · EDITION 01', pageW - 20, 18, { align: 'right' });

    // Frame corners (violet)
    pdf.setDrawColor(91, 46, 255);
    pdf.setLineWidth(0.6);
    const cs = 8; // corner length
    pdf.line(15, 30, 15 + cs, 30);
    pdf.line(15, 30, 15, 30 + cs);
    pdf.line(pageW - 15, 30, pageW - 15 - cs, 30);
    pdf.line(pageW - 15, 30, pageW - 15, 30 + cs);
    pdf.line(15, pageH - 30, 15 + cs, pageH - 30);
    pdf.line(15, pageH - 30, 15, pageH - 30 - cs);
    pdf.line(pageW - 15, pageH - 30, pageW - 15 - cs, pageH - 30);
    pdf.line(pageW - 15, pageH - 30, pageW - 15, pageH - 30 - cs);

    // Script title
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(80);
    pdf.text('Roman Dahy', pageW / 2, pageH / 2 - 16, { align: 'center' });

    // Subtitle
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('Brand Identity System', pageW / 2, pageH / 2 + 10, { align: 'center' });

    // Tagline
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(200, 200, 212);
    pdf.text("Let's Breakdown The Internet · رومان داهي", pageW / 2, pageH / 2 + 22, { align: 'center' });

    // Bottom
    pdf.setTextColor(139, 92, 246);
    pdf.setFontSize(8);
    pdf.setFont('courier', 'normal');
    pdf.text('// PAGE 001 / 008', 20, pageH - 18);
    pdf.text('// CONFIDENTIAL · DO NOT DISTRIBUTE', pageW - 20, pageH - 18, { align: 'right' });
  };

  window.generateBrandBookPDF = async () => {
    const btn = document.getElementById('pdfExportBtn');
    const progressEl = document.getElementById('pdfProgress');
    if (!btn || !window.jspdf) {
      showToast('PDF library not ready — try again in 2s');
      return;
    }

    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const { jsPDF } = window.jspdf;
      // Landscape 4:3 ratio — boards are 4:3. Use custom size for fidelity.
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [400, 300]  // 4:3 in landscape
      });
      const pageW = 400;
      const pageH = 300;

      // Cover page
      drawCoverPage(pdf, pageW, pageH);

      // Add each board as a new page
      for (let i = 0; i < BOARD_FILES.length; i++) {
        const board = BOARD_FILES[i];
        progressEl.textContent = `${i + 1} / ${BOARD_FILES.length}`;
        const { dataUrl } = await loadImageAsDataURL(board.src);
        pdf.addPage([pageW, pageH], 'landscape');
        // Black background
        pdf.setFillColor(7, 5, 13);
        pdf.rect(0, 0, pageW, pageH, 'F');
        // Image fills page
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
        // Page footer label
        pdf.setTextColor(139, 92, 246);
        pdf.setFontSize(7);
        pdf.setFont('courier', 'normal');
        pdf.text(`// BOARD ${board.num} · ${board.title.toUpperCase()}`, 10, pageH - 6);
        pdf.text(`PAGE ${String(i + 2).padStart(3, '0')} / 008`, pageW - 10, pageH - 6, { align: 'right' });
      }

      btn.classList.remove('loading');
      btn.classList.add('done');
      pdf.save('Roman-Dahy-Brand-Book-v1.0.pdf');
      showToast('✓ PDF GENERATED · ROMAN-DAHY-BRAND-BOOK-V1.0');

      setTimeout(() => {
        btn.classList.remove('done');
        btn.disabled = false;
      }, 2500);
    } catch (err) {
      console.error('PDF generation failed', err);
      btn.classList.remove('loading');
      btn.disabled = false;
      showToast('✗ PDF FAILED — CHECK CONSOLE');
    }
  };

  /* ---------- Console Easter Egg ---------- */
  console.log(
    '%c // ROMAN DAHY \n%c Brand Identity System v1.0 \n%c رومان داهي · نظام الهوية البصرية',
    'font-family: monospace; font-size: 14px; color: #5B2EFF; padding: 8px 0;',
    'font-family: serif; font-size: 18px; font-style: italic; color: white;',
    'font-family: monospace; font-size: 11px; color: #8B5CF6; letter-spacing: 4px;'
  );
})();

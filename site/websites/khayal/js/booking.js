/* KHAYAL — Booking: calendar + form + confirmation */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ===== Calendar ===== */
  const today = new Date();
  today.setHours(0,0,0,0);

  const state = {
    view: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedDate: null,
    selectedTime: null,
  };

  const SLOTS = ['10:00', '11:30', '14:00', '15:30', '17:00'];

  const monthLabel = (d) => d.toLocaleString('en-US', { month: 'long' });

  // deterministic availability: Sun, Mon, Tue, Wed, Thu only (Fri/Sat unavailable as weekend);
  // plus mark every 4th day as already-booked, just for realism
  const isAvailable = (d) => {
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day === 5 || day === 6) return false; // Friday & Saturday unavailable
    // skip a couple of busy days for realism
    const date = d.getDate();
    if ([6, 13, 21, 28].includes(date)) return false;
    return true;
  };

  const sameDay = (a, b) => a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const renderCalendar = () => {
    const grid = $('#calGrid');
    const monthEl = $('#calMonth');
    if (!grid || !monthEl) return;

    monthEl.innerHTML = `${monthLabel(state.view)} <b>${state.view.getFullYear()}</b>`;

    grid.innerHTML = '';
    const y = state.view.getFullYear();
    const m = state.view.getMonth();
    const firstDay = new Date(y, m, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // leading empty cells
    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal__day is-empty';
      grid.appendChild(cell);
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const d = new Date(y, m, date);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal__day';
      cell.textContent = String(date).padStart(2, '0');
      cell.setAttribute('aria-label', d.toDateString());

      if (sameDay(d, today)) cell.classList.add('is-today');

      if (d < today) {
        cell.classList.add('is-past');
      } else if (!isAvailable(d)) {
        cell.classList.add('is-unavailable');
      } else {
        cell.classList.add('is-available');
      }

      if (sameDay(d, state.selectedDate)) cell.classList.add('is-selected');

      if (cell.classList.contains('is-available')) {
        cell.addEventListener('click', () => selectDate(d));
      }

      grid.appendChild(cell);
    }
  };

  const renderSlots = () => {
    const wrap = $('#calSlots');
    if (!wrap) return;

    if (!state.selectedDate) {
      wrap.innerHTML = `
        <div class="cal__slots-label"><b>Select a date</b> to see available studio times.</div>
        <div class="cal__placeholder">— — : — —</div>`;
      return;
    }

    const dateStr = state.selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    const slotsHtml = SLOTS.map((s) => {
      const isSel = state.selectedTime === s;
      return `<button type="button" class="cal__slot${isSel ? ' is-selected' : ''}" data-time="${s}">${s}</button>`;
    }).join('');

    wrap.innerHTML = `
      <div class="cal__slots-label">Available <b>${dateStr}</b> · Cairo time</div>
      <div class="cal__slots-grid">${slotsHtml}</div>`;

    $$('.cal__slot', wrap).forEach(btn => {
      btn.addEventListener('click', () => selectTime(btn.dataset.time));
    });
  };

  const selectDate = (d) => {
    state.selectedDate = d;
    state.selectedTime = null;
    renderCalendar();
    renderSlots();
    updateSummary();
    updateSubmitState();
  };

  const selectTime = (t) => {
    state.selectedTime = t;
    renderSlots();
    updateSummary();
    updateSubmitState();
  };

  const updateSummary = () => {
    const sumDate = $('#sumDate');
    const sumTime = $('#sumTime');
    const summary = $('#bfSummary');
    if (!sumDate || !sumTime || !summary) return;

    if (state.selectedDate) {
      sumDate.textContent = state.selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      sumDate.textContent = '— — — —';
    }
    sumTime.textContent = state.selectedTime || '—  —';
    summary.classList.toggle('is-empty', !state.selectedDate || !state.selectedTime);
  };

  const updateSubmitState = () => {
    const btn = $('#bfSubmit');
    if (!btn) return;
    const form = $('#bookingForm');
    const name = form?.elements.namedItem('name')?.value?.trim();
    const email = form?.elements.namedItem('email')?.value?.trim();
    const phone = form?.elements.namedItem('phone')?.value?.trim();
    const valid = state.selectedDate && state.selectedTime && name && email && phone;
    // Keep button always clickable — visually tint when not ready
    btn.classList.toggle('is-ready', !!valid);
  };

  /* ===== Month nav ===== */
  const prev = $('#calPrev');
  const next = $('#calNext');
  const todayFirst = new Date(today.getFullYear(), today.getMonth(), 1);
  prev?.addEventListener('click', () => {
    const candidate = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1);
    if (candidate < todayFirst) return; // don't navigate to past months
    state.view = candidate;
    renderCalendar();
  });
  next?.addEventListener('click', () => {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1);
    renderCalendar();
  });

  /* ===== Form ===== */
  const form = $('#bookingForm');
  if (form) {
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', updateSubmitState);
      el.addEventListener('change', updateSubmitState);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const phone = (fd.get('phone') || '').toString().trim();
      const type = fd.get('type');
      const location = (fd.get('location') || '').toString().trim() || '—';
      const message = (fd.get('message') || '').toString().trim();

      // Validate — show inline what's missing, focus first invalid field
      const missing = [];
      let firstMissing = null;
      if (!name)  { missing.push('name');  firstMissing = firstMissing || $('#bf-name'); }
      if (!email) { missing.push('email'); firstMissing = firstMissing || $('#bf-email'); }
      if (!phone) { missing.push('phone'); firstMissing = firstMissing || $('#bf-phone'); }
      if (!state.selectedDate) missing.push('date');
      if (!state.selectedTime) missing.push('time');

      if (missing.length) {
        // gentle shake + scroll to first missing
        const btn = $('#bfSubmit');
        btn?.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
          { duration: 320, iterations: 1 }
        );
        // Update summary to show what's needed
        const sumDate = $('#sumDate');
        const sumTime = $('#sumTime');
        if (!state.selectedDate && sumDate) sumDate.style.color = 'var(--copper)';
        if (!state.selectedTime && sumTime) sumTime.style.color = 'var(--copper)';
        if (firstMissing) {
          firstMissing.focus({ preventScroll: false });
          firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!state.selectedDate || !state.selectedTime) {
          $('.cal')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const dateStr = state.selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

      // ===== WhatsApp message =====
      const lines = [
        '*New Consultation Request · Khayal Designs*',
        '',
        '*Client*',
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        '',
        '*Studio Call*',
        `Date: ${dateStr}`,
        `Time: ${state.selectedTime} (Cairo)`,
        '',
        '*Project*',
        `Type: ${type}`,
        `Location: ${location}`,
      ];
      if (message) {
        lines.push('', '*Brief*', message);
      }
      lines.push('', '—', 'Sent from Khayal Designs');

      const waNumber = '201027066772';
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;

      // Open WhatsApp in new tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // Build modal summary
      const summary = `
        <div>${name} · ${email}</div>
        <div style="margin-top:8px;">${dateStr} · ${state.selectedTime} Cairo</div>
        <div style="margin-top:8px;opacity:.7;">${type} · ${location}</div>
      `;
      const sumEl = $('#confirmSummary');
      if (sumEl) sumEl.innerHTML = summary;

      // Open modal
      const modal = $('#bfConfirm');
      modal?.classList.add('is-open');
      modal?.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lock');
    });
  }

  $('#bfClose')?.addEventListener('click', () => {
    const modal = $('#bfConfirm');
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
  });
  $('#bfConfirm')?.addEventListener('click', (e) => {
    if (e.target.id === 'bfConfirm') $('#bfClose').click();
  });

  /* ===== Initial render ===== */
  renderCalendar();
  renderSlots();
  updateSummary();
  updateSubmitState();

  /* ===== Animations ===== */
  if (!window.gsap || !window.ScrollTrigger) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Booking intro
  gsap.from('.booking__intro .eyebrow, .booking__intro h2', {
    autoAlpha: 0, y: 28, duration: 1.0, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '.booking__intro', start: 'top 78%' }
  });
  gsap.from('.booking__intro p, .booking__intro .promise li', {
    autoAlpha: 0, y: 22, duration: .9, stagger: .08, ease: 'expo.out',
    scrollTrigger: { trigger: '.booking__intro p', start: 'top 82%' }
  });

  // Panel reveal
  gsap.from('.booking__panel', {
    autoAlpha: 0, y: 32, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.booking__panel', start: 'top 78%' }
  });

  // Calendar days stagger on first show
  ScrollTrigger.create({
    trigger: '.booking__panel',
    start: 'top 75%',
    once: true,
    onEnter: () => {
      gsap.from('.cal__day:not(.is-empty)', {
        autoAlpha: 0, scale: .8, duration: .4, stagger: .012, ease: 'expo.out', delay: .3
      });
    }
  });

  // Form fields stagger
  gsap.from('.bf__field, .bf__row, .bf__summary, .bf__submit, .bf__alt', {
    autoAlpha: 0, y: 18, duration: .7, stagger: .05, ease: 'expo.out',
    scrollTrigger: { trigger: '.bf', start: 'top 80%' }
  });

  // Footer reveal
  gsap.from('.footer__brand, .footer__col, .footer__bottom', {
    autoAlpha: 0, y: 22, duration: .8, stagger: .08, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 90%' }
  });
  gsap.from('.footer__mega-text', {
    autoAlpha: 0, x: -60, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer__mega', start: 'top 95%' }
  });
})();

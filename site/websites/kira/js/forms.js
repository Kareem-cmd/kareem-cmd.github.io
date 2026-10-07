/* ============================================================
   KIRA — Form submission handler
   Dependency-free, accessible, defensive. Progressively enhances
   any <form data-kira-form>. Validates required fields + emails,
   shows a polite live status, drives the existing .btn spinner
   (.is-loading), POSTs to data-endpoint (or simulates success when
   none is set), then seals the form with a final verdict line.

   Public contract (attributes a <form> may declare):
     data-kira-form              — opt in to this handler (required marker)
     data-endpoint="<url>"       — POST target; omit for backend-less demo
     data-success="<message>"    — text shown once received
     data-error="<message>"      — text shown when submission fails
   Field keys are derived from each control's `name`, falling back to `id`.
   ============================================================ */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var STYLE_ID = 'kira-forms-style';
  var DEFAULT_SUCCESS = 'Received.';
  var DEFAULT_ERROR = 'Something failed — try again, or email hello@kira.studio.';

  /* ---------- One-time style injection (guarded) ---------- */
  function injectStyles() {
    try {
      if (document.getElementById(STYLE_ID)) return;
      var head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;
      var css =
        '.form-status{font-family:var(--font-sans,system-ui);font-size:0.9rem;' +
        'letter-spacing:0.02em;margin-top:14px;min-height:1.3em}' +
        '.form-status.is-error{color:#e03c49}' +
        '.form-status.is-success{font-family:Georgia,serif;font-style:italic;' +
        'font-size:1.15rem;color:#e8e2d6}';
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    } catch (e) { /* styling is non-critical — never block submission */ }
  }

  /* ---------- Helpers ---------- */
  function slice(list) { return Array.prototype.slice.call(list || []); }

  // The submit control: prefer an explicit submit, else the first .btn.
  function findSubmit(form) {
    return form.querySelector('button[type="submit"]') ||
           form.querySelector('[type="submit"]') ||
           form.querySelector('.btn');
  }

  // Ensure a polite live status element exists; insert it just before
  // the submit button (or append to the form as a fallback).
  function ensureStatus(form, submitBtn) {
    var status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      if (submitBtn && submitBtn.parentNode === form) {
        form.insertBefore(status, submitBtn);
      } else if (submitBtn && submitBtn.parentNode) {
        // Submit lives in a wrapper — place the status just before that wrapper.
        submitBtn.parentNode.insertBefore(status, submitBtn);
      } else {
        form.appendChild(status);
      }
    }
    return status;
  }

  function setStatus(status, message, kind) {
    if (!status) return;
    status.textContent = message || '';
    status.classList.remove('is-error', 'is-success');
    if (kind === 'error') status.classList.add('is-error');
    else if (kind === 'success') status.classList.add('is-success');
  }

  // First field that fails: required-but-empty, or a malformed email.
  // Returns { field, reason:'required'|'email' } or null when valid.
  function firstInvalid(form) {
    var controls = slice(form.querySelectorAll('input, select, textarea'));
    var i, el, val;

    // Required, trimmed-non-empty. Checkboxes/radios must be checked.
    for (i = 0; i < controls.length; i++) {
      el = controls[i];
      if (!el.hasAttribute('required')) continue;
      var type = (el.type || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        if (!el.checked) return { field: el, reason: 'required' };
      } else if (String(el.value == null ? '' : el.value).trim() === '') {
        return { field: el, reason: 'required' };
      }
    }

    // Email format on every email input that carries a value
    // (required-empty emails are already caught above).
    for (i = 0; i < controls.length; i++) {
      el = controls[i];
      if ((el.type || '').toLowerCase() !== 'email') continue;
      val = String(el.value == null ? '' : el.value).trim();
      if (val !== '' && !EMAIL_RE.test(val)) {
        return { field: el, reason: 'email' };
      }
    }

    return null;
  }

  // Build a plain object of submittable values, keyed by name || id.
  function collect(form) {
    var data = {};
    try {
      var controls = slice(form.querySelectorAll('input, select, textarea'));
      controls.forEach(function (el) {
        var key = el.name || el.id;
        if (!key) return;
        var type = (el.type || '').toLowerCase();
        if (type === 'submit' || type === 'button' || type === 'reset' || type === 'file') return;
        if (type === 'checkbox') { data[key] = !!el.checked; return; }
        if (type === 'radio') { if (el.checked) data[key] = el.value; return; }
        data[key] = el.value;
      });
    } catch (e) { /* return whatever we gathered */ }
    return data;
  }

  // Seal the form: hide its inputs/controls, leaving only the status line.
  function sealForm(form, status) {
    try {
      // 1) Hide every DIRECT child of the form except the status element.
      slice(form.children).forEach(function (child) {
        if (child === status) return;
        if (child.classList && child.classList.contains('form-status')) return;
        child.style.display = 'none';
      });
      // 2) Thoroughly hide known control patterns wherever they nest,
      //    but never the status element itself.
      var sel = '.field, .join__form > .input, .apply__row, input, .select-wrap, ' +
                'textarea, label, button[type="submit"]';
      slice(form.querySelectorAll(sel)).forEach(function (el) {
        if (el === status) return;
        if (el.classList && el.classList.contains('form-status')) return;
        if (el.closest && el.closest('.form-status')) return;
        el.style.display = 'none';
      });
    } catch (e) { /* a partially sealed form is acceptable */ }
  }

  /* ---------- WhatsApp hand-off (data-whatsapp="<number>") ---------- */
  // Human label for a control: its <label for=id> text, else placeholder/name.
  function fieldLabel(form, el) {
    if (el.id) {
      var lab = form.querySelector('label[for="' + el.id + '"]');
      if (lab) return lab.textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    }
    return el.getAttribute('placeholder') || el.name || el.id || 'Detail';
  }
  // Compose a readable enquiry message from every filled control.
  function buildWhatsAppText(form) {
    var lines = ['New project enquiry — KIRA', ''];
    slice(form.querySelectorAll('input, select, textarea')).forEach(function (el) {
      var type = (el.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'checkbox', 'radio'].indexOf(type) !== -1) return;
      var val = String(el.value == null ? '' : el.value).trim();
      if (!val) return;
      lines.push(fieldLabel(form, el) + ': ' + val);
    });
    return lines.join('\n');
  }
  function sendWhatsApp(form, number, status) {
    var num = String(number).replace(/[^0-9]/g, '');
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(buildWhatsAppText(form));
    try { window.open(url, '_blank', 'noopener'); }
    catch (e) { try { window.location.href = url; } catch (e2) {} }
    sealForm(form, status);
    setStatus(status, 'Opening WhatsApp — just press send and your message reaches us.', 'success');
  }

  /* ---------- Outcome paths ---------- */
  function onSuccess(form, status, btn) {
    sealForm(form, status);
    var msg = form.getAttribute('data-success');
    setStatus(status, (msg && msg.trim()) ? msg : DEFAULT_SUCCESS, 'success');
  }

  function onError(form, status, btn) {
    if (btn) {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
    }
    var msg = form.getAttribute('data-error');
    setStatus(status, (msg && msg.trim()) ? msg : DEFAULT_ERROR, 'error');
  }

  /* ---------- Submit handling ---------- */
  function handleSubmit(form, status, e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      // Validate first — never disable the button on invalid input.
      var bad = firstInvalid(form);
      if (bad) {
        try { if (bad.field && bad.field.focus) bad.field.focus(); } catch (fe) {}
        setStatus(
          status,
          bad.reason === 'email'
            ? 'A valid email is required.'
            : 'Please complete the required fields.',
          'error'
        );
        return;
      }

      var btn = findSubmit(form);
      if (btn) {
        btn.classList.add('is-loading');
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
      }

      // WhatsApp hand-off takes priority when a number is declared.
      var wa = form.getAttribute('data-whatsapp');
      if (wa && wa.trim()) { sendWhatsApp(form, wa, status); return; }

      var endpoint = form.getAttribute('data-endpoint');
      if (endpoint && endpoint.trim() && typeof window.fetch === 'function') {
        var data = collect(form);
        window.fetch(endpoint.trim(), {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (res && res.ok) onSuccess(form, status, btn);
          else onError(form, status, btn);
        }).catch(function () {
          onError(form, status, btn);
        });
      } else {
        // No endpoint (or no fetch): behave as a backend-less demo.
        window.setTimeout(function () { onSuccess(form, status, btn); }, 700);
      }
    } catch (err) {
      // Any unexpected failure surfaces as the error path, never a dead form.
      onError(form, status, findSubmit(form));
    }
  }

  /* ---------- Wiring ---------- */
  function init() {
    injectStyles();
    try {
      var forms = slice(document.querySelectorAll('form[data-kira-form]'));
      forms.forEach(function (form) {
        try {
          if (form.getAttribute('data-kira-bound') === '1') return;
          form.setAttribute('data-kira-bound', '1');
          // Defer to JS validation rather than the browser's native bubbles.
          try { form.setAttribute('novalidate', 'novalidate'); } catch (ne) {}
          var status = ensureStatus(form, findSubmit(form));
          form.addEventListener('submit', function (e) {
            handleSubmit(form, status, e);
          });
        } catch (inner) { /* skip a single malformed form, keep the rest */ }
      });
    } catch (e) { /* nothing to wire */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Script loaded after DOMContentLoaded already fired — run now.
    init();
  }
})();

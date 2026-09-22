/* Haul House — progressive enhancements. The page is fully usable without this file. */
(function () {
  'use strict';

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('primary-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- highlight the section in view (home page only) ---------- */
  var sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (sectionLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    sectionLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- project inquiry form → pre-filled email ---------- */
  var form = document.getElementById('inquiry-form');
  if (form) {
    var status = document.getElementById('form-status');
    var fields = {
      name: { el: form.elements.name, msg: 'Please enter your name.' },
      email: { el: form.elements.email, msg: 'Please enter a valid email, e.g. you@brand.com.' },
      brand: { el: form.elements.brand, msg: 'Please tell us your brand or company name.' },
      message: { el: form.elements.message, msg: 'Please add a few words about your goals.' }
    };

    var showError = function (key, show) {
      var f = fields[key];
      var err = document.getElementById(key + '-error');
      f.el.setAttribute('aria-invalid', show ? 'true' : 'false');
      if (err) {
        err.hidden = !show;
        err.querySelector('span').textContent = show ? f.msg : '';
      }
    };
    var isValid = function (key) {
      var el = fields[key].el;
      return el.value.trim() !== '' && (el.type !== 'email' || el.checkValidity());
    };

    // Validate on blur, then live-clear once the user fixes it
    Object.keys(fields).forEach(function (key) {
      var el = fields[key].el;
      el.addEventListener('blur', function () { if (el.value !== '') showError(key, !isValid(key)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true' && isValid(key)) showError(key, false);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(fields).forEach(function (key) {
        var ok = isValid(key);
        showError(key, !ok);
        if (!ok && !firstInvalid) firstInvalid = fields[key].el;
      });
      if (firstInvalid) {
        status.className = 'form-status';
        status.textContent = 'Please fix the highlighted fields.';
        firstInvalid.focus();
        return;
      }

      var v = function (n) { return (form.elements[n] && form.elements[n].value.trim()) || '—'; };
      var subject = 'New project inquiry — ' + v('brand');
      var body = [
        'Name: ' + v('name'),
        'Email: ' + v('email'),
        'Brand / company: ' + v('brand'),
        'Website or TikTok Shop: ' + v('website'),
        'Interested in: ' + v('service'),
        '',
        v('message')
      ].join('\n');

      window.location.href = 'mailto:' + form.dataset.to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      status.className = 'form-status is-success';
      status.textContent = 'Opening your email app with everything filled in. If nothing opens, email us directly at ' + form.dataset.to + '.';
    });
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

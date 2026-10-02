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

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- magnetic dock ---------- */
  var dock = document.querySelector('.dock');
  if (dock) {
    var MAX_SCALE = 1.5;
    var DISTANCE = 150;
    var LIFT = 10;
    var dockItems = Array.prototype.map.call(dock.querySelectorAll('.dock-item'), function (el) {
      return { el: el, s: 1, v: 0 };
    });
    var pointerX = Infinity;
    var baseSize = 0;
    var dockRaf = 0;
    var lastT = 0;

    var dockFrame = function (now) {
      var dt = Math.min(0.032, (now - (lastT || now)) / 1000) || 0.016;
      lastT = now;
      var moving = false;
      dockItems.forEach(function (it) {
        var target = 1;
        if (pointerX !== Infinity) {
          var r = it.el.getBoundingClientRect();
          var d = Math.abs(pointerX - (r.left + r.width / 2));
          if (d < DISTANCE) target = 1 + (MAX_SCALE - 1) * (1 - d / DISTANCE);
        }
        // spring (stiffness 300, damping 20, mass 0.5), sub-stepped for stability
        for (var i = 0; i < 4; i++) {
          var h = dt / 4;
          var a = (300 * (target - it.s) - 20 * it.v) / 0.5;
          it.v += a * h;
          it.s += it.v * h;
        }
        if (Math.abs(target - it.s) > 0.001 || Math.abs(it.v) > 0.001) moving = true;
        else { it.s = target; it.v = 0; }
        if (it.s === 1 && pointerX === Infinity) {
          it.el.style.width = it.el.style.height = it.el.style.transform = '';
        } else {
          var px = (it.s * baseSize).toFixed(2) + 'px';
          it.el.style.width = it.el.style.height = px;
          it.el.style.transform = 'translateY(' + ((it.s - 1) * -LIFT).toFixed(2) + 'px)';
        }
      });
      dockRaf = moving || pointerX !== Infinity ? requestAnimationFrame(dockFrame) : 0;
    };
    var kick = function () { if (!dockRaf) { lastT = 0; dockRaf = requestAnimationFrame(dockFrame); } };

    dock.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || reduceMotion.matches) return;
      if (pointerX === Infinity) baseSize = parseFloat(getComputedStyle(dockItems[0].el).getPropertyValue('--size')) || 48;
      pointerX = e.clientX;
      kick();
    });
    dock.addEventListener('pointerleave', function () { pointerX = Infinity; kick(); });

    // click: launch bounce + ring burst
    dockItems.forEach(function (it) {
      it.el.addEventListener('click', function () {
        if (reduceMotion.matches) return;
        it.el.classList.remove('is-launching');
        void it.el.offsetWidth;
        it.el.classList.add('is-launching');
        var ring = document.createElement('span');
        ring.className = 'dock-ripple';
        ring.setAttribute('aria-hidden', 'true');
        ring.addEventListener('animationend', function () { ring.remove(); });
        it.el.appendChild(ring);
      });
      it.el.addEventListener('animationend', function (e) {
        if (e.animationName === 'dock-launch') it.el.classList.remove('is-launching');
      });
    });

    // active dot follows the section in view
    if ('IntersectionObserver' in window) {
      var dockById = {};
      dockItems.forEach(function (it) {
        var id = it.el.getAttribute('href').slice(1);
        if (id !== 'top') dockById[id] = it.el;
      });
      var setCurrent = function (el) {
        dockItems.forEach(function (it) { it.el.removeAttribute('aria-current'); });
        if (el) el.setAttribute('aria-current', 'true');
      };
      var homeLink = dock.querySelector('[href="#top"]');
      var dockObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setCurrent(dockById[entry.target.id]);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(dockById).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) dockObserver.observe(el);
      });
      var hero = document.querySelector('.hero');
      if (hero && homeLink) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) setCurrent(homeLink);
        }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
      }
    }
  }

  /* ---------- videos: hero feed, 2x reel, hover previews, pop-out player ---------- */
  var grid = document.querySelector('[data-videos]');
  var VIDEOS = [];
  try { VIDEOS = JSON.parse(grid ? grid.getAttribute('data-videos') : '[]') || []; } catch (err) { VIDEOS = []; }
  var SPEED = 2;
  var safePlay = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
  var loadOnce = function (v) {
    if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; }
  };

  // hero phone: cycle every clip at 2x
  var feed = document.querySelector('.tt-feed');
  if (feed && VIDEOS.length) {
    var feedIdx = 0;
    var heroHandle = document.querySelector('.tt-handle');
    var heroProduct = document.querySelector('.tt-product');
    var heroBar = document.querySelector('.tt-progress span');
    var showFeed = function (i) {
      feedIdx = i % VIDEOS.length;
      var v = VIDEOS[feedIdx];
      feed.classList.remove('is-ready');
      feed.poster = v.poster;
      feed.src = v.loop;
      feed.defaultPlaybackRate = SPEED;
      if (heroHandle) heroHandle.textContent = v.handle;
      if (heroProduct) heroProduct.textContent = v.product;
      if (!reduceMotion.matches) safePlay(feed);
    };
    feed.addEventListener('playing', function () { feed.playbackRate = SPEED; feed.classList.add('is-ready'); });
    feed.addEventListener('ended', function () { showFeed(feedIdx + 1); });
    if (heroBar) {
      heroBar.style.animation = 'none';
      feed.addEventListener('timeupdate', function () {
        if (feed.duration) heroBar.style.transform = 'scaleX(' + (feed.currentTime / feed.duration) + ')';
      });
    }
    showFeed(0);
    if (reduceMotion.matches) feed.classList.add('is-ready');
  }

  // 2x reel: only phones on screen decode and play
  var reelVids = document.querySelectorAll('.reel-phone video');
  if (reelVids.length && 'IntersectionObserver' in window) {
    var reelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting && !reduceMotion.matches && !document.hidden) {
          loadOnce(v);
          v.defaultPlaybackRate = SPEED;
          v.playbackRate = SPEED;
          safePlay(v);
        } else {
          v.pause();
        }
      });
    }, { rootMargin: '0px 120px' });
    reelVids.forEach(function (v) {
      v.addEventListener('playing', function () { v.playbackRate = SPEED; });
      reelObserver.observe(v);
    });
  }

  // grid: muted preview on hover
  document.querySelectorAll('.vid-open').forEach(function (btn) {
    var v = btn.querySelector('video');
    if (!v) return;
    btn.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || reduceMotion.matches) return;
      loadOnce(v);
      safePlay(v);
    });
    btn.addEventListener('pointerleave', function () { v.pause(); v.classList.remove('is-playing'); });
    v.addEventListener('playing', function () { v.classList.add('is-playing'); });
  });

  // pop-out player
  var box = document.querySelector('.vbox');
  if (box && VIDEOS.length && typeof box.showModal === 'function') {
    var boxVideo = box.querySelector('.vbox-video');
    var boxPhone = box.querySelector('.vbox-phone');
    var boxHandle = box.querySelector('.vbox-handle');
    var boxProduct = box.querySelector('.vbox-product');
    var boxLink = box.querySelector('.vbox-link');
    var boxToggle = box.querySelector('.vbox-toggle');
    var boxMute = box.querySelector('.vbox-mute');
    var boxBar = box.querySelector('.vbox-progress span');
    var boxIdx = 0;
    var opener = null;

    var setVideo = function (i) {
      boxIdx = (i + VIDEOS.length) % VIDEOS.length;
      var v = VIDEOS[boxIdx];
      boxVideo.poster = v.poster;
      boxVideo.src = v.src;
      boxHandle.textContent = v.handle;
      boxProduct.textContent = v.product;
      if (v.url) { boxLink.href = v.url; boxLink.hidden = false; } else { boxLink.hidden = true; boxLink.removeAttribute('href'); }
      boxBar.style.transform = 'scaleX(0)';
      box.setAttribute('aria-label', 'Video: ' + v.handle + ', ' + v.product);
      safePlay(boxVideo);
    };
    var pop = function (fromEl) {
      boxPhone.classList.remove('is-popping');
      var to = boxPhone.getBoundingClientRect();
      var from = fromEl && fromEl.getBoundingClientRect();
      if (from && to.width) {
        var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
        var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
        boxPhone.style.setProperty('--from', 'translate(' + dx + 'px,' + dy + 'px) scale(' + (from.width / to.width) + ')');
      }
      void boxPhone.offsetWidth;
      boxPhone.classList.add('is-popping');
    };
    var openBox = function (i, fromEl) {
      opener = fromEl;
      box.showModal();
      setVideo(i);
      pop(fromEl);
    };
    var closeBox = function () { if (box.open) box.close(); };

    box.addEventListener('close', function () {
      boxVideo.pause();
      boxVideo.removeAttribute('src');
      boxVideo.load();
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
    boxPhone.addEventListener('animationend', function () { boxPhone.classList.remove('is-popping'); });
    var togglePlay = function () { if (boxVideo.paused) safePlay(boxVideo); else boxVideo.pause(); };
    boxVideo.addEventListener('click', togglePlay);
    boxToggle.addEventListener('click', togglePlay);
    boxVideo.addEventListener('play', function () { box.classList.remove('is-paused'); boxToggle.setAttribute('aria-label', 'Pause'); });
    boxVideo.addEventListener('pause', function () { box.classList.add('is-paused'); boxToggle.setAttribute('aria-label', 'Play'); });
    boxVideo.addEventListener('ended', function () { setVideo(boxIdx + 1); });
    boxVideo.addEventListener('timeupdate', function () {
      if (boxVideo.duration) boxBar.style.transform = 'scaleX(' + (boxVideo.currentTime / boxVideo.duration) + ')';
    });
    boxMute.addEventListener('click', function () {
      boxVideo.muted = !boxVideo.muted;
      boxMute.setAttribute('aria-pressed', String(boxVideo.muted));
      boxMute.setAttribute('aria-label', boxVideo.muted ? 'Unmute' : 'Mute');
    });
    box.querySelector('.vbox-prev').addEventListener('click', function () { setVideo(boxIdx - 1); pop(null); });
    box.querySelector('.vbox-next').addEventListener('click', function () { setVideo(boxIdx + 1); pop(null); });
    box.querySelector('.vbox-close').addEventListener('click', closeBox);
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('vbox-stage')) closeBox();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { setVideo(boxIdx + 1); pop(null); }
      else if (e.key === 'ArrowLeft') { setVideo(boxIdx - 1); pop(null); }
      else if (e.key === ' ' && e.target === boxVideo) { e.preventDefault(); togglePlay(); }
    });

    document.querySelectorAll('[data-video]').forEach(function (el) {
      el.addEventListener('click', function () {
        var phone = el.querySelector('.phone-body, .vid-thumb') || el;
        openBox(parseInt(el.getAttribute('data-video'), 10) || 0, phone);
      });
    });
  }

  /* ---------- results dashboard: staggered reveal + count-up ---------- */
  var dash = document.querySelector('[data-dash]');
  if (dash && 'IntersectionObserver' in window && !reduceMotion.matches) {
    var counters = dash.querySelectorAll('.count');
    var fmt = function (el, v) {
      var dec = parseInt(el.dataset.dec, 10) || 0;
      var n = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
      el.textContent = (el.dataset.pre || '') + n + (el.dataset.suf || '');
    };
    counters.forEach(function (el) { fmt(el, 0); });
    dash.classList.add('dash--anim');
    var runCounts = function () {
      var start = performance.now();
      var DUR = 1800;
      var tick = function (now) {
        var t = Math.min(1, (now - start) / DUR);
        var k = 1 - Math.pow(1 - t, 4);          // ease-out quart
        counters.forEach(function (el) { fmt(el, parseFloat(el.dataset.to) * k); });
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var dashObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      dash.classList.add('is-in');
      setTimeout(runCounts, 250);
      dashObserver.disconnect();
    }, { threshold: 0.2 });
    dashObserver.observe(dash);
  }

  /* ---------- terrain background ----------
     A ridged height field drifting toward the viewer on a 9s cycle. Rows are drawn
     far-to-near and each row is filled before it is stroked, so nearer ridges occlude
     the ones behind them. Violet scree slides off the warm crests and six lava veins
     run down the slopes into a hazed far edge. */
  var field = document.querySelector('.glow-field');
  var canvas = document.createElement('canvas');
  var ctx = field && canvas.getContext && canvas.getContext('2d');
  if (ctx) {
    canvas.className = 'terrain-canvas';
    field.appendChild(canvas);
    field.classList.add('glow-field--terrain');

    var BG = [8, 6, 13];
    // theme ramp, low → high: purple, violet, magenta, pink
    var RAMP = [[106, 47, 214], [131, 71, 234], [195, 58, 201], [255, 61, 116]];
    var ROWS = 64;
    var Z_NEAR = 1.1, Z_FAR = 26;
    var DZ = (Z_FAR - Z_NEAR) / ROWS;
    var CYCLE = 9;             // seconds per drift cycle
    var CYCLE_DIST = 4.5;      // world units travelled per cycle
    var CAM_H = 2.3;
    var VEINS = [];
    for (var vi = 0; vi < 6; vi++) {
      VEINS.push({ c: -10 + vi * 4 + (vi % 2 ? 0.9 : -0.6), a: 0.8 + (vi % 3) * 0.35, f: 0.21 + vi * 0.037, p: vi * 1.7 });
    }

    var hash = function (x, y) {
      var n = (x * 374761393 + y * 668265263) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    var noise = function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    var veinX = function (vn, z) { return vn.c + vn.a * Math.sin(z * vn.f + vn.p) + 0.45 * Math.sin(z * vn.f * 2.7 + vn.p * 1.3); };
    // ridged fbm, carved by the vein channels
    var sample = function (x, z) {
      var h = 0, amp = 1, fr = 0.26;
      for (var o = 0; o < 3; o++) {
        var r = 1 - Math.abs(noise(x * fr + o * 17.3, z * fr) * 2 - 1);
        h += r * r * amp;
        amp *= 0.5; fr *= 2.05;
      }
      h = h / 1.75 * 1.55;
      for (var k = 0; k < VEINS.length; k++) {
        var d = x - veinX(VEINS[k], z);
        var dd = d * d;
        if (dd < 1) {
          h -= Math.exp(-dd / 0.09) * 0.32;
        }
      }
      return h;
    };
    var rampColor = function (t) {
      t = Math.max(0, Math.min(0.999, t)) * (RAMP.length - 1);
      var i = Math.floor(t), f = t - i, a = RAMP[i], b = RAMP[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    };
    var rgba = function (c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; };

    var W = 0, H = 0, dpr = 1, cols = 0;
    var resize = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(60, Math.min(150, Math.round(W / 11)));
    };

    var BANDS = 8, BAND_COLORS = [], bandPaths = [];
    for (var bc = 0; bc < BANDS; bc++) BAND_COLORS.push(rampColor(bc / (BANDS - 1)));
    var xs = [], ys = [], hs = [];
    var draw = function (t) {
      var horizon = H * 0.36;
      var focal = H * 0.85;
      var travel = (t / CYCLE) * CYCLE_DIST;
      var frac = (travel / DZ) % 1;
      var base = Math.floor(travel / DZ);
      var halfSpan = W / 2 / focal;

      ctx.fillStyle = rgba(BG, 1);
      ctx.fillRect(0, 0, W, H);
      var sky = ctx.createRadialGradient(W * 0.5, horizon, 0, W * 0.5, horizon, Math.max(W, H) * 0.6);
      sky.addColorStop(0, 'rgba(195,58,201,0.20)');
      sky.addColorStop(0.45, 'rgba(131,71,234,0.08)');
      sky.addColorStop(1, 'rgba(8,6,13,0)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      var prevVein = null;
      for (var r = ROWS - 1; r >= 0; r--) {
        var z = Z_NEAR + (r + 1 - frac) * DZ;       // screen depth of this row
        var lat = base + r + 1;                       // fixed lattice row, so samples never swim
        var wz = Z_NEAR + lat * DZ;                   // world z of that lattice row
        var depth = (z - Z_NEAR) / (Z_FAR - Z_NEAR);
        var fade = Math.min(1, (1 - depth) * 3.2) * (1 - depth * 0.55);
        if (fade <= 0) { prevVein = null; continue; }
        var span = halfSpan * z * 1.08;
        var scale = focal / z;
        var rowVein = [];
        for (var i = 0; i <= cols; i++) {
          var wx = -span + (2 * span * i) / cols;
          hs[i] = sample(wx, wz);
          xs[i] = W / 2 + wx * scale;
          ys[i] = horizon + (CAM_H - hs[i]) * scale;
        }
        // occluding fill (slightly lit so the relief reads as solid)
        ctx.beginPath();
        ctx.moveTo(xs[0], H + 2);
        for (i = 0; i <= cols; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.lineTo(xs[cols], H + 2);
        ctx.closePath();
        ctx.fillStyle = rgba([BG[0] + 6 * fade, BG[1] + 3 * fade, BG[2] + 12 * fade], 1);
        ctx.fill();

        // ridge line, coloured by height (violet in the troughs, warm on the crests);
        // segments are grouped into a few colour bands so each row is a handful of strokes
        ctx.lineWidth = 0.7 + (1 - depth) * 1.3;
        for (var bnd = 0; bnd < BANDS; bnd++) bandPaths[bnd] = false;
        for (i = 0; i < cols; i++) {
          var bi = Math.max(0, Math.min(BANDS - 1, Math.floor(((hs[i] + hs[i + 1]) / 2 - 0.2) / 1.2 * BANDS)));
          if (!bandPaths[bi]) { bandPaths[bi] = new Path2D(); }
          bandPaths[bi].moveTo(xs[i], ys[i]);
          bandPaths[bi].lineTo(xs[i + 1], ys[i + 1]);
        }
        for (bnd = 0; bnd < BANDS; bnd++) {
          if (!bandPaths[bnd]) continue;
          ctx.strokeStyle = rgba(BAND_COLORS[bnd], Math.min(0.95, (0.34 + bnd / BANDS * 0.55) * fade));
          ctx.stroke(bandPaths[bnd]);
        }

        // scree: violet grit shed from local crests, sliding down the face
        for (i = 2; i < cols - 1; i++) {
          if (hs[i] > 1.0 && hs[i] >= hs[i - 1] && hs[i] >= hs[i + 1]) {
            for (var g = 0; g < 3; g++) {
              var seed = hash(i * 7 + g, lat);
              var ph = (t / CYCLE * 2.5 + seed) % 1;
              var side = seed > 0.5 ? 1 : -1;
              var px = xs[i] + side * ph * scale * 0.35 * (0.4 + seed);
              var py = ys[i] + ph * ph * scale * 0.22;
              ctx.fillStyle = rgba(RAMP[1], (1 - ph) * 0.7 * fade);
              ctx.fillRect(px, py, 1.4, 1.4);
            }
          }
        }

        // lava: find where each vein crosses this row and join it to the row behind
        for (var k = 0; k < VEINS.length; k++) {
          var vx = veinX(VEINS[k], wz);
          if (vx < -span || vx > span) { rowVein[k] = null; continue; }
          var sv = sample(vx, wz);
          var sx = W / 2 + vx * scale;
          var sy = horizon + (CAM_H - sv) * scale;
          rowVein[k] = [sx, sy];
          var pv = prevVein && prevVein[k];
          if (!pv) continue;
          var pulse = 0.55 + 0.45 * Math.sin(wz * 1.4 - t * 2.6 + k);
          var la = fade * (0.35 + 0.65 * pulse);
          ctx.lineCap = 'round';
          ctx.strokeStyle = rgba(RAMP[3], la * 0.3);
          ctx.lineWidth = (3 + (1 - depth) * 12);
          ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(sx, sy); ctx.stroke();
          ctx.strokeStyle = rgba([255, 170, 196], la);
          ctx.lineWidth = 1 + (1 - depth) * 2.6;
          ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(sx, sy); ctx.stroke();
          ctx.lineCap = 'butt';
        }
        prevVein = rowVein;
      }

      // haze over the far edge
      var haze = ctx.createLinearGradient(0, horizon - H * 0.12, 0, horizon + H * 0.22);
      haze.addColorStop(0, 'rgba(8,6,13,1)');
      haze.addColorStop(0.35, 'rgba(20,12,34,0.75)');
      haze.addColorStop(1, 'rgba(8,6,13,0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, horizon + H * 0.22);
      // keep the top of the page quiet behind the header and hero copy
      var veil = ctx.createLinearGradient(0, 0, 0, H);
      var dim = W < 700 ? 0.18 : 0;
      veil.addColorStop(0, rgba(BG, 0.35 + dim));
      veil.addColorStop(1, rgba(BG, 0.28 + dim));
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
    };

    var terrainRaf = 0, start = 0, lastDraw = 0;
    var loop = function (now) {
      if (!start) start = now;
      // the drift is slow, so ~30fps is plenty and halves the cost
      if (now - lastDraw > 30) { lastDraw = now; draw((now - start) / 1000); }
      terrainRaf = requestAnimationFrame(loop);
    };
    var run = function () {
      cancelAnimationFrame(terrainRaf); terrainRaf = 0;
      if (reduceMotion.matches || document.hidden) draw(2.5);
      else terrainRaf = requestAnimationFrame(loop);
    };
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); if (!terrainRaf) draw(2.5); }, 120);
    });
    document.addEventListener('visibilitychange', run);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', run);
    resize();
    run();
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

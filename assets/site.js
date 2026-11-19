/* WOODS Corporation — site.js */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;

  /* ---------- header ---------- */
  var header = doc.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- mobile nav ---------- */
  var burger = doc.getElementById('burger');
  var nav = doc.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.documentElement.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        doc.documentElement.style.overflow = '';
      });
    });
  }

  /* ---------- smooth anchor offset ---------- */
  doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (!id || id === '#') return;
      var target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 78;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---------- scroll progress / parallax ---------- */
  var progressBar = doc.querySelector('.progress span');
  var heroMedia = doc.querySelectorAll('.hero-media img, .hero-video');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  function onFrame() {
    var y = window.scrollY || window.pageYOffset;
    if (progressBar) {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if (heroMedia && heroMedia.length && !reduce && y < window.innerHeight * 1.3) {
      var t = 'translate3d(0,' + (y * 0.14).toFixed(2) + 'px,0) scale(1.04)';
      heroMedia.forEach(function (el) { el.style.transform = t; });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }, { passive: true });
  onFrame();

  /* ---------- cursor glow ---------- */
  var glow = doc.querySelector('.cursor-glow');
  if (glow && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    var tx = gx, ty = gy;
    doc.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      gx += (tx - gx) * 0.08;
      gy += (ty - gy) * 0.08;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- logo cursor ---------- */
  var cur = doc.getElementById('customCursor');
  if (cur && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var probe = new Image();
    probe.onload = function () { body.classList.add('has-cursor'); };
    probe.src = '/assets/logo.png';
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var mx = cx, my = cy;
    doc.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function trail() {
      cx += (mx - cx) * 0.22;
      cy += (my - cy) * 0.22;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(trail);
    })();
    doc.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    doc.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
  }

  /* ---------- stagger ---------- */
  doc.querySelectorAll('.grid, .tiers, .steps').forEach(function (group) {
    var kids = group.querySelectorAll(':scope > .reveal');
    kids.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
    });
  });

  /* ---------- reveal ---------- */
  var items = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- GA4 helpers ---------- */
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.getAttribute('href') && a.getAttribute('href').indexOf('tel:') === 0) {
      track('click_tel', { link_url: a.getAttribute('href') });
    }
    if (a.classList.contains('btn')) {
      track('cta_click', { label: (a.textContent || '').trim().slice(0, 40), page: location.pathname });
    }
  });

  /* ---------- contact form ---------- */
  var form = doc.getElementById('contactForm');
  if (form) {
    var status = doc.getElementById('formStatus');
    var submit = doc.getElementById('submitBtn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var consent = form.querySelector('[name="consent"]');
      if (consent && !consent.checked) {
        status.className = 'form-status is-err';
        status.textContent = doc.documentElement.lang.indexOf('zh') === 0
          ? '请先同意隐私政策。'
          : 'プライバシーポリシーへの同意が必要です。';
        return;
      }

      var original = submit.innerHTML;
      submit.disabled = true;
      submit.textContent = doc.documentElement.lang.indexOf('zh') === 0 ? '发送中…' : '送信中…';
      status.className = 'form-status';
      status.textContent = '';

      var fd = new FormData(form);
      fetch('https://woods-chat.lin-285.workers.dev/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name') || '',
          email: fd.get('email') || '',
          company: fd.get('company') || '',
          message: fd.get('message') || '',
          botcheck: fd.get('botcheck') || '',
          page: location.pathname
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (!result.ok) throw new Error(result.message || 'failed');
          status.className = 'form-status is-ok';
          status.textContent = doc.documentElement.lang.indexOf('zh') === 0
            ? '✓ 已收到您的咨询，我们将在 1–2 个工作日内回复。'
            : '✓ お問い合わせありがとうございます。1〜2営業日以内にご連絡いたします。';
          form.reset();
          track('generate_lead', { form: 'contact', page: location.pathname });
        })
        .catch(function () {
          status.className = 'form-status is-err';
          status.textContent = doc.documentElement.lang.indexOf('zh') === 0
            ? '✗ 发送失败。请稍后重试，或直接邮件联系 contact@woods-corp.jp'
            : '✗ 送信に失敗しました。しばらくしてから再度お試しいただくか、contact@woods-corp.jp までご連絡ください。';
        })
        .finally(function () {
          submit.disabled = false;
          submit.innerHTML = original;
        });
    });
  }

  /* ---------- footer year ---------- */
  var y = doc.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

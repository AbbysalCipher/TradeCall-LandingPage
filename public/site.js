(function () {
  'use strict';
  var config = window.TRADECALL_CONFIG || {};

  function setupMotion() {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var revealSelector = [
      '.trust-strip__inner',
      '.problem .section-heading', '.stat-card',
      '.live-copy', '.live-demo-card',
      '.capabilities-heading', '.capability-card',
      '.how .section-heading', '.step-card', '.number-note',
      '.pricing-copy', '.pricing-card',
      '.why .section-heading', '.why-item', '.pdpa-assurance__card',
      '.final-cta__inner > *', '.footer-main > *', '.footer-bottom > *'
    ].join(',');
    var revealTargets = Array.prototype.slice.call(document.querySelectorAll(revealSelector));

    revealTargets.forEach(function (target) { target.classList.add('reveal-on-scroll'); });

    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -42px 0px' });
      revealTargets.forEach(function (target) { revealObserver.observe(target); });
    } else {
      revealTargets.forEach(function (target) { target.classList.add('is-revealed'); });
    }

    document.body.classList.add('motion-ready');
  }


  function initCookieConsent() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    var storageKey = 'tradeline-cookie-preferences-v1';
    var preferences = { necessary: true, analytics: false, marketing: false, updatedAt: null };
    var mainActions = document.getElementById('cookie-main-actions');
    var preferencePanel = document.getElementById('cookie-preferences');
    var analyticsToggle = document.getElementById('cookie-analytics');
    var marketingToggle = document.getElementById('cookie-marketing');
    function readSaved() {
      try {
        var raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return { necessary: true, analytics: parsed.analytics === true, marketing: parsed.marketing === true, updatedAt: parsed.updatedAt || null };
      } catch (error) { return null; }
    }
    function save(next) {
      preferences = { necessary: true, analytics: !!next.analytics, marketing: !!next.marketing, updatedAt: new Date().toISOString() };
      try { window.localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch (error) { /* Browser storage may be unavailable; keep this choice for the current page. */ }
      banner.hidden = true;
      mainActions.hidden = false;
      preferencePanel.hidden = true;
      document.dispatchEvent(new CustomEvent('tradeline:cookie-preferences-updated', { detail: preferences }));
    }
    function showPreferences() {
      var saved = readSaved() || preferences;
      analyticsToggle.checked = saved.analytics;
      marketingToggle.checked = saved.marketing;
      mainActions.hidden = true;
      preferencePanel.hidden = false;
      banner.hidden = false;
    }
    var saved = readSaved();
    if (!saved) banner.hidden = false;
    document.getElementById('cookie-accept').addEventListener('click', function () { save({ analytics: true, marketing: true }); });
    document.getElementById('cookie-reject').addEventListener('click', function () { save({ analytics: false, marketing: false }); });
    document.getElementById('cookie-customize').addEventListener('click', showPreferences);
    document.getElementById('cookie-save').addEventListener('click', function () { save({ analytics: analyticsToggle.checked, marketing: marketingToggle.checked }); });
    document.getElementById('cookie-back').addEventListener('click', function () { preferencePanel.hidden = true; mainActions.hidden = false; });
    document.getElementById('cookie-close').addEventListener('click', function () { banner.hidden = true; });
    var settingsButton = document.getElementById('open-cookie-settings');
    if (settingsButton) settingsButton.addEventListener('click', showPreferences);
    if (saved) preferences = saved;
  }

  function init() {
    setupMotion();
    initCookieConsent();
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
    var menuToggle = document.getElementById('menu-toggle');
    var mainNav = document.getElementById('main-nav');
    if (menuToggle && mainNav) {
      menuToggle.addEventListener('click', function () {
        var open = mainNav.classList.toggle('main-nav--open');
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      });
      mainNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mainNav.classList.remove('main-nav--open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.setAttribute('aria-label', 'Open navigation');
        });
      });
    }

    if (config.phone) {
      var phoneNode = document.getElementById('footer-phone');
      if (phoneNode) {
        var phoneLink = document.createElement('a');
        phoneLink.href = 'tel:' + String(config.phone).replace(/[^+\d]/g, '');
        phoneLink.className = 'footer-book';
        phoneLink.textContent = config.phone;
        phoneNode.replaceChildren(phoneLink);
      }
    }

    var calcFields = {
      missed: document.getElementById('calc-missed-calls'),
      days: document.getElementById('calc-working-days'),
      callsPerCustomer: document.getElementById('calc-calls-per-customer'),
      jobValue: document.getElementById('calc-job-value')
    };
    var calcRevenue = document.getElementById('calc-monthly-revenue');
    var calcMonthlyCalls = document.getElementById('calc-monthly-calls');
    var calcCustomers = document.getElementById('calc-potential-customers');
    function updateMissedCallCalculator() {
      if (!calcRevenue || !calcMonthlyCalls || !calcCustomers) return;
      function numeric(field, fallback) {
        var value = field ? Number(field.value) : fallback;
        return Number.isFinite(value) && value >= 0 ? value : 0;
      }
      var missed = numeric(calcFields.missed, 5);
      var days = numeric(calcFields.days, 26);
      var callsPerCustomer = Math.max(1, numeric(calcFields.callsPerCustomer, 10));
      var jobValue = numeric(calcFields.jobValue, 1200);
      var monthlyCalls = missed * days;
      var potentialCustomers = monthlyCalls / callsPerCustomer;
      var revenue = potentialCustomers * jobValue;
      calcRevenue.textContent = 'RM ' + Math.round(revenue).toLocaleString('en-MY');
      calcMonthlyCalls.textContent = Math.round(monthlyCalls).toLocaleString('en-MY');
      calcCustomers.textContent = potentialCustomers.toLocaleString('en-MY', { maximumFractionDigits: 1 });
    }
    Object.keys(calcFields).forEach(function (key) {
      if (calcFields[key]) calcFields[key].addEventListener('input', updateMissedCallCalculator);
    });
    updateMissedCallCalculator();

  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

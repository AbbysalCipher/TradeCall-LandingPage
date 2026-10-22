(function () {
  'use strict';
  var config = window.TRADECALL_CONFIG || {};
  var bookingUrl = 'https://cal.com/tan-po-keng-esfh5w/60-min';
  var nudge = null;
  var nudgeTimer = null;
  var widgetScript = null;
  var widgetPoll = null;

  function showGlobalMessage(message) {
    var panel = document.getElementById('global-mic-note');
    if (!panel) return;
    panel.querySelector('span').textContent = message;
    panel.hidden = false;
  }

  function setLiveMessage(message) {
    var panel = document.getElementById('mic-message');
    if (!panel) return;
    panel.textContent = message;
    panel.hidden = !message;
  }

  function phoneFallback() {
    return config.phone ? ', or call us at ' + config.phone : ', or book a call with us';
  }

  function deepQuery(root, selector, found) {
    found = found || [];
    if (!root || !root.querySelectorAll) return found;
    var list = root.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      found.push(list[i]);
      if (list[i].shadowRoot) deepQuery(list[i].shadowRoot, selector, found);
    }
    var children = root.querySelectorAll('*');
    for (var j = 0; j < children.length; j++) {
      if (children[j].shadowRoot) deepQuery(children[j].shadowRoot, selector, found);
    }
    return found;
  }

  function findRetellLauncher() {
    var nodes = deepQuery(document, 'button, [role="button"], [tabindex="0"]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.closest && (node.closest('#assistant-nudge') || node.closest('#mic-start') || node.closest('.js-talk'))) continue;
      var label = [node.innerText, node.textContent, node.getAttribute('aria-label'), node.getAttribute('title')].filter(Boolean).join(' ').toLowerCase();
      if (label.indexOf('talk to our receptionist') !== -1 || label.indexOf('retell') !== -1 || label.indexOf('need support') !== -1) return node;
    }
    return null;
  }

  function loadRetellWidget() {
    if (!config.retellPublicKey || !config.retellAgentId) {
      showGlobalMessage('The live receptionist needs its Retell public key and agent ID. Set RETELL_PUBLIC_KEY and RETELL_AGENT_ID in your environment settings.');
      return;
    }
    if (document.getElementById('retell-widget')) return;
    widgetScript = document.createElement('script');
    widgetScript.id = 'retell-widget';
    widgetScript.src = 'https://dashboard.retellai.com/retell-widget-v2.js';
    widgetScript.type = 'module';
    widgetScript.async = true;
    widgetScript.setAttribute('data-voice-public-key', config.retellPublicKey);
    widgetScript.setAttribute('data-voice-agent-id', config.retellAgentId);
    widgetScript.setAttribute('data-title', 'TradeLine Receptionist');
    widgetScript.setAttribute('data-bot-name', 'TradeLine Receptionist');
    widgetScript.setAttribute('data-theme-color', '#ffffff');
    widgetScript.setAttribute('data-component-color', '#22d3ee');
    widgetScript.setAttribute('data-fab-text', 'Talk to our receptionist');
    widgetScript.setAttribute('data-show-ai-popup', 'false');
    widgetScript.setAttribute('data-auto-open', 'false');
    widgetScript.addEventListener('error', function () {
      showGlobalMessage('The live receptionist could not load. Please check the Retell public key, allowed domains, and your internet connection.');
    });
    document.head.appendChild(widgetScript);
    widgetPoll = window.setInterval(function () {
      if (findRetellLauncher()) {
        window.clearInterval(widgetPoll);
        widgetPoll = null;
      }
    }, 800);
    window.setTimeout(function () {
      if (widgetPoll) {
        window.clearInterval(widgetPoll);
        widgetPoll = null;
      }
    }, 20000);
  }

  async function openAssistant() {
    setLiveMessage('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('unsupported');
      }
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(function (track) { track.stop(); });
    } catch (err) {
      var message;
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        message = 'Microphone permission was blocked. Allow microphone access in your browser settings and try again' + phoneFallback() + '.';
      } else if ((err && err.name === 'NotFoundError') || err.message === 'unsupported') {
        message = 'Mic not found — check your microphone and try again' + phoneFallback() + '.';
      } else {
        message = 'We could not access your microphone. Check your device and browser permissions, then try again' + phoneFallback() + '.';
      }
      setLiveMessage(message);
      showGlobalMessage(message);
      return;
    }

    var launcher = findRetellLauncher();
    if (launcher) {
      launcher.click();
      setLiveMessage('Microphone ready. The TradeLine receptionist is opening.');
      if (nudge) nudge.hidden = true;
    } else {
      var loadedMessage = 'Microphone ready. Use the floating “Talk to our receptionist” launcher to begin. If it is missing, check the Retell allowed-domain settings.';
      setLiveMessage(loadedMessage);
      showGlobalMessage(loadedMessage);
    }
  }

  function startNudgeCycle() {
    nudge = document.getElementById('assistant-nudge');
    if (!nudge) return;
    function show() {
      nudge.hidden = false;
      nudgeTimer = window.setTimeout(function () {
        nudge.hidden = true;
        nudgeTimer = window.setTimeout(show, 5000);
      }, 5000);
    }
    nudgeTimer = window.setTimeout(show, 5000);
    var close = document.getElementById('nudge-close');
    if (close) close.addEventListener('click', function (event) {
      event.stopPropagation();
      nudge.hidden = true;
    });
    nudge.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('#nudge-close')) return;
      openAssistant();
    });
  }

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

  function init() {
    setupMotion();
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

    var talkButtons = document.querySelectorAll('.js-talk');
    talkButtons.forEach(function (button) { button.addEventListener('click', openAssistant); });
    var micButton = document.getElementById('mic-start');
    if (micButton) micButton.addEventListener('click', openAssistant);
    var globalNote = document.getElementById('global-mic-note');
    if (globalNote) {
      var close = globalNote.querySelector('button');
      if (close) close.addEventListener('click', function () { globalNote.hidden = true; });
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

    loadRetellWidget();
    startNudgeCycle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

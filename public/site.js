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
    widgetScript.setAttribute('data-title', 'TradeCall Receptionist');
    widgetScript.setAttribute('data-bot-name', 'TradeCall Receptionist');
    widgetScript.setAttribute('data-theme-color', '#172531');
    widgetScript.setAttribute('data-component-color', '#f4b942');
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
      setLiveMessage('Microphone ready. The TradeCall receptionist is opening.');
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

  function init() {
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

    loadRetellWidget();
    startNudgeCycle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

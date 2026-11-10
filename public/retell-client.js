const retellSdkPromise = import('https://esm.sh/retell-client-js-sdk@3.0.2?bundle');

(function () {
  'use strict';

  const config = window.TRADECALL_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const launcher = $('assistant-launcher');
  const panel = $('assistant-panel');
  const closeButton = $('assistant-panel-close');
  const startButton = $('assistant-start');
  const activeControls = $('assistant-active-controls');
  const muteButton = $('assistant-mute');
  const endButton = $('assistant-end');
  const statusNode = $('assistant-status');
  const errorNode = $('assistant-error');
  const orb = $('assistant-orb');
  const nudge = $('assistant-nudge');
  const demoStartButton = $('mic-start');

  let RetellClientConstructor = null;
  let retellClient = null;
  let activeCall = null;
  let muted = false;
  let nudgeTimer = null;
  let nudgeDismissed = false;
  let lastCallFailed = false;

  if (!launcher || !panel || !startButton || !statusNode) return;

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setError(message) {
    errorNode.textContent = message;
    errorNode.hidden = !message;
  }

  function phoneFallback() {
    const phone = String(config.phone || '').trim();
    return phone ? ' You can also call us at ' + phone + '.' : ' You can also book a discovery call with our team.';
  }

  function friendlyError(error) {
    const name = String(error && error.name || '').toLowerCase();
    const message = String(error && (error.message || error) || '').toLowerCase();
    if (name.includes('notallowed') || name.includes('security') || /permission denied|not allowed|microphone permission|mic.*denied|permission.*blocked/.test(message)) {
      return 'Microphone access was blocked. Allow microphone access in your browser settings, then try again.' + phoneFallback();
    }
    if (name.includes('notfound') || /no device|device not found|no microphone|audio input.*not found/.test(message)) {
      return 'No microphone was found. Connect a microphone and try again.' + phoneFallback();
    }
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      return 'Voice calls need a secure HTTPS connection. Open the secure website address and try again.' + phoneFallback();
    }
    if (/public key|domain|unauthorized|forbidden|401|403|agent.*not found/.test(message)) {
      return 'The voice assistant could not connect. Please check that this website domain is allowed for the Retell public key and that the agent ID is correct.' + phoneFallback();
    }
    return 'The call could not connect. Check your internet connection and microphone permissions, then try again.' + phoneFallback();
  }

  function isCallActive() {
    return !!activeCall && activeCall.status !== 'ended';
  }

  function renderState(state) {
    const connecting = state === 'connecting';
    const live = state === 'live';
    const active = connecting || live;

    startButton.hidden = active;
    startButton.disabled = connecting;
    activeControls.hidden = !live;
    launcher.classList.toggle('is-live', live);
    launcher.classList.toggle('is-connecting', connecting);
    orb.classList.toggle('is-live', live);
    orb.classList.toggle('is-speaking', false);

    if (state === 'idle') {
      setStatus('Ready when you are. Start a call to speak with the assistant.');
    } else if (connecting) {
      setStatus('Connecting to the TradeLine assistant…');
    } else if (live) {
      setStatus('You’re connected. Go ahead and speak naturally.');
    }
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (nudge) nudge.hidden = true;
    window.setTimeout(() => (isCallActive() ? endButton : startButton).focus(), 80);
  }

  function closePanel() {
    if (isCallActive()) {
      setStatus('Your call is still active. End the call before closing this panel.');
      return;
    }
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function showCallError(error, call) {
    if (call && activeCall && call !== activeCall) return;
    const session = call || activeCall;
    const message = friendlyError(error);

    // The SDK can emit non-fatal errors while a session is still live.
    // Keep the in-call controls available in that case.
    if (session && session.status === 'live') {
      setError(message);
      setStatus('A connection issue was reported. If you can still hear the assistant, continue; otherwise end the call and retry.');
      return;
    }

    lastCallFailed = true;
    if (session && session.status !== 'ended') {
      try { Promise.resolve(session.end()).catch(function () {}); } catch (ignored) {}
    }
    if (session === activeCall || !call) activeCall = null;
    setError(message);
    setStatus('We couldn’t start the call.');
    activeControls.hidden = true;
    startButton.hidden = false;
    startButton.disabled = false;
    launcher.classList.remove('is-live', 'is-connecting');
    orb.classList.remove('is-live', 'is-speaking');
    muted = false;
    muteButton.setAttribute('aria-pressed', 'false');
    muteButton.textContent = 'Mute microphone';
  }

  function finishCall(message) {
    activeCall = null;
    muted = false;
    lastCallFailed = false;
    renderState('idle');
    setStatus(message || 'Call ended. Thanks for trying the TradeLine assistant.');
    setError('');
    muteButton.setAttribute('aria-pressed', 'false');
    muteButton.textContent = 'Mute microphone';
  }

  async function startCall() {
    openPanel();
    setError('');
    lastCallFailed = false;

    if (!config.retellPublicKey || !config.retellAgentId) {
      showCallError(new Error('Missing Retell public key or agent ID.'));
      setError('The live demo is not configured yet. Please contact TradeLine Agency or book a discovery call.' + phoneFallback());
      return;
    }

    if (!window.isSecureContext && location.hostname !== 'localhost') {
      showCallError(new Error('A secure HTTPS connection is required.'));
      return;
    }

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      showCallError(new Error('Microphone access is not supported in this browser.'));
      return;
    }

    if (isCallActive()) return;

    renderState('connecting');
    startButton.hidden = true;
    startButton.disabled = true;
    setStatus('Connecting to the TradeLine assistant… Your browser may ask for microphone access.');

    try {
      if (!RetellClientConstructor) throw new Error('The Retell voice SDK is still loading. Please try again in a moment.');
      retellClient = retellClient || new RetellClientConstructor({ key: config.retellPublicKey });
      const call = retellClient.createWebCall({
        agent_id: config.retellAgentId,
        hooks: {
          onStatus: (status) => {
            if (activeCall !== call) return;
            if (status === 'connecting') renderState('connecting');
            if (status === 'live') renderState('live');
            if (status === 'ended' && !lastCallFailed) finishCall('Call ended. Thanks for trying the TradeLine assistant.');
          },
          onAgentStartTalking: () => {
            if (activeCall !== call) return;
            orb.classList.add('is-speaking');
            setStatus('TradeLine is speaking…');
          },
          onAgentStopTalking: () => {
            if (activeCall !== call) return;
            orb.classList.remove('is-speaking');
            if (call.status === 'live') setStatus('You’re connected. Go ahead and speak naturally.');
          },
          onEnd: () => {
            if (activeCall === call && !lastCallFailed) finishCall('Call ended. Thanks for trying the TradeLine assistant.');
          },
          onError: (error) => {
            if (activeCall === call) showCallError(error, call);
          }
        }
      });
      activeCall = call;
      await call.ready;
      if (activeCall === call && call.status === 'live') renderState('live');
    } catch (error) {
      showCallError(error, activeCall);
    }
  }

  function toggleMute() {
    if (!isCallActive() || !activeCall || activeCall.status !== 'live') return;
    try {
      if (muted) {
        activeCall.unmute();
        muted = false;
        muteButton.textContent = 'Mute microphone';
        muteButton.setAttribute('aria-pressed', 'false');
        setStatus('Microphone on. You’re connected.');
      } else {
        activeCall.mute();
        muted = true;
        muteButton.textContent = 'Unmute microphone';
        muteButton.setAttribute('aria-pressed', 'true');
        setStatus('Microphone muted. Unmute when you’re ready to speak.');
      }
    } catch (error) {
      setError('We couldn’t change your microphone setting. Please try again.');
    }
  }

  async function endCall() {
    if (!activeCall) return;
    const call = activeCall;
    endButton.disabled = true;
    try {
      await call.end();
    } catch (error) {
      setError('The call could not be ended cleanly. You can close this page to disconnect.');
    } finally {
      if (activeCall === call) finishCall('Call ended. Thanks for trying the TradeLine assistant.');
      endButton.disabled = false;
    }
  }

  function startNudgeCycle() {
    if (!nudge) return;
    function showNudge() {
      if (nudgeDismissed || !panel.hidden) return;
      nudge.hidden = false;
      nudgeTimer = window.setTimeout(() => {
        nudge.hidden = true;
        nudgeTimer = window.setTimeout(showNudge, 5000);
      }, 5000);
    }
    nudgeTimer = window.setTimeout(showNudge, 5000);
    const dismiss = $('nudge-close');
    if (dismiss) dismiss.addEventListener('click', (event) => {
      event.stopPropagation();
      nudgeDismissed = true;
      nudge.hidden = true;
      if (nudgeTimer) window.clearTimeout(nudgeTimer);
    });
    nudge.addEventListener('click', (event) => {
      if (event.target.closest('#nudge-close')) return;
      openPanel();
    });
  }

  launcher.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeButton.addEventListener('click', closePanel);
  startButton.addEventListener('click', startCall);
  muteButton.addEventListener('click', toggleMute);
  endButton.addEventListener('click', endCall);

  document.querySelectorAll('.js-talk').forEach((button) => button.addEventListener('click', openPanel));
  if (demoStartButton) demoStartButton.addEventListener('click', startCall);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });

  window.TradeLineAssistant = { open: openPanel, start: startCall };
  renderState('idle');
  startButton.disabled = true;
  if (demoStartButton) demoStartButton.disabled = true;
  setStatus('Preparing your live voice assistant…');
  retellSdkPromise.then((sdk) => {
    if (!sdk || typeof sdk.RetellClient !== 'function') throw new Error('RetellClient export was not found in the SDK bundle.');
    RetellClientConstructor = sdk.RetellClient;
    startButton.disabled = false;
    if (demoStartButton) demoStartButton.disabled = false;
    if (!isCallActive()) setStatus('Ready when you are. Start a call to speak with the assistant.');
  }).catch(() => {
    const message = 'The voice assistant could not load. Check your internet connection and refresh the page to try again.';
    setStatus('The live assistant is temporarily unavailable.');
    setError(message);
    startButton.disabled = true;
    if (demoStartButton) demoStartButton.disabled = true;
  });
  startNudgeCycle();
})();

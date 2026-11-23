// Deck page: one slide at a time. ← / → (and swipe) move between slides;
// "Present" goes full screen.
(() => {
  const deck = document.querySelector('[data-deck]');
  const stage = deck.querySelector('.stage');
  const frames = [...deck.querySelectorAll('.slide-frame')];
  const counter = deck.querySelector('[data-counter]');
  const prevBtn = deck.querySelector('[data-prev]');
  const nextBtn = deck.querySelector('[data-next]');
  let current = -1;
  let idleTimer;

  // ?preview: a bare slide for the presenter view's thumbnails. No chrome, no keys, no syncing.
  const preview = new URLSearchParams(location.search).has('preview');
  if (preview) document.documentElement.classList.add('is-preview');

  // Presenter view sync. The deck and presenter/ talk over a BroadcastChannel named after the
  // deck's path; so does a walkthrough page opened over the deck.
  const channel = !preview && 'BroadcastChannel' in window ? new BroadcastChannel(`deck-presenter:${location.pathname}`) : null;
  const layerFrame = () => document.querySelector('.hd-layer iframe');
  const announce = () => channel?.postMessage({
    type: 'slide', index: current, total: frames.length, fullscreen: Boolean(document.fullscreenElement),
  });

  const eager = (frame) => frame?.querySelectorAll('img[loading]').forEach((img) => img.removeAttribute('loading'));

  function show(i, { updateHash = true } = {}) {
    const next = Math.max(0, Math.min(frames.length - 1, i));
    if (next === current) return;
    current = next;
    frames.forEach((f, n) => { f.hidden = n !== current; });
    eager(frames[current]);
    eager(frames[current + 1]);
    eager(frames[current - 1]);
    counter.textContent = `${current + 1} / ${frames.length}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === frames.length - 1;
    if (updateHash) history.replaceState(null, '', `#${current + 1}`);
    announce();
    // Lets live components on the slide restore their starting state.
    frames[current].dispatchEvent(new CustomEvent('deck-slide-shown', { bubbles: true }));
  }

  function fromHash() {
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isFinite(n) ? n - 1 : 0;
  }

  function wake() {
    deck.classList.remove('idle');
    clearTimeout(idleTimer);
    if (document.fullscreenElement) idleTimer = setTimeout(() => deck.classList.add('idle'), 2500);
  }

  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));

  document.querySelector('[data-present]').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else deck.requestFullscreen?.().catch(() => {});
  });
  // The click that starts full screen shouldn't also count as a click on the slide.
  let fullscreenAt = 0;
  document.addEventListener('fullscreenchange', () => { fullscreenAt = Date.now(); wake(); });
  deck.addEventListener('mousemove', wake);

  // In full screen, clicking the slide advances (left third goes back).
  stage.addEventListener('click', (e) => {
    if (!document.fullscreenElement || Date.now() - fullscreenAt < 500 || e.target.closest('a, button, [role="menu"], uds-menu, uds-overflow-menu')) return;
    const r = stage.getBoundingClientRect();
    show(current + (e.clientX - r.left < r.width / 3 ? -1 : 1));
  });

  // Ignore keys while the user is typing. Use isContentEditable rather than a
  // [contenteditable] selector: browser extensions often add
  // contenteditable="false" to <body>, which a selector would match.
  const isTyping = (t) =>
    t instanceof Element && (t.isContentEditable || t.matches('input, textarea, select'));

  if (!preview) document.addEventListener('keydown', (e) => {
    // Interactive components on a slide (e.g. a menu) handle their own keys
    // and mark them handled.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
    const k = e.key;
    // Space on a focused button or link activates it; don't also change slide.
    if (k === ' ' && e.target instanceof Element && e.target.closest('button, a, [role^="menuitem"]')) return;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') show(current + 1);
    else if (k === 'ArrowLeft' || k === 'PageUp') show(current - 1);
    else if (k === 'Home') show(0);
    else if (k === 'End') show(frames.length - 1);
    else if (k === 'p' || k === 'f') document.querySelector('[data-present]').click();
    else return;
    e.preventDefault();
    wake();
  });

  // Swipe on touch screens.
  let touch = null;
  stage.addEventListener('touchstart', (e) => {
    touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  });

  window.addEventListener('hashchange', () => show(fromHash(), { updateHash: false }));
  show(fromHash(), { updateHash: false });

  // Full screen needs a click or key press in this window, so the presenter view can't start it from
  // its own window. When it's blocked, the deck shows one big prompt: a single click on the projector
  // window starts presenting.
  let prompt = null;
  const hidePrompt = () => { prompt?.remove(); prompt = null; };
  const goFullscreen = () => deck.requestFullscreen?.().then(hidePrompt, () => askToPresent());
  function askToPresent(reason) {
    if (reason === 'blocked') {
      // The browser blocked the notes window: say so, and let the next click try again.
      hidePrompt();
      prompt = document.createElement('button');
      prompt.type = 'button';
      prompt.className = 'present-prompt';
      prompt.innerHTML = '<b>Click to open the presenter view</b><span>The browser blocked the window. If this keeps happening, allow pop-ups for this site. <kbd>Esc</kbd> to dismiss.</span>';
      prompt.addEventListener('click', (e) => { e.stopPropagation(); hidePrompt(); openPresenter(); });
      prompt.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hidePrompt(); }
      });
      deck.append(prompt);
      prompt.focus({ preventScroll: true });
      return;
    }
    if (preview || document.fullscreenElement || prompt) return;
    prompt = document.createElement('button');
    prompt.type = 'button';
    prompt.className = 'present-prompt';
    prompt.innerHTML = '<b>Click to present full screen</b><span>The presenter view is open in another window. <kbd>Esc</kbd> to dismiss.</span>';
    prompt.addEventListener('click', (e) => { e.stopPropagation(); goFullscreen(); });
    prompt.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hidePrompt(); }
    });
    deck.append(prompt);
    prompt.focus({ preventScroll: true });
  }
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) hidePrompt(); announce(); });

  // Presenter view: N (or the button) opens it in its own window, and puts the deck in full screen
  // when the browser allows it.
  // The notes window comes first: it can't be retried from the deck, while full screen can (the prompt).
  // Browsers let one click do only one of the two, so full screen may need a second click.
  const openPresenter = () => {
    const win = window.open('presenter/', `presenter:${location.pathname}`, 'popup,width=1280,height=800');
    if (!win) { askToPresent('blocked'); return; }
    if (!document.fullscreenElement) goFullscreen();
  };
  document.querySelector('[data-presenter]')?.addEventListener('click', openPresenter);
  if (!preview && document.querySelector('[data-presenter]')) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'n' || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      e.preventDefault();
      openPresenter();
    });
  }

  // Keys pressed in the presenter view drive the deck, or the walkthrough when one is open.
  channel?.addEventListener('message', ({ data }) => {
    if (data?.type === 'hello') { announce(); askToPresent(); }
    else if (data?.type === 'present') { if (!document.fullscreenElement) askToPresent(); }
    else if (data?.type === 'goto') show(data.index);
    else if (data?.type === 'key') {
      const frame = layerFrame();
      if (frame) frame.contentWindow.postMessage({ type: 'presenter-key', key: data.key }, location.origin);
      else if (data.key === 'ArrowRight') show(current + 1);
      else if (data.key === 'ArrowLeft') show(current - 1);
      else if (data.key === 'Enter') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    }
  });
})();

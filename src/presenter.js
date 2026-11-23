// Presenter view: dist/<slug>/presenter/. Open it from the deck with N (or the Presenter view
// button), keep the deck on the projector and this window on your laptop.
//
// Shows the current slide's notes and speaker, previews of this slide and the next, a talk timer
// and whether you're ahead or behind the per-slide time budget (data-minutes on each slide's notes).
// Arrow keys, Space, Enter, 1–4 and Esc here drive the deck, or the walkthrough page when one is
// open over it. The deck, this view and the walkthrough talk over a BroadcastChannel.
(() => {
  const data = JSON.parse(document.getElementById('deck-notes').textContent);
  const slides = data.slides;
  const deckPath = new URL('../', location.href).pathname;
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(`deck-presenter:${deckPath}`) : null;
  const planned = slides.reduce((t, s) => t + s.minutes, 0);
  const slot = data.minutes || 0;

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clock = (sec) => {
    const s = Math.max(0, Math.round(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  document.body.insertAdjacentHTML('beforeend', `
    <header class="pv-bar">
      <div class="pv-title"><b>Presenter view</b><span>${esc(data.title)}</span></div>
      <div class="pv-timer">
        <span class="pv-elapsed" data-elapsed>0:00</span>
        <span class="pv-of">of ${clock((slot || planned) * 60)}</span>
        <span class="pv-pace" data-pace>Not started</span>
        <button type="button" data-timer>Start timer</button>
        <button type="button" data-reset aria-label="Reset the timer">Reset</button>
      </div>
    </header>
    <main class="pv-main">
      <section class="pv-notes" aria-live="polite">
        <p class="pv-eyebrow" data-eyebrow></p>
        <div class="pv-handoff" data-handoff hidden></div>
        <div class="pv-text" data-text></div>
      </section>
      <aside class="pv-previews">
        <figure class="pv-preview">
          <figcaption data-now-cap>Now</figcaption>
          <div class="pv-frame"><iframe data-now title="Current slide" tabindex="-1"></iframe><span class="pv-flag" data-story-flag hidden></span></div>
        </figure>
        <figure class="pv-preview is-next">
          <figcaption data-next-cap>Next</figcaption>
          <div class="pv-frame"><iframe data-next title="Next slide" tabindex="-1"></iframe><span class="pv-end" data-end hidden>End of the deck</span></div>
        </figure>
      </aside>
    </main>
    <footer class="pv-foot">
      <button type="button" data-go="ArrowLeft">‹ Previous</button>
      <button type="button" class="pv-primary" data-go="ArrowRight">Next ›</button>
      <span class="pv-deck" data-deck-state hidden></span>
      <button type="button" data-present hidden>Show “Click to present” on the deck</button>
      <span class="pv-status" data-status></span>
      <span class="pv-hint"><kbd>←</kbd> <kbd>→</kbd> move · <kbd>Enter</kbd> open the story · <kbd>T</kbd> timer</span>
    </footer>`);

  const $ = (sel) => document.querySelector(sel);
  const nowFrame = $('[data-now]');
  const nextFrame = $('[data-next]');
  let current = 0;
  let story = null; // { page, of, title, speaker, html } while a walkthrough page is open
  let connected = false;
  let deckFullscreen = false;

  // ---------------------------------------------------------------- timer
  // Kept in sessionStorage so reloading this window doesn't lose it.
  const load = () => { try { return JSON.parse(sessionStorage.getItem('pv-timer')) || {}; } catch { return {}; } };
  const save = (t) => { try { sessionStorage.setItem('pv-timer', JSON.stringify(t)); } catch { /* private mode */ } };
  let timer = { start: null, banked: 0, ...load() }; // start: ms timestamp while running; banked: seconds before it
  const elapsed = () => timer.banked + (timer.start ? (Date.now() - timer.start) / 1000 : 0);
  const running = () => Boolean(timer.start);
  function toggleTimer() {
    timer = running() ? { start: null, banked: elapsed() } : { start: Date.now(), banked: timer.banked };
    save(timer);
    tick();
  }
  function resetTimer() {
    timer = { start: null, banked: 0 };
    save(timer);
    tick();
  }
  function tick() {
    const e = elapsed();
    $('[data-elapsed]').textContent = clock(e);
    $('[data-timer]').textContent = running() ? 'Pause' : e ? 'Resume' : 'Start timer';
    const pace = $('[data-pace]');
    if (!e) { pace.textContent = 'Not started'; pace.dataset.state = ''; return; }
    // Budget window for the current slide: the planned time before it, to the end of it.
    const before = slides.slice(0, current).reduce((t, s) => t + s.minutes, 0) * 60;
    const after = before + slides[current].minutes * 60;
    if (e > after + 15) { pace.textContent = `${clock(e - after)} behind`; pace.dataset.state = 'behind'; }
    else if (e < before - 15) { pace.textContent = `${clock(before - e)} ahead`; pace.dataset.state = 'ahead'; }
    else { pace.textContent = 'On time'; pace.dataset.state = 'ok'; }
  }
  setInterval(tick, 1000);
  $('[data-timer]').addEventListener('click', toggleTimer);
  $('[data-reset]').addEventListener('click', resetTimer);

  // ---------------------------------------------------------------- render
  const preview = (frame, index) => {
    const url = `../?preview#${index + 1}`;
    if (frame.getAttribute('src') !== url) frame.setAttribute('src', url);
  };

  function render() {
    const s = slides[current];
    const next = slides[current + 1];
    const who = (x) => x?.speaker || '';
    if (story) {
      $('[data-eyebrow]').innerHTML = `<span class="pv-chip">${esc(story.speaker || who(s))}</span> Story · page ${story.page} of ${story.of} · ${esc(story.title)}`;
      $('[data-text]').innerHTML = story.html || '<p class="pv-empty">No notes for this page.</p>';
    } else {
      $('[data-eyebrow]').innerHTML = `<span class="pv-chip">${esc(who(s) || 'No speaker set')}</span> Slide ${current + 1} of ${slides.length}${s.minutes ? ` · about ${s.minutes} min` : ''}`;
      $('[data-text]').innerHTML = s.html || '<p class="pv-empty">No notes for this slide.</p>';
    }
    // A handoff warning when the next slide has a different speaker.
    const handoff = $('[data-handoff]');
    const nextWho = who(next);
    handoff.hidden = !(next && nextWho && who(s) && nextWho !== who(s)) || Boolean(story && story.page < story.of);
    handoff.textContent = handoff.hidden ? '' : `Next slide: ${nextWho} takes over`;

    preview(nowFrame, current);
    $('[data-now-cap]').textContent = `Now · slide ${current + 1}`;
    $('[data-story-flag]').hidden = !story;
    $('[data-story-flag]').textContent = story ? `Story open · page ${story.page} of ${story.of}` : '';
    $('[data-end]').hidden = Boolean(next);
    nextFrame.hidden = !next;
    if (next) preview(nextFrame, current + 1);
    $('[data-next-cap]').textContent = next ? `Next · slide ${current + 2}${nextWho ? ` · ${nextWho}` : ''}` : 'Next';
    const deckState = $('[data-deck-state]');
    deckState.hidden = !connected;
    deckState.dataset.state = deckFullscreen ? 'on' : 'off';
    deckState.textContent = deckFullscreen ? 'Deck is full screen' : 'Deck isn’t full screen: click the deck window once';
    $('[data-present]').hidden = !connected || deckFullscreen;
    $('[data-status]').textContent = connected ? '' : 'Waiting for the deck: open it in another window, or keep stepping through the notes here.';
    tick();
  }

  // ---------------------------------------------------------------- sync
  channel?.addEventListener('message', ({ data: m }) => {
    if (!m) return;
    if (m.type === 'slide') {
      connected = true;
      deckFullscreen = Boolean(m.fullscreen);
      if (m.index !== current && !running() && !elapsed() && m.index > 0) toggleTimer(); // start on the first move
      current = Math.max(0, Math.min(slides.length - 1, m.index));
      story = null;
    } else if (m.type === 'story') { connected = true; story = m; }
    else if (m.type === 'story-end') story = null;
    else return;
    render();
  });
  channel?.postMessage({ type: 'hello' });

  function send(key) {
    if (connected && channel) channel.postMessage({ type: 'key', key });
    else if (key === 'ArrowRight') { current = Math.min(slides.length - 1, current + 1); render(); }
    else if (key === 'ArrowLeft') { current = Math.max(0, current - 1); render(); }
  }
  $('[data-present]').addEventListener('click', () => channel?.postMessage({ type: 'present' }));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => send(b.dataset.go)));
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === ' ' && e.target.closest?.('button')) return;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') send('ArrowRight');
    else if (k === 'ArrowLeft' || k === 'PageUp') send('ArrowLeft');
    else if (k === 'Enter' || k === 'Escape' || /^[1-4]$/.test(k)) send(k);
    else if (k === 'Home' || k === 'End') {
      const index = k === 'Home' ? 0 : slides.length - 1;
      if (connected) channel.postMessage({ type: 'goto', index }); else { current = index; render(); }
    } else if (k === 't' || k === 'T') toggleTimer();
    else return;
    e.preventDefault();
  });

  render();
})();

// Live pieces for HTML-authored decks.
//   [data-terminal="<script>"]  a terminal that plays a scripted session and loops
//   [data-interview="tree|files"] a setup interview you can answer, showing either
//                                the decision tree or the files each answer scaffolds
//   [data-walkthrough="<page>/"] a button that opens a page over the deck
//   .hd-diagram > script[type="text/x-mermaid"]  a Mermaid diagram drawn in the Deva Kit colours
(() => {
  const scriptUrl = document.currentScript?.src || location.href;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Run `start` while the element's slide is on screen and `stop` when it is hidden.
  // Outside a deck (the landing-page thumbnail) it gets the still version.
  function whileShown(node, start, stop, still) {
    const frame = node.closest('.slide-frame');
    if (!frame) { still(); return; }
    frame.addEventListener('deck-slide-shown', start);
    new MutationObserver(() => { if (frame.hidden) stop(); }).observe(frame, { attributes: true, attributeFilter: ['hidden'] });
    if (!frame.hidden) start();
  }

  // ---------------------------------------------------------------- terminal
  // The two fictional brands in the example (also set in pages/decision-tree/).
  const BRAND_A = 'Brand A';
  const BRAND_B = 'Brand B';
  const ME = '~ % ';
  const PROJECT = '~/product-page % ';
  const SCRIPTS = {
    // The starter CLI's setup interview, from npx to "Done".
    interview: {
      title: 'Terminal — npx create-ds-prototype',
      label: `Animated terminal: create-ds-prototype asks what you are building (a prototype), the project name, `
        + `which brand you work on (${BRAND_A}), and the starting template (the product page). It installs the latest `
        + 'design system and brand theme, sets up Claude Code with the design system context and the update check, then '
        + 'creates the project repo and deploys a shareable preview URL.',
      steps: [
        { cmd: 'npx create-ds-prototype', prompt: ME },
        { out: '' },
        { out: '  <span class="t-accent t-b">create-ds-prototype</span>' },
        { out: '  <span class="t-dim">Prototype with your design system</span>', wait: 500 },
        { out: '' },
        { select: 'What are you building?', options: [
          ['Prototype', 'Test an idea · deploys to a preview URL'],
          ['App', 'Headed to production · tests and CI included'],
        ], path: [] },
        { input: 'Project name', value: 'product-page' },
        { select: 'What brand do you work on?', options: [
          [BRAND_A, 'Coffee supply · theme and templates'],
          [BRAND_B, 'Bar supply · theme and templates'],
        ], path: [] },
        { select: 'Starting template', options: [
          ['Storefront', `${BRAND_A}: header, navigation and a product grid`],
          ['Product page', `${BRAND_A}: gallery, price and add to cart`],
          ['Checkout', `${BRAND_A}: cart, shipping and payment steps`],
          ['Blank page', `${BRAND_A}: the store header and nothing else`],
        ], path: [1] },
        { out: '' },
        { spin: `Copying the ${BRAND_A} product page template…`, done: 'Product page template copied' },
        { spin: 'Installing @your-ds/tokens and @your-ds/components…', done: 'Design system installed', ms: 1400 },
        { out: `<span class="t-ok">✔</span> ${BRAND_A} theme applied`, wait: 220 },
        { out: '<span class="t-ok">✔</span> Preview deploy configured', wait: 220 },
        { out: '<span class="t-ok">✔</span> CLAUDE.md written <span class="t-dim">(design system context)</span>', wait: 220 },
        { out: '<span class="t-ok">✔</span> Guardrail hook wired <span class="t-dim">(PreToolUse)</span>', wait: 220 },
        { out: '<span class="t-ok">✔</span> Update check wired <span class="t-dim">(SessionStart)</span>', wait: 220 },
        { spin: 'Creating the project repo…', done: 'Repo created · your-org/product-page' },
        { spin: 'Deploying a preview…', done: 'Preview ready · https://preview.your-org.example/product-page', ms: 1300 },
        { out: '' },
        { out: '<span class="t-ok t-b">Done!</span> Share the preview link, or start building:' },
        { out: '  <span class="t-accent">cd product-page</span>' },
        { out: '  <span class="t-accent">npm run dev</span>' },
        { out: '' },
        { prompt: ME, end: true },
      ],
    },

    // An agent tries to write off-system code and the PreToolUse hook blocks it.
    guardrail: {
      title: 'Terminal — Claude Code in product-page',
      label: 'Animated agent session: asked to add a customer reviews section, Claude starts writing its own ReviewCard '
        + 'component with a raw hex colour. The guardrail hook blocks the new file: the design system already has Card, '
        + 'and the colour should be a token. Claude looks up the catalog, then builds the section with the design '
        + 'system Heading and Card, and the edit passes.',
      steps: [
        { cmd: 'Add a customer reviews section under the product details', prompt: '❯ ' },
        { out: '', wait: 600 },
        { out: '<span class="t-b">●</span> I\'ll make a ReviewCard component, then list the reviews.', wait: 700 },
        { out: '<span class="t-b">●</span> <span class="t-b">Write</span> src/components/ReviewCard.tsx', wait: 300 },
        { out: '  <span class="t-add">+ export function ReviewCard({ review }) {</span>', wait: 150 },
        { out: '  <span class="t-add">+   return &lt;div style={{ border: "1px solid #D9C9B6" }}&gt;</span>', wait: 900 },
        { spin: 'Running PreToolUse hook: ds-guard', done: '', ms: 900, quiet: true },
        { out: '  <span class="t-err">⎿ Blocked by ds-guard</span>', wait: 200 },
        { out: '    <span class="t-err">✖</span> New component ReviewCard. Use &lt;Card&gt; from @your-ds/components', wait: 200 },
        { out: '    <span class="t-err">✖</span> Raw colour #D9C9B6. Use a token: var(--ds-color-border)', wait: 1400 },
        { out: '' },
        { out: '<span class="t-b">●</span> I\'ll check the catalog before writing UI.', wait: 500 },
        { out: '<span class="t-b">●</span> <span class="t-b">Bash</span> npm run ds:find "review"', wait: 300 },
        { out: '  <span class="t-dim">⎿ Card · Heading · Text · Avatar</span>', wait: 900 },
        { out: '<span class="t-b">●</span> <span class="t-b">Edit</span> src/templates/ProductPage.tsx', wait: 300 },
        { out: '  <span class="t-add">+ &lt;Heading level={3}&gt;Customer reviews&lt;/Heading&gt;</span>', wait: 300 },
        { out: '  <span class="t-add">+ {reviews.map((r) =&gt; &lt;Card key={r.id}&gt;{r.text}&lt;/Card&gt;)}</span>', wait: 900 },
        { spin: 'Running PreToolUse hook: ds-guard', done: '', ms: 700, quiet: true },
        { out: '  <span class="t-ok">⎿ ✔ Passed ds-guard</span>', wait: 300 },
        { out: '' },
        { prompt: '❯ ', end: true },
      ],
    },

    // A new agent session starts and the SessionStart hook reports what is out of date.
    'session-start': {
      title: 'Terminal — Claude Code in product-page',
      label: 'Animated agent session: when the session starts, the update check finds a newer design system '
        + 'release with a Rating component and a newer scaffold template. Asked to show each review\'s star rating, '
        + 'the agent updates the package first and uses the Rating component.',
      steps: [
        { cmd: 'claude', prompt: PROJECT },
        { out: '' },
        { spin: 'SessionStart hook: ds-check', done: 'ds-check added context for the agent', ms: 1100 },
        { out: '  <span class="t-warn">!</span> @your-ds/components <span class="t-b">4.2.0</span> installed · <span class="t-b">4.4.0</span> available', wait: 250 },
        { out: '    <span class="t-dim">New since 4.2: Rating, QuantityStepper</span>', wait: 250 },
        { out: '  <span class="t-warn">!</span> Scaffold template <span class="t-b">1.3</span> · <span class="t-b">1.5</span> available', wait: 250 },
        { out: '    <span class="t-dim">Update with: npx create-ds-prototype update</span>', wait: 1200 },
        { out: '' },
        { cmd: 'Show the star rating on each review', prompt: '❯ ' },
        { out: '', wait: 600 },
        { out: '<span class="t-b">●</span> Version 4.4.0 adds a Rating component, so I\'ll update the package first.', wait: 700 },
        { out: '<span class="t-b">●</span> <span class="t-b">Bash</span> npm install @your-ds/components@4.4.0', wait: 300 },
        { spin: 'Installing…', done: 'Updated @your-ds/components to 4.4.0', ms: 1200 },
        { out: '<span class="t-b">●</span> <span class="t-b">Edit</span> src/templates/ProductPage.tsx', wait: 300 },
        { out: '  <span class="t-add">+ &lt;Rating value={r.rating} /&gt;</span>', wait: 300 },
        { out: '  <span class="t-ok">⎿ ✔ Passed ds-guard</span>', wait: 300 },
        { out: '' },
        { prompt: '❯ ', end: true },
      ],
    },
  };

  function terminal(host) {
    const script = SCRIPTS[host.dataset.terminal];
    if (!script) return;
    host.classList.add('hd-term');
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', script.label);
    host.innerHTML = `
      <div class="hd-term__bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(script.title)}</span></div>
      <div class="hd-term__body" aria-hidden="true"><div class="hd-term__lines"></div></div>`;
    const linesEl = host.querySelector('.hd-term__lines');
    const body = host.querySelector('.hd-term__body');
    new ResizeObserver(() => { body.scrollTop = body.scrollHeight; }).observe(linesEl);
    const CURSOR = '<span class="t-cursor"></span>';

    let run = 0; // bumping this cancels the session in progress
    const sleep = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(new Error('stop'))), ms));
    const add = (html = '') => { const d = document.createElement('div'); d.innerHTML = html || '&nbsp;'; linesEl.append(d); return d; };

    async function play(id, fast) {
      const t = (ms) => (fast ? Promise.resolve() : sleep(ms, id));
      linesEl.textContent = '';
      for (const s of script.steps) {
        if (id !== run) return;
        while (linesEl.children.length > 80) linesEl.firstChild.remove();
        if ('out' in s) { add(s.out); await t(s.wait ?? 90); }
        else if (s.cmd) {
          const line = add(esc(s.prompt) + CURSOR);
          await t(700);
          for (let i = 1; i <= s.cmd.length; i += 1) { line.innerHTML = esc(s.prompt) + esc(s.cmd.slice(0, i)) + CURSOR; await t(40 + Math.random() * 50); }
          await t(450);
          line.innerHTML = esc(s.prompt) + esc(s.cmd);
          await t(400);
        } else if (s.select) {
          // An inquirer-style list: the cursor moves along `path`, then the
          // prompt collapses into its answer.
          const block = add();
          let at = 0;
          const draw = () => {
            const desc = s.options[at][1];
            block.innerHTML = [`<span class="t-accent">?</span> <span class="t-b">${s.select}</span>`,
              ...s.options.map(([o], i) => (i === at ? `<span class="t-accent">❯ ${esc(o)}</span>` : `  ${esc(o)}`)),
              desc ? `<span class="t-dim">  ${esc(desc)}</span>` : null].filter((x) => x !== null).join('\n');
          };
          draw();
          await t(1300);
          for (const target of s.path) {
            while (at !== target) { at += target > at ? 1 : -1; draw(); await t(380); }
            await t(700);
          }
          await t(350);
          const note = s.note ? ` <span class="t-dim">· ${esc(s.note)}</span>` : '';
          block.innerHTML = `<span class="t-ok">✔</span> <span class="t-b">${s.select}</span> <span class="t-accent">${esc(s.options[at][0])}</span>${note}`;
          await t(300);
        } else if (s.input) {
          const line = add();
          const head = `<span class="t-accent">?</span> <span class="t-b">${s.input}</span> `;
          line.innerHTML = head + CURSOR;
          await t(600);
          for (let i = 1; i <= s.value.length; i += 1) { line.innerHTML = head + esc(s.value.slice(0, i)) + CURSOR; await t(45 + Math.random() * 55); }
          await t(500);
          line.innerHTML = `<span class="t-ok">✔</span> <span class="t-b">${s.input}</span> <span class="t-accent">${esc(s.value)}</span>`;
          await t(300);
        } else if (s.spin) {
          const line = add();
          const frames = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
          const end = s.ms ?? 1000;
          for (let n = 0; n * 80 < end && !fast; n += 1) { line.innerHTML = `  <span class="t-accent">${frames[n % frames.length]}</span> <span class="t-dim">${esc(s.spin)}</span>`; await t(80); }
          if (s.quiet) line.remove();
          else line.innerHTML = `<span class="t-ok">✔</span> ${esc(s.done)}`;
          await t(200);
        } else if (s.end) {
          add(esc(s.prompt) + CURSOR);
        }
      }
      if (fast) return;
      await t(6000);
      play(id, false).catch(() => {}); // loop
    }

    whileShown(host,
      () => { run += 1; play(run, reduceMotion).catch(() => {}); },
      () => { run += 1; },
      () => { run += 1; play(run, true).catch(() => {}); });
  }

  // ---------------------------------------------------------------- interview
  // The starter CLI's interview as data. `when` gates a question on earlier
  // answers; `recommend` picks an option and says why. Each answer adds files.
  const BRANDS = { a: BRAND_A, b: BRAND_B };
  const QUESTIONS = [
    { id: 'build', q: 'What are you building?', options: [
      { v: 'prototype', l: 'Prototype' }, { v: 'app', l: 'App' }] },
    { id: 'brand', q: 'What brand do you work on?', options: [
      { v: 'a', l: BRAND_A }, { v: 'b', l: BRAND_B }] },
    // Gated on the brand: each brand only offers its own templates.
    { id: 'template', q: (a) => (a.brand ? `Starting template (${BRANDS[a.brand]})` : 'Starting template'),
      recommend: (a) => (a.build === 'app' ? ['storefront', "apps live inside the store's header and navigation"] : null),
      options: [{ v: 'storefront', l: 'Storefront' }, { v: 'product', l: 'Product page' }, { v: 'checkout', l: 'Checkout' }, { v: 'blank', l: 'Blank' }] },
  ];
  const qText = (q, a) => (typeof q.q === 'function' ? q.q(a) : q.q);

  // What gets scaffolded, as [path, reason] pairs.
  function filesFor(a) {
    const f = [['package.json', 'tokens and components installed'], ['src/main.tsx', 'imports the token CSS'],
      ['eslint.config.js', 'design system lint rules']];
    if (a.build === 'prototype') f.push(['.github/workflows/preview.yml', 'deploys a preview URL'], ['src/mocks/products.ts', 'mock products, prices and reviews']);
    if (a.build === 'app') f.push(['vitest.config.ts', 'unit tests'], ['.github/workflows/ci.yml', 'checks on every pull request']);
    if (a.brand) f.push([`src/theme/brand-${a.brand}.css`, `${BRANDS[a.brand]} tokens and fonts`]);
    const who = BRANDS[a.brand] || 'the brand';
    if (a.template) f.push(['src/templates/StoreHeader.tsx', `${who} logo, search, navigation and cart`]);
    if (a.template === 'storefront') f.push(['src/templates/Storefront.tsx', 'hero and product grid']);
    if (a.template === 'product') f.push(['src/templates/ProductPage.tsx', 'gallery, price and add to cart']);
    if (a.template === 'checkout') f.push(['src/templates/Checkout.tsx', 'cart, shipping and payment steps']);
    if (a.template === 'blank') f.push(['src/pages/Start.tsx', 'the store header and nothing else']);
    // Every project starts current and set up for Claude Code, our preferred agent.
    if (a.template) f.push(['CLAUDE.md', 'design system context for Claude'], ['.claude/settings.json', 'registers both hooks'],
      ['.claude/hooks/ds-guard.mjs', 'PreToolUse: blocks off-system code'], ['.claude/hooks/ds-check.mjs', 'SessionStart: checks for updates']);
    return f;
  }

  function interview(host) {
    const mode = host.dataset.interview;
    const answers = {};
    let before = null; // files from the previous draw
    host.classList.add('hd-iv');
    host.innerHTML = `<div class="hd-iv__qs"></div><div class="hd-iv__side"></div>`;
    const qs = host.querySelector('.hd-iv__qs');
    const side = host.querySelector('.hd-iv__side');

    const shown = (q) => !q.when || q.when(answers);
    const draw = (focusId) => {
      // Drop answers to questions that are no longer asked.
      for (const q of QUESTIONS) if (!shown(q)) delete answers[q.id];
      const open = QUESTIONS.filter(shown);
      const firstUnanswered = open.find((q) => !(q.id in answers));
      // Show answered questions plus the next one to answer.
      const visible = open.slice(0, firstUnanswered ? open.indexOf(firstUnanswered) + 1 : open.length);
      qs.innerHTML = visible.map((q) => {
        const [rec, why] = q.recommend?.(answers) || [];
        const text = qText(q, answers);
        return `<div class="hd-iv__q${q.id in answers ? ' is-done' : ''}" role="group" aria-label="${esc(text)}">
          <p class="hd-iv__qt"><span aria-hidden="true">?</span> ${esc(text)}</p>
          <div class="hd-iv__opts">${q.options.map((o) => `<button type="button" data-q="${q.id}" data-v="${o.v}"
            aria-pressed="${answers[q.id] === o.v}">${esc(o.l)}${o.v === rec ? '<span class="hd-iv__rec">Recommended</span>' : ''}</button>`).join('')}</div>
          ${why ? `<p class="hd-iv__why">${esc(why[0].toUpperCase() + why.slice(1))}</p>` : ''}
        </div>`;
      }).join('');
      if (!firstUnanswered) qs.insertAdjacentHTML('beforeend', '<p class="hd-iv__done"><span aria-hidden="true">✔</span> Ready to scaffold</p>');

      if (mode === 'tree') {
        side.innerHTML = `<p class="hd-iv__title">Decision tree</p><ol class="hd-iv__tree">${QUESTIONS.map((q) => {
          const on = shown(q);
          const ans = q.options.find((o) => o.v === answers[q.id]);
          const state = !on ? 'skip' : ans ? 'done' : q === firstUnanswered ? 'now' : 'later';
          const note = state === 'skip' ? `Skipped · ${q.why}` : state === 'done' ? ans.l : state === 'now' ? 'Asking now' : 'Coming up';
          return `<li class="is-${state}"><span>${esc(qText(q, answers))}</span><em>${esc(note)}</em></li>`;
        }).join('')}</ol>`;
      } else {
        const files = filesFor(answers);
        const now = new Set(files.map(([p]) => p));
        // Files the last answer added show why they're there (and flash, after the first draw).
        const first = !before;
        side.innerHTML = `<p class="hd-iv__title">product-page/ · ${files.length} files</p><ul class="hd-iv__files">${files.map(([p, r]) =>
          (first || !before.has(p) ? `<li class="is-new${first ? '' : ' is-flash'}"><code>${esc(p)}</code><span>${esc(r)}</span></li>` : `<li><code>${esc(p)}</code></li>`)).join('')}</ul>`;
        before = now;
      }
      if (focusId) host.querySelector(`[data-q="${focusId}"][aria-pressed="true"]`)?.focus({ preventScroll: true });
    };

    host.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-q]');
      if (!b) return;
      answers[b.dataset.q] = b.dataset.v;
      draw(b.dataset.q);
    });
    // Start part-way through so the slide reads at a glance.
    Object.assign(answers, { build: 'prototype', brand: 'a' });
    draw();
  }

  // ---------------------------------------------------------------- walkthrough
  // [data-walkthrough="<page>/"]: opens that page (e.g. Mermaid diagrams) in a layer
  // over the deck. The layer sits inside the deck element, so Present (full screen)
  // stays on. The page posts { type: 'walkthrough-close', finished } to close it;
  // finished moves on to the next slide.
  function openWalkthrough(btn) {
    if (document.querySelector('.hd-layer')) return;
    const frame = btn.closest('.slide-frame');
    const nextSlide = Number(frame?.dataset.index ?? 0) + 2;
    const layer = document.createElement('div');
    layer.className = 'hd-layer';
    const iframe = document.createElement('iframe');
    iframe.title = btn.textContent.trim();
    iframe.src = `${btn.dataset.walkthrough}?return=${nextSlide}`;
    layer.append(iframe);
    (btn.closest('[data-deck]') || document.body).append(layer);
    iframe.addEventListener('load', () => iframe.contentWindow.focus(), { once: true });
    const close = (finished) => {
      removeEventListener('message', onMessage);
      layer.remove();
      if (finished) location.hash = String(nextSlide);
      else btn.focus({ preventScroll: true });
    };
    function onMessage(e) {
      if (e.source === iframe.contentWindow && e.data?.type === 'walkthrough-close') close(Boolean(e.data.finished));
    }
    addEventListener('message', onMessage);
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-walkthrough]');
    if (btn) openWalkthrough(btn);
  });
  // Enter on a walkthrough slide opens it, without having to focus the button.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.target.closest?.('button, a, input, textarea')) return;
    const btn = [...document.querySelectorAll('[data-walkthrough]')].find((b) => !b.closest('.slide-frame')?.hidden);
    if (btn) { e.preventDefault(); openWalkthrough(btn); }
  });

  // ---------------------------------------------------------------- mermaid
  // Diagrams on slides. Mermaid is bundled (dist/vendor/), so this works offline.
  const diagrams = [...document.querySelectorAll('.hd-diagram')];
  if (diagrams.length) {
    const tag = document.createElement('script');
    tag.src = new URL('vendor/mermaid.min.js', scriptUrl).href;
    tag.addEventListener('load', async () => {
      const { mermaid } = window;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          fontFamily: '"Funnel Sans", system-ui, sans-serif',
          fontSize: '22px',
          primaryColor: '#fef8f8',
          primaryTextColor: '#05237d',
          primaryBorderColor: '#05237d',
          lineColor: '#05237d',
          textColor: '#05237d',
          edgeLabelBackground: '#fcefed',
        },
        flowchart: { curve: 'basis', htmlLabels: true, padding: 14, nodeSpacing: 30, rankSpacing: 46, wrappingWidth: 340 },
      });
      await document.fonts.ready;
      for (const [i, box] of diagrams.entries()) {
        const src = box.querySelector('script[type="text/x-mermaid"]');
        if (!src) continue;
        try {
          const { svg } = await mermaid.render(`hd-diagram-${i + 1}`, src.textContent);
          box.insertAdjacentHTML('beforeend', svg);
          const el = box.querySelector('svg');
          el.removeAttribute('height');
          el.setAttribute('role', 'img');
          if (box.dataset.label) el.setAttribute('aria-label', box.dataset.label);
        } catch (err) {
          box.insertAdjacentHTML('beforeend', `<p class="hd-diagram-error">Diagram could not be drawn: ${esc(err.message || err)}</p>`);
        }
      }
    });
    document.head.append(tag);
  }

  document.querySelectorAll('[data-terminal]').forEach(terminal);
  document.querySelectorAll('[data-interview]').forEach(interview);
})();

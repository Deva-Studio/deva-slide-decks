// Live pieces for HTML-authored decks.
//   [data-terminal="<script>"]  a terminal that plays a scripted session and loops
//   [data-interview="tree|files"] a setup interview you can answer, showing either
//                                the decision tree or the files each answer scaffolds
(() => {
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
  const ME = '~ % ';
  const PROJECT = '~/checkout-study % ';
  const SCRIPTS = {
    // The starter CLI's setup interview, from npx to "Done".
    interview: {
      title: 'Terminal — npx create-ds-prototype',
      label: 'Animated terminal: create-ds-prototype asks what you are making, the project name, who will see it, '
        + 'recommends a starting layout with a reason, asks which AI agent you use, then installs the design system '
        + 'and writes the agent rules and hooks.',
      steps: [
        { cmd: 'npx create-ds-prototype', prompt: ME },
        { out: '' },
        { out: '  <span class="t-accent t-b">create-ds-prototype</span>' },
        { out: '  <span class="t-dim">Prototype with your design system</span>', wait: 500 },
        { out: '' },
        { select: 'What are you making?', options: [
          ['Prototype', 'Test an idea with people · deploys to a preview URL'],
          ['Feature', 'Headed to engineering · built on your product stack'],
          ['Contribution', 'A new or changed design system component'],
        ], path: [] },
        { input: 'Project name', value: 'checkout-study' },
        { select: 'Who will see it?', options: [
          ['Our team', 'Internal review · placeholder content is fine'],
          ['Research participants', 'People outside the team, in a study'],
        ], path: [1] },
        { select: 'Content', options: [
          ['Realistic mock data', 'Recommended: participants react to content that looks real'],
          ['Placeholder text'],
        ], path: [] },
        { select: 'Starting layout', options: [
          ['App shell', 'Recommended: participants should see something that feels like the product'],
          ['Form flow'],
          ['Blank page'],
        ], path: [1], note: 'Overrode the recommendation' },
        { select: 'Which AI coding agent do you use?', options: [['Claude Code'], ['Cursor'], ['GitHub Copilot'], ['None']], path: [] },
        { out: '' },
        { spin: 'Copying the form-flow template…', done: 'Template copied' },
        { spin: 'Installing @your-ds/tokens and @your-ds/components…', done: 'Design system installed', ms: 1400 },
        { out: '<span class="t-ok">✔</span> Realistic mock data generated', wait: 220 },
        { out: '<span class="t-ok">✔</span> CLAUDE.md written', wait: 220 },
        { out: '<span class="t-ok">✔</span> Guardrail hook wired <span class="t-dim">(PreToolUse)</span>', wait: 220 },
        { out: '<span class="t-ok">✔</span> Update check wired <span class="t-dim">(SessionStart)</span>', wait: 220 },
        { out: '' },
        { out: '<span class="t-ok t-b">Done!</span> Next steps:' },
        { out: '  <span class="t-accent">cd checkout-study</span>' },
        { out: '  <span class="t-accent">npm run dev</span>' },
        { out: '' },
        { prompt: ME, end: true },
      ],
    },

    // An agent tries to write off-system code and the PreToolUse hook blocks it.
    guardrail: {
      title: 'Terminal — AI coding agent in checkout-study',
      label: 'Animated agent session: asked to add a Pay now button, the agent writes a raw hex colour and a plain '
        + 'button element. The guardrail hook blocks the edit and names the token and component to use. The agent '
        + 'retries with the design system Button and the edit passes.',
      steps: [
        { cmd: 'Add a "Pay now" button under the order total', prompt: '❯ ' },
        { out: '', wait: 600 },
        { out: '<span class="t-b">●</span> I\'ll add a primary button below the total.', wait: 700 },
        { out: '<span class="t-b">●</span> <span class="t-b">Edit</span> src/CheckoutSummary.tsx', wait: 300 },
        { out: '  <span class="t-add">+ &lt;button style={{ background: "#2F6FED" }}&gt;Pay now&lt;/button&gt;</span>', wait: 900 },
        { spin: 'Running PreToolUse hook: ds-guard', done: '', ms: 900, quiet: true },
        { out: '  <span class="t-err">⎿ Blocked by ds-guard</span>', wait: 200 },
        { out: '    <span class="t-err">✖</span> Raw colour #2F6FED. Use a token: var(--ds-color-action-primary)', wait: 200 },
        { out: '    <span class="t-err">✖</span> &lt;button&gt; found. Use &lt;Button&gt; from @your-ds/components', wait: 1400 },
        { out: '' },
        { out: '<span class="t-b">●</span> The design system has a Button. Using it instead.', wait: 700 },
        { out: '<span class="t-b">●</span> <span class="t-b">Edit</span> src/CheckoutSummary.tsx', wait: 300 },
        { out: '  <span class="t-add">+ &lt;Button variant="primary"&gt;Pay now&lt;/Button&gt;</span>', wait: 900 },
        { spin: 'Running PreToolUse hook: ds-guard', done: '', ms: 700, quiet: true },
        { out: '  <span class="t-ok">⎿ ✔ Passed ds-guard</span>', wait: 300 },
        { out: '' },
        { prompt: '❯ ', end: true },
      ],
    },

    // A new agent session starts and the SessionStart hook reports what is out of date.
    'session-start': {
      title: 'Terminal — AI coding agent in checkout-study',
      label: 'Animated agent session: when the session starts, the update check finds a newer design system '
        + 'release with a Stepper component and a newer scaffold template. Asked for a step indicator, the agent '
        + 'updates the package first and uses the Stepper.',
      steps: [
        { cmd: 'claude', prompt: PROJECT },
        { out: '' },
        { spin: 'SessionStart hook: ds-check', done: 'ds-check added context for the agent', ms: 1100 },
        { out: '  <span class="t-warn">!</span> @your-ds/components <span class="t-b">4.2.0</span> installed · <span class="t-b">4.4.0</span> available', wait: 250 },
        { out: '    <span class="t-dim">New since 4.2: Stepper, DatePicker</span>', wait: 250 },
        { out: '  <span class="t-warn">!</span> Scaffold template <span class="t-b">1.3</span> · <span class="t-b">1.5</span> available', wait: 250 },
        { out: '    <span class="t-dim">Update with: npx create-ds-prototype update</span>', wait: 1200 },
        { out: '' },
        { cmd: 'Add a step indicator to the checkout', prompt: '❯ ' },
        { out: '', wait: 600 },
        { out: '<span class="t-b">●</span> Version 4.4.0 adds a Stepper, so I\'ll update the package first.', wait: 700 },
        { out: '<span class="t-b">●</span> <span class="t-b">Bash</span> npm install @your-ds/components@4.4.0', wait: 300 },
        { spin: 'Installing…', done: 'Updated @your-ds/components to 4.4.0', ms: 1200 },
        { out: '<span class="t-b">●</span> <span class="t-b">Edit</span> src/CheckoutFlow.tsx', wait: 300 },
        { out: '  <span class="t-add">+ &lt;Stepper steps={steps} current={step} /&gt;</span>', wait: 300 },
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
  const QUESTIONS = [
    { id: 'kind', q: 'What are you making?', options: [
      { v: 'prototype', l: 'Prototype' }, { v: 'feature', l: 'Feature' }, { v: 'contribution', l: 'Contribution' }] },
    { id: 'audience', q: 'Who will see it?', when: (a) => a.kind === 'prototype', why: 'prototypes only', options: [
      { v: 'team', l: 'Our team' }, { v: 'participants', l: 'Participants' }] },
    { id: 'content', q: 'Content', when: (a) => a.kind === 'prototype', why: 'prototypes only',
      recommend: (a) => (a.audience === 'participants'
        ? ['realistic', 'participants react to content that looks real']
        : ['placeholder', 'quickest for an internal review']),
      options: [{ v: 'realistic', l: 'Realistic data' }, { v: 'placeholder', l: 'Placeholder' }] },
    { id: 'stack', q: 'Framework', when: (a) => a.kind === 'feature', why: 'features only',
      recommend: () => ['react', 'matches the product codebase engineers will merge it into'],
      options: [{ v: 'react', l: 'React' }, { v: 'vue', l: 'Vue' }, { v: 'wc', l: 'Web components' }] },
    { id: 'layout', q: 'Starting layout', when: (a) => a.kind !== 'contribution', why: 'not for contributions',
      recommend: (a) => (a.kind === 'feature' || a.audience === 'participants'
        ? ['shell', a.kind === 'feature' ? 'features live inside the product shell' : 'participants should see something that feels like the product']
        : ['blank', 'nothing to remove when sketching an idea']),
      options: [{ v: 'shell', l: 'App shell' }, { v: 'form', l: 'Form flow' }, { v: 'blank', l: 'Blank' }] },
    { id: 'component', q: 'Which component?', when: (a) => a.kind === 'contribution', why: 'contributions only', options: [
      { v: 'new', l: 'A new one' }, { v: 'existing', l: 'An existing one' }] },
    { id: 'agent', q: 'AI coding agent', options: [
      { v: 'claude', l: 'Claude Code' }, { v: 'cursor', l: 'Cursor' }, { v: 'copilot', l: 'Copilot' }, { v: 'none', l: 'None' }] },
  ];

  // What gets scaffolded, as [path, reason] pairs.
  function filesFor(a) {
    const f = [['package.json', 'tokens and components installed'], ['src/main.tsx', 'imports the token CSS'],
      ['eslint.config.js', 'design system lint rules']];
    if (a.kind === 'prototype') f.push(['.github/workflows/preview.yml', 'deploys a preview URL']);
    if (a.content === 'realistic') f.push(['src/mocks/data.ts', 'realistic mock data']);
    if (a.content === 'placeholder') f.push(['src/mocks/placeholder.ts', 'placeholder content']);
    if (a.stack === 'react') f.push(['src/app/routes.tsx', 'product routing']);
    if (a.stack === 'vue') f.push(['src/app/router.ts', 'product routing']);
    if (a.stack === 'wc') f.push(['src/app/app-root.ts', 'app entry element']);
    if (a.layout === 'shell') f.push(['src/layouts/AppShell.tsx', 'nav, header and content areas']);
    if (a.layout === 'form') f.push(['src/layouts/FormFlow.tsx', 'steps, validation and summary']);
    if (a.layout === 'blank') f.push(['src/pages/Start.tsx', 'one empty page']);
    if (a.component === 'new') f.push(['src/components/NewComponent/', 'component, stories and tests'], ['CONTRIBUTING.md', 'the review process']);
    if (a.component === 'existing') f.push(['src/sandbox/', 'the component, linked from the library'], ['CONTRIBUTING.md', 'the review process']);
    if (a.agent === 'claude') f.push(['CLAUDE.md', 'design system rules for the agent'], ['.claude/settings.json', 'registers both hooks'],
      ['.claude/hooks/ds-guard.mjs', 'PreToolUse: blocks off-system code'], ['.claude/hooks/ds-check.mjs', 'SessionStart: checks for updates']);
    if (a.agent === 'cursor') f.push(['.cursor/rules/design-system.mdc', 'design system rules for the agent']);
    if (a.agent === 'copilot') f.push(['.github/copilot-instructions.md', 'design system rules for the agent']);
    if (a.agent && a.agent !== 'none') f.push(['AGENTS.md', 'shared rules any agent can read']);
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
        return `<div class="hd-iv__q${q.id in answers ? ' is-done' : ''}" role="group" aria-label="${esc(q.q)}">
          <p class="hd-iv__qt"><span aria-hidden="true">?</span> ${esc(q.q)}</p>
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
          return `<li class="is-${state}"><span>${esc(q.q)}</span><em>${esc(note)}</em></li>`;
        }).join('')}</ol>`;
      } else {
        const files = filesFor(answers);
        const now = new Set(files.map(([p]) => p));
        // Files the last answer added show why they're there (and flash, after the first draw).
        const first = !before;
        side.innerHTML = `<p class="hd-iv__title">checkout-study/ · ${files.length} files</p><ul class="hd-iv__files">${files.map(([p, r]) =>
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
    Object.assign(answers, { kind: 'prototype', audience: 'participants' });
    draw();
  }

  document.querySelectorAll('[data-terminal]').forEach(terminal);
  document.querySelectorAll('[data-interview]').forEach(interview);
})();

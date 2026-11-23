# deva-slide-decks

Presentation decks for Deva Studio, built as responsive web pages with a landing page that lists every deck.

## Usage

```bash
npm install
npm run dev      # build, then serve at http://localhost:4322
```

- `npm run build` writes the static site to `dist/`.
- `npm run serve` serves `dist/` locally (`PORT=… npm run serve` to change the port).

Pushing to `main` builds the site and publishes `dist/` to the `gh-pages` branch
(`.github/workflows/pages.yml`). In the repository's *Settings → Pages*, choose **Deploy from a branch** with
**`gh-pages`** and **`/ (root)`**. The build writes `dist/.nojekyll`, so GitHub Pages serves the files as built
and never runs Jekyll.

## Decks

| Deck | Folder |
| --- | --- |
| How to build a CLI for your design system (Into Design Systems · AI and Design Systems) | `decks/cli-for-design-systems/` |

## Adding a deck

Decks are written in HTML, so slides can contain working UI.

1. Put one `<section>` per slide in `decks/<name>/slides.html` (add `class="dark"` for the dark theme).
   Slides use a 1280 × 720 canvas styled by `src/html-deck.css`.
2. Images go in `decks/<name>/media/` and are referenced as `media/…`.
3. Register it in `decks/decks.json`:

   ```json
   { "dir": "my-talk", "slug": "my-talk", "title": "My Talk", "description": "…", "date": "2026" }
   ```

   Add `"hidden": true` to leave one out. The landing page title and tagline live in `decks/site.json`.
4. Run `npm run build`.

A `.pptx` dropped into `decks/` is also converted (positioned text, shapes and images), as in the
personal slide-decks site this repo was copied from.

### Look

Slides follow the Deva Kit cover (Figma: 🧩 Deva Kit · Components): indigo ink (`indigo/700` #05237d) on pink
paper (`pink/400` #f4c7c2) over the isometric grid in `src/theme/`, Funnel Display headings and Funnel Sans text.
`class="dark"` reverses to pink on indigo. The kit's colour tokens are CSS variables at the top of `src/html-deck.css`.

### Layout classes

- `hd-cover` with `hd-kicker`, `hd-display` and `hd-sub`: the title slide. `hd-people`: speaker names.
- `hd-band`: a full-width band between thick rules (`span.is-off` dims an item). `hd-giant`: oversized spaced letters.
- `hd-close`: the closing slide.
- `hd-tpls` / `hd-tpl` with `hd-wf`: template cards with outline wireframes (storefront, product, checkout, blank).
- `hd-break` with `hd-break-tag`: a "Live in Figma" pause slide for a demo.
- `hd-diagram` (with a `<script type="text/x-mermaid">` inside) and `hd-diagram-cap`: a Mermaid diagram on a slide,
  drawn in the Deva Kit colours; a `<span>` in the caption becomes a second, lighter line.

- `hd-label` + `hd-title`: section label and slide title. `hd-lede`: a line under the title.
- `hd-cols`: two columns (text left, demo right). Override `grid-template-columns` per slide.
- `hd-list`, `hd-num`: dash and numbered lists. `hd-cards` / `hd-card`: three cards in a row.
- `hd-flow` / `hd-flow-step`: a left-to-right pipeline (`is-key` highlights a step).
- `hd-pre`: a code block (`.k` keyword, `.s` string, `.c` comment, `.bad`, `.good`). `hd-shell`: static terminal text.
- `hd-section`: a section divider (`hd-section-num`, `hd-section-title`, `hd-section-sub`).
- `hd-demo`: a panel for a live piece. `hd-todo`: content still needed (dashed box).

### Live pieces (`src/html-deck.js`)

- `<div data-terminal="interview|guardrail|session-start">`: a terminal that plays a scripted session while
  its slide is shown, then loops. Scripts live in `SCRIPTS`. Size it with `width`, `height` and `font-size`.
- `<div data-interview="tree|files">`: the starter CLI's setup interview, answerable on the slide. `tree` shows
  which questions are asked, skipped (gated on earlier answers) or still to come; `files` shows what each answer
  scaffolds. Questions, gates and recommendations live in `QUESTIONS`; files in `filesFor()`.

Both respect reduced motion (the terminal shows its finished session).
- `<button data-walkthrough="decision-tree/">`: opens a page from `decks/<dir>/pages/` in a layer over the deck,
  so Present (full screen) stays on. The page closes the layer with
  `parent.postMessage({ type: 'walkthrough-close', finished })`; `finished` moves on to the next slide.
  `Enter` on that slide opens it too.

### Decision tree: choose your own adventure

`decks/cli-for-design-systems/pages/decision-tree/index.html` tells the decision tree as a choose-your-own-adventure,
outside the slide format, opened from the "You're the author" slide. Part 1 (writing it) plans the story from the
ending back: the outcome (a prototyping environment for designers and PMs), the readers and their two product
verticals, the turning point (which team you're on), and the story map. Part 2 (reading it) plays it as a designer:
pick a team, then one of that team's templates (gated), then an agent (recommended), and reach a themed ending with
the files each answer wrote. Each page has an author's note on what it becomes in the CLI.

The teams, verticals, templates, themes and agents are set once in `STORY` at the top of its script. `←` / `→` turn
pages, `1`–`4` pick a choice, `Esc` goes back to the slides, and `→` on the ending continues the deck. It also works on
its own at `/cli-for-design-systems/decision-tree/`.

The example's fictional brands (placeholders "Brand A" and "Brand B") appear in three places: `STORY` in that page,
`BRAND_A` / `BRAND_B` at the top of `src/html-deck.js` (interview and terminals), and the text of
`decks/cli-for-design-systems/slides.html`.

Files in `decks/<dir>/pages/` are copied next to the deck as they are. Mermaid (used by the diagrams on the slides) comes from the `mermaid` npm
package and is copied to `dist/vendor/`, so the diagrams work without a network connection.

## Viewing a deck

- One slide at a time, scaled to fit the screen from phone to desktop.
- `←` / `→` (or swipe, or the ‹ › buttons) move between slides. Each slide has its own link (`/cli-for-design-systems/#5`).
- **Present** (or `P`) goes full screen.

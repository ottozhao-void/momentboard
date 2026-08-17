# Manual Performance Entry — Implementation Plan

Goal: let Otto record benchmark scores by hand while reading a paper, via a
button that opens a minimal, polished modal form. A previous heavier attempt
(edit-mode, toasts, home-page SOTA merge) was reverted; this plan keeps the
feature lean and the published dataset untouched.

## Design

- **Entry point** — an "Add result" button (＋ icon) in the benchmark-page
  toolbar. One place, contextually where numbers are compared.
- **Modal** — native `<dialog>` injected by app.js: free focus trap, Esc to
  close, backdrop blur, minimal card (head / scrollable body / foot).
- **Fields** — method name (required), benchmark (select, defaults to the
  current page), setting (fine-tuned / zero-shot segmented control), paper or
  source (optional; bare arXiv IDs auto-link), note (optional), plus one score
  input per metric of the chosen benchmark, grouped like the table headers
  (blank = not reported, 0–100 validation).
- **Persistence** — localStorage key `momentboard:manual:v1` (versioned
  envelope). `js/data.js` is never touched: the published dataset stays the
  single source of truth; manual entries are private scratch.
- **Table** — manual rows merge into the sorted/ranked table with a dashed
  amber `manual` tag; the expandable row shows source, added date and a
  "remove entry" control. Freshly saved rows flash amber and scroll into view.
- **Export** — an "export JSON" ghost button appears in the toolbar while any
  entry exists and downloads `momentboard-manual-entries.json`, the bridge for
  merging rows into `js/data.js` later.
- **Home page** — unchanged: timeline, SOTA callout and stats stay
  published-only, so private entries never masquerade as the field's state.

## Files

- `js/app.js` — `manualStore` (load/add/remove), modal builder, benchmark-page
  integration (toolbar, rows, remove, flash, export), About-page copy.
- `css/style.css` — `.btn`, `.toolbar-actions`, `.tag.manual`, `.modal`,
  form fields, segmented control, score grid; tokens (`--shadow-modal`,
  `--danger`, `--chevron`) added to both themes.
- `README.md` / `AGENTS.md` — document the quick-entry workflow.

## Validation

- `node --check js/app.js`
- `node tools/validate_data.js` (data.js untouched, must still pass)
- Manual browser pass: open modal, save, check row/tag/export/remove, dark mode.

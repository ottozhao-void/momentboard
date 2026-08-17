# Manual performance entry

## Goal

Let a researcher record benchmark results from a paper without editing the static data file. The flow should be quick, keyboard-friendly, visually consistent with Momentboard, and persistent on the current browser.

## Design direction

- Use the existing ink-on-paper palette, amber highlight, Space Grotesk headings, and IBM Plex Mono data labels.
- Use one restrained `Record result` action in the header and in the benchmark toolbar.
- Present the form as a native modal dialog: quiet paper surface, hairline borders, compact metric grid, and a single amber save action.
- Keep the distinctive visual cue to a small amber “manual” badge on saved rows; avoid adding decorative effects.

## Scope

1. Add a persistent `Record result` action and accessible native dialog.
2. Let the user choose a benchmark, enter a method name, optional paper metadata, setting, notes, and any available metric values.
3. Validate required fields and score ranges inline; require at least one metric.
4. Store entries in `localStorage` under a namespaced key so static `js/data.js` remains untouched and the feature works on GitHub Pages/offline.
5. Merge saved entries into benchmark tables, timelines, home statistics, rankings, and SOTA summaries.
6. Mark manual rows clearly and allow editing/removing them from their expanded paper detail.
7. Add responsive, keyboard, focus, reduced-motion, and dark-theme styles.
8. Update README usage notes and run the existing data validator plus syntax checks.

## Acceptance checks

- `Record result` opens the dialog from the header, home benchmark section, and benchmark toolbar.
- Benchmark metrics update when the benchmark selection changes.
- A saved entry appears immediately in the selected benchmark table and remains after reload.
- Blank metric cells stay `-`; values outside `0–100` or malformed URLs show a local error.
- Escape, close, and cancel dismiss the dialog; focus returns to the trigger.
- Manual entries show a `manual` badge and have working Edit and Remove actions.
- The existing static data validator continues to pass.

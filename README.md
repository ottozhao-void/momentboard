# Momentboard

A minimal, self-contained leaderboard for **temporal sentence grounding** and
**video moment retrieval** — method rankings across five benchmarks, seeded
with real published results from top-conference papers.

Zero dependencies: open `index.html` directly in a browser, or serve the
folder with any static server. Fonts are vendored (no CDN), data lives in a
single editable file, and everything works offline.

## Quick start

```bash
# from anywhere, either:
python3 -m http.server 8080        # then open http://localhost:8080
# or just double-click index.html  (works — no fetch, no build step)
```

## What's inside

| Path | Purpose |
|---|---|
| `index.html` | Single page; all views rendered client-side |
| `css/style.css` | Design tokens + layout (light, amber accent, mono numerals) |
| `js/data.js` | **Single source of truth** — benchmarks, methods, results |
| `js/app.js` | Router, table rendering, sorting, search, expandable rows |
| `fonts/` | Self-hosted Space Grotesk + IBM Plex Sans/Mono |
| `tools/import_from_extractor.py` | Import the extractor's `summary.csv` into the board |

## Views

- **Home** — current state of the field: SOTA callout, stats, benchmark cards
  with a "moment" timeline per benchmark.
- **Benchmark pages** (`#/benchmark/qvhighlights`, …) — relative-to-best
  timeline, sortable metric columns (grouped headers), method search,
  expandable rows with paper title / venue / arXiv link.
- **About & sources** — methodology, caveats, and per-benchmark provenance.

## Benchmarks & data

Five benchmarks, 22 methods, 51 reported results as of 2026-08-16:

- **QVHighlights** (test) — MR R1@0.5/0.7 + HD mAP
- **Charades-STA** (test) — R@0.3/0.5/0.7, mIoU
- **ActivityNet-Captions** (val_2) — R@0.3/0.5/0.7, mIoU
- **TACoS** (test) — R@0.3/0.5/0.7, mIoU
- **Ego4D-NLQ** (val) — R@0.3/0.5/0.7, mIoU

Numbers are as reported in the papers — compiled from the VideoMind benchmark
tables (`yeliudev/VideoMind`) and R2-Tuning (arXiv:2404.00801, Table 2), with
per-method papers linked from each row. See the About page for caveats.

## Adding results

**Manually** — edit `js/data.js`:

```js
rows: [
  { "method": "my-method", "size": "7B", "setting": "zero-shot",
    "values": { "r@0.5": 62.3, "r@0.7": 41.0, "miou": 44.1 } }
]
```

and add a `methods` entry `"my-method": { "title": …, "venue": …, "year": …,
"arxiv": … }`.

**From paper PDFs** — run the extraction pipeline, then import:

```bash
cd benchmark-extractor
.venv/bin/python extract_benchmarks.py          # -> output/summary.csv
cd ../tsg-leaderboard
python3 tools/import_from_extractor.py --csv ../benchmark-extractor/output/summary.csv
```

Imported rows appear on the benchmark page under a "pending review" notice —
the extractor's generic values still need a human to confirm metric and paper.

## Validation

```bash
node tools/validate_data.js   # checks methods, metrics, value ranges
```

## Design notes

- One accent color (a "highlight marker" amber) on ink-on-paper; hairline
  rules; numbers in IBM Plex Mono (tabular); Space Grotesk for display.
- The timeline motif — every method is a tick on a video-timeline, the SOTA
  result is the highlighted moment — mirrors what the field actually studies.
- Focus-visible states, `prefers-reduced-motion`, and mobile overflow
  handling are respected.

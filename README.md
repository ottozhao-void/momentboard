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

**Six benchmarks, 73 methods, 148 reported results** as of 2026-08-16:

- **QVHighlights** (test) — MR R1@0.5/0.7 + HD mAP
- **Charades-STA** (test) — R@0.3/0.5/0.7, mIoU
- **ActivityNet-Captions** (val_2) — R@0.3/0.5/0.7, mIoU
- **TACoS** (test) — R@0.3/0.5/0.7, mIoU
- **Ego4D-NLQ** (val) — R@0.3/0.5/0.7, mIoU
- **Long video (MAD · MomentSeeker)** (test) — R1@0.1/0.3/0.5, Avg

Numbers are as reported in the papers. Seed data came from the Obsidian
research vault paper library plus the primary papers (VideoMind, R2-Tuning,
TFVTG, TAG, Moment-GPT, Self-SiMS, MarkIt, T2SGrid, SemVID, ShotDetect,
ED-VTG, Moment Quantization, LD-DETR, UniTime, OmniVTG, CVA, GroundVTS,
UniVTG, …), each row linking back to its paper. The full zero-shot /
training-free VMR family from the library is covered, plus the
training-free token-pruning line.

## Tags

Every method carries tags from the WebSiting/research-library taxonomy
(`topic/*`): training-free, zero-shot, Vision-LLM, DETR, diffusion, RL,
CLIP-sim, video-retrieval, token-opt, codebook, survey, VMR. Filter any
benchmark table with the chip bar — tags combine with search and sorting.
The home page shows the tag distribution across the board.

## Adding results

**While reading a paper** — click **Record result** in the header, home
benchmark section, or any benchmark toolbar. Choose the benchmark, enter the
method and any available metric values, then save. Entries are marked `manual`
and stored in this browser's local storage, so they survive reloads without
changing the published `js/data.js` dataset. Expand a manual row to edit or
remove it.

**For published board data** — edit `js/data.js` directly:

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

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
| `js/app.js` | Router, table rendering, sorting, search, expandable rows, manual entry + correction forms |
| `server/server.js` | Zero-dependency persistence server (static site + REST API) |
| `server/entries.json` | Server-side entries/corrections store (atomic writes) |
| `tools/merge_entries.js` | Fold server entries + corrections back into `js/data.js` |
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

**While reading** — the **Add result** button on any benchmark page opens a
minimal form for typing scores by hand. Entries sync to the momentboard
server (this machine on your Tailscale network, `server/server.js`) and
appear on the table tagged `manual`. If the server is unreachable the
browser falls back to localStorage and the toolbar shows `local only`.

**Fixing extraction errors** — expand any row and choose **edit** to correct
its scores. The fix is stored as an *override* on the server, layered on top
of the published value and tagged `corrected`; **revert** goes back to the
published number. Manual entries can be edited or removed the same way.

**Publishing** — run `tools/merge_entries.js` to fold server overrides and
manual entries back into `js/data.js`, then commit. You can also export a
JSON snapshot with the **export JSON** button.

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

## Server & persistence

```bash
./server/start.sh          # HTTP on 0.0.0.0:8080 (static + API)
```

The server persists entries/corrections to `server/entries.json` with atomic
writes. On this machine it runs as a systemd user service
(`~/.config/systemd/user/momentboard.service`) and is reachable over
Tailscale at **https://openclaw.tailda1b50.ts.net/momentboard** (via
`tailscale serve`). The GitHub Pages copy syncs to it over HTTPS/CORS; when
it can't be reached (off-network, or Chrome's local-network security blocks
the public→private call) the app degrades to browser-local storage with a
status chip in the toolbar. For the full syncing experience, use the tailnet
URL above as your editing home.

See `server/README.md` for the API and deployment notes.

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

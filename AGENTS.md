# Momentboard (TSG/VMR Leaderboard) — Project Instructions

This project is a static leaderboard frontend (zero-dependency HTML/JS/CSS) that
compares Video Moment Retrieval (VMR) / Temporal Sentence Grounding (TSG) methods
across benchmarks. It is served locally (via SSH port forwarding) and sourced
from the user's Obsidian research vault (City library). These instructions
capture the hard-won lessons from building and extending it.

# Data Sources & Paper Inventory

## Paper inventory comes from multiple channels, not a single source

- The paper inventory is NOT limited to one place. Papers can come from several
  channels, including (but not limited to):
  - the Obsidian research vault (see below),
  - **daily-paper websites / scanners** (e.g. a future arXiv digest feed that
    surfaces new VMR/TSG papers to review and add),
  - venues' own pages, RSS feeds, or any other collection Otto points at.
- Keep the inventory additive: a paper discovered via any channel should be
  eligible, provided it is a real, published work with retrievable numbers.
- Web/arXiv is for retrieving numbers, not for deciding what is in scope.

## Obsidian vault notes: `Paper - ` title prefix OR `paper` tag

- A note is a **paper note** if EITHER of these holds:
  - the title contains `Paper - ` (e.g. `Paper - TFVTG ...`), OR
  - the note's tags include `paper` (e.g. in frontmatter `tags: [paper, topic/vmr, ...]`).
  Match on the OR of both conditions — do not rely on the prefix alone, since some
  paper notes carry only the `paper` tag, and vice versa.
- **Notes are NOT guaranteed to live in `Library/Paper/`.** They may sit in other
  folders, so when scanning the vault, search the whole vault for notes matching
  either condition rather than assuming a single folder path.
- Access the vault over the Tailscale bridge (Obsidian Local REST API), bulk-download
  the matching notes, and parse frontmatter (`tags`, `publication-venue`,
  `publication-year`, `paper-url`, `code-url`, `aliases`).

## Papers are NOT only on arXiv — always check the venue's own platform

- A paper may have no arXiv ID even though it is a real, published paper. Examples
  encountered in this project:
  - **ACM MM** (e.g. PZVMR, `dl.acm.org`) — no arXiv.
  - **ICLR** (e.g. HiTeA) — hosted on **OpenReview**, not arXiv.
  - **ECCV** (e.g. Self-SiMS) — may be on **OpenReview** only.
  - **ISVC / Springer** (e.g. Zero-Shot BLIP) — chapter on `link.springer.com`.
  - **NeurIPS Workshop** (e.g. ShotDetect) — may still have an arXiv ID (it can, so check).
- When a note's `paper-url` does not point at arXiv, fetch the number-bearing tables from
  that venue's platform (OpenReview forum, Springer chapter, ACM DL) instead of skipping
  the paper.
- Only register a paper as "no public numbers" after attempting its actual venue page.

## Selection must be broad — tags are not the whole story

- Do not filter by the `topic/vmr` tag alone. Many relevant papers carry other or no
  `topic/*` tags. Match on keywords across the title, aliases, AND tags, e.g.:
  `moment retrieval | temporal grounding | moment localization | highlight detection |
  video grounding | VMR | VTG | temporal-aware | gridification`.
- The candidate set is keyword hits over all paper notes (by the `Paper - ` prefix
  across the whole vault, plus any other channel), not the `topic/vmr` tag subset.

# Data Extraction Pipeline (recommended workflow)

Extract benchmark numbers from papers and land them in `js/data.js` as follows
(this is the working process that produced the current 148 rows / 6 benchmarks):

## Steps

- **Inventory.** Identify candidate papers from every channel (Obsidian vault
  notes, daily-paper feeds, venue pages). Match VMR/TSG by keywords across
  title, aliases AND tags (see "Selection must be broad" above), not by
  `topic/vmr` alone.
- **Resolve a source.** Prefer `paper-url` → arXiv ID. If the note has no arXiv,
  check the venue's own platform (OpenReview, ACM DL, Springer, CVF) — most
  papers have *some* public page with a number-bearing table.
- **Fetch the HTML.** Download `https://arxiv.org/html/<id>` with curl
  (custom user-agent, ~0.7s sleep between requests). If the file is a stub
  (< ~5 KB) or an arXiv template page, fall back to
  `https://ar5iv.labs.arxiv.org/html/<id>`, then the venue page. Record any ID
  that yields an unrelated paper (e.g. TinyViM instead of a VMR paper) as a
  **wrong-match** — never guess numbers from a mismatched source.
- **Parse tables.** Walk the HTML with a stdlib `HTMLParser` (strip
  `<script>`/`<style>`), keep only `<table>`s whose text matches a
  benchmark-name OR metric regex
  (`QVHighlights|Charades|ActivityNet|TACoS|Ego4D|DiDeMo` and
  `R1@|R@|mAP|mIoU|HIT@`), then align the 2-row headers (method · setting ·
  per-benchmark metric columns) by hand.
- **Image tables → use `describe_image`.** If the table is embedded as an image
  or math-markup (no parseable `<table>`), do NOT skip it: run the
  `describe_image` visual tool on the paper's table figure and transcribe the
  cells into a row. Use image tables as the fallback for any paper the HTML
  parser cannot crack.
- **Map to the schema.** For each row keep (benchmark, split, metric, value) —
  e.g. `qvhighlights/test/r1@0.5`. Track splits (test vs val) and settings
  (zero-shot vs fine-tuned) explicitly on the row; never conflate a val split
  with a test split.
- **Cross-validate.** When two papers report the same baseline (e.g. TFVTG and
  TAG both tabulate 2D-TAN/EMB/UniVTG), confirm values match before trusting
  either. Accuracy beats completeness: if a cell can't be confidently mapped,
  leave it out rather than guess.
- **Validate & commit.** Run `node tools/validate_data.js`, then commit with the
  conventional `type(scope): subject` format.

## Graceful degradation — never silently drop a paper

- Make every reasonable effort first (venue page, ar5iv, `describe_image` on
  image tables). If numbers still can't be obtained, **the paper must still be
  shown** on its benchmark table(s):
  - keep its row with the method name and every drill-down link,
  - put `-` in every score cell,
  - tag the row `<span class="tag failed">⚠ no numbers — pending</span>`,
  - list the failure reason on the row and in the About page's
    "Data gaps — awaiting extraction" section,
  - mark it <span class="gaps-manual">needs manual review</span> so a human
    closes the gap later.
- Record each gap in `data.js` under the top-level `unavailable` array with
  `{ id, code, failReason, benchmarks }`. Valid codes:
  `image-table`, `bad-download`, `no-arxiv`, `wrong-match`.
- `wrong-match` entries must keep `benchmarks: []` (they never enter a table);
  `tinyvim` is the canonical example.

# Manual entry channel (server-synced edits)

Separate from the extraction pipeline, the UI offers manual entry and
correction of numbers (see README "Adding results"):

- **Add result** creates a `manual` entry; **edit** on any row creates an
  `override` of a published value. Both are stored on the momentboard server
  (`server/server.js`) in `server/entries.json`, and are layered on top of
  `data.js` at render time — `data.js` is never rewritten from the UI.
- The site is accessed via **SSH port forwarding** (`ssh -L 8080:localhost:8080`)
  — the server binds localhost only, with no LAN/Tailnet/Pages exposure.
- When the server is unreachable the app falls back to localStorage
  (`momentboard:manual:v2`) and shows `local only` in the toolbar.
- **Publish corrections:** run `node tools/merge_entries.js` to fold
  `server/entries.json` overrides + manual rows into `js/data.js`, validate
  with `node tools/validate_data.js`, and commit. Merging re-serializes the
  file (whole values like `35.0` normalize to `35`).
- The home page and benchmark timelines show published values + overrides;
  they intentionally exclude pure `manual` scratch rows.

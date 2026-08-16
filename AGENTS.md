# Momentboard (TSG/VMR Leaderboard) — Project Instructions

This project is a static leaderboard frontend (zero-dependency HTML/JS/CSS) that
compares Video Moment Retrieval (VMR) / Temporal Sentence Grounding (TSG) methods
across benchmarks. It is deployed on GitHub Pages and sourced from the user's
Obsidian research vault (City library). These instructions capture the
hard-won lessons from building and extending it.

# Data Sources & Paper Inventory

## Paper inventory comes from the Obsidian vault, not web search

- The authoritative paper inventory is the user's Obsidian vault: `Library/Paper/*.md`.
  Every note starting with `Paper - ` is a paper note and is in scope.
- Access the vault over the Tailscale bridge (Obsidian Local REST API), bulk-download
  notes, and parse frontmatter (`tags`, `publication-venue`, `publication-year`,
  `paper-url`, `code-url`, `aliases`).
- **Do NOT treat web search as the paper source.** The vault is the ground truth for
  what to include; web/arXiv is only for retrieving numbers.

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
- Keyword hits (title+alias+tags) over the whole `Library/Paper` folder is the correct
  candidate set, not the `topic/vmr` tag subset.

# Extraction Pipeline (numbers from the primary papers)

## Numbers must come from the primary papers, not library PDFs

- Per user instruction: "直接arxiv就行" — take numbers from the paper's own tables on
  arXiv/OpenReview/venue HTML, **not** from the personal-library PDFs in the vault.
- Workflow: resolve arXiv ID from frontmatter `paper-url` → download
  `https://arxiv.org/html/<id>` (fallback `ar5iv.labs.arxiv.org/html/<id>`) →
  parse tables with the local `html.parser`-based extractor → review by eye before
  committing numbers to `js/data.js`.

## Table parsing fails often — always have fallbacks

- Expect ~40% of papers to NOT auto-parse (tables rendered as images / other markup /
  prose numbers). Do not treat a failed parse as "skip the paper."
- Fallbacks, in order: (1) `fetch_content` mode=answer on `arxiv.org/html/<id>`,
  (2) ar5iv HTML, (3) grep the raw HTML text for benchmark keywords
  (`Charades`, `QVHigh`, `ActivityNet`, `R1@0.5`, `mIoU`) and read the surrounding prose,
  (4) the venue page (OpenReview/ACM/Springer) when no arXiv exists.
- After the extraction pass, produce a **coverage report**: every candidate paper must be
  either (a) given rows, (b) given a method entry with tags, or (c) explicitly listed as
  "no public numbers" with the reason. No silent drops.

## Verify arXiv IDs before use — fuzzy matches can be wrong

- Resolving IDs by fuzzy/query matching can map the wrong paper (e.g. `2309.00661` was
  assigned to PZVMR but actually belongs to a different paper, "Zero-Shot VMR from Frozen
  VLM", WACV 2024). Always confirm the resolved ID's title matches the note's title.
- Split distinct papers into distinct method IDs even when one is a baseline of the other.
- Prefer the exact `paper-url` arXiv ID from frontmatter over query-based resolution.

# Leaderboard Data (js/data.js)

## Schema

- `window.LEADERBOARD_DATA = { updated, methods: {id: {title, venue, year, arxiv|url, tags}},
  benchmarks: [{id, name, task, split, dataset, metrics, rows: [{method, values, setting?, name?, note?}]}] }`.
- Benchmarks (IDs): `qvhighlights`, `charades-sta`, `activitynet-captions`, `tacos`,
  `ego4d-nlq`, and **`long-video`** (MAD · MomentSeeker) for long-video grounding.
- Display names live in the `METHOD_NAMES` map in `js/app.js` — every new method ID must
  get an entry there or it renders as its raw id.

## Tags (WebSiting taxonomy from the vault)

- Every method carries the vault's `topic/*` taxonomy as `tags`: `vmr`, `training-free`,
  `zero-shot`, `vision-llm`, `detr`, `diffusion`, `rl`, `clip-similarity`,
  `video-retrieval`, `input-token-optimization`, `codebook`, `survey`,
  `weakly-supervised`, `long-video`, `mamba`, `ssm`, …
- `TAG_LABELS` and `TAG_ORDER` in `js/app.js` must include every tag used, or it will not
  be filterable/rendered.

## Completeness is a hard requirement

- The bug that lost the zero-shot/training-free series: only a "priority subset" of
  papers was hand-reviewed and committed, while the rest sat in a "next steps" backlog.
  **Never deploy with uncommitted candidates.** After any extension, re-run the
  vault↔leaderboard cross-reference audit and confirm every relevant note is represented.
- Every row must link back to its paper (via `arxiv`/`url`); rows with partial metrics
  (e.g. only R@0.5) are fine — add a `note` explaining the metric/split (e.g. "val split",
  "OOD-1", "VGG features", "R@1@IoU").

# Validation, Commits & Deployment

- Always run `node tools/validate_data.js` and `node --check js/*.js` before committing.
- Regenerate `js/data.js` with a single idempotent build script (e.g. `/tmp/build_data*.py`)
  — avoid repeated in-place appends that create duplicate rows/benchmarks; start from
  `git show HEAD:js/data.js` for a clean baseline.
- Commit in small units with the `<type>(<scope>): <subject>` format (e.g.
  `fix(leaderboard): ...`, `feat(leaderboard): ...`), then push to `main` — GitHub Pages
  auto-rebuilds. Verify the live site (public GitHub Pages URL) after deploy, not just the
  local server.

# Momentboard (TSG/VMR Leaderboard) — Project Instructions

This project is a static leaderboard frontend (zero-dependency HTML/JS/CSS) that
compares Video Moment Retrieval (VMR) / Temporal Sentence Grounding (TSG) methods
across benchmarks. It is deployed on GitHub Pages and sourced from the user's
Obsidian research vault (City library). These instructions capture the
hard-won lessons from building and extending it.

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

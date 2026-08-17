# Manual Performance Entry — Implementation Plan (v2: server sync + editing)

Goal: let Otto record, correct and persist benchmark scores while reading
papers. v1 shipped a browser-local form (localStorage only). v2 adds
**server-side persistence** (self-hosted on this machine, Tailscale-reachable)
and **editing of every entry** — including published rows, so extraction
errors can be fixed in the UI instead of editing `js/data.js` by hand.

## Hosting decision (confirmed by Otto)

- **Server runs on this machine (`openclaw`)** on the Tailscale network, zero
  dependencies (Node stdlib only).
- GitHub Pages stays the public static frontend; its pages call the Tailscale
  API via CORS. When the server is unreachable (off-network, `file://`), the
  frontend degrades to a localStorage fallback with an explicit status chip.

## Backend — `server/server.js`

- Single zero-dependency Node process (node:http/fs/path/url/crypto).
- Serves the static site (same origin) **and** a REST API:
  - `GET /api/health` → `{ ok, entries }` (frontend detection)
  - `GET /api/entries` → `{ version, entries }`
  - `POST /api/entries` → create (server keeps client id)
  - `PUT /api/entries/:id` → update
  - `DELETE /api/entries/:id` → delete
  - Mutations return the full entries array so clients stay in sync.
- Persistence: atomic writes to `server/entries.json` (tmp + rename), plus a
  `.bak` before each save. Body size cap, path-traversal guard, CORS
  (`*` by default, restrictable via `CORS_ORIGINS` env), `HOST`/`PORT` env
  (default 0.0.0.0:8787). Personal tool on Tailscale — no auth by design.

## Entry model

- `kind: "manual"` — a brand-new row created via the form:
  `{ id, kind, benchmark, method, setting, paper, note, values, added, updated }`
- `kind: "override"` — a correction of an existing published row:
  `{ id, kind, benchmark, target: { method, name }, values, note, updated }`
  Keyed by `benchmark|method|name` (name disambiguates rows like `XML`/`XML+`).
  Rendering layers overrides on top of `data.js` rows without rewriting them.

## Frontend — `js/app.js`

- **Sync store** replaces the localStorage-only store:
  - Config `API_BASE`: `window.MOMENTBOARD_API` override, else `""` (same
    origin) for localhost/openclaw, else `http://openclaw:8787`; `null` on
    `file://`.
  - `init()` fetches `/api/entries` (2 s timeout) → `mode: "server"`; on
    failure → `mode: "local"` + localStorage. `add/update/remove` hit the
    server in server mode, localStorage in local mode.
  - Page renders instantly (published-only), then re-renders when sync
    completes (existing `refreshCurrent` hook). Home stays published-only.
- **Status chip** in the toolbar: `● synced · server` vs `○ local only`.
- **Edit / correct** on every expanded row:
  - Manual rows: `edit` (modal prefilled, method editable, benchmark locked)
    + `remove`.
  - Published rows: `edit` → "Correct result" modal (method/benchmark locked,
    banner explains it overrides the published value) → upserts an override;
    `revert` removes an existing override. Corrected rows get a `corrected` tag.
  - Manual/override edits use the same modal in different modes (fields
    hidden per mode).
- **Export JSON** button keeps working (downloads all server/local entries).

## Merge loop — `tools/merge_entries.js`

- Reads `server/entries.json`, applies overrides onto matching `data.js` rows
  (replacing `values`), and appends manual entries as new rows + `methods`
  entries (so `validate_data.js` passes). Writes back `data.js` preserving
  JSON formatting. This is how corrections become published permanently.

## Validation

- `node --check js/app.js`, `node --check server/server.js`,
  `node tools/validate_data.js`, `node tools/merge_entries.js --check`
- Headless-Chromium E2E against a running server: add manual entry → appears;
  edit published row (override) → corrected value shown + tag; revert; edit
  manual; delete; server-down → local fallback + status chip; reload persists.

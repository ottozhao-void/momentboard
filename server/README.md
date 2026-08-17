# Momentboard server

Zero-dependency Node server that serves the static site **and** a REST API for
manual performance entries and corrections. Run it on the Tailscale node that
should own the data (this repo's default home is `openclaw`).

## Run

```bash
./server/start.sh                 # HTTP on 0.0.0.0:8080 (static + API)
PORT=9000 ./server/start.sh       # custom port
```

Then open **http://openclaw:8080** (same origin → entries sync here) or, from
a device on your tailnet, **https://openclaw.tailda1b50.ts.net/momentboard**
(fronted by `tailscale serve` → local :8080).

The GitHub Pages copy calls the API over HTTPS
(`https://openclaw.tailda1b50.ts.net/momentboard/api/…`) via CORS, so edits
made there persist to the same `server/entries.json`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/health` | `{ ok, entries }` — frontend detection |
| GET  | `/api/entries` | list all entries |
| POST | `/api/entries` | create (client provides `id`) |
| PUT  | `/api/entries/:id` | update |
| DELETE | `/api/entries/:id` | remove |

Mutations return the full entries array. Data is written atomically to
`server/entries.json` (with a `.bak`). Personal tool on your tailnet — no
auth; restrict with `CORS_ORIGINS` if you expose it publicly.

## Run as a service (on this machine)

Installed as the user service `momentboard.service`:

```bash
systemctl --user enable --now momentboard     # already enabled here
systemctl --user status momentboard
journalctl --user -u momentboard -f           # logs
```

The unit file is `server/momentboard.service` (copy to
`~/.config/systemd/user/` on other hosts).

## Publish corrections back to the board

```bash
node tools/merge_entries.js            # fold entries.json into js/data.js
git add js/data.js && git commit -m "feat(data): apply corrections" && git push
```

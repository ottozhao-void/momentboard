# Momentboard server

Zero-dependency Node server that serves the static site **and** a REST API for
manual performance entries and corrections. It binds **127.0.0.1** by default
and is meant to be reached over **SSH port forwarding** — nothing is exposed
on the LAN, Tailnet or internet.

## Access

```bash
# on the machine hosting the repo (here: openclaw):
./server/start.sh                 # static + API on http://localhost:8080

# from any other machine that can SSH here:
ssh -L 8080:localhost:8080 <host> # then open http://localhost:8080
```

The server is installed here as a **systemd system service** (auto-start at
boot, auto-restart):

```bash
sudo cp server/momentboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now momentboard      # already done here
systemctl status momentboard
journalctl -u momentboard -f                 # logs
```

The unit file is `server/momentboard.service` (runs as `ubuntu`, sets
`PORT=8080` and `HOST=127.0.0.1`).

## API

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/health` | `{ ok, entries }` — frontend detection |
| GET  | `/api/entries` | list all entries |
| POST | `/api/entries` | create (client provides `id`) |
| PUT  | `/api/entries/:id` | update |
| DELETE | `/api/entries/:id` | remove |

Mutations return the full entries array. Data is written atomically to
`server/entries.json` (with a `.bak`). CORS is permissive by default
(`CORS_ORIGINS` env to restrict) since the server is localhost-only; it is
unauthenticated — a personal tool behind your SSH tunnel.

## Publish corrections back to the board

```bash
node tools/merge_entries.js            # fold entries.json into js/data.js
git add js/data.js && git commit -m "feat(data): apply corrections" && git push
```

#!/usr/bin/env bash
# Start the Momentboard persistence server (static + API) from the repo root.
# Port defaults to 8787; override with PORT=… ./server/start.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8787}"
exec env PORT="$PORT" node server/server.js

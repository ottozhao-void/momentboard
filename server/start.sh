#!/usr/bin/env bash
# Start the Momentboard persistence server (static + API) from the repo root.
# For a managed, auto-start setup use the systemd unit instead:
#   sudo cp server/momentboard.service /etc/systemd/system/ && sudo systemctl enable --now momentboard
#
# It binds 127.0.0.1 by default — reach it via SSH port forwarding:
#   ssh -L 8080:localhost:8080 <host>
# Port/host override: PORT=9000 HOST=0.0.0.0 ./server/start.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"
exec env PORT="$PORT" HOST="$HOST" node server/server.js

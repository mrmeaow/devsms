#!/usr/bin/env bash
set -euo pipefail

node apps/server/src/index.js &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

NODE_ENV=production node apps/web/server.js

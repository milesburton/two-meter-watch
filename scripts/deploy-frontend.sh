#!/usr/bin/env bash
set -euo pipefail

# Deploys the built frontend to a Raspberry Pi (or any host running the
# two-meter-watch server) via rsync/scp.
#
# Required environment variables:
#   PI_HOST   - SSH-reachable host, e.g. "pi@two-meter-watch.local"
#   PI_PATH   - remote path to serve static frontend assets from,
#               e.g. "/home/pi/two-meter-watch/src/frontend/dist"
#
# Usage:
#   PI_HOST=pi@raspberrypi.local PI_PATH=/opt/two-meter-watch/dist ./scripts/deploy-frontend.sh

: "${PI_HOST:?Set PI_HOST, e.g. pi@two-meter-watch.local}"
: "${PI_PATH:?Set PI_PATH, e.g. /opt/two-meter-watch/dist}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Regenerating version.json..."
npm run version:generate

echo "Building frontend..."
npm run build:ui

echo "Deploying dist/ to ${PI_HOST}:${PI_PATH}..."
if command -v rsync >/dev/null 2>&1; then
  rsync -avz --delete src/frontend/dist/ "${PI_HOST}:${PI_PATH}/"
else
  # Fallback if rsync isn't available on this machine.
  scp -r src/frontend/dist/* "${PI_HOST}:${PI_PATH}/"
fi

echo "Done."

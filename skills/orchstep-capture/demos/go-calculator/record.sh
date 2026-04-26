#!/usr/bin/env bash
# Record the orchstep-capture demo GIF.
# Idempotent: installs vhs if missing, renders demo.tape -> capture-demo.gif.

set -euo pipefail

cd "$(dirname "$0")"

if command -v brew >/dev/null 2>&1; then
  export PATH="$(brew --prefix)/bin:$PATH"
fi

if ! command -v vhs >/dev/null 2>&1; then
  echo "[record] vhs not found — installing via Homebrew"
  brew install vhs
fi

if ! command -v ttyd >/dev/null 2>&1; then
  echo "[record] ttyd not found — installing via Homebrew (vhs dependency)"
  brew install ttyd
fi

for cmd in go orchstep; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[record] required tool not on PATH: $cmd" >&2
    exit 1
  fi
done

export DEMO_DIR="$(pwd)"

echo "[record] rendering demo.tape -> capture-demo.gif"
vhs demo.tape

echo "[record] done -> $(pwd)/capture-demo.gif"
ls -lh capture-demo.gif

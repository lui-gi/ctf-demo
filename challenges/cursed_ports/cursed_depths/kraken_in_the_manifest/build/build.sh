#!/bin/sh
# build.sh — orchestrate kraken_in_the_manifest via docker compose.

set -eu

ISLAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ISLAND_DIR/src"
BUILD_DIR="$ISLAND_DIR/build"
COMPOSE_FILE="$BUILD_DIR/docker-compose.yml"

case "${1:-up}" in
  up)
    docker compose -f "$COMPOSE_FILE" up --build -d
    sleep 4
    docker compose -f "$COMPOSE_FILE" ps
    echo
    echo "[build] container 'app' running on :8080"
    echo "[build] sample exploit chain (run from outside the container):"
    echo "  curl -sS -X POST http://localhost:8080/api/quotes -H 'Content-Type: application/json' -d '{}'"
    echo "  # then PATCH the returned id to pollute Object.prototype.escapeFunction"
    echo "  # then GET .../bill to trigger SSTI"
    ;;
  down)
    docker compose -f "$COMPOSE_FILE" down -v
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f app
    ;;
  verify)
    echo "[verify] checking source files exist..."
    test -f "$SRC_DIR/app.js"        || { echo "MISSING app.js"; exit 1; }
    test -f "$SRC_DIR/package.json"  || { echo "MISSING package.json"; exit 1; }
    test -f "$SRC_DIR/Dockerfile"    || { echo "MISSING Dockerfile"; exit 1; }
    test -f "$COMPOSE_FILE"          || { echo "MISSING docker-compose.yml"; exit 1; }
    echo "[verify] checking ejs is pinned to 3.1.6..."
    if ! grep -q '"ejs": "3\.1\.6"' "$SRC_DIR/package.json"; then
      echo "FAIL: ejs version pin missing or wrong (want exactly 3.1.6)" >&2
      exit 1
    fi
    echo "[verify] checking the merge function does NOT actually code-filter __proto__..."
    # Look for actual code patterns that would block the exploit, not for
    # explanatory prose. A real guard would be a string compare or
    # hasOwnProperty short-circuit on the dangerous keys.
    if grep -nE 'key\s*===?\s*"__proto__"|key\s*===?\s*"prototype"|key\s*===?\s*"constructor"' "$SRC_DIR/app.js" >/dev/null; then
      echo "FAIL: merge appears to code-filter __proto__/prototype/constructor — exploit will not work" >&2
      exit 1
    fi
    if grep -nE 'hasOwnProperty\(.*key.*\).*continue' "$SRC_DIR/app.js" >/dev/null; then
      echo "FAIL: merge appears to skip non-own-properties — exploit will not work" >&2
      exit 1
    fi
    echo "[verify] checking the merge is NOT lodash.merge..."
    # Look for actual require/import of lodash, not for prose mentions of it.
    if grep -nE '^(const|let|var)\s+\w+\s*=\s*require\(["'\''"]lodash' "$SRC_DIR/app.js" >/dev/null; then
      echo "FAIL: app.js requires lodash — its merge has a __proto__ guard" >&2
      exit 1
    fi
    if grep -nE '"lodash"\s*:' "$SRC_DIR/package.json" >/dev/null; then
      echo "FAIL: package.json declares lodash dependency" >&2
      exit 1
    fi
    echo "[verify] checking Dockerfile installs /treasure with the flag..."
    if ! grep -q "progctf{the_kraken_polluted_my_prototype}" "$SRC_DIR/Dockerfile"; then
      echo "FAIL: /treasure file not seeded with flag in Dockerfile" >&2
      exit 1
    fi
    echo "[verify] checking the flag is NOT in app.js..."
    if grep -q "progctf{" "$SRC_DIR/app.js"; then
      echo "FAIL: flag string appears in app.js — should ONLY be in /treasure" >&2
      exit 1
    fi
    echo "[verify] OK — static checks pass"
    ;;
  *)
    echo "usage: $0 {up|down|logs|verify}" >&2
    exit 2
    ;;
esac

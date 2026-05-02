#!/usr/bin/env bash
# build.sh — Powder Monkey build entrypoint for the Ghost Fleet's Supply Chain island.
#
# Usage:
#   ./build.sh           # build all images
#   ./build.sh up        # build and bring the bundle up
#   ./build.sh down      # stop the bundle
#   ./build.sh verify    # run the static verification checks
#   ./build.sh all       # default: build
#
# Reads ../flag.txt and exports CHALLENGE_FLAG so the hidden-page container
# can render the alt-text puzzle. The flag literal is NEVER baked into source.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISLAND_DIR="$(cd "$HERE/.." && pwd)"
FLAG_FILE="$ISLAND_DIR/flag.txt"
COMPOSE="docker compose -f $HERE/docker-compose.yml"

require_flag() {
    if [ ! -f "$FLAG_FILE" ]; then
        echo "FATAL: flag.txt not found at $FLAG_FILE" >&2
        exit 1
    fi
    CHALLENGE_FLAG="$(tr -d '\n\r' < "$FLAG_FILE")"
    if ! printf '%s' "$CHALLENGE_FLAG" | grep -qE '^progctf\{[a-z0-9_]+\}$'; then
        echo "FATAL: flag.txt does not match progctf{...} format" >&2
        exit 1
    fi
    export CHALLENGE_FLAG
}

cmd_build() {
    require_flag
    $COMPOSE build
}

cmd_up() {
    require_flag
    $COMPOSE up -d --build
    echo
    echo "Ghost Fleet's Supply Chain is up. Service map:"
    echo "  http://localhost:8080  — marrowtide.example (corp site)"
    echo "  http://localhost:8081  — npm.marrowtide.example (registry mock)"
    echo "  http://localhost:8082  — git.marrowtide.example (git host mock)"
    echo "  http://localhost:8083  — crt.marrowtide.example (CT log mock)"
    echo "  http://localhost:8084  — vault.marrowtide.example (hidden page service)"
    echo "  http://localhost:8085  — sela-marrowfen.example (persona)"
    echo "  http://localhost:8086  — kaspar-threnody.example (persona)"
    echo "  http://localhost:8087  — ines-tidemark.example (persona)"
}

cmd_down() {
    $COMPOSE down -v
}

cmd_verify() {
    echo "== Verifying build directory contains no flag literal =="
    if grep -RIn "progctf{" "$HERE" 2>/dev/null; then
        echo "FAIL: build/ contains a literal flag string." >&2
        exit 1
    fi
    echo "PASS: no flag literal in build/."

    echo "== Verifying no real-service references =="
    if grep -RIEn "(facebook|twitter|linkedin|github\.com|npmjs\.com|crt\.sh|google)\." "$HERE" 2>/dev/null; then
        echo "FAIL: build/ references a real external service." >&2
        exit 1
    fi
    echo "PASS: no real-service references in build/."

    echo "== All static verification checks passed =="
}

case "${1:-all}" in
    all|build) cmd_build ;;
    up)        cmd_up ;;
    down)      cmd_down ;;
    verify)    cmd_verify ;;
    *) echo "usage: $0 [build|up|down|verify]" >&2; exit 2 ;;
esac

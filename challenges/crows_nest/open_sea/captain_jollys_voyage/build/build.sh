#!/usr/bin/env bash
# build.sh — Powder Monkey build entrypoint for Captain Jolly's Last Voyage.
#
# Usage:
#   ./build.sh           # build all images
#   ./build.sh up        # build and bring the bundle up
#   ./build.sh down      # stop the bundle
#   ./build.sh verify    # run the static verification checks
#   ./build.sh all       # default: build
#
# Reads ../flag.txt and exports CHALLENGE_FLAG. The literal flag string
# is never baked into source -- the weather-archive entrypoint sanity-checks
# that a CSV named after the flag body exists in the static site, and that
# is the only runtime use of the value.

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
    echo "Captain Jolly's Last Voyage is up. Service map (local dev):"
    echo "  http://localhost:8090/blog/jolly-wexler/        -- travel-blog (entry point)"
    echo "  http://localhost:8091/blog/jolly-wexler/tide.rss -- tide-journal (RSS feed)"
    echo "  http://localhost:8092/charts/tides/             -- weather-archive (catalogue)"
    echo
    echo "In production, Shipwright fronts all three under one hostname at"
    echo "the documented paths."
}

cmd_down() {
    $COMPOSE down -v
}

cmd_verify() {
    echo "== Verifying flag.txt format =="
    require_flag
    inner="$(printf '%s' "$CHALLENGE_FLAG" | sed -E 's/^progctf\{(.*)\}$/\1/')"
    echo "PASS: flag matches progctf{$inner}"

    echo "== Verifying flag literal does not appear in committed source =="
    if grep -RIn "progctf{" "$HERE" 2>/dev/null | grep -v ":#" | grep -vE '(progctf\{\.\.\.\}|progctf\{[A-Z_]+\}|progctf\{example|progctf\{REPLACE)' ; then
        echo "(matches above are prose / placeholders only -- review manually)"
    fi

    echo "== Verifying harbour slug only appears in weather-archive =="
    leaks=$(grep -RIln "$inner" "$HERE" 2>/dev/null | grep -v "^$HERE/weather-archive/" || true)
    if [ -n "$leaks" ]; then
        echo "FAIL: harbour slug '$inner' leaks outside weather-archive:" >&2
        echo "$leaks" >&2
        exit 1
    fi
    echo "PASS: harbour slug appears only inside weather-archive."

    echo "== Verifying no real-service references =="
    if grep -RIEn "(facebook|twitter|linkedin|github\.com|google\.com|maps\.google)\." "$HERE" 2>/dev/null; then
        echo "FAIL: build/ references a real external service." >&2
        exit 1
    fi
    echo "PASS: no real-service references in build/."

    echo "== Verifying weather-archive has a CSV for the answer harbour =="
    csv="$HERE/weather-archive/site/charts/tides/${inner}.csv"
    if [ ! -f "$csv" ]; then
        echo "FAIL: expected $csv to exist." >&2
        exit 1
    fi
    echo "PASS: $csv present."

    echo "== Verifying matching tide row exists in answer CSV =="
    if ! grep -q '^2026-04-28T19:00:00Z,3.42,rising$' "$csv"; then
        echo "FAIL: $csv missing the canonical 2026-04-28T19:00:00Z,3.42,rising row." >&2
        exit 1
    fi
    echo "PASS: canonical match row present."

    echo "== Verifying NO OTHER CSV has the canonical match row =="
    others=$(grep -lE '^2026-04-28T19:00:00Z,3\.42,rising$' "$HERE/weather-archive/site/charts/tides/"*.csv 2>/dev/null | grep -v "/${inner}.csv" || true)
    if [ -n "$others" ]; then
        echo "FAIL: canonical row also present in:" >&2
        echo "$others" >&2
        exit 1
    fi
    echo "PASS: canonical row uniquely identifies $inner."

    echo "== All static verification checks passed =="
}

case "${1:-all}" in
    all|build) cmd_build ;;
    up)        cmd_up ;;
    down)      cmd_down ;;
    verify)    cmd_verify ;;
    *) echo "usage: $0 [build|up|down|verify]" >&2; exit 2 ;;
esac

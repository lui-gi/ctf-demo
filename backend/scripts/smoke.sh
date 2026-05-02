#!/usr/bin/env bash
# progctf — happy-path smoke test
#
# Exercises:
#   1. POST /api/auth/sign-articles  — register a Pirate
#   2. POST /api/auth/board          — login (verifies cookie issued)
#   3. POST /api/crews                — create a Crew
#   4. POST /api/islands/:slug/submit — malformed flag → 400
#   5. POST /api/islands/:slug/submit — wrong flag      → 200 ERR_WRONG_TREASURE (logged)
#   6. POST /api/islands/:slug/submit — correct flag    → 200, points awarded
#   7. GET  /api/charts/me            — verify standing reflects the solve
#
# REQUIREMENT: a published Island slug + the canonical correct flag.
# Override with env vars: ISLAND_SLUG=... CORRECT_FLAG=...
#
# Server must be running at $BASE (default http://localhost:4000).

set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
ISLAND_SLUG="${ISLAND_SLUG:-the_first_port}"
CORRECT_FLAG="${CORRECT_FLAG:-progctf{set_sail}}"

TS=$(date +%s)
EMAIL="smoke_${TS}@progctf.test"
HANDLE="smoke_${TS}"
PASSWORD="hunter2hunter2"
CREW_NAME="SmokeCrew_${TS}"

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

say() { echo -e "\n>>> $*"; }
expect() {
  local got=$1 want=$2 label=$3
  if [[ "$got" != "$want" ]]; then
    echo "FAIL: $label — expected $want, got $got"
    exit 1
  fi
  echo "OK   $label (HTTP $got)"
}

say "Step 1: sign articles ($EMAIL)"
STATUS=$(curl -sS -o /tmp/r1.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"handle\":\"$HANDLE\",\"password\":\"$PASSWORD\"}" \
  "$BASE/api/auth/sign-articles")
expect "$STATUS" "201" "register"

say "Step 2: board (login)"
STATUS=$(curl -sS -o /tmp/r2.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE/api/auth/board")
expect "$STATUS" "200" "login"

say "Step 3: create Crew ($CREW_NAME)"
STATUS=$(curl -sS -o /tmp/r3.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d "{\"name\":\"$CREW_NAME\"}" \
  "$BASE/api/crews/")
expect "$STATUS" "201" "crew create"

say "Step 4: submit MALFORMED flag (expect 400)"
STATUS=$(curl -sS -o /tmp/r4.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d '{"flag":"not-a-flag"}' \
  "$BASE/api/islands/$ISLAND_SLUG/submit")
expect "$STATUS" "400" "malformed flag"
grep -q ERR_BAD_FORMAT /tmp/r4.json && echo "OK   ERR_BAD_FORMAT in body" || (echo "FAIL: expected ERR_BAD_FORMAT" && exit 1)

say "Step 5: submit WRONG flag (expect 200 + ERR_WRONG_TREASURE)"
STATUS=$(curl -sS -o /tmp/r5.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d '{"flag":"progctf{definitely_wrong}"}' \
  "$BASE/api/islands/$ISLAND_SLUG/submit")
expect "$STATUS" "200" "wrong flag (logged but not awarded)"
grep -q ERR_WRONG_TREASURE /tmp/r5.json && echo "OK   ERR_WRONG_TREASURE in body" || (echo "FAIL: expected ERR_WRONG_TREASURE" && exit 1)

say "Step 6: submit CORRECT flag (expect 200, points awarded)"
STATUS=$(curl -sS -o /tmp/r6.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'content-type: application/json' \
  -d "{\"flag\":\"$CORRECT_FLAG\"}" \
  "$BASE/api/islands/$ISLAND_SLUG/submit")
expect "$STATUS" "200" "correct flag"
grep -q '"ok":true' /tmp/r6.json && echo "OK   ok=true in body" || (echo "FAIL: expected ok=true" && cat /tmp/r6.json && exit 1)

say "Step 7: GET /api/charts/me (verify standing)"
STATUS=$(curl -sS -o /tmp/r7.json -w '%{http_code}' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  "$BASE/api/charts/me")
expect "$STATUS" "200" "charts/me"
grep -q "$ISLAND_SLUG" /tmp/r7.json && echo "OK   solved island appears in standing" || (echo "FAIL: solved island not in standing" && cat /tmp/r7.json && exit 1)

echo
echo "===== SMOKE PASSED ====="

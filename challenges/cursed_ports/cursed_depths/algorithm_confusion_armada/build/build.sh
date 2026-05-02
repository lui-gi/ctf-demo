#!/bin/sh
# build.sh — orchestrate the algorithm_confusion_armada multi-service stack.

set -eu

ISLAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ISLAND_DIR/src"
BUILD_DIR="$ISLAND_DIR/build"
COMPOSE_FILE="$BUILD_DIR/docker-compose.yml"

case "${1:-up}" in
  up)
    docker compose -f "$COMPOSE_FILE" up --build -d
    sleep 8
    docker compose -f "$COMPOSE_FILE" ps
    echo
    echo "[build] auth on :8081, dispatch on :8082"
    echo "[build] full exploit chain documented in solution.md"
    ;;
  down)
    docker compose -f "$COMPOSE_FILE" down -v
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f auth dispatch
    ;;
  verify)
    echo "[verify] checking source tree exists..."
    for f in \
      auth-service/app.js auth-service/Dockerfile auth-service/package.json \
      dispatch-service/app.js dispatch-service/Dockerfile dispatch-service/package.json \
      metadata-mock/app.py metadata-mock/Dockerfile \
      s3-mock-init/seed.sh s3-mock-init/Dockerfile
    do
      test -f "$SRC_DIR/$f" || { echo "MISSING $f"; exit 1; }
    done
    test -f "$COMPOSE_FILE" || { echo "MISSING docker-compose.yml"; exit 1; }

    echo "[verify] checking auth-service verifier accepts BOTH RS256 and HS256..."
    if ! grep -F 'algorithms: ["RS256", "HS256"]' "$SRC_DIR/auth-service/app.js" >/dev/null; then
      echo "FAIL: auth-service verifier does not accept both algorithms" >&2
      exit 1
    fi

    echo "[verify] checking dispatch-service verifier accepts BOTH RS256 and HS256..."
    if ! grep -F 'algorithms: ["RS256", "HS256"]' "$SRC_DIR/dispatch-service/app.js" >/dev/null; then
      echo "FAIL: dispatch-service verifier does not accept both algorithms" >&2
      exit 1
    fi

    echo "[verify] checking dispatch deny-list does NOT include 169.254.0.0/16..."
    # Look for 169.254 inside string literals (deny-list contents), not in comments.
    if grep -nE '"169\.254|'\''169\.254|169\.254\.169\.254"' "$SRC_DIR/dispatch-service/app.js" >/dev/null; then
      echo "FAIL: dispatch source includes 169.254 in a string literal — likely on the deny list!" >&2
      exit 1
    fi

    echo "[verify] checking dispatch deny-list DOES include localhost+127.0.0.1..."
    if ! grep -F '"127.0.0.1"' "$SRC_DIR/dispatch-service/app.js" >/dev/null; then
      echo "FAIL: dispatch deny-list missing 127.0.0.1" >&2
      exit 1
    fi
    if ! grep -F '"localhost"' "$SRC_DIR/dispatch-service/app.js" >/dev/null; then
      echo "FAIL: dispatch deny-list missing localhost" >&2
      exit 1
    fi

    echo "[verify] checking metadata-mock binds inside 169.254.0.0/16..."
    if ! grep -F '169.254.169.254' "$COMPOSE_FILE" >/dev/null; then
      echo "FAIL: docker-compose does not assign 169.254.169.254 to metadata-mock" >&2
      exit 1
    fi
    if ! grep -F '169.254.0.0/16' "$COMPOSE_FILE" >/dev/null; then
      echo "FAIL: compose network does not include 169.254.0.0/16 subnet" >&2
      exit 1
    fi

    echo "[verify] checking s3-mock seeds the flag into the bucket..."
    if ! grep -q 'progctf{the_armada_confused_its_algorithms}' "$COMPOSE_FILE"; then
      echo "FAIL: ARMADA_FLAG env not set in compose for s3-mock-init" >&2
      exit 1
    fi
    if ! grep -q 'sealed' "$SRC_DIR/s3-mock-init/seed.sh"; then
      echo "FAIL: seed.sh does not create the 'sealed' bucket" >&2
      exit 1
    fi
    if ! grep -q 'manifest.txt' "$SRC_DIR/s3-mock-init/seed.sh"; then
      echo "FAIL: seed.sh does not write manifest.txt" >&2
      exit 1
    fi

    echo "[verify] checking the flag is NOT in any source code (only compose env)..."
    for f in auth-service/app.js dispatch-service/app.js metadata-mock/app.py s3-mock-init/seed.sh; do
      if grep -q "progctf{the_armada" "$SRC_DIR/$f"; then
        echo "FAIL: flag literal found in $f — should ONLY be in compose ARMADA_FLAG env" >&2
        exit 1
      fi
    done

    echo "[verify] OK — static checks pass"
    ;;
  *)
    echo "usage: $0 {up|down|logs|verify}" >&2
    exit 2
    ;;
esac

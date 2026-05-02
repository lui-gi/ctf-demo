#!/bin/sh
# build.sh — build, run, and tear down the port_authority_jwt container.
#
# Usage:
#   bash build/build.sh build   # build the docker image
#   bash build/build.sh up      # build + run (foreground); exposes :8080
#   bash build/build.sh down    # stop the running container
#   bash build/build.sh logs    # tail logs
#   bash build/build.sh verify  # run static checks (no Docker)

set -eu

ISLAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ISLAND_DIR/src"
IMAGE_TAG="progctf/port-authority:latest"
CONTAINER_NAME="port-authority"
JWT_SECRET="salt_marks_secret_2017"

case "${1:-up}" in
  build)
    docker build -t "$IMAGE_TAG" "$SRC_DIR"
    ;;
  up)
    docker build -t "$IMAGE_TAG" "$SRC_DIR"
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker run -d --name "$CONTAINER_NAME" \
      -p 8080:8080 \
      -e JWT_SECRET="$JWT_SECRET" \
      "$IMAGE_TAG"
    sleep 2
    docker logs "$CONTAINER_NAME"
    echo
    echo "[build] container 'port-authority' running on :8080"
    echo "[build] try:  curl http://localhost:8080/.git/HEAD"
    ;;
  down)
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    ;;
  logs)
    docker logs -f "$CONTAINER_NAME"
    ;;
  verify)
    # Static checks (no Docker daemon required)
    echo "[verify] checking source files exist..."
    test -f "$SRC_DIR/app.js"          || { echo "MISSING app.js"; exit 1; }
    test -f "$SRC_DIR/package.json"    || { echo "MISSING package.json"; exit 1; }
    test -f "$SRC_DIR/Dockerfile"      || { echo "MISSING Dockerfile"; exit 1; }
    test -f "$SRC_DIR/git_init.sh"     || { echo "MISSING git_init.sh"; exit 1; }
    test -f "$SRC_DIR/entrypoint.sh"   || { echo "MISSING entrypoint.sh"; exit 1; }
    echo "[verify] checking the runtime app.js does NOT contain the literal secret..."
    if grep -q "salt_marks_secret_2017" "$SRC_DIR/app.js"; then
      echo "FAIL: runtime app.js contains the literal secret — it must read from env" >&2
      exit 1
    fi
    echo "[verify] checking git_init.sh embeds the literal secret in commit 1..."
    if ! grep -q "salt_marks_secret_2017" "$SRC_DIR/git_init.sh"; then
      echo "FAIL: git_init.sh does not embed the secret in commit 1" >&2
      exit 1
    fi
    echo "[verify] checking the flag is in the runtime app.js (admin/logbook banner)..."
    if ! grep -q "progctf{never_commit_thy_secrets}" "$SRC_DIR/app.js"; then
      echo "FAIL: flag string missing from /admin/logbook handler" >&2
      exit 1
    fi
    echo "[verify] checking the flag is NOT in any commit-1 source..."
    if grep -q "progctf{" "$SRC_DIR/git_init.sh"; then
      echo "FAIL: git_init.sh leaks the flag into git history" >&2
      exit 1
    fi
    echo "[verify] OK — static checks pass"
    ;;
  *)
    echo "usage: $0 {build|up|down|logs|verify}" >&2
    exit 2
    ;;
esac

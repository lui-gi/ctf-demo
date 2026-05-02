#!/usr/bin/env bash
# Local-dev wrapper for drowned_admin.
# Reads ../flag.txt, exports CHALLENGE_FLAG, then `docker compose up --build`.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISLAND="$(cd "${HERE}/.." && pwd)"

FLAG_FILE="${ISLAND}/flag.txt"
if [[ ! -f "${FLAG_FILE}" ]]; then
  echo "drowned_admin/build.sh: ${FLAG_FILE} not found" >&2
  exit 1
fi

CHALLENGE_FLAG="$(tr -d '[:space:]' < "${FLAG_FILE}")"
if [[ ! "${CHALLENGE_FLAG}" =~ ^progctf\{[a-z0-9_]+\}$ ]]; then
  echo "drowned_admin/build.sh: flag.txt does not match progctf{[a-z0-9_]+}" >&2
  exit 1
fi
export CHALLENGE_FLAG

cd "${HERE}"
exec docker compose up --build "$@"

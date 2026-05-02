#!/bin/sh
# weather-archive entrypoint.
#
# Sanity-checks that the harbour slug expected by the player (the body of
# CHALLENGE_FLAG, with the progctf{} wrapper stripped) actually has a CSV
# served from this image. We do NOT inject the flag into any served file
# at runtime — the harbour name appears literally in the static catalogue
# (/charts/tides/index.html) and in its CSV (/charts/tides/<slug>.csv) as
# the intended hiding place.
#
# If CHALLENGE_FLAG is unset (e.g. local smoke test) we proceed silently
# so this image can boot in isolation for healthcheck testing.

set -eu

if [ -n "${CHALLENGE_FLAG:-}" ]; then
    inner=$(printf '%s' "$CHALLENGE_FLAG" | sed -n 's/^progctf{\(.*\)}$/\1/p')
    if [ -z "$inner" ]; then
        echo "FATAL: CHALLENGE_FLAG does not match expected format progctf{...}" >&2
        exit 1
    fi
    csv="/usr/share/nginx/html/charts/tides/${inner}.csv"
    if [ ! -f "$csv" ]; then
        echo "FATAL: weather-archive does not have a CSV for harbour '${inner}'." >&2
        echo "       Expected file: $csv" >&2
        echo "       The harbour catalogue and CSVs are baked into the image at build time;" >&2
        echo "       if the flag harbour changes, the static site must be regenerated." >&2
        exit 1
    fi
fi

exec "$@"

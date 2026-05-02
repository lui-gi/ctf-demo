#!/bin/sh
# entrypoint for vault.marrowtide.example
#
# Reads CHALLENGE_FLAG from environment (a string of the form
# progctf{word1_word2_word3_word4_word5}), extracts the inner words separated
# by underscores, and templates the five {{WORD_1..5}} placeholders in
# /site/known-issues/cgo7w3.html.
#
# This is the ONLY place the flag literal is consumed. The literal is never
# committed to the image source.

set -eu

if [ -z "${CHALLENGE_FLAG:-}" ]; then
    echo "FATAL: CHALLENGE_FLAG environment variable is not set." >&2
    exit 1
fi

# Strip "progctf{" prefix and "}" suffix.
inner=$(printf '%s' "$CHALLENGE_FLAG" | sed -n 's/^progctf{\(.*\)}$/\1/p')
if [ -z "$inner" ]; then
    echo "FATAL: CHALLENGE_FLAG does not match expected format progctf{...}" >&2
    exit 1
fi

# Split inner on underscore. We expect exactly 5 words.
i=1
WORDS=""
OLDIFS=$IFS
IFS='_'
for w in $inner; do
    case $i in
      1) WORD_1="$w" ;;
      2) WORD_2="$w" ;;
      3) WORD_3="$w" ;;
      4) WORD_4="$w" ;;
      5) WORD_5="$w" ;;
    esac
    i=$((i + 1))
done
IFS=$OLDIFS

if [ "$i" -ne 6 ]; then
    echo "FATAL: CHALLENGE_FLAG inner body must have exactly 5 underscore-separated words; got $((i-1))." >&2
    exit 1
fi

# Copy the static site to the runtime root and template the known-issues page.
mkdir -p /usr/share/nginx/html
cp -R /site/. /usr/share/nginx/html/

src="/site/known-issues/cgo7w3.html"
dst="/usr/share/nginx/html/known-issues/cgo7w3.html"

if [ ! -f "$src" ]; then
    echo "FATAL: template $src not present in image." >&2
    exit 1
fi

# Use sed to substitute placeholders. Words are lowercase ASCII per the flag regex.
sed -e "s/{{WORD_1}}/$WORD_1/g" \
    -e "s/{{WORD_2}}/$WORD_2/g" \
    -e "s/{{WORD_3}}/$WORD_3/g" \
    -e "s/{{WORD_4}}/$WORD_4/g" \
    -e "s/{{WORD_5}}/$WORD_5/g" \
    "$src" > "$dst"

# Sanity check: render must NOT contain any "{{" placeholders left over.
if grep -q '{{WORD_' "$dst"; then
    echo "FATAL: rendered known-issues page still contains placeholders." >&2
    exit 1
fi

# Sanity check: render must NOT contain the literal flag string anywhere.
# (The 5 words are placed individually into 5 alt attributes; the literal
# "progctf{...}" string must NOT be reconstructed in the rendered HTML.)
if grep -q 'progctf{' "$dst"; then
    echo "FATAL: rendered known-issues page accidentally contains the flag literal." >&2
    exit 1
fi

# Hand off to nginx.
exec "$@"

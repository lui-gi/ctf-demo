#!/usr/bin/env bash
# Memory of the Helmsman -- artifact builder.
#
# REQUIRES a Linux host (or WSL2 with kernel headers) that can:
#   - run gpg with --batch / --symmetric
#   - load the LiME kernel module (or accept a documented Linux test dump)
#   - run vim and produce a real .swp file in /tmp
#
# This script CANNOT run on a stock Windows host. It must be invoked from
# inside the challenge build VM. The Cartographer's spec explicitly calls
# this out; see the report appended to solution.md for the blocker.
#
# Steps:
#   1. encrypt files/sealed.gpg from flag.txt (passphrase = $PASSPHRASE)
#   2. on the build VM:
#        - as user 'helmsman', vim /tmp/note, type the passphrase, save&quit
#          (this leaves /tmp/.note.swp on disk)
#        - run `gpg --batch --passphrase "$PASSPHRASE" --decrypt sealed.gpg
#               > /dev/null` (caches passphrase in gpg-agent)
#        - drop a couple of decoy /tmp/*.swp files with unrelated content
#        - load LiME with format=lime path=files/dump.lime
#   3. validate: vol3 -f files/dump.lime banners.banners | grep Linux
#                vol3 -f files/dump.lime linux.bash         | grep -i sealed
#                vol3 -f files/dump.lime linux.find_file --find /tmp/.note.swp
#   4. spotcheck: strings files/dump.lime | grep -F 'progctf{'   # MUST be empty

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLAG="$(cat "$ROOT/flag.txt")"
PASSPHRASE="pale_cassandra_drift_19"

mkdir -p "$ROOT/files"

# (1) The encrypted file -- this part runs anywhere gpg is installed.
printf '%s\n' "$FLAG" | gpg --batch --yes --passphrase "$PASSPHRASE" \
    --cipher-algo AES256 --symmetric \
    --output "$ROOT/files/sealed.gpg"

# Sanity: gpg round-trip.
printf '%s' "$PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
    --decrypt "$ROOT/files/sealed.gpg" > /tmp/_helmsman_check
diff <(printf '%s\n' "$FLAG") /tmp/_helmsman_check
rm -f /tmp/_helmsman_check
echo "sealed.gpg round-trip OK"

# (2)-(3) On a Linux build VM only:
if [ "$(uname -s)" = "Linux" ] && [ -e /proc/kcore ] && command -v insmod >/dev/null; then
    HELMSMAN_HOME="${HELMSMAN_HOME:-/home/helmsman}"
    sudo -u helmsman bash -lc "
      cd /tmp
      printf '%s\n' '$PASSPHRASE'      > /tmp/note    # primes vim's buffer
      printf 'just my fishing list\n'  > /tmp/grocery
      printf 'crew shifts for sunday\n' > /tmp/shifts
      vim -c ':write|:quit' /tmp/note      </dev/null   # leaves /tmp/.note.swp
      vim -c ':write|:quit' /tmp/grocery   </dev/null
      vim -c ':write|:quit' /tmp/shifts    </dev/null
      gpg --batch --passphrase '$PASSPHRASE' --decrypt $ROOT/files/sealed.gpg \
          > /tmp/decrypted.txt 2>/dev/null || true
    "
    # LiME must be built against the running kernel (apt install lime-forensics-dkms).
    sudo insmod /usr/src/lime-*/lime.ko \
        path="$ROOT/files/dump.lime" format=lime
    sudo rmmod lime
    sudo chown "$USER:" "$ROOT/files/dump.lime"

    # (3) validate
    vol3 -f "$ROOT/files/dump.lime" banners.banners | grep -i linux
    vol3 -f "$ROOT/files/dump.lime" linux.bash      | grep -i 'sealed.gpg'
    vol3 -f "$ROOT/files/dump.lime" linux.find_file \
        --find /tmp/.note.swp --output-dir /tmp/ ;
    strings /tmp/.note.swp | grep -F "$PASSPHRASE"
    if strings "$ROOT/files/dump.lime" | grep -F "$FLAG" >/dev/null ; then
        echo "FAIL: flag plaintext leaked into the dump" >&2
        exit 1
    fi
    echo "dump.lime built and validated"
else
    cat >&2 <<'EOF'
Skipping LiME capture: not on a suitable Linux host.

Next operator must run THIS script on a Linux build VM with:
  - matching kernel headers
  - lime-forensics-dkms installed (or LiME built from source)
  - volatility3 with linux symbol tables for the running kernel
  - a 'helmsman' user account
  - sudo access for insmod
EOF
fi

# (4) MANIFEST
cat > "$ROOT/files/MANIFEST.txt" <<'EOF'
dump.lime    256 MiB Linux memory dump in LiME format. Volatility 3 friendly.
sealed.gpg   AES256-symmetric GPG ciphertext. Passphrase recoverable from the
             dump (specifically: from a vim swap file in /tmp).
EOF
echo "MANIFEST written"

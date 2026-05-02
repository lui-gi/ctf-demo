#!/usr/bin/env bash
# Davy Jones's Locker -- artifact builder.
#
# Produces files/tidekeeper.lime (1 GB Linux LiME memory dump). Two-stage
# intended solve requires the dump to contain BOTH:
#   (a) a live gpg-agent process whose heap still holds a 32-byte AES key
#   (b) cached page-cache pages of an unlinked SQLCipher database
#       (logbook.db) whose key is exactly that 32-byte value
#
# Per the spec's feasibility caveat: this absolutely cannot be produced on
# a Windows host. It needs:
#   - Linux VM, Ubuntu 22.04 / kernel 6.1.x, ~1.5 GB RAM
#   - sqlcipher (apt install sqlcipher python3-pysqlcipher3)
#   - gpg + gpg-preset-passphrase (apt install gnupg2)
#   - LiME kernel module built against the running kernel
#   - volatility3 with the matching linux symbol tables, for self-test
#
# This script is the executable runbook. On non-Linux hosts it stops at the
# preflight check and prints the blocker; an unblocked operator can re-run
# it inside the build VM to produce tidekeeper.lime.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLAG="$(cat "$ROOT/flag.txt")"

mkdir -p "$ROOT/files"

if [ "$(uname -s)" != "Linux" ] ; then
    cat >&2 <<EOF
BLOCKED: davy_jones_locker requires a Linux build VM.

Reason: the artifact is a 1 GB LiME memory dump that must contain a *live*
gpg-agent heap and *cached* SQLCipher page-cache pages of an unlinked file.
Neither can be synthesized on a Windows host without booting Linux.

Provision: Ubuntu 22.04 VM, 1.5 GB RAM, root access, then re-run:
    bash $0
EOF
    exit 2
fi

# --- inside the build VM only -----------------------------------------

KEY_HEX="$(openssl rand -hex 32)"   # 64-hex-char => 32-byte raw key
DB=/var/lib/tidekeeper/logbook.db
mkdir -p "$(dirname "$DB")"

python3 - "$KEY_HEX" "$DB" "$FLAG" <<'PY'
import secrets, sys, sqlite3
key_hex, db_path, flag = sys.argv[1:4]
# pysqlcipher3 mirrors sqlite3 stdlib API
from pysqlcipher3 import dbapi2 as sqlite
con = sqlite.connect(db_path)
con.execute(f"PRAGMA key = \"x'{key_hex}'\";")
con.execute("PRAGMA cipher_page_size = 4096;")
con.execute("CREATE TABLE logbook(id INTEGER PRIMARY KEY, "
            "officer TEXT, date TEXT, notes TEXT);")
import random
random.seed(0xD00DFEED)
officers = ["Greaves","Tully","Margaret","Tom","Pike","Halloran","Rance"]
for i in range(50):
    o = random.choice(officers)
    d = f"17{random.randint(50,99):02d}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
    n = random.choice([
        "shore-leave granted, returned sober",
        "rum ration short by half a pint, cooper to investigate",
        "cargo manifest reconciled",
        "sail mended, no further action",
        "compass calibration drift 2 degrees, corrected",
    ])
    con.execute("INSERT INTO logbook(officer,date,notes) VALUES (?,?,?)",(o,d,n))
con.execute("INSERT INTO logbook(officer,date,notes) VALUES (?,?,?)",
            ("Quartermaster","1789-04-01",flag))
con.commit(); con.close()
PY

# Cache the same key in gpg-agent so its heap holds the bytes.
# gpg-preset-passphrase wants a CACHEID -- we use a synthetic one.
gpgconf --launch gpg-agent
CACHEID=$(echo -n tidekeeper | sha1sum | cut -d' ' -f1)
echo "$KEY_HEX" | /usr/lib/gnupg/gpg-preset-passphrase --preset "$CACHEID"

# Sanity: process must still be alive at dump time.
pgrep -x gpg-agent >/dev/null

# Drop the inode -- pages stay in cache because no other writer touched them.
sync
unlink "$DB"

# Capture.
LIME=/usr/src/lime-*/lime.ko
sudo insmod $LIME path="$ROOT/files/tidekeeper.lime" format=lime
sudo rmmod lime
sudo chown "$USER:" "$ROOT/files/tidekeeper.lime"

# Self-test the intended solve. (Stage 1+2 combined script lives at
# build/dryrun_solve.py -- written below.)
python3 "$ROOT/build/dryrun_solve.py" \
    --dump "$ROOT/files/tidekeeper.lime" \
    --expected-flag "$FLAG"

# Anti-leak.
if strings "$ROOT/files/tidekeeper.lime" | grep -F "$FLAG" >/dev/null ; then
    echo "FAIL: plaintext flag found in dump (would be unintended solve)" >&2
    exit 1
fi

cat > "$ROOT/files/MANIFEST.txt" <<EOF
tidekeeper.lime    1 GiB Linux memory dump in LiME format. Volatility 3
                   friendly. Two-stage forensic challenge: extract a key
                   from gpg-agent heap, reassemble a deleted SQLCipher
                   database from page-cache pages, decrypt with the key.
EOF
echo "tidekeeper.lime built, validated, no plaintext flag leak"

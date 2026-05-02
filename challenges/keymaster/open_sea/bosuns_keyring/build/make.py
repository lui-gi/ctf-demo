"""Build script for bosuns_keyring.

Produces:
  files/shipnames.txt  — 800 fictional 18th-century ship names
  files/treasure.7z    — header-encrypted 7z archive containing treasure.txt
  files/MANIFEST.txt

The password follows the leaked pattern <shipname><year><!|?|.>; the spec hard-codes
Reefborn1803! per Cartographer's pick. shipnames.txt MUST contain "Reefborn" in
positions 51..749 (i.e. neither the first nor the last 50) so the player must
brute through.

Determinism:
  Ship names are drawn from a deterministic generator seeded with a known constant
  so two builds produce byte-identical artifacts. Reefborn is force-inserted at a
  fixed mid-list position; the rest of the list is the deterministic generator's
  output with collision avoidance.

Tooling:
  Uses 7z.exe at "C:\\Program Files\\7-Zip\\7z.exe" for the archive (py7zr's header-
  encryption support is fragile). Build aborts cleanly if 7z is not on PATH or at
  the standard install location.
"""
from __future__ import annotations

import hashlib
import os
import subprocess
import sys
import shutil
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

PASSWORD = "Reefborn1803!"
TARGET_NAME = "Reefborn"
TARGET_POSITION = 412  # mid-list, well inside the 51..749 spec window
NUM_NAMES = 800


def make_rng(seed: bytes):
    counter = [0]

    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    def randint(a: int, b: int) -> int:
        span = b - a + 1
        nb = max(1, ((span - 1).bit_length() + 7) // 8)
        while True:
            x = int.from_bytes(randbytes(nb), "big")
            if x < (1 << (span - 1).bit_length() if span > 1 else 1):
                return a + (x % span)

    def choice(seq):
        return seq[randint(0, len(seq) - 1)]

    return randbytes, randint, choice


randbytes, randint, choice = make_rng(b"bosuns_keyring|seed")

# Deterministic 18th-century-style ship name generator
PREFIXES = [
    "Salt", "Iron", "Crimson", "Bone", "Ash", "Black", "White", "Grey",
    "Storm", "Wind", "Tide", "Wave", "Sea", "Coral", "Reef", "Foam",
    "Crescent", "Silver", "Golden", "Brass", "Cinder", "Ember",
    "Twilight", "Morning", "Evening", "Midnight", "Dawn", "Dusk",
    "Bramble", "Fern", "Holly", "Cedar", "Oak", "Pine", "Hawthorn",
    "Wraith", "Spirit", "Ghost", "Phantom", "Shade", "Mist",
    "Dread", "Bold", "Fierce", "Brave", "Noble", "Loyal",
    "Captain", "Bosun", "Skipper", "Pilot", "Mariner",
    "Drifter", "Wanderer", "Voyager", "Pilgrim", "Rover",
]
SUFFIXES = [
    "wing", "song", "wake", "tide", "drift", "haven", "harbor",
    "spire", "crest", "vale", "watch", "ward", "keeper",
    "Hawk", "Heron", "Kingfisher", "Petrel", "Tern", "Gannet",
    "Pheasant", "Sparrow", "Lark", "Wren", "Finch",
    "Maid", "Lady", "Queen", "Daughter", "Sister",
    "Sword", "Lance", "Shield", "Anchor", "Compass",
    "born", "bound", "hold", "fall", "leap", "flight",
    "mark", "way", "rise", "moon", "sun", "star",
]
SOLO_NAMES = [
    "Albatross", "Petrel", "Tern", "Marlin", "Bonito",
    "Hesperus", "Maribel", "Calypso", "Andromeda", "Polaris",
    "Boreas", "Eurus", "Notus", "Zephyr", "Aeolus",
    "Hyacinth", "Hibiscus", "Magnolia", "Iris", "Lily",
    "Concord", "Eclipse", "Endeavour", "Resolution", "Discovery",
    "Adamant", "Constant", "Defiant", "Determined", "Enterprise",
]


def make_name() -> str:
    style = randint(0, 9)
    if style < 4:  # 40% prefix+suffix
        return choice(PREFIXES) + choice(SUFFIXES)
    elif style < 7:  # 30% prefix+capitalized suffix
        s = choice(SUFFIXES)
        return choice(PREFIXES) + s[0].upper() + s[1:]
    else:  # 30% solo classical name
        return choice(SOLO_NAMES)


names = set()
ordered: list[str] = []
attempts = 0
while len(ordered) < NUM_NAMES - 1:  # -1 to leave room for forced Reefborn
    n = make_name()
    if n == TARGET_NAME:
        continue  # only one Reefborn, in the forced position
    if n in names:
        attempts += 1
        if attempts > NUM_NAMES * 50:
            raise SystemExit("name generator collision rate too high")
        continue
    names.add(n)
    ordered.append(n)

# Insert Reefborn at the fixed mid-list position
ordered.insert(TARGET_POSITION, TARGET_NAME)
assert len(ordered) == NUM_NAMES
assert TARGET_POSITION >= 50 and TARGET_POSITION < NUM_NAMES - 50, (
    f"Reefborn at position {TARGET_POSITION} violates the 'not first/last 50' spec"
)
assert ordered[TARGET_POSITION] == TARGET_NAME

(OUT / "shipnames.txt").write_text("\n".join(ordered) + "\n", encoding="utf-8")

# Build the encrypted 7z archive
treasure_txt = ISLAND / "build" / "_treasure.txt"  # staged inside build/, never in files/
treasure_txt.write_text(flag + "\n", encoding="utf-8")

archive_path = OUT / "treasure.7z"
if archive_path.exists():
    archive_path.unlink()

candidates = [
    r"C:\Program Files\7-Zip\7z.exe",
    "7z",
    "7za",
]
seven_z = None
for c in candidates:
    if Path(c).exists() or shutil.which(c):
        seven_z = c
        break
if seven_z is None:
    raise SystemExit("7z executable not found; install 7-Zip or place 7za on PATH")

# 7z a -p<pwd> -mhe=on archive.7z file
# We rename the staged file to treasure.txt inside the archive by passing a
# directory layout: copy into a temp directory under build/staging/treasure.txt
staging = ISLAND / "build" / "_staging"
staging.mkdir(exist_ok=True)
(staging / "treasure.txt").write_text(flag + "\n", encoding="utf-8")

result = subprocess.run(
    [seven_z, "a", f"-p{PASSWORD}", "-mhe=on", str(archive_path), str(staging / "treasure.txt")],
    capture_output=True,
    text=True,
)
if result.returncode != 0:
    print("7z stdout:", result.stdout)
    print("7z stderr:", result.stderr)
    raise SystemExit(f"7z archive creation failed (exit {result.returncode})")

# Cleanup staging
(staging / "treasure.txt").unlink()
staging.rmdir()
treasure_txt.unlink()

# Verify the archive opens with the password and yields the canonical flag
import tempfile
with tempfile.TemporaryDirectory() as td:
    extract_result = subprocess.run(
        [seven_z, "x", f"-p{PASSWORD}", "-y", f"-o{td}", str(archive_path)],
        capture_output=True,
        text=True,
    )
    if extract_result.returncode != 0:
        raise SystemExit(f"extraction with correct password failed:\n{extract_result.stdout}\n{extract_result.stderr}")
    extracted = (Path(td) / "treasure.txt").read_text(encoding="utf-8").strip()
    assert extracted == flag, f"extracted contents {extracted!r} != canonical flag {flag!r}"

# Negative test: wrong password fails
neg = subprocess.run(
    [seven_z, "x", "-pwrongpassword", "-y", "-so", str(archive_path)],
    capture_output=True,
    text=True,
)
assert neg.returncode != 0, "wrong password should fail extraction"

manifest = (
    "The Bosun's Keyring — player-served files\n"
    "==========================================\n"
    f"shipnames.txt  — {NUM_NAMES} fictional 18th-century ship names, one per line.\n"
    f"                  No duplicates. The bosun's chosen name is somewhere in the\n"
    f"                  middle of the list (positions 51..{NUM_NAMES-50}).\n"
    "treasure.7z    — header-encrypted 7-Zip archive containing one file.\n"
    "                  Password follows the leaked pattern <shipname><year><!|?|.>\n"
    "                  with year in the 1790-1810 range.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

print("[bosuns_keyring] build OK")
print(f"  shipnames.txt   : {NUM_NAMES} names, Reefborn at line {TARGET_POSITION + 1}")
print(f"  treasure.7z     : {archive_path.stat().st_size} bytes (header-encrypted)")
print(f"  password (NOT shipped): {PASSWORD}")
print(f"  candidate keyspace: {NUM_NAMES} names x 21 years x 3 punct = {NUM_NAMES * 21 * 3:,}")

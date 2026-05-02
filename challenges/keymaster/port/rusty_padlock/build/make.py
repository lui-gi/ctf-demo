"""Build script for rusty_padlock — produces files/hash.txt + files/fruits.txt + MANIFEST.txt.

Reads the canonical flag from ../flag.txt at build time. Never hardcodes the flag literal.
Run: `python build/make.py` from the island folder.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

# 1. hash.txt — MD5 hex digest of the canonical flag string.
md5 = hashlib.md5(flag.encode("utf-8")).hexdigest()
(OUT / "hash.txt").write_text(md5 + "\n", encoding="utf-8")

# 2. fruits.txt — themed wordlist hint. Must NOT contain the literal flag string;
#    players use it as a "fruit-flavored" prompt to construct progctf{...} candidates.
fruits = [
    "apple", "apricot", "banana", "blackberry", "blueberry", "boysenberry",
    "cantaloupe", "cherry", "clementine", "coconut", "cranberry", "currant",
    "dragonfruit", "durian", "elderberry", "fig", "gooseberry", "grape",
    "grapefruit", "guava", "honeydew", "huckleberry", "jackfruit", "kiwi",
    "kumquat", "lemon", "lime", "loquat", "lychee", "mandarin",
    "mango", "mangosteen", "mulberry", "nectarine", "olive", "orange",
    "papaya", "passionfruit", "peach", "pear", "persimmon", "pineapple",
    "plantain", "plum", "pomegranate", "pomelo", "quince", "raspberry",
    "rhubarb", "salak", "soursop", "starfruit", "strawberry", "tamarind",
    "tangerine", "watermelon", "yuzu",
]
(OUT / "fruits.txt").write_text("\n".join(fruits) + "\n", encoding="utf-8")

# 3. MANIFEST.txt — sha256 + size of every file served to the player.
manifest_lines: list[str] = []
for fname in sorted(p.name for p in OUT.iterdir() if p.name not in {"MANIFEST.txt"}):
    data = (OUT / fname).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    manifest_lines.append(f"{fname}\tsize={len(data)}\tsha256={sha}")
manifest_lines.append("")
manifest_lines.append("# How to solve (player-facing reminder):")
manifest_lines.append("#   hashcat -m 0 hash.txt -a 0 fruits.txt --rules-name=base64")
manifest_lines.append("#   ... OR construct progctf{<fruit>_for_the_bosun} candidates from fruits.txt and MD5-check.")
(OUT / "MANIFEST.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

# 4. Self-verify: the recomputed MD5 of the flag must match what we just wrote.
assert hashlib.md5(flag.encode("utf-8")).hexdigest() == md5
# 5. Anti-leak: the literal flag string must NOT appear in any file under files/.
for p in OUT.iterdir():
    body = p.read_bytes()
    assert flag.encode("utf-8") not in body, f"FAIL: flag literal present in {p.name}"

print(f"OK rusty_padlock built. md5={md5}  files={[p.name for p in sorted(OUT.iterdir())]}")

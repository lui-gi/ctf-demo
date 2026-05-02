"""Build script for captains_caesar — produces files/parchment.txt + MANIFEST.txt.

ROT13-encodes a captain's-log paragraph that ends with the canonical flag. ROT13 is
chosen so 'progctf' encodes to 'cebtpgs' — a 7-character all-lowercase token that
gives players a clean handle for the obvious frequency analysis pivot.
"""
from __future__ import annotations

import codecs
import hashlib
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

# Plaintext paragraph. Pirate flavor + final line is the literal flag.
plaintext = (
    "The Captain wrote in haste, his quill scratching by lamplight as the ship pitched. "
    "He had received word that the bilge rats were plotting again, and the morning's "
    "wind had turned against the watch.\n"
    "\n"
    "He set down the cipher he had used since his first command — the same trick the "
    "old Roman general taught his lieutenants when the legion needed a quiet word "
    "between centurions. Easy to teach, easier to break, but useful for hurried notes "
    "in a captain's log.\n"
    "\n"
    "His final words on the parchment, before the lamp guttered out at last:\n"
    "\n"
    f"{flag}\n"
)
ciphertext = codecs.encode(plaintext, "rot_13")

(OUT / "parchment.txt").write_text(ciphertext, encoding="utf-8")

# MANIFEST
manifest_lines: list[str] = []
for fname in sorted(p.name for p in OUT.iterdir() if p.name != "MANIFEST.txt"):
    data = (OUT / fname).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    manifest_lines.append(f"{fname}\tsize={len(data)}\tsha256={sha}")
manifest_lines.append("")
manifest_lines.append("# How to solve:")
manifest_lines.append("#   tr 'A-Za-z' 'N-ZA-Mn-za-m' < parchment.txt")
manifest_lines.append("#   ... OR python -c \"import sys,codecs; print(codecs.decode(sys.stdin.read(),'rot_13'))\" < parchment.txt")
(OUT / "MANIFEST.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

# Self-verify
roundtrip = codecs.decode((OUT / "parchment.txt").read_text(encoding="utf-8"), "rot_13")
assert roundtrip == plaintext, "rot_13 round-trip mismatch"
assert flag in roundtrip, "flag missing from decoded plaintext"

# Anti-leak: the literal flag string must NOT appear in the ciphertext file.
ct_body = (OUT / "parchment.txt").read_bytes()
assert flag.encode("utf-8") not in ct_body, f"FAIL: flag literal in parchment.txt"

# Anti-shift-leak: the ciphertext must NOT contain the literal 'progctf' (which would
# happen if any non-13 shift accidentally produced the cleartext token).
assert b"progctf" not in ct_body, "FAIL: 'progctf' literal appears in ciphertext"

# Confirm the encoded marker the player will see after solving:
encoded_flag_marker = codecs.encode(flag, "rot_13")
assert encoded_flag_marker.encode("utf-8") in ct_body, f"encoded flag missing: {encoded_flag_marker}"

print(f"OK captains_caesar built. ciphertext starts: {ciphertext[:60]!r}...")
print(f"   encoded flag = {encoded_flag_marker}")

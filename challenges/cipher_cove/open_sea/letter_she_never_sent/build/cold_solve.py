"""Cold-solve harness for letter_she_never_sent.

Replays the player's intended chain end-to-end:
  1. waves.wav  → LSB extract every 8th sample → coordinate string
  2. shanty.pdf → walk each (page,line,word) triple → concatenate → passphrase
  3. letter.bin → PBKDF2(passphrase, b"deadwake-tides", 100_000) → AES-256-CBC decrypt
                  → recover Calypso's letter; final line normalizes to the flag.

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

import re
import struct
import wave
from pathlib import Path

import numpy as np
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from pypdf import PdfReader

ISLAND = Path(__file__).resolve().parent.parent
FILES = ISLAND / "files"

# --- step 1: LSB-extract coordinate string from waves.wav -----------------
STRIDE = 8
with wave.open(str(FILES / "waves.wav"), "rb") as w:
    nframes = w.getnframes()
    raw = w.readframes(nframes)
samples = np.frombuffer(raw, dtype=np.int16)
print(f"[player] waves.wav: {nframes} samples (stride {STRIDE})")

bits: list[int] = []
for i in range(0, nframes, STRIDE):
    bits.append(int(samples[i]) & 1)

# Pack MSB-first; stop searching once we see ||END||
out = bytearray()
for i in range(0, len(bits) // 8 * 8, 8):
    b = 0
    for j in range(8):
        b = (b << 1) | bits[i + j]
    out.append(b)

text = bytes(out)
end_idx = text.find(b"||END||")
assert end_idx != -1, "no ||END|| terminator found in LSB stream"
coord_string = text[:end_idx].decode("ascii")
print(f"[player] coord string: {coord_string!r}")

# Parse triples
triple_re = re.compile(r"p(\d+)l(\d+)w(\d+)")
triples = [(int(m.group(1)), int(m.group(2)), int(m.group(3)))
           for m in triple_re.finditer(coord_string)]
print(f"[player] parsed {len(triples)} triples")


# --- step 2: walk shanty.pdf with the triples → passphrase -----------------
reader = PdfReader(str(FILES / "shanty.pdf"))
SHANTY_TITLE = "The Tides Forget"
pages_lines: list[list[str]] = []
for page in reader.pages:
    body = []
    for ln in (page.extract_text() or "").splitlines():
        ln = ln.strip()
        if not ln:
            continue
        if ln == SHANTY_TITLE:
            continue
        if ln.startswith("— Verse") or ln.startswith("— page"):
            continue
        body.append(ln)
    pages_lines.append(body)
print(f"[player] shanty.pdf: {len(pages_lines)} pages, "
      f"line counts {[len(p) for p in pages_lines]}")


def normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


words_extracted = []
for p, l, w in triples:
    line = pages_lines[p - 1][l - 1]
    word = line.split()[w - 1]
    norm = normalize(word)
    words_extracted.append(norm)
    print(f"    ({p},{l},{w}) → {word!r} → {norm!r}")
passphrase = "".join(words_extracted)
print(f"[player] passphrase: {passphrase!r} ({len(passphrase)} chars)")


# --- step 3: PBKDF2 + AES-256-CBC decrypt letter.bin -----------------------
SALT = b"deadwake-tides"
ITERS = 100_000
kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=SALT, iterations=ITERS)
key = kdf.derive(passphrase.encode("utf-8"))

blob = (FILES / "letter.bin").read_bytes()
iv, ct = blob[:16], blob[16:]
dec = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
pt_padded = dec.update(ct) + dec.finalize()
pad_len = pt_padded[-1]
pt = pt_padded[:-pad_len].decode("utf-8")

# Show the last 5 lines of the letter
last_lines = [ln for ln in pt.splitlines() if ln.strip()][-5:]
print("\n[player] decrypted letter.bin (last 5 non-empty lines):")
for ln in last_lines:
    print(f"    {ln}")

# Final line normalized to flag format
final = last_lines[-1].strip().rstrip(".").lower()
final = re.sub(r"\s+", "_", final)
final = re.sub(r"[^a-z0-9_]", "", final)
flag_recovered = f"progctf{{{final}}}"
print(f"\nRECOVERED: {flag_recovered}")

# Sanity check
expected_flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
assert flag_recovered == expected_flag, f"mismatch: got {flag_recovered!r}, want {expected_flag!r}"

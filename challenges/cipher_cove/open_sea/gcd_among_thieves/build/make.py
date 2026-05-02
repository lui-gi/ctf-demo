"""Build script for gcd_among_thieves — produces files/{n1,n2,e1,e2,ciphertext,MANIFEST}.

Reads the canonical flag from ../flag.txt at build time. Never hardcodes the flag literal.

Determinism: a SHA-256-counter PRG seeded from ("gcd_among_thieves|" + flag) drives
pycryptodome's getPrime, so a second run produces byte-identical n1/n2/ciphertext.

Run: `python build/make.py` from the island folder.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from Crypto.Util.number import getPrime, bytes_to_long

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag_bytes = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip().encode("utf-8")


def make_rng(seed: bytes):
    """SHA-256-counter deterministic PRG. randfunc(n) returns n bytes."""
    counter = [0]

    def randfunc(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    return randfunc


rng = make_rng(b"gcd_among_thieves|" + flag_bytes)

# Two 2048-bit RSA moduli sharing one 1024-bit prime.
p = getPrime(1024, randfunc=rng)
q1 = getPrime(1024, randfunc=rng)
q2 = getPrime(1024, randfunc=rng)

assert p != q1 and p != q2 and q1 != q2, "Prime collision — regenerate with different seed."

n1 = p * q1
n2 = p * q2
e = 65537

# Raw RSA (no padding) — the challenge is GCD-based factorization recovery, not a
# padding oracle attack. Plaintext fits comfortably in a 2048-bit modulus.
m = bytes_to_long(flag_bytes)
assert m < n1, "Flag plaintext does not fit in modulus n1."
c = pow(m, e, n1)

# Sanity: gcd recovery actually works against the artifacts we are about to ship.
import math
g = math.gcd(n1, n2)
assert g == p, "gcd(n1, n2) != p — build is broken."
assert g != 1 and g != n1 and g != n2, "gcd is trivial — build is broken."
q1_recovered = n1 // p
phi = (p - 1) * (q1_recovered - 1)
d = pow(e, -1, phi)
m_recovered = pow(c, d, n1)
recovered = m_recovered.to_bytes((m_recovered.bit_length() + 7) // 8, "big")
assert recovered == flag_bytes, "Round-trip RSA decrypt did not recover flag."

# Write artifacts: decimal integers, one per file, trailing newline.
(OUT / "n1.txt").write_text(str(n1) + "\n", encoding="utf-8")
(OUT / "n2.txt").write_text(str(n2) + "\n", encoding="utf-8")
(OUT / "e1.txt").write_text(str(e) + "\n", encoding="utf-8")
(OUT / "e2.txt").write_text(str(e) + "\n", encoding="utf-8")
(OUT / "ciphertext.txt").write_text(str(c) + "\n", encoding="utf-8")

manifest = (
    "GCD Among Thieves — player-served files\n"
    "=========================================\n"
    "n1.txt          — Hodges's RSA modulus (2048 bits, decimal integer)\n"
    "n2.txt          — Maeve's RSA modulus  (2048 bits, decimal integer)\n"
    "e1.txt          — Hodges's public exponent (decimal integer)\n"
    "e2.txt          — Maeve's public exponent  (decimal integer)\n"
    "ciphertext.txt  — Treasure encrypted under Hodges's key (raw RSA, no padding)\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

print("[gcd_among_thieves] build OK")
print(f"  n1 = {n1.bit_length()} bits, n2 = {n2.bit_length()} bits, ciphertext = {c.bit_length()} bits")
print(f"  shared prime p recovered via gcd(n1, n2): {p.bit_length()} bits")
print(f"  round-trip plaintext == flag.txt: confirmed")

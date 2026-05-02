"""End-to-end verification harness for ecdsa_two_signatures.

Asserts:
  1. The deterministic seed re-derives the same private key d that signed the bundle.
  2. d * G matches the shipped pubkey.pem.
  3. All 80 shipped signatures verify under standard ECDSA on SHA-256(msg).
  4. All 80 nonces (recovered from d) have bit-length <= 248 (the intended bias).
  5. Signing the target message with d and feeding the signature to verifier.py
     prints the canonical flag and exits 0.

Does NOT run the LLL recovery itself — see solution.md verification block for the
deferred-to-Linux/Sage HNP attack note. This harness covers everything else.

Run:
  python build/verify_artifacts.py
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

from ecdsa import SECP256k1, VerifyingKey, SigningKey
from ecdsa.numbertheory import inverse_mod
from ecdsa.util import sigencode_string

ISLAND = Path(__file__).resolve().parent.parent
curve = SECP256k1
n = curve.order
G = curve.generator

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip().encode("utf-8")


def make_rng(seed: bytes):
    counter = [0]

    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    return randbytes


rng = make_rng(b"ecdsa_two_signatures|" + flag)
d = (int.from_bytes(rng(32), "big") % (n - 1)) + 1
print(f"[verify] re-derived private key d  : 0x{d:064x}")

vk = VerifyingKey.from_pem((ISLAND / "files" / "pubkey.pem").read_bytes())
expected = d * G
assert vk.pubkey.point.x() == expected.x() and vk.pubkey.point.y() == expected.y()
print("[verify] derived d matches shipped pubkey.pem: PASS")

sigs = json.loads((ISLAND / "files" / "signatures.json").read_text())
assert len(sigs) == 80, f"expected 80 signatures, got {len(sigs)}"

verified = 0
biased = 0
for sig in sigs:
    msg = bytes.fromhex(sig["msg_hex"])
    r = int(sig["r_hex"], 16)
    s = int(sig["s_hex"], 16)
    h = int.from_bytes(hashlib.sha256(msg).digest(), "big") % n
    k = (inverse_mod(s, n) * (h + r * d)) % n
    if k.bit_length() <= 248:
        biased += 1
    w = inverse_mod(s, n)
    P = (h * w % n) * G + (r * w % n) * vk.pubkey.point
    if P.x() % n == r:
        verified += 1

print(f"[verify] sigs that VERIFY: {verified}/80")
print(f"[verify] sigs whose nonces are biased to <=248 bits: {biased}/80")
assert verified == 80 and biased == 80

sk = SigningKey.from_secret_exponent(d, curve=curve)
target = (ISLAND / "files" / "target_message.txt").read_bytes()
sig = sk.sign(target, hashfunc=hashlib.sha256, sigencode=sigencode_string)
r_hex = sig[:32].hex()
s_hex = sig[32:].hex()
print(f"[verify] signed target with d:")
print(f"  r = {r_hex}")
print(f"  s = {s_hex}")

result = subprocess.run(
    [sys.executable, str(ISLAND / "files" / "verifier.py"), r_hex, s_hex],
    capture_output=True, text=True
)
print(f"[verify] verifier exit={result.returncode}, stdout={result.stdout.strip()!r}")
assert result.returncode == 0 and result.stdout.strip() == flag.decode()
print("[verify] verifier printed canonical flag: PASS")

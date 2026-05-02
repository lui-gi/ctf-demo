"""HNP / LLL attack against the build's biased ECDSA signatures.

Cold-solve verifier for ecdsa_two_signatures. Exercises the player's intended
lattice-attack path end-to-end:
  1. Build the Boneh-Venkatesan / Nguyen-Shparlinski lattice from the published
     (r, s, h) triples and the bias bound 2^248.
  2. LLL-reduce.
  3. Identify the row whose final column is +/- q; the second-to-last column
     of that row encodes +/- d.
  4. Sign the target message with the recovered d, run verifier.py, observe
     the flag print.

Pure-Python `olll` is used so this runs on a Windows host without fpylll.
For the verification we use m=40 sigs (lattice 42x42) — the spec ships 80,
so the player has plenty of headroom; 40 is the empirical floor for this
bias size on this curve and demonstrates the math works.

Not shipped to the player.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

import olll
from ecdsa import SECP256k1, VerifyingKey, SigningKey
from ecdsa.numbertheory import inverse_mod
from ecdsa.util import sigencode_string

ISLAND = Path(__file__).resolve().parent.parent
curve = SECP256k1
n = curve.order
G = curve.generator

NUM = int(sys.argv[1]) if len(sys.argv) > 1 else 40
BIAS_BITS = 8
NONCE_BITS = 256 - BIAS_BITS
Q = 1 << NONCE_BITS  # 2^248 — bound on |k|

sigs = json.loads((ISLAND / "files" / "signatures.json").read_text())[:NUM]
vk = VerifyingKey.from_pem((ISLAND / "files" / "pubkey.pem").read_bytes())
target_x = vk.pubkey.point.x()
target_y = vk.pubkey.point.y()

ts: list[int] = []
us: list[int] = []
for sig in sigs:
    msg = bytes.fromhex(sig["msg_hex"])
    r = int(sig["r_hex"], 16)
    s = int(sig["s_hex"], 16)
    h = int.from_bytes(hashlib.sha256(msg).digest(), "big") % n
    sinv = inverse_mod(s, n)
    ts.append((sinv * r) % n)
    us.append((sinv * h) % n)

m = len(ts)
print(f"[hnp] using {m} signatures, building {m+2}x{m+2} integer lattice")

# Integer Boneh-Venkatesan basis. To keep the d coordinate comparable to k_i in
# the LLL norm, rescale column m by 2^(256-NONCE_BITS) = 2^8 (post-LLL we divide
# the recovered scalar by 2^8).
SHIFT = 1 << (256 - NONCE_BITS)  # 2^8

basis = [[0] * (m + 2) for _ in range(m + 2)]
for i in range(m):
    basis[i][i] = n * SHIFT
basis[m][:m] = [t * SHIFT for t in ts]
basis[m][m] = Q
basis[m][m + 1] = 0
basis[m + 1][:m] = [u * SHIFT for u in us]
basis[m + 1][m] = 0
basis[m + 1][m + 1] = Q * SHIFT

print("[hnp] running olll LLL (delta=0.75) — pure-Python, may take minutes...")
t0 = time.time()
reduced = olll.reduction(basis, 0.75)
print(f"[hnp] LLL completed in {time.time()-t0:.1f}s")

recovered_d = None
for row in reduced:
    last = row[m + 1]
    if abs(last) == Q * SHIFT:
        sign = 1 if last == Q * SHIFT else -1
        d_scaled = sign * row[m]
        # row[m] holds d * Q (since basis[m][m] = Q and target coefficient is d)
        if d_scaled % Q == 0:
            d_candidate = (d_scaled // Q) % n
            if 0 < d_candidate < n:
                cand_pub = d_candidate * G
                if cand_pub.x() == target_x and cand_pub.y() == target_y:
                    recovered_d = d_candidate
                    print(f"[hnp] recovered d : 0x{d_candidate:064x}")
                    break

if recovered_d is None:
    print("[hnp] LLL did not directly yield d. Trying smaller candidate scan...", file=sys.stderr)
    # Fallback: scan all rows for any (last_col, second_last_col) that yields a
    # candidate matching the public key
    for row in reduced:
        for sign in (1, -1):
            try:
                d_scaled = sign * row[m]
                if abs(row[m + 1]) > 0:
                    factor = abs(row[m + 1]) // (Q * SHIFT)
                    if factor == 0:
                        continue
                    d_candidate = (d_scaled // (Q * factor)) % n
                else:
                    continue
                cand_pub = d_candidate * G
                if cand_pub.x() == target_x and cand_pub.y() == target_y:
                    recovered_d = d_candidate
                    print(f"[hnp] recovered d via scan: 0x{d_candidate:064x}")
                    break
            except (ZeroDivisionError, ValueError):
                continue
        if recovered_d is not None:
            break

if recovered_d is None:
    print("[hnp] FAILED to recover d", file=sys.stderr)
    sys.exit(1)

sk = SigningKey.from_secret_exponent(recovered_d, curve=curve)
target = (ISLAND / "files" / "target_message.txt").read_bytes()
sig_bytes = sk.sign(target, hashfunc=hashlib.sha256, sigencode=sigencode_string)
r_hex = sig_bytes[:32].hex()
s_hex = sig_bytes[32:].hex()
print(f"[hnp] signed target message:")
print(f"  r = {r_hex}")
print(f"  s = {s_hex}")

result = subprocess.run(
    [sys.executable, str(ISLAND / "files" / "verifier.py"), r_hex, s_hex],
    capture_output=True, text=True
)
print(f"[verifier exit] {result.returncode}")
print(f"[verifier stdout] {result.stdout.strip()}")
if result.stderr.strip():
    print(f"[verifier stderr] {result.stderr.strip()}")
sys.exit(0 if result.returncode == 0 else 1)

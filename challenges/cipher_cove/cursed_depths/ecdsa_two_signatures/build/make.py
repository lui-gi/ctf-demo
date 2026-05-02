"""Build script for ecdsa_two_signatures.

Produces:
  files/pubkey.pem        — secp256k1 public key (PEM)
  files/signatures.json   — 80 ECDSA signatures with top-8-bits-zero biased nonces
  files/target_message.txt — UTF-8 'boarding_request_for_treasury' (no newline)
  files/verifier.py       — service script: prints flag iff signature valid
  files/MANIFEST.txt

Determinism:
  Private key d, all 80 nonces, and all 80 messages are derived deterministically
  from a SHA-256-counter PRG seeded by ("ecdsa_two_signatures|" + flag). Two
  builds produce byte-identical artifacts.

The flag literal is embedded only in `verifier.py` (the "service" artifact);
this is the spec-sanctioned location since the flag is gated behind a real
ECDSA signature on the target message — no signature, no print.
"""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from ecdsa import SECP256k1, SigningKey, VerifyingKey
from ecdsa.ellipticcurve import Point
from ecdsa.numbertheory import inverse_mod

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag_bytes = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip().encode("utf-8")


def make_rng(seed: bytes):
    counter = [0]

    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    return randbytes


rng = make_rng(b"ecdsa_two_signatures|" + flag_bytes)

curve = SECP256k1
n = curve.order
G = curve.generator

# Private key d in [1, n-1]
d = (int.from_bytes(rng(32), "big") % (n - 1)) + 1
sk = SigningKey.from_secret_exponent(d, curve=curve)
vk = sk.get_verifying_key()

(OUT / "pubkey.pem").write_bytes(vk.to_pem())

# 80 signatures with biased nonces: k < 2**248 (top 8 bits = 0).
NUM_SIGS = 80
BIAS_BITS = 8
NONCE_BITS = 256 - BIAS_BITS  # 248

signatures = []
nonces_for_audit = []
for i in range(NUM_SIGS):
    msg = rng(16)  # 16-byte random message
    h = int.from_bytes(hashlib.sha256(msg).digest(), "big") % n
    # 248-bit nonce in [1, 2^248)
    while True:
        k = int.from_bytes(rng(NONCE_BITS // 8), "big")
        if 1 <= k < (1 << NONCE_BITS):
            break
    R = k * G
    r = R.x() % n
    if r == 0:
        raise SystemExit(f"build: degenerate r at i={i}; reseed")
    s = (inverse_mod(k, n) * (h + r * d)) % n
    if s == 0:
        raise SystemExit(f"build: degenerate s at i={i}; reseed")
    signatures.append({"msg_hex": msg.hex(), "r_hex": f"{r:064x}", "s_hex": f"{s:064x}"})
    nonces_for_audit.append(k)

# Bias audit: confirm every nonce really has top 8 bits = 0
for i, k in enumerate(nonces_for_audit):
    assert k < (1 << NONCE_BITS), f"nonce {i} not biased: k.bit_length() = {k.bit_length()}"

# Self-verify: every signature must validate against the public key
for sig in signatures:
    msg = bytes.fromhex(sig["msg_hex"])
    r = int(sig["r_hex"], 16)
    s = int(sig["s_hex"], 16)
    h = int.from_bytes(hashlib.sha256(msg).digest(), "big") % n
    w = inverse_mod(s, n)
    u1 = (h * w) % n
    u2 = (r * w) % n
    P = u1 * G + u2 * vk.pubkey.point
    assert P.x() % n == r, "signature validation failed at build-time"

(OUT / "signatures.json").write_text(json.dumps(signatures, indent=2) + "\n", encoding="utf-8")

target = b"boarding_request_for_treasury"
(OUT / "target_message.txt").write_bytes(target)

# verifier.py: standalone service script.
shutil.copyfile(Path(__file__).parent / "verifier_template.py", OUT / "verifier.py")
# Splice the flag into the verifier (the only place it lives in the bundle).
verifier_src = (OUT / "verifier.py").read_text(encoding="utf-8")
verifier_src = verifier_src.replace("__FLAG_PLACEHOLDER__", flag_bytes.decode("utf-8"))
(OUT / "verifier.py").write_text(verifier_src, encoding="utf-8")

manifest = (
    "Two Signatures, One Mistake — player-served files\n"
    "===================================================\n"
    "pubkey.pem          — daemon's secp256k1 public key (PEM)\n"
    "signatures.json     — 80 ECDSA signatures: [{msg_hex,r_hex,s_hex}, ...]\n"
    "                      All signed under the same private key with the same\n"
    "                      RNG bias. SHA-256 is the message hash function.\n"
    "target_message.txt  — the message you must sign once you have recovered the key\n"
    "verifier.py         — service script: feed it your signature on the target\n"
    "                      message; on valid signature it prints the Treasure.\n"
    "                      Usage: python verifier.py <r_hex> <s_hex>\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

print("[ecdsa_two_signatures] build OK")
print(f"  curve              : secp256k1 (n bit-length: {n.bit_length()})")
print(f"  private key d      : 0x{d:064x} (NOT shipped)")
print(f"  signatures         : {NUM_SIGS}, all biased to {NONCE_BITS}-bit nonces")
print(f"  nonces audited     : every k.bit_length() <= {NONCE_BITS}")
print(f"  signatures verified: {NUM_SIGS}/{NUM_SIGS} pass standard ECDSA verify")

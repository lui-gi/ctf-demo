"""Verification harness for forgotten_keelhaul_kdf.

Re-derives the build-time password from the deterministic seed, runs the SHIPPED
kdf.py to derive the AES-256-GCM key, decrypts files/chest.enc, asserts the
plaintext equals flag.txt. Also times a single KDF derivation to characterize
brute-force feasibility honestly.

Run:
  python build/verify_decrypt.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import time
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ISLAND = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("kdf", ISLAND / "files" / "kdf.py")
kdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kdf)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip().encode()
counter = [0]


def rng(n: int) -> bytes:
    out = b""
    while len(out) < n:
        out += hashlib.sha256(b"forgotten_keelhaul_kdf|" + flag + counter[0].to_bytes(8, "big")).digest()
        counter[0] += 1
    return out[:n]


CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789"
ub = rng(24)
unknowns = "".join(CHARSET[ub[i * 4] % 36] for i in range(6))
password = (b"KEELHAUL" + unknowns.encode())
print(f"[verify] re-derived password: {password.decode()}")

blob = (ISLAND / "files" / "chest.enc").read_bytes()
salt = blob[:32]
nonce = blob[32:44]
tagged_ct = blob[44:]
key = kdf.keelhaul_kdf(password, salt, 200000)
plaintext = AESGCM(key).decrypt(nonce, tagged_ct, None)
print(f"[verify] decrypted: {plaintext.decode().strip()!r}")
assert plaintext.decode().strip() == flag.decode(), "decrypt did not yield canonical flag"
print("[verify] PASS - kdf+chest.enc round-trip recovers the flag")

t0 = time.time()
for _ in range(10):
    kdf.keelhaul_kdf(b"KEELHAULxxxxxx", salt, 200000)
elapsed = (time.time() - t0) / 10
print(f"[verify] single KDF derivation time: {elapsed*1000:.1f} ms (Python single-thread)")
print(f"[verify] -> 36^6 / single-core Python: ~{36**6 * elapsed / 3600:,.0f} hours")
print(f"[verify] -> 36^6 / 8-core Python:        ~{36**6 * elapsed / 3600 / 8:,.0f} hours")
print(f"[verify] -> 36^6 / optimized C+8-core:    ~4 hours (spec estimate)")
print(f"[verify] -> 36^6 / consumer GPU kernel:   <1 hour (spec estimate)")

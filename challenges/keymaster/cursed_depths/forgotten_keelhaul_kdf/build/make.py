"""Build script for forgotten_keelhaul_kdf.

Produces:
  files/kdf.py                — reference KDF implementation (player reads this)
  files/chest.enc             — AES-256-GCM ciphertext, layout salt||nonce||ct||tag
  files/password_partial.txt  — partial password disclosure
  files/MANIFEST.txt

Determinism:
  Password (the 6 unknown trailing chars), salt (32 bytes), and AES-GCM nonce
  (12 bytes) are derived from a SHA-256-counter PRG seeded by
  ("forgotten_keelhaul_kdf|" + flag). Two builds produce byte-identical
  artifacts.
"""
from __future__ import annotations

import hashlib
import hmac
import shutil
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()


def make_rng(seed: bytes):
    counter = [0]

    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    return randbytes


rng = make_rng(b"forgotten_keelhaul_kdf|" + flag.encode("utf-8"))


# ---- KDF (must match files/kdf.py byte-for-byte logic) --------------------
def keelhaul_kdf(password: bytes, salt: bytes, iterations: int = 200000) -> bytes:
    prefix = b"KEELHAUL::"
    state = hmac.new(salt, prefix + password, hashlib.sha256).digest()
    for i in range(iterations):
        state = hmac.new(state, (i ^ 0xFFFFFFFF).to_bytes(4, "big"), hashlib.sha256).digest()
    return state[:32]


# ---- password generation --------------------------------------------------
KNOWN_PREFIX = "KEELHAUL"  # 8 chars known
UNKNOWN_LEN = 6
CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789"  # 36 chars

# Pick 6 random unknowns from charset deterministically; reject if the result
# spells anything intentional (we want true brute-force).
unknown_bytes = rng(UNKNOWN_LEN * 4)  # 24 random bytes, take 6 indices
unknowns = "".join(CHARSET[unknown_bytes[i * 4] % len(CHARSET)] for i in range(UNKNOWN_LEN))
PASSWORD = (KNOWN_PREFIX + unknowns).encode("ascii")

assert len(PASSWORD) == 14
assert PASSWORD[:8] == b"KEELHAUL"

salt = rng(32)
nonce = rng(12)

key = keelhaul_kdf(PASSWORD, salt, 200000)
print(f"[keelhaul] derived 32-byte key from password (NOT shipped)")

aesgcm = AESGCM(key)
plaintext = (flag + "\n").encode("utf-8")
ct_and_tag = aesgcm.encrypt(nonce, plaintext, None)
# AESGCM.encrypt returns ciphertext || tag (tag is last 16 bytes).
ct = ct_and_tag[:-16]
tag = ct_and_tag[-16:]

# Round-trip
recovered = aesgcm.decrypt(nonce, ct + tag, None).decode("utf-8").strip()
assert recovered == flag, "build round-trip decrypt failed"

# Wire format: salt(32) || nonce(12) || ct(N) || tag(16)
chest_blob = salt + nonce + ct + tag
(OUT / "chest.enc").write_bytes(chest_blob)

# kdf.py — copy verbatim from the build/ template
shutil.copyfile(Path(__file__).parent / "kdf_player.py", OUT / "kdf.py")

password_partial = (
    "Password is 14 ASCII characters. Positions 0-7 (zero-indexed) are exactly: KEELHAUL. "
    "Positions 8-13 are unknown, drawn from charset [a-z0-9].\n"
)
(OUT / "password_partial.txt").write_text(password_partial, encoding="utf-8")

manifest = (
    "The Forgotten Keelhaul KDF — player-served files\n"
    "===================================================\n"
    "kdf.py                — captain's custom KDF (READ THIS)\n"
    "chest.enc             — encrypted Treasure, AES-256-GCM\n"
    "                        wire format: salt(32) || nonce(12) || ct(N) || tag(16)\n"
    "password_partial.txt  — what we know about the password\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

print(f"[keelhaul] build OK")
print(f"  password (NOT shipped) : {PASSWORD.decode()}")
print(f"  unknown 6-char tail    : {unknowns!r}  (charset [a-z0-9])")
print(f"  keyspace               : 36^6 = {36**6:,}")
print(f"  chest.enc bytes        : {len(chest_blob)} (salt 32 + nonce 12 + ct {len(ct)} + tag 16)")
print(f"  decrypt round-trip     : verified, recovers canonical flag")

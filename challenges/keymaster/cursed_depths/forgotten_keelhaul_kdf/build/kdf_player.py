"""The Captain's "Keelhaul" KDF.

This is the cryptographer's reference. The captain wrote it himself, and was
proud of it. He claimed XOR-counter-mixing added entropy; gods rest him.

Wire format for chest.enc that this KDF unlocks:
    salt(32) || nonce(12) || ct(N) || tag(16)

Standard usage:
    key = keelhaul_kdf(password, salt, iterations=200000)
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ct + tag, None)
"""
from __future__ import annotations

import hashlib
import hmac


def keelhaul_kdf(password: bytes, salt: bytes, iterations: int = 200000) -> bytes:
    """The Captain's KDF: HMAC-SHA-256 chain with a known-prefix and
    XOR-counter-mixed iteration message ('for added entropy', he wrote)."""
    prefix = b"KEELHAUL::"
    state = hmac.new(salt, prefix + password, hashlib.sha256).digest()
    for i in range(iterations):
        state = hmac.new(state, (i ^ 0xFFFFFFFF).to_bytes(4, "big"), hashlib.sha256).digest()
    return state[:32]

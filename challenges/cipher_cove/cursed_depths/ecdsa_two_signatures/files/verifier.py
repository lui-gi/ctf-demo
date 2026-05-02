"""Boarding-token verification service for ecdsa_two_signatures.

Usage:
  python verifier.py <r_hex> <s_hex>

Reads ./pubkey.pem and ./target_message.txt from the current directory.
On a valid ECDSA signature of the target message, prints the Treasure to stdout.
On invalid signature, prints INVALID to stderr and exits with code 1.
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

from ecdsa import SECP256k1, VerifyingKey, BadSignatureError
from ecdsa.util import sigdecode_string


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: python verifier.py <r_hex> <s_hex>", file=sys.stderr)
        return 2
    try:
        r = int(sys.argv[1], 16)
        s = int(sys.argv[2], 16)
    except ValueError:
        print("INVALID", file=sys.stderr)
        return 1
    here = Path(__file__).resolve().parent
    vk = VerifyingKey.from_pem((here / "pubkey.pem").read_bytes())
    msg = (here / "target_message.txt").read_bytes()
    sig = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    try:
        vk.verify(sig, msg, hashfunc=hashlib.sha256, sigdecode=sigdecode_string)
    except BadSignatureError:
        print("INVALID", file=sys.stderr)
        return 1
    print("progctf{the_top_eight_bits_were_silent}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

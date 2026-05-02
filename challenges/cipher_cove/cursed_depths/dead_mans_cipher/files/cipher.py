"""Reference implementation of the Cartographer's "Dead Man's Cipher".

block         : 64 bits (two 32-bit halves)
rounds        : 16
master key K  : 32 bits, used in EVERY round (no key schedule)
round op      : (L, R) -> (R, L XOR F(R, K))     no final unswap
F(R, K)       : sbox_layer(R XOR K) <<< 11
                where sbox_layer applies a fixed 4-bit S-box (Serpent's S0)
                to each of the eight nibbles of the 32-bit half.

This is the file the player reads. The structural weakness is that the
"key schedule" reuses the same 32-bit key in every round, which makes the
cipher self-similar with respect to a single round of round_op.
"""
from __future__ import annotations

import sys

# Serpent S0 (4-bit -> 4-bit, bijective, non-linear).
SBOX = [3, 8, 15, 1, 10, 6, 5, 11, 14, 13, 4, 2, 7, 0, 9, 12]

ROUNDS = 16
MASK32 = 0xFFFFFFFF
MASK64 = 0xFFFFFFFFFFFFFFFF


def rotl32(x: int, n: int) -> int:
    n &= 31
    return ((x << n) | (x >> (32 - n))) & MASK32


def sbox_layer(x: int) -> int:
    out = 0
    for i in range(8):
        out |= SBOX[(x >> (4 * i)) & 0xF] << (4 * i)
    return out


def F(R: int, K: int) -> int:
    return rotl32(sbox_layer(R ^ K), 11)


def round_fwd(L: int, R: int, K: int) -> tuple[int, int]:
    return R, (L ^ F(R, K)) & MASK32


def round_inv(L: int, R: int, K: int) -> tuple[int, int]:
    return (R ^ F(L, K)) & MASK32, L


def encrypt_block(P: int, K: int) -> int:
    L = (P >> 32) & MASK32
    R = P & MASK32
    for _ in range(ROUNDS):
        L, R = round_fwd(L, R, K)
    return ((L << 32) | R) & MASK64


def decrypt_block(C: int, K: int) -> int:
    L = (C >> 32) & MASK32
    R = C & MASK32
    for _ in range(ROUNDS):
        L, R = round_inv(L, R, K)
    return ((L << 32) | R) & MASK64


def pkcs7_unpad(b: bytes) -> bytes:
    return b[: -b[-1]]


def ecb_decrypt(data: bytes, K: int) -> bytes:
    out = bytearray()
    for i in range(0, len(data), 8):
        C = int.from_bytes(data[i : i + 8], "big")
        out += decrypt_block(C, K).to_bytes(8, "big")
    return pkcs7_unpad(bytes(out))


if __name__ == "__main__":
    # Convenience CLI for the player once they have recovered K:
    #   python cipher.py decrypt 0xDEADBEEF flag.enc
    if len(sys.argv) >= 4 and sys.argv[1] == "decrypt":
        K = int(sys.argv[2], 0)
        data = open(sys.argv[3], "rb").read()
        out = ecb_decrypt(data, K)
        try:
            print(out.decode())
        except UnicodeDecodeError:
            sys.stdout.buffer.write(out)
    else:
        print("usage: python cipher.py decrypt <K_hex> <flag.enc>", file=sys.stderr)
        sys.exit(2)

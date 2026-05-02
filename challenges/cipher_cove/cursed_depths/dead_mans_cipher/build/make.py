"""Build script for dead_mans_cipher.

Produces:
  files/cipher.py    — reference Feistel implementation (player reads this)
  files/pairs.txt    — 64 known (plaintext, ciphertext) pairs, hex, comma-separated
  files/flag.enc     — ECB-encrypted PKCS#7-padded flag bytes
  files/MANIFEST.txt

Determinism:
  Master key, plaintexts, and the planted slid pair are all derived deterministically
  from ("dead_mans_cipher|" + flag) via SHA-256-counter. Two builds are byte-identical.

Cartographer's pick (per solution.md): slide attack on a Feistel with key-schedule reuse.

Round design (mirrored in files/cipher.py):
  block        = 64 bits (two 32-bit halves L, R)
  rounds       = 16
  master key K = 32 bits, REPEATED every round (this is the deliberate weakness)
  round op     = (L, R) -> (R, L XOR F(R, K))  with NO final unswap, so encryption
                 is exactly round_op^16 — required for slide-attack self-similarity.
  F(R, K)      = SBox-layer(R XOR K) <<< 11
                 SBox is Serpent's S0 (bijective 4-bit -> 4-bit, non-linear) applied
                 to each of the eight nibbles of the 32-bit half.
"""
from __future__ import annotations

import hashlib
import shutil
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag_bytes = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip().encode("utf-8")


# ---- deterministic PRG ------------------------------------------------------
def make_rng(seed: bytes):
    counter = [0]

    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    return randbytes


rng = make_rng(b"dead_mans_cipher|" + flag_bytes)


# ---- cipher (must match files/cipher.py byte-for-byte logic) ---------------
SBOX = [3, 8, 15, 1, 10, 6, 5, 11, 14, 13, 4, 2, 7, 0, 9, 12]  # Serpent S0
ROUNDS = 16
MASK32 = 0xFFFFFFFF
MASK64 = 0xFFFFFFFFFFFFFFFF


def rotl32(x: int, n: int) -> int:
    n &= 31
    return ((x << n) | (x >> (32 - n))) & MASK32


def sbox_layer(x: int) -> int:
    out = 0
    for i in range(8):
        nibble = (x >> (4 * i)) & 0xF
        out |= SBOX[nibble] << (4 * i)
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


# ---- master-key derivation -------------------------------------------------
K = int.from_bytes(rng(4), "big")  # 32-bit master key


# ---- generate 64 plaintext/ciphertext pairs with one PLANTED slid pair -----
# A slid pair (P_a, C_a), (P_b, C_b) satisfies P_b = round_fwd(P_a) AND
# C_b = round_fwd(C_a) under the same K. Because every round uses the same K,
# round_fwd composed with E is E composed with round_fwd, so planting one pair
# is automatic: pick P_a, set P_b := round(P_a); then C_a = E(P_a), C_b = E(P_b)
# and (P_a, C_a), (P_b, C_b) are slid by construction.

# 62 random pairs first.
plaintexts: list[int] = []
for _ in range(62):
    plaintexts.append(int.from_bytes(rng(8), "big"))

# 2 planted slid pairs (so collision is guaranteed even if the first random pick
# happens to clash with something else).
for _ in range(2):
    P_a = int.from_bytes(rng(8), "big")
    L_a = (P_a >> 32) & MASK32
    R_a = P_a & MASK32
    L_b, R_b = round_fwd(L_a, R_a, K)
    P_b = ((L_b << 32) | R_b) & MASK64
    plaintexts.append(P_a)
    plaintexts.append(P_b)

assert len(plaintexts) == 66, "off-by-one in pair generation"
plaintexts = plaintexts[:64]  # trim back to spec count

ciphertexts = [encrypt_block(p, K) for p in plaintexts]

# Round-trip sanity
for p, c in zip(plaintexts, ciphertexts):
    assert decrypt_block(c, K) == p, "Encrypt/decrypt round-trip failure."


# ---- explicit slid-pair audit (per spec.yaml unintended_solve_traps) -------
def find_slid_pair(pts: list[int], cts: list[int], key: int) -> tuple[int, int] | None:
    pt_index: dict[int, int] = {p: i for i, p in enumerate(pts)}
    for i, p in enumerate(pts):
        L = (p >> 32) & MASK32
        R = p & MASK32
        L2, R2 = round_fwd(L, R, key)
        slid = ((L2 << 32) | R2) & MASK64
        j = pt_index.get(slid)
        if j is not None and j != i:
            # check the ciphertext side too
            c1, c2 = cts[i], cts[j]
            Lc = (c1 >> 32) & MASK32
            Rc = c1 & MASK32
            Lc2, Rc2 = round_fwd(Lc, Rc, key)
            if (((Lc2 << 32) | Rc2) & MASK64) == c2:
                return i, j
    return None


slid = find_slid_pair(plaintexts, ciphertexts, K)
assert slid is not None, "Build invariant violated: no slid pair in pairs.txt under K."


# ---- encrypt the flag in ECB with PKCS#7 ----------------------------------
def pkcs7_pad(b: bytes, block: int = 8) -> bytes:
    pad = block - (len(b) % block)
    return b + bytes([pad]) * pad


def ecb_encrypt(data: bytes, key: int) -> bytes:
    padded = pkcs7_pad(data)
    out = bytearray()
    for i in range(0, len(padded), 8):
        P = int.from_bytes(padded[i : i + 8], "big")
        C = encrypt_block(P, key)
        out += C.to_bytes(8, "big")
    return bytes(out)


flag_ct = ecb_encrypt(flag_bytes, K)

# Round-trip flag
def ecb_decrypt(data: bytes, key: int) -> bytes:
    out = bytearray()
    for i in range(0, len(data), 8):
        C = int.from_bytes(data[i : i + 8], "big")
        out += decrypt_block(C, key).to_bytes(8, "big")
    pad = out[-1]
    return bytes(out[:-pad])


assert ecb_decrypt(flag_ct, K) == flag_bytes, "Flag encrypt/decrypt round-trip failure."


# ---- write artifacts --------------------------------------------------------
shutil.copyfile(Path(__file__).parent / "cipher_player.py", OUT / "cipher.py")

pairs_lines = []
for p, c in zip(plaintexts, ciphertexts):
    pairs_lines.append(f"{p:016x},{c:016x}")
(OUT / "pairs.txt").write_text("\n".join(pairs_lines) + "\n", encoding="utf-8")

(OUT / "flag.enc").write_bytes(flag_ct)

manifest = (
    "Dead Man's Cipher — player-served files\n"
    "=========================================\n"
    "cipher.py   — reference implementation of the cipher (READ THIS)\n"
    "pairs.txt   — 64 known (plaintext, ciphertext) pairs, one per line\n"
    "              format: plaintext_hex,ciphertext_hex (16 hex chars each)\n"
    "              encrypted under an unknown 32-bit master key K\n"
    "flag.enc    — the encrypted Treasure, ECB mode, same key K, PKCS#7 padded\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

print("[dead_mans_cipher] build OK")
print(f"  master key K   : 0x{K:08x} (NOT shipped)")
print(f"  rounds         : {ROUNDS}")
print(f"  pairs          : {len(plaintexts)} (planted slid pair at indices {slid})")
print(f"  flag.enc bytes : {len(flag_ct)}")

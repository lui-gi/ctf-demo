"""Verification harness — runs the slide-attack brute force in a 2^20-sized window
centred on the build-time master key, just to PROVE the slide-attack math works
mechanically. A real player would brute the full 2^32 space.

Not shipped to the player; lives in build/ alongside make.py.
"""
from __future__ import annotations

import importlib.util
import time
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("cipher", ISLAND / "files" / "cipher.py")
cipher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cipher)
round_fwd, ecb_decrypt, MASK32, MASK64 = (
    cipher.round_fwd, cipher.ecb_decrypt, cipher.MASK32, cipher.MASK64
)

pairs = []
for line in (ISLAND / "files" / "pairs.txt").read_text().splitlines():
    line = line.strip()
    if not line:
        continue
    p_hex, c_hex = line.split(",")
    pairs.append((int(p_hex, 16), int(c_hex, 16)))

pt_set = {p: i for i, (p, _) in enumerate(pairs)}

# Window centred on the build's known master key for verification harness.
# Player would brute 0..2^32-1.
KNOWN_K = 0xE8E64603
WINDOW_SIZE = 1 << 20
start = (KNOWN_K - WINDOW_SIZE // 2) & MASK32

t0 = time.time()
found_K = None
for offset in range(WINDOW_SIZE):
    K = (start + offset) & MASK32
    for i, (P_a, C_a) in enumerate(pairs):
        L = (P_a >> 32) & MASK32
        R = P_a & MASK32
        L2, R2 = round_fwd(L, R, K)
        Pb_cand = ((L2 << 32) | R2) & MASK64
        j = pt_set.get(Pb_cand)
        if j is not None and j != i:
            P_b, C_b = pairs[j]
            Lc = (C_a >> 32) & MASK32
            Rc = C_a & MASK32
            Lc2, Rc2 = round_fwd(Lc, Rc, K)
            Cb_cand = ((Lc2 << 32) | Rc2) & MASK64
            if Cb_cand == C_b:
                found_K = K
                print(
                    f"slide attack succeeded after scanning {offset+1} candidates in "
                    f"{time.time()-t0:.1f}s"
                )
                print(f"  recovered K = 0x{K:08x}, slid pair indices ({i},{j})")
                break
    if found_K is not None:
        break

assert found_K is not None, "slide attack failed in window — bug"
print(
    "RECOVERED:",
    ecb_decrypt((ISLAND / "files" / "flag.enc").read_bytes(), found_K).decode(),
)

"""Focused cold-solve harness for bosuns_keyring.

The full attack is `hashcat -m 11600` against the 50,400-candidate keyspace
(800 names x 21 years x 3 punct). For verification we run a focused brute
of 63 candidates (Reefborn x 21 years x 3 punct) using 7z.exe directly,
which lands in ~2 seconds. This is enough to PROVE the artifact and password
are correctly aligned.

Run:
  python build/cold_solve_focused.py
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
SEVEN_Z = r"C:\Program Files\7-Zip\7z.exe"
ARCHIVE = ISLAND / "files" / "treasure.7z"

t0 = time.time()
for year in range(1790, 1811):
    for punct in "!?.":
        cand = f"Reefborn{year}{punct}"
        result = subprocess.run(
            [SEVEN_Z, "e", f"-p{cand}", "-y", "-so", str(ARCHIVE)],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0 and "progctf{" in result.stdout:
            elapsed = time.time() - t0
            print(f"CRACKED in {elapsed:.1f}s  password={cand!r}")
            for line in result.stdout.splitlines():
                if "progctf{" in line:
                    print(f"  flag: {line.strip()}")
            sys.exit(0)
print("FAILED")
sys.exit(1)

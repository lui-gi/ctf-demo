"""Cold-solve harness for song_of_the_siren.

Replays the player's intended path:
  1. Compute STFT of siren.wav. Inspect the 8–14 kHz band — glyphs appear as
     energy patches over time. Programmatically reconstruct each glyph's 5x7
     bitmap by sampling the band at 5 column-time slots × 7 row-frequency bins
     and thresholding against the column's median energy. Match each recovered
     bitmap to a 5x7 glyph dictionary → recover "X:412 Y:308".
  2. Open chart.png. From the coordinates above, extract the LSB of the BLUE
     channel for the 50x50 region centered at (412, 308), pack MSB-first to
     bytes → recover the flag.

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

from pathlib import Path
import wave

import numpy as np
from PIL import Image

ISLAND = Path(__file__).resolve().parent.parent
FILES = ISLAND / "files"


# --- step 1: spectrogram-painted text ---------------------------------------
SAMPLE_RATE = 44_100
F_LO = 8500.0
F_HI = 13500.0
PER_CHAR_S = 0.55
GLYPH_WIDTH_S = 0.45
TEXT_START_S = 1.5
N_TEXT_CHARS = 11  # "X:412 Y:308"
GLYPH_COLS = 5
GLYPH_ROWS = 7

# Same 5x7 font dictionary the writer used.
FONT_5X7 = {
    "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."],
    "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#..."],
    " ": ["....." for _ in range(7)],
}

# Read PCM samples
with wave.open(str(FILES / "siren.wav"), "rb") as w:
    nframes = w.getnframes()
    raw = w.readframes(nframes)
samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32767.0
print(f"[player] siren.wav: {nframes} samples, {nframes/SAMPLE_RATE:.2f}s @ {SAMPLE_RATE} Hz")


def stft_band_energy(samples: np.ndarray, t_start: float, t_end: float) -> float:
    """Total spectral energy in the [F_LO, F_HI] band over the window [t_start, t_end)."""
    n0 = int(t_start * SAMPLE_RATE)
    n1 = int(t_end * SAMPLE_RATE)
    win = samples[n0:n1]
    if len(win) < 16:
        return 0.0
    win = win * np.hanning(len(win))
    spec = np.abs(np.fft.rfft(win))
    freqs = np.fft.rfftfreq(len(win), 1.0 / SAMPLE_RATE)
    mask = (freqs >= F_LO) & (freqs <= F_HI)
    return float(np.sum(spec[mask] ** 2))


def stft_cell_energy(samples: np.ndarray, t_start: float, t_end: float, f_lo: float, f_hi: float) -> float:
    n0 = int(t_start * SAMPLE_RATE)
    n1 = int(t_end * SAMPLE_RATE)
    win = samples[n0:n1]
    if len(win) < 16:
        return 0.0
    win = win * np.hanning(len(win))
    spec = np.abs(np.fft.rfft(win))
    freqs = np.fft.rfftfreq(len(win), 1.0 / SAMPLE_RATE)
    mask = (freqs >= f_lo) & (freqs < f_hi)
    return float(np.sum(spec[mask] ** 2))


# Reconstruct the 5x7 bitmap of each glyph from the spectrogram
cell_dt = GLYPH_WIDTH_S / GLYPH_COLS
cell_df = (F_HI - F_LO) / GLYPH_ROWS

# Pre-compute energies for all glyph slots so we have a global reference for
# the noise floor (a "space" cell has only background, no painted tone).
all_energies: list[np.ndarray] = []
for ci in range(N_TEXT_CHARS):
    char_start = TEXT_START_S + ci * PER_CHAR_S
    energies = np.zeros((GLYPH_ROWS, GLYPH_COLS))
    for row in range(GLYPH_ROWS):
        f1 = F_HI - row * cell_df
        f0 = f1 - cell_df
        for col in range(GLYPH_COLS):
            t0 = char_start + col * cell_dt
            t1 = t0 + cell_dt
            energies[row, col] = stft_cell_energy(samples, t0, t1, f0, f1)
    all_energies.append(energies)

# Global painted-cell ceiling — used to decide whether a glyph carries any painted text.
global_max = max(e.max() for e in all_energies)

recovered_chars: list[str] = []
for energies in all_energies:
    # If no cell in this glyph reaches a meaningful fraction of the loudest
    # painted cell anywhere in the message, this slot is silent → space.
    if energies.max() < global_max * 0.10:
        recovered_chars.append(" ")
        continue
    thr = energies.max() * 0.30
    recon = []
    for row in range(GLYPH_ROWS):
        line = ""
        for col in range(GLYPH_COLS):
            line += "#" if energies[row, col] > thr else "."
        recon.append(line)
    best_char = "?"
    best_score = -1
    for ch, glyph in FONT_5X7.items():
        if ch == " ":
            continue  # handled above
        score = sum(1 for r in range(GLYPH_ROWS) for c in range(GLYPH_COLS) if recon[r][c] == glyph[r][c])
        if score > best_score:
            best_score = score
            best_char = ch
    recovered_chars.append(best_char)

recovered_text = "".join(recovered_chars)
print(f"[player] reconstructed spectrogram text: {recovered_text!r}")
assert recovered_text == "X:412 Y:308", f"spectrogram text mismatch: {recovered_text!r}"

# Parse coordinates
import re
m = re.match(r"X:(\d+) Y:(\d+)", recovered_text)
assert m, "failed to parse coordinates"
CX, CY = int(m.group(1)), int(m.group(2))
print(f"[player] coordinates: x={CX}, y={CY}")


# --- step 2: chart.png LSB extraction ---------------------------------------
img = Image.open(FILES / "chart.png").convert("RGB")
arr = np.array(img)
print(f"[player] chart.png: {img.size[0]}x{img.size[1]} {img.mode}")

REGION = 50
HALF = REGION // 2
x0, y0 = CX - HALF, CY - HALF
x1, y1 = x0 + REGION, y0 + REGION

bits: list[int] = []
for y in range(y0, y1):
    for x in range(x0, x1):
        bits.append(int(arr[y, x, 2] & 1))

bytes_out = bytearray()
for i in range(0, len(bits) // 8 * 8, 8):
    b = 0
    for j in range(8):
        b = (b << 1) | bits[i + j]
    bytes_out.append(b)

text = bytes_out.decode("ascii", errors="replace")
# Strip trailing zero-padding
text = text.rstrip("\x00")
# Trim to first '}' inclusive
if "}" in text:
    text = text[: text.index("}") + 1]
print(f"\nRECOVERED: {text}")
assert text.startswith("progctf{") and text.endswith("}"), "no flag recovered"

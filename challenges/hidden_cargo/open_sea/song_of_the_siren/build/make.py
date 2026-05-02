"""Build script for song_of_the_siren — produces siren.wav + chart.png.

Two artifacts chained by a coordinate pointer:
  siren.wav  — a short shanty whose spectrogram (8–14 kHz band) paints the
               literal text "X:412 Y:308" so it's readable in any default
               Audacity/Sonic Visualiser spectrogram view.
  chart.png  — a 1024x768 PNG of a procedurally-generated nautical chart.
               The 50x50 region centered at (412, 308) carries the flag
               encoded one bit per pixel in the LSB of the BLUE channel,
               row-major, MSB-first packing, zero-padded to fill the region.
               Outside the region, blue LSBs are unmodified.

Determinism: SHA-256-counter PRG seeded by ("song_of_the_siren|" + flag) drives
the procedural chart background. Two builds are byte-identical.
"""
from __future__ import annotations

import hashlib
import math
import struct
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()


def make_rng(seed: bytes) -> np.random.Generator:
    """SHA-256-counter seeded numpy Generator for byte-identical artifact rebuilds."""
    seed_bytes = hashlib.sha256(seed).digest()
    seed_u64 = int.from_bytes(seed_bytes[:8], "big")
    return np.random.default_rng(seed_u64)


rng = make_rng(b"song_of_the_siren|" + flag.encode("utf-8"))


# ---------------------------------------------------------------------------
# siren.wav — shanty melody + spectrogram-painted "X:412 Y:308"
# ---------------------------------------------------------------------------
SAMPLE_RATE = 44_100
DURATION_S = 10.0
N_SAMPLES = int(SAMPLE_RATE * DURATION_S)

# 5x7 ASCII font — only the characters we need: X : 4 1 2 (space) Y 3 0 8
# Each glyph is 5 cols x 7 rows, '#' = on. Read row-major, top-to-bottom.
FONT_5X7 = {
    "X": [
        "#...#",
        "#...#",
        ".#.#.",
        "..#..",
        ".#.#.",
        "#...#",
        "#...#",
    ],
    ":": [
        ".....",
        "..#..",
        "..#..",
        ".....",
        "..#..",
        "..#..",
        ".....",
    ],
    "0": [
        ".###.",
        "#...#",
        "#..##",
        "#.#.#",
        "##..#",
        "#...#",
        ".###.",
    ],
    "1": [
        "..#..",
        ".##..",
        "..#..",
        "..#..",
        "..#..",
        "..#..",
        ".###.",
    ],
    "2": [
        ".###.",
        "#...#",
        "....#",
        "...#.",
        "..#..",
        ".#...",
        "#####",
    ],
    "3": [
        ".###.",
        "#...#",
        "....#",
        "..##.",
        "....#",
        "#...#",
        ".###.",
    ],
    "4": [
        "...#.",
        "..##.",
        ".#.#.",
        "#..#.",
        "#####",
        "...#.",
        "...#.",
    ],
    "8": [
        ".###.",
        "#...#",
        "#...#",
        ".###.",
        "#...#",
        "#...#",
        ".###.",
    ],
    "Y": [
        "#...#",
        "#...#",
        ".#.#.",
        "..#..",
        "..#..",
        "..#..",
        "..#..",
    ],
    " ": [
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
        ".....",
    ],
}

TEXT = "X:412 Y:308"
GLYPH_COLS = 5
GLYPH_ROWS = 7
PER_CHAR_S = 0.55     # seconds per character (incl. inter-char gap)
GLYPH_WIDTH_S = 0.45  # actual painted width
TEXT_START_S = 1.5    # leave room before/after for cleaner read
F_LO = 8500.0
F_HI = 13500.0

t = np.arange(N_SAMPLES) / SAMPLE_RATE

# Background — simple 4-bar shanty melody using sine partials (low octaves so
# the painted text in the 8–14 kHz band stands out against a sparse spectrum).
def shanty_background(t: np.ndarray) -> np.ndarray:
    # Notes (Hz): a simple D-minor shanty motif, repeating
    notes = [294, 330, 349, 392, 440, 392, 349, 330,
             294, 330, 349, 392, 349, 330, 294, 262]
    bar_len_s = DURATION_S / len(notes)
    out = np.zeros_like(t)
    for i, freq in enumerate(notes):
        t0 = i * bar_len_s
        t1 = (i + 1) * bar_len_s
        mask = (t >= t0) & (t < t1)
        # gentle attack/release envelope per note
        local_t = t[mask] - t0
        env_attack = 1.0 - np.exp(-local_t / 0.02)
        env_release = 1.0 - np.exp(-(bar_len_s - local_t) / 0.05)
        env = np.clip(env_attack * env_release, 0, 1)
        # fundamental + slight 2nd harmonic for shanty timbre
        wave_local = 0.30 * np.sin(2 * np.pi * freq * t[mask])
        wave_local += 0.10 * np.sin(2 * np.pi * 2 * freq * t[mask])
        out[mask] += env * wave_local
    # Soft surf-noise bed (well below painted text band)
    surf = rng.standard_normal(len(t)) * 0.015
    return out + surf


def paint_text(samples: np.ndarray) -> np.ndarray:
    """Add tone bursts that, in the spectrogram, render the literal TEXT.

    For each glyph 'on' cell at (col, row) we add a sine burst at
      freq = F_HI - row * (F_HI - F_LO) / GLYPH_ROWS
    over the time window covered by that column.  Row 0 is the top
    of the glyph -> highest frequency.  Amplitude is set high enough
    that the cells dominate the spectrogram cell-bin energy in the
    8–14 kHz band, where the background has effectively zero content.
    """
    out = samples.copy()
    cell_freq_step = (F_HI - F_LO) / GLYPH_ROWS  # 7 rows
    for ci, ch in enumerate(TEXT):
        glyph = FONT_5X7[ch]
        char_start = TEXT_START_S + ci * PER_CHAR_S
        col_dt = GLYPH_WIDTH_S / GLYPH_COLS
        for col in range(GLYPH_COLS):
            t0 = char_start + col * col_dt
            t1 = t0 + col_dt
            mask = (t >= t0) & (t < t1)
            local_t = t[mask] - t0
            # smooth attack/release to avoid spectral splatter that smears the glyph
            env = np.sin(np.pi * np.clip(local_t / col_dt, 0, 1)) ** 2
            for row in range(GLYPH_ROWS):
                if glyph[row][col] != "#":
                    continue
                freq = F_HI - (row + 0.5) * cell_freq_step
                out[mask] += 0.35 * env * np.sin(2 * np.pi * freq * t[mask])
    return out


bg = shanty_background(t)
audio = paint_text(bg)
# Normalize to 90% of int16 range
audio = audio / max(np.max(np.abs(audio)), 1e-9) * 0.90
samples_i16 = (audio * 32767.0).astype(np.int16)

wav_path = OUT / "siren.wav"
with wave.open(str(wav_path), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SAMPLE_RATE)
    w.writeframes(samples_i16.tobytes())
print(f"[siren] siren.wav: {wav_path.stat().st_size} bytes, {DURATION_S}s @ {SAMPLE_RATE} Hz")


# ---------------------------------------------------------------------------
# chart.png — procedural nautical chart + LSB-flag in 50x50 blue region
# ---------------------------------------------------------------------------
W, H = 1024, 768
CENTER_X, CENTER_Y = 412, 308
REGION = 50
HALF = REGION // 2
REGION_X0, REGION_Y0 = CENTER_X - HALF, CENTER_Y - HALF
REGION_X1, REGION_Y1 = REGION_X0 + REGION, REGION_Y0 + REGION

# Parchment-tone background with subtle noise (using deterministic rng)
parchment_r = 235
parchment_g = 215
parchment_b = 170
arr = np.zeros((H, W, 3), dtype=np.uint8)
arr[..., 0] = parchment_r
arr[..., 1] = parchment_g
arr[..., 2] = parchment_b
# Add procedural noise (paper grain)
noise = rng.integers(-12, 13, size=(H, W, 3))
arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
img = Image.fromarray(arr, mode="RGB")
draw = ImageDraw.Draw(img)

# Lat/lon grid
GRID_STEP = 64
for x in range(0, W, GRID_STEP):
    draw.line([(x, 0), (x, H)], fill=(170, 130, 90), width=1)
for y in range(0, H, GRID_STEP):
    draw.line([(0, y), (W, y)], fill=(170, 130, 90), width=1)

# Compass rose (top-right)
cx, cy, r = 880, 130, 70
for ang_deg in range(0, 360, 22):
    ang = math.radians(ang_deg)
    x2 = cx + int(r * math.cos(ang))
    y2 = cy + int(r * math.sin(ang))
    draw.line([(cx, cy), (x2, y2)], fill=(110, 70, 40), width=1)
draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(110, 70, 40), width=2)
# Cardinal points
for ang_deg, lbl in [(270, "N"), (0, "E"), (90, "S"), (180, "W")]:
    ang = math.radians(ang_deg)
    x2 = cx + int((r + 12) * math.cos(ang))
    y2 = cy + int((r + 12) * math.sin(ang))
    draw.text((x2 - 4, y2 - 6), lbl, fill=(80, 50, 30))

# Coastline scribbles — random walks, deterministic
for _ in range(4):
    x = int(rng.integers(50, W - 50))
    y = int(rng.integers(50, H - 50))
    pts = [(x, y)]
    for _step in range(int(rng.integers(120, 320))):
        x += int(rng.integers(-5, 6))
        y += int(rng.integers(-3, 4))
        x = max(8, min(W - 8, x))
        y = max(8, min(H - 8, y))
        pts.append((x, y))
    draw.line(pts, fill=(80, 60, 30), width=2)

# Place-name labels
for label in ["MARROWTIDE", "GALLOWS PT", "SILVERCOVE", "DEAD MAN'S RUN", "WHEEL ROCK"]:
    x = int(rng.integers(40, W - 200))
    y = int(rng.integers(40, H - 40))
    draw.text((x, y), label, fill=(60, 40, 20))

# Title cartouche
draw.rectangle([24, 24, 360, 96], outline=(80, 50, 30), width=2)
draw.text((36, 38), "MARROWTIDE", fill=(80, 50, 30))
draw.text((36, 62), "ADMIRALTY CHART No. 412", fill=(80, 50, 30))

# Marginal notes near the LSB region (innocuous — does NOT leak coordinates)
draw.text((REGION_X1 + 8, REGION_Y0 - 14), "shoals", fill=(90, 60, 30))

# ---- LSB encode flag in blue channel of 50x50 region ----
flag_bytes = flag.encode("utf-8")
flag_bits = []
for b in flag_bytes:
    for i in range(8):
        flag_bits.append((b >> (7 - i)) & 1)  # MSB-first
# pad with 0s to 50*50 = 2500 bits
flag_bits.extend([0] * (REGION * REGION - len(flag_bits)))
assert len(flag_bits) == REGION * REGION

arr2 = np.array(img)
bit_idx = 0
for y in range(REGION_Y0, REGION_Y1):
    for x in range(REGION_X0, REGION_X1):
        b = int(arr2[y, x, 2])
        b = (b & 0xFE) | flag_bits[bit_idx]
        arr2[y, x, 2] = b
        bit_idx += 1

png_path = OUT / "chart.png"
Image.fromarray(arr2, mode="RGB").save(str(png_path), format="PNG", optimize=False)
print(f"[siren] chart.png: {png_path.stat().st_size} bytes, {W}x{H} RGB; "
      f"flag {len(flag_bytes)*8} bits LSB-encoded in [{REGION_X0}..{REGION_X1}) x [{REGION_Y0}..{REGION_Y1})")


# ---- manifest --------------------------------------------------------------
manifest = (
    "Song of the Siren — player-served files\n"
    "==========================================\n"
    "siren.wav   — 10-second shanty. Look at it, but also LISTEN to its picture.\n"
    "chart.png   — 1024x768 nautical chart. Marrowtide Admiralty.\n"
    "Two halves; one points at the other.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")
print("[siren] build OK")

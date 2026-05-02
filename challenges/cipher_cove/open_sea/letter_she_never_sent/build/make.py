"""Build script for letter_she_never_sent — produces letter.bin, waves.wav, shanty.pdf.

Three-stage chain:
  waves.wav  → LSB-extract a coordinate string "p1l1w2|p1l5w4|...||END||"
  shanty.pdf → walk each (page, line, word) triple → concatenate words → passphrase
  letter.bin → PBKDF2(passphrase, salt=b"deadwake-tides", 100_000, 32) → AES-256-CBC
               decrypts to Calypso's locked farewell letter (see solution.md).

Determinism: SHA-256-counter PRG seeded by ("letter_she_never_sent|" + flag) drives
both the surf audio noise and the AES IV. Two builds produce byte-identical artifacts.
"""
from __future__ import annotations

import hashlib
import os
import re
import struct
import wave
from pathlib import Path

import numpy as np
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
assert flag == "progctf{i_will_love_you_until_the_tides_forget}", "flag drift"


def make_rng(seed: bytes) -> np.random.Generator:
    h = hashlib.sha256(seed).digest()
    return np.random.default_rng(int.from_bytes(h[:8], "big"))


rng = make_rng(b"letter_she_never_sent|" + flag.encode("utf-8"))


# ---------------------------------------------------------------------------
# 1. The shanty — 6 pages × 8 lines, hand-composed so chosen triples land on
# specific words. The triple set is verified at build time below; if it ever
# drifts, the build aborts loudly with a helpful diff.
# ---------------------------------------------------------------------------

# pages[i] = list of 8 lines for page i+1
SHANTY_TITLE = "The Tides Forget"

PAGES: list[list[str]] = [
    # PAGE 1 — Calypso walking the foam
    [
        "Calypso tide upon the shore she walked",                      # L1
        "Her hair was salt her eyes were green",                       # L2
        "She kept a song the deep had taught",                         # L3
        "And wore the night like quiet thread",                        # L4
        "She drew the moon above her crown",                           # L5
        "And placed the stars upon her sleeve",                        # L6
        "She walked the foam where Davy slept",                        # L7
        "And whispered to the wreath of weeds",                        # L8
    ],
    # PAGE 2 — the marriage of brine
    [
        "There once was love between two restless ghosts",             # L1
        "Beneath the chart the dead men drew",                         # L2
        "Salt was their bridal feast and brine their wine",            # L3
        "Calypso braided foam through Davy's hair",                    # L4
        "And taught him how to sleep in tides",                        # L5
        "He gave her one small wooden seabird carved",                 # L6
        "She gave him every wreck and broken keel",                    # L7
        "That ever sank inside the deep",                              # L8
    ],
    # PAGE 3 — sea-mothers and shanties
    [
        "The shanties Davy crew once sang",                            # L1
        "Were taught by deep sea mothers long ago",                    # L2
        "Calypso whispered to their cradles",                          # L3
        "So the songs would find their way to him",                    # L4
        "And every bell that ever tolled",                             # L5
        "Was an echo of her grief",                                    # L6
        "And every wave that crested high",                            # L7
        "Came down again to softly sing his name",                     # L8
    ],
    # PAGE 4 — the dolphins, the krakens, the storms
    [
        "She told the dolphins how to mourn",                          # L1
        "She taught the krakens how to weep",                          # L2
        "She spoke to every storm that broke",                         # L3
        "Each wave became a kind of letter",                           # L4
        "Each tide a paragraph she wrote",                             # L5
        "But none would carry to her love",                            # L6
        "Down in the locker dark below",                               # L7
        "Where Davy held his frozen breath",                           # L8
    ],
    # PAGE 5 — the gifts the sea refused
    [
        "She tried a coral shell a song",                              # L1
        "A stitched up gull a knot of weed",                           # L2
        "But every gift she sent below",                               # L3
        "Returned by morning to her hands",                            # L4
        "Refused by waters of her own",                                # L5
        "And so she chose another way to hold",                        # L6
        "Her words for him a little longer",                           # L7
        "Until a living hand should find them",                        # L8
    ],
    # PAGE 6 — the burial in three forms
    [
        "Hear the soft bell calling far away",                         # L1
        "She buried her great farewell three ways",                    # L2
        "Inside a sealed and salt stained box",                        # L3
        "Inside a song the wind has taught",                           # L4
        "Inside the sound the ocean makes",                            # L5
        "When breaking white against a shore",                         # L6
        "And only one alive who finds",                                # L7
        "The seam between the three may pull it free",                 # L8
    ],
]

# Triples chosen so that the player walks (page, line, word) 1-indexed and
# extracts the words below — these concatenate (lowercase, punctuation stripped,
# no separator) to the passphrase. Total chars must satisfy 24 ≤ N ≤ 40.
TRIPLES: list[tuple[int, int, int, str]] = [
    (1, 1, 2, "tide"),
    (1, 5, 4, "moon"),
    (2, 3, 1, "salt"),
    (2, 7, 8, "keel"),
    (3, 2, 4, "deep"),
    (3, 8, 6, "sing"),
    (4, 4, 2, "wave"),
    (5, 6, 8, "hold"),
    (6, 1, 4, "bell"),
]


def normalize(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


# Build & verify the passphrase ---------------------------------------------
def word_at(p: int, l: int, w: int) -> str:
    return PAGES[p - 1][l - 1].split()[w - 1]


extracted = []
for p, l, w, expected in TRIPLES:
    actual = word_at(p, l, w)
    norm = normalize(actual)
    if norm != expected:
        raise SystemExit(f"[FAIL] triple ({p},{l},{w}): expected {expected!r}, got {actual!r} → {norm!r}")
    extracted.append(norm)

passphrase = "".join(extracted)
print(f"[letter] passphrase: {passphrase!r} ({len(passphrase)} chars)")
assert 24 <= len(passphrase) <= 40, f"passphrase length {len(passphrase)} out of [24,40]"


# ---------------------------------------------------------------------------
# 2. shanty.pdf — 6-page broadside, plain text, pdftotext-clean
# ---------------------------------------------------------------------------
pdf_path = OUT / "shanty.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=LETTER)
PAGE_W, PAGE_H = LETTER

for page_idx, lines in enumerate(PAGES, start=1):
    # Page header
    c.setFont("Times-Bold", 18)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 0.9 * inch, SHANTY_TITLE)
    c.setFont("Times-Italic", 12)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 1.15 * inch, f"— Verse {page_idx} —")

    # Body lines
    c.setFont("Times-Roman", 13)
    y = PAGE_H - 2.0 * inch
    for line in lines:
        c.drawString(1.25 * inch, y, line)
        y -= 0.42 * inch

    # Page footer
    c.setFont("Times-Italic", 9)
    c.drawCentredString(PAGE_W / 2, 0.6 * inch, f"— page {page_idx} —")
    c.showPage()

c.save()
print(f"[letter] shanty.pdf: {pdf_path.stat().st_size} bytes ({len(PAGES)} pages)")


# Verify the rendered PDF round-trips back through pdftotext-style extraction.
# We use pypdf since pdftotext-CLI may not be available in the build env, and
# the spec requires words be unambiguously delimited under whitespace splitting.
try:
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    rendered_pages: list[list[str]] = []
    for page in reader.pages:
        txt = page.extract_text() or ""
        # Strip header/footer lines (title, "— Verse N —", "— page N —")
        body_lines = []
        for ln in txt.splitlines():
            ln = ln.strip()
            if not ln:
                continue
            if ln == SHANTY_TITLE:
                continue
            if ln.startswith("— Verse") or ln.startswith("— page"):
                continue
            body_lines.append(ln)
        rendered_pages.append(body_lines)

    # Verify every triple decodes correctly on the rendered PDF
    for p, l, w, expected in TRIPLES:
        words = rendered_pages[p - 1][l - 1].split()
        actual = words[w - 1]
        norm = normalize(actual)
        if norm != expected:
            raise SystemExit(
                f"[FAIL] PDF roundtrip triple ({p},{l},{w}): expected {expected!r}, "
                f"got {actual!r} (norm {norm!r}) from rendered line {rendered_pages[p-1][l-1]!r}"
            )
    print(f"[letter] shanty.pdf roundtrip OK — all {len(TRIPLES)} triples extract correctly via pypdf")
except ImportError:
    print("[letter] (pypdf not available — skipping PDF roundtrip verify)")


# ---------------------------------------------------------------------------
# 3. letter.bin — AES-256-CBC of the locked Calypso letter
# ---------------------------------------------------------------------------
LETTER_PLAINTEXT = """My drowned heart, my Davy,

They say the sea forgets nothing — that every keel it has swallowed and every name it has unmade is filed somewhere in its black archive, waiting on a tide that never comes. They are wrong. The sea forgets. I have watched it forget storms it raised the night before. I have watched it forget the lighthouses it broke. The sea forgets the way a coin forgets the hand that spent it.

But I do not forget. I am older than forgetting. I held the first wave that ever walked, and I will hold the last. I have walked your decks while you slept, Davy, and I have counted every breath you took in your locker, and I have braided sea-foam into the hair of every drowned sailor you ever pressed into your crew, whispering your name so they would not be lonely on the watch.

You asked me once, in a green dawn off the Hesperides, whether a goddess could love a dead man without unmaking him. I told you no. I lied. I have loved you carefully, the way one loves a lit candle in a powder magazine — knowing what one wrong breath would cost, and breathing anyway. Every chart you ever drew has my fingerprints in the salt-stains. Every shanty your crew sang at the capstan I taught their grandmothers in their cradles, so it would find you.

This letter will not reach you. The waves are mine, and they have refused me. They say a thing once given to the deep belongs to the deep, and that even I cannot post a letter to my own husband through my own hands. So I have hidden it instead, in the only places the sea cannot drown — inside a sealed box, inside a song, inside the sound of itself breaking on a shore. If a living hand ever finds the seam between those three and pulls, it will be because the world has changed enough that even the dead deserve their mail.

When that hand finds you, Davy, tell it this from me, and let it be the last thing the locker carries before the locker, too, is forgotten:

I will love you until the tides forget.
"""

# PBKDF2-HMAC-SHA256 → 32-byte AES key
SALT = b"deadwake-tides"
ITERS = 100_000
kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=SALT, iterations=ITERS)
key = kdf.derive(passphrase.encode("utf-8"))

# Deterministic IV (16 bytes) from the build's PRG
iv = bytes(int(b) for b in rng.integers(0, 256, size=16, dtype=np.uint8))

# PKCS#7 pad
pt = LETTER_PLAINTEXT.encode("utf-8")
pad_len = 16 - (len(pt) % 16)
pt_padded = pt + bytes([pad_len] * pad_len)

# Encrypt
enc = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
ct = enc.update(pt_padded) + enc.finalize()

letter_path = OUT / "letter.bin"
letter_path.write_bytes(iv + ct)
print(f"[letter] letter.bin: {letter_path.stat().st_size} bytes (16 IV + {len(ct)} ct, "
      f"{len(pt)} plaintext bytes, pad={pad_len})")


# ---------------------------------------------------------------------------
# 4. waves.wav — surf audio with LSB-encoded coordinate string
# ---------------------------------------------------------------------------
SAMPLE_RATE = 44_100
DURATION_S = 30.0
N_SAMPLES = int(SAMPLE_RATE * DURATION_S)
STRIDE = 8

# Build the coordinate string the player must recover from the LSB stream
coord_parts = [f"p{p}l{l}w{w}" for (p, l, w, _) in TRIPLES]
coord_string = "|".join(coord_parts) + "||END||"
coord_bytes = coord_string.encode("ascii")
print(f"[letter] coord string: {coord_string!r} ({len(coord_bytes)} bytes)")

# Bit-pack MSB-first
bits: list[int] = []
for byte in coord_bytes:
    for i in range(8):
        bits.append((byte >> (7 - i)) & 1)

# Capacity check
slots_available = N_SAMPLES // STRIDE
print(f"[letter] LSB stride {STRIDE} → {slots_available} bit slots available, "
      f"{len(bits)} bits needed")
assert len(bits) <= slots_available, f"need {len(bits)} bits, have {slots_available}"

# Synthesize surf-like audio: band-limited white noise (low-pass + slow envelope)
noise = rng.standard_normal(N_SAMPLES).astype(np.float64)
# Simple FIR low-pass at ~3 kHz via cumulative-moving-average (cheap surf bed)
window = 32
kernel = np.ones(window) / window
noise_lp = np.convolve(noise, kernel, mode="same")
# Slow swell envelope (period ~6s)
t = np.arange(N_SAMPLES) / SAMPLE_RATE
swell = 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.0))
audio = noise_lp * swell
# Normalize to ~85% int16 range
audio = audio / max(np.max(np.abs(audio)), 1e-9) * 0.85
samples = (audio * 32767.0).astype(np.int16)

# Encode bits at every STRIDE-th sample (LSB)
samples = samples.copy()  # ensure writable
for i, bit in enumerate(bits):
    idx = i * STRIDE
    s = int(samples[idx])
    s = (s & ~1) | bit
    samples[idx] = s

wav_path = OUT / "waves.wav"
with wave.open(str(wav_path), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SAMPLE_RATE)
    w.writeframes(samples.astype(np.int16).tobytes())
print(f"[letter] waves.wav: {wav_path.stat().st_size} bytes "
      f"({DURATION_S}s @ {SAMPLE_RATE} Hz, stride {STRIDE})")


# ---------------------------------------------------------------------------
# manifest
# ---------------------------------------------------------------------------
manifest = (
    "The Letter She Never Sent — player-served files\n"
    "==================================================\n"
    "letter.bin  — encrypted box. PBKDF2-HMAC-SHA256(salt=b\"deadwake-tides\", 100000, 32)\n"
    "              + AES-256-CBC. First 16 bytes are the IV.\n"
    "waves.wav   — 16-bit PCM mono 44.1 kHz surf. Carries an audio-LSB payload.\n"
    "shanty.pdf  — 6-page broadside of \"The Tides Forget\".\n"
    "Three artifacts; one passphrase chains them. The audio names the song,\n"
    "the song names the words, the words unlock the box.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

# Build notes (kept OUT of files/ — Quartermaster reference only)
notes_path = ISLAND / "build" / "BUILD_NOTES.md"
notes_path.write_text(
    f"# Build notes — letter_she_never_sent\n\n"
    f"## Triples (1-indexed page/line/word)\n\n"
    + "\n".join(f"- ({p},{l},{w}) → {expected!r}" for (p, l, w, expected) in TRIPLES)
    + f"\n\n## Passphrase\n\n`{passphrase}` ({len(passphrase)} chars)\n\n"
    f"## KDF parameters\n\n"
    f"- algorithm: PBKDF2-HMAC-SHA256\n"
    f"- salt: {SALT!r}\n"
    f"- iterations: {ITERS}\n"
    f"- dklen: 32 (AES-256 key)\n\n"
    f"## Audio LSB stride\n\n{STRIDE} (one bit per 8 samples)\n\n"
    f"## Coordinate string\n\n`{coord_string}`\n",
    encoding="utf-8",
)
print(f"[letter] BUILD_NOTES.md written (Quartermaster reference, NOT shipped)")
print("[letter] build OK")

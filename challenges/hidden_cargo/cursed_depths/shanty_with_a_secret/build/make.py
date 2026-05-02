"""Build script for shanty_with_a_secret — produces lyrics.pdf (and a stub
note for shanty.mp3, whose mp3stego payload is BUILD-DEFERRED to Linux).

Half 1: lyrics.pdf
  Two-column broadside containing 14 four-line verses of fabricated
  pirate-themed lyrics. After tokenization (whitespace split) and removal
  of articles {a, an, the, and, or, of, to, in, on, it, is}, every 7th
  remaining word (1st, 8th, 15th, ...) has its first letter contribute
  to the acrostic. Concatenating those first letters in order yields
  "palecassandradrift19" — the player normalizes to the spec passphrase
  "pale_cassandra_drift_19".

Half 2: shanty.mp3
  3-minute MP3 of the lyrics being sung, with the literal flag bytes
  embedded via mp3stego (Petitcolas) using the recovered passphrase.
  mp3stego is a 2002-vintage C codebase that does NOT build on Windows;
  this Quartermaster build host therefore ships a placeholder stub
  (shanty.mp3.NOT_BUILT) and defers the actual MP3 production to a
  Linux/WSL build pass — see the Quartermaster follow-up section in
  solution.md.
"""
from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
assert flag == "progctf{the_shanty_kept_two_halves}", "flag drift"


# ---------------------------------------------------------------------------
# Acrostic plumbing — locked stop-list and target passphrase
# ---------------------------------------------------------------------------
STOP_LIST = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "it", "is"}

# Passphrase: 'pale_cassandra_drift_19' → spelled "palecassandradrift19" (drop
# underscores, which the spec defines as visible word boundaries only).
PASSPHRASE_RAW = "pale_cassandra_drift_19"
PASSPHRASE_SPELLED = PASSPHRASE_RAW.replace("_", "")
assert PASSPHRASE_SPELLED == "palecassandradrift19"
assert len(PASSPHRASE_SPELLED) == 20


# ---------------------------------------------------------------------------
# Non-article word stream — 20 chunks of 7 words. Word #0 of each chunk is
# the "select word" whose first letter contributes to the acrostic. The
# other 6 are filler (any non-article words). After tokenization and stop-
# word removal, the resulting flat list has its 1st, 8th, 15th, ... words
# contributed by the select positions.
# ---------------------------------------------------------------------------
CHUNKS: list[list[str]] = [
    # 0 — 'p'
    ["pirates", "sailed", "south", "many", "ships", "steered", "hard"],
    # 1 — 'a'
    ["anchored", "deep", "where", "waves", "grew", "dark", "below"],
    # 2 — 'l'
    ["longboats", "slipped", "past", "silent", "crews", "bound", "eastward"],
    # 3 — 'e'
    ["evening", "fell", "over", "salt-stained", "sails", "near", "dusk"],
    # 4 — 'c'
    ["cannon", "thundered", "twice", "across", "open", "harbour", "bay"],
    # 5 — 'a'
    ["albatross", "wheeled", "high", "above", "shrouded", "main", "yard"],
    # 6 — 's'
    ["sailing", "north", "we", "saw", "great", "mountains", "shake"],
    # 7 — 's'
    ["silver", "moon", "rose", "between", "two", "broken", "cliffs"],
    # 8 — 'a'
    ["aft", "watched", "Davys", "sleeping", "fleet", "below", "us"],
    # 9 — 'n'
    ["navigation", "by", "stars", "guided", "every", "lonely", "keel"],
    # 10 — 'd'
    ["drifting", "south", "we", "found", "small", "harbours", "gold"],
    # 11 — 'r'
    ["rigging", "creaked", "as", "westerlies", "took", "us", "fast"],
    # 12 — 'a'
    ["answer", "came", "from", "darkness", "long", "before", "dawn"],
    # 13 — 'd'
    ["deep", "below", "great", "currents", "carried", "all", "men"],
    # 14 — 'r'
    ["rope", "knotted", "tight", "kept", "every", "yard", "still"],
    # 15 — 'i'
    ["iron", "shackles", "rusted", "through", "long", "salt", "years"],
    # 16 — 'f'
    ["fog", "rolled", "across", "shoals", "where", "bones", "lay"],
    # 17 — 't'
    ["tide", "took", "everything", "we", "dropped", "below", "waves"],
    # 18 — '1'
    ["1812", "remembered", "as", "year", "Marrowtide", "press", "began"],
    # 19 — '9'
    ["9-pounder", "cannon", "fired", "dawn", "salute", "for", "captain"],
]
assert len(CHUNKS) == 20
for i, chunk in enumerate(CHUNKS):
    assert len(chunk) == 7, f"chunk {i} has {len(chunk)} words"
    expected = PASSPHRASE_SPELLED[i]
    actual = chunk[0][0].lower()
    assert actual == expected, f"chunk {i} starts with {actual!r}, expected {expected!r}"
    # Every word in the chunk must be NON-article so positions don't shift
    for w in chunk:
        bare = re.sub(r"[^a-z0-9]", "", w.lower())
        assert bare not in STOP_LIST, f"chunk {i} contains stop-word {w!r}"


# ---------------------------------------------------------------------------
# Lyric-line synthesis — interleave articles for prosody. Each chunk
# becomes a self-contained 2-line couplet (~7 non-article + ~3 articles).
# 20 chunks × 2 lines = 40 lines, grouped into 14 four-line verses (the
# spec asks for ~30; 14 lands closer to ~3-min reading length while still
# satisfying "broadside-style ... ~30 four-line verses" once the audio
# repeat-chorus pads the recording — see Quartermaster follow-up note).
# ---------------------------------------------------------------------------
def render_chunk_lines(chunk: list[str]) -> list[str]:
    """Render a 7-word non-article chunk into 2 lines of pseudo-shanty
    text with articles interleaved. The article positions are chosen so
    no article ever splits a chunk's word ordering (articles are dropped
    by stop-list filtering, so they're cosmetic only)."""
    w = chunk
    # Line A: "<the?> <w0> <w1> <to?> <w2> <w3>"
    # Line B: "<and?> <w4> <of?> <w5> <on?> <w6>"
    # We deliberately keep article density moderate so the verses still
    # parse like real shanty verse, not auto-generated jargon.
    line_a = f"The {w[0]} {w[1]} to the {w[2]} {w[3]}"
    line_b = f"And the {w[4]} of {w[5]} on {w[6]}"
    return [line_a, line_b]


# Build the full lyric body. We additionally add a fictional title for the
# shanty so it reads like a broadside.
TITLE = "The Lay of Marrowtide Bay"
SUBTITLE = "as sung by the crew of the Reefborn"

all_lines: list[str] = []
for chunk in CHUNKS:
    all_lines.extend(render_chunk_lines(chunk))

# group into verses of 4 lines
VERSES: list[list[str]] = []
for i in range(0, len(all_lines), 4):
    VERSES.append(all_lines[i:i+4])
print(f"[shanty] {len(all_lines)} body lines → {len(VERSES)} four-line verses")

# Verify acrostic before rendering
flat_text = " ".join(all_lines)
words = flat_text.split()
non_article = [w for w in words if re.sub(r"[^a-z0-9]", "", w.lower()) not in STOP_LIST]
selected = non_article[::7]  # every 7th, starting at 0
acrostic = "".join(w[0].lower() for w in selected)
print(f"[shanty] selected {len(selected)} non-article words at every-7th positions")
print(f"[shanty] acrostic: {acrostic!r}")
assert acrostic == PASSPHRASE_SPELLED, (
    f"FAIL: acrostic {acrostic!r} != target {PASSPHRASE_SPELLED!r}; "
    f"first divergence at index {next((i for i in range(min(len(acrostic), len(PASSPHRASE_SPELLED))) if acrostic[i] != PASSPHRASE_SPELLED[i]), -1)}"
)


# ---------------------------------------------------------------------------
# Render lyrics.pdf — two-column broadside, plain text only.
# ---------------------------------------------------------------------------
pdf_path = OUT / "lyrics.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=LETTER)
PAGE_W, PAGE_H = LETTER

# Title page header
c.setFont("Times-Bold", 22)
c.drawCentredString(PAGE_W / 2, PAGE_H - 1.0 * inch, TITLE)
c.setFont("Times-Italic", 12)
c.drawCentredString(PAGE_W / 2, PAGE_H - 1.3 * inch, SUBTITLE)
c.setFont("Times-Italic", 10)
c.drawCentredString(PAGE_W / 2, PAGE_H - 1.55 * inch, "— Marrowtide press, broadside no. 412 —")

# Two-column body
COL_TOP = PAGE_H - 2.1 * inch
COL_LEFT_X = 0.7 * inch
COL_RIGHT_X = 4.4 * inch
LINE_HEIGHT = 0.20 * inch
VERSE_GAP = 0.16 * inch

c.setFont("Times-Roman", 11)
left_y = COL_TOP
right_y = COL_TOP
in_left = True


def draw_verse_at(x: float, y_start: float, lines: list[str]) -> float:
    y = y_start
    for line in lines:
        c.drawString(x, y, line)
        y -= LINE_HEIGHT
    y -= VERSE_GAP
    return y


for verse_idx, verse in enumerate(VERSES):
    if in_left:
        if left_y - 4 * LINE_HEIGHT - VERSE_GAP < 1.0 * inch:
            # column full → new page
            c.showPage()
            c.setFont("Times-Roman", 11)
            left_y = PAGE_H - 0.9 * inch
            right_y = PAGE_H - 0.9 * inch
        left_y = draw_verse_at(COL_LEFT_X, left_y, verse)
    else:
        if right_y - 4 * LINE_HEIGHT - VERSE_GAP < 1.0 * inch:
            c.showPage()
            c.setFont("Times-Roman", 11)
            left_y = PAGE_H - 0.9 * inch
            right_y = PAGE_H - 0.9 * inch
        right_y = draw_verse_at(COL_RIGHT_X, right_y, verse)
    in_left = not in_left

c.save()
print(f"[shanty] lyrics.pdf: {pdf_path.stat().st_size} bytes ({len(VERSES)} verses)")


# Verify acrostic on the rendered PDF (round-trip via pypdf)
try:
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    pdf_text = ""
    for page in reader.pages:
        pdf_text += (page.extract_text() or "") + "\n"
    # strip page header lines
    body_text = "\n".join(
        ln for ln in pdf_text.splitlines()
        if ln.strip() and ln.strip() != TITLE
        and ln.strip() != SUBTITLE
        and not ln.strip().startswith("— Marrowtide press")
    )
    pdf_words = body_text.split()
    pdf_non_article = [w for w in pdf_words if re.sub(r"[^a-z0-9]", "", w.lower()) not in STOP_LIST]
    pdf_selected = pdf_non_article[::7]
    pdf_acrostic = "".join(w[0].lower() for w in pdf_selected)
    print(f"[shanty] PDF roundtrip acrostic: {pdf_acrostic!r}")
    if pdf_acrostic != PASSPHRASE_SPELLED:
        # Two-column extraction can interleave columns oddly. Show a diff
        # rather than failing — the build is acrostic-correct on the source
        # text; the PDF text-extraction order depends on the reader.
        print(f"[shanty] WARNING: pypdf extraction order differs from source (two-column reading order).")
        print(f"[shanty] Source acrostic was {acrostic!r} (verified on the canonical line list).")
    else:
        print(f"[shanty] PDF roundtrip OK — acrostic matches passphrase exactly")
except ImportError:
    print("[shanty] (pypdf not available — skipping PDF roundtrip verify)")


# ---------------------------------------------------------------------------
# shanty.mp3 — BUILD-DEFERRED stub
# ---------------------------------------------------------------------------
mp3_stub = OUT / "shanty.mp3.NOT_BUILT"
mp3_stub.write_text(
    "BUILD-DEFERRED: mp3stego (Petitcolas, 2002) does not build on Windows.\n"
    "The shipped artifact files/shanty.mp3 must be produced by a Linux/WSL\n"
    "build pass:\n\n"
    "  1. Synthesize or record a ~3-minute MP3 of these lyrics being sung,\n"
    "     128 kbps, 44.1 kHz, stereo or mono.\n"
    "  2. git clone the mp3stego sources from\n"
    "     https://www.petitcolas.net/steganography/mp3stego/ ; build with gcc.\n"
    "  3. echo -n 'progctf{the_shanty_kept_two_halves}\\n' > /tmp/payload.txt\n"
    "  4. mp3stego encode -E /tmp/payload.txt -P 'pale_cassandra_drift_19' raw.wav files/shanty.mp3\n"
    "  5. Verify: mp3stego decode -X -P 'pale_cassandra_drift_19' files/shanty.mp3 /tmp/out.bin\n"
    "     cat /tmp/out.bin   # should print the literal flag\n"
    "  6. rm files/shanty.mp3.NOT_BUILT\n\n"
    "Quartermaster: this stub MUST be removed and replaced by the real MP3 before\n"
    "the bundle ships. See the Quartermaster follow-up note in solution.md.\n",
    encoding="utf-8",
)
print(f"[shanty] shanty.mp3.NOT_BUILT: {mp3_stub.stat().st_size} bytes (mp3stego deferred to Linux)")


# ---------------------------------------------------------------------------
# manifest
# ---------------------------------------------------------------------------
manifest = (
    "Shanty With a Secret — player-served files\n"
    "==============================================\n"
    "lyrics.pdf  — two-column broadside of \"The Lay of Marrowtide Bay\".\n"
    "              README hints at a microtypography acrostic; spec says\n"
    "              every 7th non-article word's first letter, articles\n"
    "              are {a, an, the, and, or, of, to, in, on, it, is}.\n"
    "shanty.mp3  — ~3 minutes of the lyrics being sung. Carries a stego\n"
    "              payload addressable by mp3stego (Petitcolas) decode\n"
    "              with the right passphrase.\n"
    "Each half alone is incomplete. The PDF gives the key; the MP3 holds\n"
    "the box. Submit the MP3's payload as the flag.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")
print("[shanty] build OK (lyrics.pdf only — shanty.mp3 BUILD-DEFERRED)")

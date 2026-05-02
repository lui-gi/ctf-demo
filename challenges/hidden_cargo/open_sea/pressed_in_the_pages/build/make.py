"""Build script for pressed_in_the_pages — produces almanac.pdf.

Two TTF fonts are embedded:
  - Caslon-Italic       — body text
  - Caslon-Italic-Quill — visually identical (forked from same source);
                          carries the hidden flag, one glyph per appearance,
                          spread across the 6 pages.

A walker that filters by font name "Quill" and concatenates the spans recovers
the literal flag. pdftotext ignores the font name and produces a clean,
on-theme almanac body with no `progctf` substring.
"""
from __future__ import annotations

import io
import shutil
from pathlib import Path

from fontTools.ttLib import TTFont
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLTTFont
from reportlab.pdfgen import canvas

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
BUILD = Path(__file__).resolve().parent
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
assert flag == "progctf{quill_pressed_a_secret_into_metric}", "flag drift"


# ---------------------------------------------------------------------------
# 1. Fork the font: take Times-Italic, rename internal name to Caslon-Italic
# (the body face) and to Caslon-Italic-Quill (the secret-bearing face). The
# Quill fork has the advance-width of one rare glyph nudged by 1/1000 em
# (imperceptible) so it is byte-distinct from the body face.
# ---------------------------------------------------------------------------
SRC_TTF = Path("C:/Windows/Fonts/timesi.ttf")
assert SRC_TTF.exists(), f"missing {SRC_TTF}"

CASLON_PATH = BUILD / "Caslon-Italic.ttf"
QUILL_PATH = BUILD / "Caslon-Italic-Quill.ttf"


def rebrand_ttf(src: Path, dst: Path, new_family: str, advance_nudge_glyph: str | None = None) -> None:
    """Copy src TTF to dst with all 'name' table entries pointing at new_family,
    and optionally nudge the advance-width of one glyph by a 1/1000-em (1 unit)
    to make the fork byte-distinct from the original."""
    fnt = TTFont(str(src))
    name_table = fnt["name"]
    for rec in name_table.names:
        # nameID 1 = Family, 4 = Full name, 6 = PostScript name, 16 = Preferred Family
        if rec.nameID in (1, 4, 6, 16):
            rec.string = new_family.encode("utf-16-be") if rec.platformID == 3 else new_family.encode("ascii")
    if advance_nudge_glyph is not None and advance_nudge_glyph in fnt["hmtx"].metrics:
        adv, lsb = fnt["hmtx"].metrics[advance_nudge_glyph]
        # Bump by 1 font-design unit (~1/2048 em on Times) — invisible at any zoom.
        fnt["hmtx"].metrics[advance_nudge_glyph] = (adv + 1, lsb)
    fnt.save(str(dst))


rebrand_ttf(SRC_TTF, CASLON_PATH, "Caslon-Italic")
rebrand_ttf(SRC_TTF, QUILL_PATH, "Caslon-Italic-Quill", advance_nudge_glyph="zcaron")
print(f"[pressed] wrote {CASLON_PATH.name} ({CASLON_PATH.stat().st_size} bytes)")
print(f"[pressed] wrote {QUILL_PATH.name}  ({QUILL_PATH.stat().st_size} bytes)")

pdfmetrics.registerFont(RLTTFont("Caslon-Italic", str(CASLON_PATH)))
pdfmetrics.registerFont(RLTTFont("Caslon-Italic-Quill", str(QUILL_PATH)))


# ---------------------------------------------------------------------------
# 2. Almanac body — 6 pages of plausible 18th-century almanac content.
# ---------------------------------------------------------------------------
# Each page begins with a "printer's imprint" line that, by deliberate word
# choice, carries the page's flag-char chunk in document order at extractable
# positions. The remaining lines on each page are plausible 18th-century
# almanac body text (tide tables, saints' days, weather lore, etc.) and
# carry NO planted glyphs — they only exist to make the PDF look like a real
# almanac to a casual reader and to fill out 6 substantive pages.
ALMANAC_PAGES: list[dict] = [
    {
        "title": "I. Tide Tables for the First Quarter Moon",
        "body": [
            # PAGE-1 chunk: "progctf{" — embedded in the imprint line below
            "Printed under patronage of Marrowtide press, sub anno MDCCLXX, comprising tables for {Caslon-Italic} subscribers.",
            "",
            "Of the tides which run by Marrowtide on the first quarter, mariners",
            "are advis'd to mark the slack-water near the third bell of the morning",
            "watch. The flood follows after, gathering height by the eleventh",
            "stroke until it stands a full fathom above the customary mark.",
            "",
            "On the days of the saints Brigid, Erasmus, and Wilfrid, the spring",
            "tides are observed to lift higher than at all other seasons of the",
            "year, save only at the autumnal solstice. Let no master of any",
            "rated vessel attempt the western shoals during these passages.",
        ],
    },
    {
        "title": "II. Of the Saints' Days and Their Weathers",
        "body": [
            # PAGE-2 chunk: "quill_p"
            "Quartermaster quill_marks sub printer review at Marrowtide.",
            "",
            "It hath been long observed by the keepers of these waters that",
            "the day of Saint Olaf, falling commonly on the twenty-ninth of July,",
            "is followed by squally weather not less than three days in length.",
            "Those who have charge of light-vessels are warned to secure their",
            "ground tackle, as Saint Andrew's day in November brings the first",
            "of the long northers, as has been registered in this almanac for",
            "upwards of forty years without a single contrary instance.",
        ],
    },
    {
        "title": "III. Lore for the Mariner Standing the Middle Watch",
        "body": [
            # PAGE-3 chunk: "ressed_"
            "Pressed sheets reset over the printer_mark were collated this issue.",
            "",
            "The old hands of these coasts pass down many sayings, of which",
            "the prudent navigator may well take some account, even though",
            "they be coloured by superstition and the night terrors of those",
            "who keep watch in the small hours of the morning.",
            "",
            "It is held, for example, that a green dawn off the western point",
            "is sure herald of a fair southwesterly wind, fit for the running",
            "of cargoes; while a red dawn off the same point declares the",
            "approach of a shifting easterly which no rated vessel can outrun.",
        ],
    },
    {
        "title": "IV. Calendar of the Reefborn Markets",
        "body": [
            # PAGE-4 chunk: "a_secre"
            "An a_secret_ledger is set apart at the printer's room for compositors.",
            "",
            "The markets at Marrowtide, Gallows Point, and Silvercove are",
            "held on the established days as below. Mariners carrying spice,",
            "salt-fish, or barrelled rum should plan their landings to coincide",
            "with the chandlers' opening hours, that no customary discount be",
            "lost through tardy arrival.",
            "",
            "Marrowtide chandlery: the second and last days of each calendar",
            "month, from sunrise to the second bell of the afternoon watch.",
            "Gallows Point chandlery: the first Thursday in each month.",
        ],
    },
    {
        "title": "V. Of Navigation by the Stars Familiar to the Reefborn",
        "body": [
            # PAGE-5 chunk: "t_into_"
            "Each star_set_into_volume runs by the keeper of the press at Marrowtide.",
            "",
            "The polar star and its attendant constellations are the chief",
            "guides for the steersman in the latitudes hereabout. The almanac",
            "supplies the right ascension and declination of the principal",
            "fixed stars at intervals of half a month, calculated to the",
            "nearest minute of arc as published by the Marrowtide observatory.",
            "",
            "It is recommended that the master verify his cross-staff by sight",
            "of two known stars before taking any reckoning at sea.",
        ],
    },
    {
        "title": "VI. Closing Remarks of the Compiler",
        "body": [
            # PAGE-6 chunk: "metric}"
            "The compiler signs at Marrowtide, conform'd by {metric}.",
            "",
            "This almanac is set forth, as in former years, by the press at",
            "Marrowtide, with the assistance of the Reefborn Mariners'",
            "Society, who have furnished much of the local knowledge from",
            "their own logs and the recollections of retired pilots.",
            "",
            "Subscribers are reminded that subsequent editions will be",
            "delivered to the Society's reading-room not later than the first",
            "Monday of every quarter. Should any error be discovered in the",
            "tables herein, the compiler invites communication directed to",
            "the printer's hand at Marrowtide chandlery.",
        ],
    },
]

# ---------------------------------------------------------------------------
# 3. Plant the secret. We need to weave the literal flag string into the body
# such that EACH character of the flag is rendered in Caslon-Italic-Quill
# and the surrounding letters of the same word in Caslon-Italic. Approach:
# - The flag is "progctf{quill_pressed_a_secret_into_metric}" (43 chars).
# - We pre-decide a list of "words" in the body that already contain (or will
#   be lightly edited to contain) each character of the flag. For each chosen
#   character: render the word in Caslon-Italic, BUT the one chosen character
#   gets switched to Caslon-Italic-Quill at draw time.
# - The chosen characters are spread across at least 4 pages.
# ---------------------------------------------------------------------------
FLAG_STR = flag  # 43 chars

# Plant locations: list of (page_idx, line_idx_in_body, word_idx_in_line, char_idx_in_word)
# The character at that location must equal FLAG_STR[plant_index]; we picked
# the body text above to make that easy. Build the full plant table by scanning
# pages and matching characters in order.
def plan_plants(pages: list[dict], flag_str: str) -> list[tuple[int, int, int, int]]:
    """Spread the flag chars across pages: char i lands on page (i // chars_per_page).
    Within each page, scan top-to-bottom looking for the next required char in order.
    Returns the list of plant coordinates, or None if any char can't be placed."""
    n_pages = len(pages)
    # Chars per page: distribute as evenly as possible (e.g., 43 over 6 pages → 8,8,7,7,7,6)
    base = len(flag_str) // n_pages
    extra = len(flag_str) % n_pages
    per_page = [base + (1 if i < extra else 0) for i in range(n_pages)]
    assert sum(per_page) == len(flag_str)

    plants: list[tuple[int, int, int, int]] = []
    char_idx = 0
    for pi in range(n_pages):
        body = pages[pi]["body"]
        # Reset cursor for each page; walk the body and grab the next per_page[pi] chars in order.
        li, wi, ci = 0, 0, 0
        page_targets = list(flag_str[char_idx : char_idx + per_page[pi]])
        for target in page_targets:
            found = None
            while li < len(body):
                line = body[li]
                if not line.strip():
                    li += 1; wi = 0; ci = 0; continue
                words = line.split()
                while wi < len(words):
                    word = words[wi]
                    while ci < len(word):
                        if word[ci] == target:  # case-sensitive — preserves flag's case
                            found = (pi, li, wi, ci)
                            ci += 1  # advance past this hit for next target on same page
                            break
                        ci += 1
                    if found is not None:
                        break
                    wi += 1; ci = 0
                if found is not None:
                    break
                li += 1; wi = 0; ci = 0
            if found is None:
                # Diagnostic: dump what we needed and where we got stuck
                remaining = page_targets[page_targets.index(target):]
                print(f"[DEBUG] Page {pi+1} stuck on char {target!r}; remaining for this page: {remaining!r}")
                print(f"[DEBUG] cursor was (line={li}, word={wi}, char={ci})")
                return None
            plants.append(found)
        char_idx += per_page[pi]
    return plants


# Try plain greedy first; if the body doesn't carry every needed char in order,
# we'll patch the body. The flag has chars: p,r,o,g,c,t,f,{,q,u,i,l,l,_,p,r,e,s,s,e,d,_,a,_,s,e,c,r,e,t,_,i,n,t,o,_,m,e,t,r,i,c,}.
# Notable: '{', '}', '_' are NOT present in the prose. We must inject them.
# Strategy: pre-process by inserting harmless-looking sentinel ASCII into the
# body to host those chars. We'll embed them in the closing line of each page
# using a "footer note" carrying e.g. the printer's mark "{N}" and an
# underscore-decorated section break.
# Easier approach: extend each page with a one-line "Compiler's mark:" entry
# that uses braces and underscores naturally (e.g. printer signatures like
# "set in 12pt {Caslon} — proof_n. 41"), giving us the chars we need.

# (Each page's body[0] already carries its char-chunk imprint line;
# no footer injection needed.)

plants = plan_plants(ALMANAC_PAGES, FLAG_STR)
if plants is None:
    raise SystemExit(
        "[FAIL] Could not place every flag character in the body in order. "
        "Edit the prose or the EXTRA_FOOTERS to expose the missing characters."
    )

# Sanity: verify each plant matches the flag char EXACTLY (case-sensitive).
print(f"[pressed] {len(plants)} plant points across the body:")
pages_used = set()
for fi, (pi, li, wi, ci) in enumerate(plants):
    word = ALMANAC_PAGES[pi]["body"][li].split()[wi]
    assert word[ci] == FLAG_STR[fi], (
        f"plant #{fi}: page{pi+1} L{li+1} word{wi+1} char{ci+1}: "
        f"got {word[ci]!r}, want {FLAG_STR[fi]!r}"
    )
    pages_used.add(pi + 1)
print(f"[pressed] plants distributed across pages: {sorted(pages_used)} ({len(pages_used)} of 6)")
assert len(pages_used) >= 4, "spec requires plants distributed across at least 4 pages"


# Build a per-character font-name map for the page body so the canvas knows
# when to switch fonts at draw time.
def font_for(pi: int, li: int, wi: int, ci: int) -> str:
    for (P, L, W, C) in plants:
        if (P, L, W, C) == (pi, li, wi, ci):
            return "Caslon-Italic-Quill"
    return "Caslon-Italic"


# ---------------------------------------------------------------------------
# 4. Render the PDF with per-character font switches
# ---------------------------------------------------------------------------
pdf_path = OUT / "almanac.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=LETTER)
PAGE_W, PAGE_H = LETTER
BODY_FONT_SIZE = 11
TITLE_FONT_SIZE = 15

for pi, page in enumerate(ALMANAC_PAGES):
    # Page header
    c.setFont("Caslon-Italic", TITLE_FONT_SIZE)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 0.9 * inch, "MARROWTIDE ALMANAC")
    c.setFont("Caslon-Italic", 11)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 1.15 * inch, page["title"])

    y = PAGE_H - 1.7 * inch
    for li, line in enumerate(page["body"]):
        if not line.strip():
            y -= 0.18 * inch
            continue
        # Render character by character with font switching only on the planted
        # positions. Other characters in a "planted" word still use Caslon-Italic.
        x = 1.0 * inch
        words = line.split()
        # Compute leading whitespace if any (we lose them on .split(); preserve
        # uniform single-space joining at draw time).
        for wi, word in enumerate(words):
            for ci, ch in enumerate(word):
                font_name = font_for(pi, li, wi, ci)
                c.setFont(font_name, BODY_FONT_SIZE)
                c.drawString(x, y, ch)
                x += c.stringWidth(ch, font_name, BODY_FONT_SIZE)
            # space separator after each word (except last)
            if wi < len(words) - 1:
                c.setFont("Caslon-Italic", BODY_FONT_SIZE)
                c.drawString(x, y, " ")
                x += c.stringWidth(" ", "Caslon-Italic", BODY_FONT_SIZE)
        y -= 0.20 * inch
        if y < 1.0 * inch:
            break

    # Page number
    c.setFont("Caslon-Italic", 9)
    c.drawCentredString(PAGE_W / 2, 0.6 * inch, f"— page {pi+1} of 6 —")
    c.showPage()

c.save()
print(f"[pressed] almanac.pdf: {pdf_path.stat().st_size} bytes ({len(ALMANAC_PAGES)} pages)")


# ---------------------------------------------------------------------------
# 5. Self-verify: re-open the PDF and walk content streams looking for spans
# whose font name contains 'Quill'. Concatenate → must equal the flag.
# ---------------------------------------------------------------------------
try:
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    n_pages = len(reader.pages)
    visible_text = ""
    for page in reader.pages:
        visible_text += (page.extract_text() or "") + "\n"
    assert "progctf" not in visible_text.lower(), "FAIL: pdftotext-equivalent extraction leaks 'progctf' into visible text"
    print("[pressed] pypdf visible-text extraction: clean ('progctf' not present)")
    # The "filter by font name" step in solution.md uses pymupdf; pypdf doesn't
    # expose font-per-span easily. So we additionally do a deeper check by
    # parsing the page content stream directly.
    quill_chars: list[str] = []
    body_chars_count = 0
    quill_font_pdfname = None  # we'll discover this

    # Find the PDF resource name for Caslon-Italic-Quill (e.g. /F2 or /F3) by
    # scanning each page's /Font dict.
    for page in reader.pages:
        resources = page.get("/Resources")
        if resources is None:
            continue
        fonts = resources.get("/Font", {})
        # Resolve indirect refs
        if hasattr(fonts, "get_object"):
            fonts = fonts.get_object()
        for ref_name, font_ref in fonts.items():
            font_obj = font_ref.get_object() if hasattr(font_ref, "get_object") else font_ref
            base = font_obj.get("/BaseFont", "")
            if "Quill" in str(base):
                quill_font_pdfname = ref_name
                break
        if quill_font_pdfname is not None:
            break
    print(f"[pressed] Quill font PDF resource name: {quill_font_pdfname!r}")

    # Walk each page's content stream, track which font is active, collect
    # characters drawn under the Quill font.
    from pypdf.generic import ContentStream

    for page in reader.pages:
        content = ContentStream(page.get_contents(), reader)
        active_font: str | None = None
        for operands, operator in content.operations:
            op = operator.decode("ascii", errors="ignore") if isinstance(operator, (bytes, bytearray)) else operator
            if op == "Tf":
                # operands: [/F1, fontsize]
                active_font = str(operands[0])
            elif op == "Tj":
                txt = operands[0]
                if isinstance(txt, bytes):
                    txt = txt.decode("latin-1")
                if active_font and "Quill" in str(active_font) or active_font == quill_font_pdfname:
                    quill_chars.append(txt)
            elif op == "TJ":
                txt = "".join(
                    (item.decode("latin-1") if isinstance(item, bytes) else "")
                    for item in operands[0]
                )
                if active_font and "Quill" in str(active_font) or active_font == quill_font_pdfname:
                    quill_chars.append(txt)

    quill_text = "".join(quill_chars)
    print(f"[pressed] recovered Quill-font text: {quill_text!r}")
    assert quill_text == FLAG_STR, f"FAIL: expected {FLAG_STR!r}, got {quill_text!r}"
    print(f"[pressed] roundtrip OK — Quill-font extraction matches flag exactly")
except ImportError:
    print("[pressed] (pypdf not available — skipping roundtrip verify)")


# ---------------------------------------------------------------------------
# manifest
# ---------------------------------------------------------------------------
manifest = (
    "Pressed in the Pages — player-served files\n"
    "==============================================\n"
    "almanac.pdf — a 6-page Marrowtide almanac. Read the typesetting, not the words.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")
print("[pressed] build OK")

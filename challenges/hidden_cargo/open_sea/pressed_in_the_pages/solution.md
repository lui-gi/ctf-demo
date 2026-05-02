# Solution — Pressed in the Pages

## Intended solve

1. **Open `almanac.pdf`** in any reader. Looks like a normal multi-page almanac. Tools: any PDF viewer. (~3 min)
2. **Inspect with `pdftotext` and observe the text comes out cleanly** — but the README says "read the typesetting, not the words." That hints the player needs to look at the PDF's font usage, not its visible content. (~5 min)
3. **Use `pdfinfo` and `pdffonts`** on the file. `pdffonts almanac.pdf` lists multiple embedded fonts: a primary `Caslon-Italic` (the body face) and a secondary `Caslon-Italic-Quill` (custom — slight metric differences only). Both look identical to the eye. (~10 min)
4. **Walk the PDF content stream.** Use a library like `pikepdf`, `pdfplumber`, or `pymupdf` (fitz). For each text-showing operator, record the font that was active. Tools: Python + pymupdf:
   ```python
   import fitz
   doc = fitz.open('almanac.pdf')
   hidden = []
   for page in doc:
       blocks = page.get_text("dict")
       for block in blocks["blocks"]:
           for line in block.get("lines",[]):
               for span in line["spans"]:
                   if "Quill" in span["font"]:
                       hidden.append(span["text"])
   print("".join(hidden))
   ```
   (~30 min)
5. **Read the recovered string.** Concatenated glyphs from the secondary font, in document order, spell `the_almanac_keeper_was_a_typesetter_at_heart_progctf{quill_pressed_a_secret_into_metric}`. Trim to the flag. (~5 min)

## Total estimated time: 60–90 minutes

## Why this is Open Sea
- Two techniques: PDF font enumeration + scripted content-stream walking.
- Cannot be solved by hand for a 60+ char message — forces the player to write code.
- README explicitly hints at typesetting; pdffonts immediately confirms there are two suspiciously-similar fonts.
- Beginner who only runs `pdftotext` will see a clean almanac and find nothing.

## Implementer note
Powder Monkey: produce a multi-page (~6 pages) PDF using two embedded subset fonts that are visually identical — easiest path is to take Caslon (or any open Italic face), fork it, rename to `Caslon-Italic-Quill`, alter only one or two glyph metrics by 1/1000 em (invisible) so the rendering looks identical. Layout the almanac body in `Caslon-Italic`. Sprinkle individual glyphs in `Caslon-Italic-Quill` such that, in document order, those glyphs spell the literal flag string `progctf{quill_pressed_a_secret_into_metric}` — at least 35 characters worth, distributed across pages. Use `fontTools` + `reportlab` (or `weasyprint` with custom CSS @font-face declarations).

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, fontTools 4.62, reportlab 4.5, pypdf 6.10). The Caslon-Italic and Caslon-Italic-Quill fonts are forked at build time from `C:/Windows/Fonts/timesi.ttf` (Times New Roman Italic). Both forks share identical glyph outlines; the Quill fork additionally has the advance-width of one rare glyph ("zcaron") nudged by a single font-design unit (~1/2048 em — visually imperceptible at any reading zoom) so that the two fonts are byte-distinct and pdffonts reports them as separate embedded subsets.

The build script self-verifies by re-opening the rendered PDF, walking each page's PDF content stream, tracking the active font across `Tf` operators, and concatenating any text drawn under the Caslon-Italic-Quill font — that string MUST equal the flag exactly, or the build aborts. It also confirms that `pypdf.extract_text()` (the pdftotext-equivalent path) returns clean almanac body text with no occurrence of "progctf".

```
$ python build/make.py
[pressed] wrote Caslon-Italic.ttf (943152 bytes)
[pressed] wrote Caslon-Italic-Quill.ttf  (943168 bytes)
[pressed] 43 plant points across the body:
[pressed] plants distributed across pages: [1, 2, 3, 4, 5, 6] (6 of 6)
[pressed] almanac.pdf: 108384 bytes (6 pages)
[pressed] pypdf visible-text extraction: clean ('progctf' not present)
[pressed] Quill font PDF resource name: '/F3+0'
[pressed] recovered Quill-font text: 'progctf{quill_pressed_a_secret_into_metric}'
[pressed] roundtrip OK — Quill-font extraction matches flag exactly
[pressed] build OK

$ ls files/
almanac.pdf  MANIFEST.txt

$ python build/cold_solve.py
[player] almanac.pdf: 6 pages
[player] fonts in document: ['/AAAAAA+Caslon-Italic', '/AAAAAA+Caslon-Italic-Quill', '/Helvetica']
[player] Quill font PDF resource name: /F3+0
[player] total body characters drawn: 3763
[player] characters drawn in Quill font: 43

RECOVERED: progctf{quill_pressed_a_secret_into_metric}
[player] pdftotext-equivalent extraction is clean (no 'progctf' substring)
```

The Caslon-Italic font draws 3720 of the 3763 visible body characters; the Caslon-Italic-Quill font draws exactly 43 — one per character of the flag — distributed across all 6 pages. Each plant lands at a position where the surrounding word is set in Caslon-Italic, so visually the planted character is indistinguishable from its neighbours; only a content-stream walker that filters by font name recovers the message.

The flag chars are planted in document order across pages: page 1 carries `progctf{` (chars 0–7), page 2 carries `quill_p` (8–14), page 3 carries `ressed_` (15–21), page 4 carries `a_secre` (22–28), page 5 carries `t_into_` (29–35), page 6 carries `metric}` (36–42). Each page's plant chunk is hosted by a single "printer's imprint" line at the top of the body, with the rest of the page being plausible 18th-century almanac prose (tide tables, saints' days, weather lore, market calendars, navigation notes, the compiler's closing remarks).

**Anti-leak audit:**
- `grep -ac "progctf" files/almanac.pdf` → 0. The flag chars are split across the body text and never appear contiguously in the file's bytes (they are stored in subsetted CID-encoded glyph references, not as plaintext).
- `grep -ac "quill_pressed" files/almanac.pdf` → 0.
- `pypdf.extract_text()` (pdftotext-equivalent) returns 100% clean almanac content with no "progctf" substring — verified at build time by an explicit assertion.
- The two font name strings (`Caslon-Italic` and `Caslon-Italic-Quill`) appear in the PDF font dictionary as part of normal PDF structure — these are visible only via `pdffonts`-style enumeration, which IS the intended cue for the player.

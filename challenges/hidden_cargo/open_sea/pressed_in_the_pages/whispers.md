# Whispers — Pressed in the Pages

## Whisper 1 (-10%)
The visible text of the PDF is irrelevant. Don't read it. Examine *how* the PDF is constructed — specifically, the fonts it uses.

## Whisper 2 (-20% cumulative)
Run `pdffonts almanac.pdf`. There are two embedded fonts that look identical to the eye but are distinct objects. The hidden message is built from glyphs typeset in the *secondary* font, scattered through the visible body text in the *primary* font.

## Whisper 3 (-35% cumulative)
Walk the PDF content stream with `pymupdf` / `fitz` or `pdfplumber`. For each text span, record the font face name. Concatenate the text of every span using the secondary font (the one with "Quill" in the name), in document order. The result contains the flag (you'll need to trim some flavor text around it). Final 20% is writing the actual extraction script.

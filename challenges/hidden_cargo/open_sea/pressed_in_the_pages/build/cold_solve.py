"""Cold-solve harness for pressed_in_the_pages.

Replays the player's intended path:
  1. Run pdffonts-equivalent: enumerate fonts in almanac.pdf — find two
     embedded fonts that look identical but have different names. The one
     named "Caslon-Italic-Quill" is the secret-bearing font.
  2. Walk the page content stream of every page, tracking the active font
     across `Tf` operators. Whenever the active font is the Quill font,
     append the drawn characters to a buffer. The concatenated buffer in
     document order spells the flag.
  3. Sanity-check that pdftotext-equivalent extraction returns clean
     almanac body content with no occurrence of the flag string.

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader
from pypdf.generic import ContentStream

ISLAND = Path(__file__).resolve().parent.parent
PDF_PATH = ISLAND / "files" / "almanac.pdf"


def main() -> None:
    reader = PdfReader(str(PDF_PATH))
    n_pages = len(reader.pages)
    print(f"[player] almanac.pdf: {n_pages} pages")

    # --- step 1: enumerate fonts (pdffonts-equivalent) ---------------------
    fonts_seen: set[str] = set()
    quill_pdf_resource: str | None = None
    for page in reader.pages:
        resources = page.get("/Resources")
        if resources is None:
            continue
        fonts = resources.get("/Font", {})
        if hasattr(fonts, "get_object"):
            fonts = fonts.get_object()
        for ref_name, font_ref in fonts.items():
            font_obj = font_ref.get_object() if hasattr(font_ref, "get_object") else font_ref
            base = str(font_obj.get("/BaseFont", ""))
            fonts_seen.add(base)
            if "Quill" in base and quill_pdf_resource is None:
                quill_pdf_resource = ref_name

    print(f"[player] fonts in document: {sorted(fonts_seen)}")
    assert quill_pdf_resource is not None, "expected a font with 'Quill' in its name"
    print(f"[player] Quill font PDF resource name: {quill_pdf_resource}")

    # --- step 2: walk content streams, collect Quill-font characters --------
    quill_chars: list[str] = []
    body_text_chars = 0
    for page in reader.pages:
        content = ContentStream(page.get_contents(), reader)
        active_font: str | None = None
        for operands, operator in content.operations:
            op = operator.decode("ascii", errors="ignore") if isinstance(operator, (bytes, bytearray)) else operator
            if op == "Tf":
                active_font = str(operands[0])
            elif op == "Tj":
                txt = operands[0]
                if isinstance(txt, bytes):
                    txt = txt.decode("latin-1")
                body_text_chars += len(txt)
                if active_font == quill_pdf_resource:
                    quill_chars.append(txt)
            elif op == "TJ":
                txt = "".join(
                    (item.decode("latin-1") if isinstance(item, bytes) else "")
                    for item in operands[0]
                )
                body_text_chars += len(txt)
                if active_font == quill_pdf_resource:
                    quill_chars.append(txt)

    quill_text = "".join(quill_chars)
    print(f"[player] total body characters drawn: {body_text_chars}")
    print(f"[player] characters drawn in Quill font: {len(quill_text)}")
    print(f"\nRECOVERED: {quill_text}")

    # --- step 3: sanity check — pdftotext-style extraction is clean -------
    visible = ""
    for page in reader.pages:
        visible += (page.extract_text() or "") + "\n"
    assert "progctf" not in visible.lower(), (
        "FAIL: visible text leaks 'progctf' — the flag is exposed without the font filter"
    )
    print(f"[player] pdftotext-equivalent extraction is clean (no 'progctf' substring)")

    # Final assertion — the flag must match
    expected = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
    assert quill_text == expected, f"mismatch: got {quill_text!r}, want {expected!r}"


if __name__ == "__main__":
    main()

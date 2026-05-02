"""Cold-solve harness for shanty_with_a_secret — acrostic half only.

Half 1 (this harness):
  Open lyrics.pdf with pypdf → tokenize → drop stop-list articles →
  every-7th-word-first-letter acrostic → recover passphrase
  "pale_cassandra_drift_19".

Half 2 (mp3stego — BUILD-DEFERRED to Linux):
  Run `mp3stego decode -X -P 'pale_cassandra_drift_19' files/shanty.mp3 out.bin`
  → cat out.bin → "progctf{the_shanty_kept_two_halves}\\n".

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

import re
from pathlib import Path

from pypdf import PdfReader

ISLAND = Path(__file__).resolve().parent.parent
PDF_PATH = ISLAND / "files" / "lyrics.pdf"

STOP_LIST = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "it", "is"}
TITLE_LINES = {"The Lay of Marrowtide Bay", "as sung by the crew of the Reefborn"}


def main() -> None:
    reader = PdfReader(str(PDF_PATH))
    print(f"[player] lyrics.pdf: {len(reader.pages)} page(s)")

    # Step 1: pdftotext-equivalent extraction
    raw = ""
    for page in reader.pages:
        raw += (page.extract_text() or "") + "\n"

    # Strip header/footer cruft
    body_lines = [
        ln for ln in raw.splitlines()
        if ln.strip()
        and ln.strip() not in TITLE_LINES
        and not ln.strip().startswith("— Marrowtide press")
    ]
    print(f"[player] {len(body_lines)} body lines after stripping headers")

    # Step 2: tokenize, remove articles
    text = " ".join(body_lines)
    words = text.split()

    def is_article(w: str) -> bool:
        return re.sub(r"[^a-z0-9]", "", w.lower()) in STOP_LIST

    non_article = [w for w in words if not is_article(w)]
    print(f"[player] {len(words)} words total, {len(non_article)} non-article words")

    # Step 3: every 7th word (1st, 8th, 15th, ...) → first letter
    selected = non_article[::7]
    acrostic = "".join(w[0].lower() for w in selected)
    print(f"[player] selected {len(selected)} words at every-7th positions")
    print(f"[player] acrostic: {acrostic!r}")

    # Step 4: normalize to passphrase format. The spec defines the passphrase
    # as "pale_cassandra_drift_19", with underscores serving as visible word
    # boundaries. The recovered acrostic is a flat string; the player groups
    # it by the obvious word-shape ("pale", "cassandra", "drift", "19").
    expected_spelled = "palecassandradrift19"
    assert acrostic == expected_spelled, (
        f"acrostic mismatch: got {acrostic!r}, want {expected_spelled!r}"
    )
    passphrase = "pale_cassandra_drift_19"
    print(f"[player] recovered passphrase: {passphrase!r}")

    # Half 2 (mp3stego) — only attempt if the real MP3 was built.
    mp3_path = ISLAND / "files" / "shanty.mp3"
    stub_path = ISLAND / "files" / "shanty.mp3.NOT_BUILT"
    if mp3_path.exists() and not stub_path.exists():
        import shutil, subprocess, tempfile
        if shutil.which("mp3stego") is None:
            print("[player] (mp3stego CLI not on PATH — skipping MP3 decode)")
        else:
            with tempfile.NamedTemporaryFile(suffix=".bin", delete=False) as tf:
                out_bin = tf.name
            try:
                subprocess.run(
                    ["mp3stego", "decode", "-X", "-P", passphrase, str(mp3_path), out_bin],
                    check=True,
                )
                payload = Path(out_bin).read_bytes()
                print(f"[player] mp3stego decode payload: {payload!r}")
                expected = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
                assert payload.decode("utf-8").strip() == expected
                print(f"\nRECOVERED: {expected}")
            finally:
                Path(out_bin).unlink(missing_ok=True)
    else:
        # Half 2 deferred — confirm half 1 alone, point at the deferral note.
        print("[player] (shanty.mp3 BUILD-DEFERRED — half 2 cannot run on this host)")
        print("[player]  → see solution.md 'Quartermaster follow-up' for the Linux mp3stego pass")
        print()
        print("HALF-1 RECOVERED PASSPHRASE: pale_cassandra_drift_19")
        print("HALF-2 EXPECTED FLAG (after Linux mp3stego pass):")
        print(f"        {(ISLAND / 'flag.txt').read_text(encoding='utf-8').strip()}")


if __name__ == "__main__":
    main()

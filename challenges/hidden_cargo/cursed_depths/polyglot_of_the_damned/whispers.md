# Whispers — Polyglot of the Damned

## Whisper 1 (-10%)
The same bytes form a valid PNG, ZIP, and PDF — `binwalk` will confirm. Each format hides a different fragment of the Treasure. The PNG fragment is in the alpha channel's LSB; the ZIP fragment is in a comment; the PDF fragment is in an "orphan" content stream not referenced by the page tree.

## Whisper 2 (-20% cumulative)
The fourth fragment is derived. Concatenate the first three fragments (in order), take SHA-256 of the result, and XOR against a 32-byte constant stored in the PNG's iTXt chunk under the key `xorpad`. The result is the fourth (and final) fragment. The full flag is the four fragments concatenated in order.

## Whisper 3 (-35% cumulative)
- Fragment 1 extraction: read the alpha channel LSB of every pixel in row-major order; pack into bytes; the resulting bytes start with a recognizable prefix.
- Fragment 2 extraction: list all ZIP entries; one has size 0 and a non-empty comment field — that's it.
- Fragment 3 extraction: enumerate PDF objects (use `qpdf --qdf` or `pikepdf`); find the object whose stream is NOT referenced from any /Page object — its decompressed stream is the third fragment.
- Fragment 4: SHA-256(F1||F2||F3) XOR base64-decode(iTXt['xorpad']).
Final 20%: writing the extractors and assembling the four pieces in the correct order.

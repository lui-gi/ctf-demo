# Solution — Polyglot of the Damned

## Intended solve

### Identify the polyglot

1. **Run `file polyglot.bin`** → reports PNG. (~5 min)
2. **Try `unzip -l polyglot.bin`** → also lists ZIP entries. (~2 min)
3. **Try opening in a PDF reader** → renders as a 1-page PDF. (~2 min)
4. **Confirm polyglot** with `binwalk polyglot.bin` — shows PNG header at offset 0, PDF header somewhere later, ZIP central directory at the end. (~10 min)

### Extract fragment 1: PNG LSB-in-alpha

5. **Decode the PNG normally.** Open in PIL: `img = PIL.Image.open('polyglot.bin')` — verify mode is RGBA (so an alpha channel exists). (~10 min)
6. **Extract the LSB of the alpha channel** for each pixel in row-major order, pack to bytes:
   ```python
   bits = []
   for y in range(img.height):
       for x in range(img.width):
           a = img.getpixel((x,y))[3]
           bits.append(a & 1)
   data = bytes(int(''.join(map(str,bits[i:i+8])),2) for i in range(0,len(bits),8))
   ```
   The decoded data starts with `FRAG1=` then a partial flag fragment (e.g., `FRAG1=progctf{the_thr`). (~30 min)

### Extract fragment 2: ZIP zero-byte entry comment

7. **List ZIP entries:** `python -c "import zipfile; z=zipfile.ZipFile('polyglot.bin'); [print(i.filename, i.comment) for i in z.infolist()]"`. One entry has `file_size=0` and a non-empty `comment` field. (~15 min)
8. **Read the comment.** Comment is `FRAG2=ee_faces_of_a_si` (continues the flag). (~5 min)

### Extract fragment 3: PDF unused content stream

9. **Inspect PDF objects** with `pikepdf`, `qpdf --qdf polyglot.bin -`, or `mutool show polyglot.bin trailer`. (~30 min)
10. **Find the "unused" content stream.** Most PDF objects are referenced from the page tree; find an object NOT referenced by any page (orphan). Its decompressed stream contains `FRAG3=ngle_b1n_progctf{`. (~30 min)

### Extract fragment 4: XOR-derived from XOR(F1,F2,F3) ⊕ constant

11. **Concatenate F1, F2, F3** in order. (~5 min)
12. **Find the constant.** README says it's "embedded in the PNG's iTXt chunk." Run `pnginfo polyglot.bin` or use `pypng`/`PIL.PngImagePlugin` to dump iTXt entries. One iTXt has key `xorpad` and a base64 value. Decode the base64 → 32 bytes. (~30 min)
13. **Compute SHA-256 of (F1+F2+F3) and XOR against the constant:**
    ```python
    import hashlib
    h = hashlib.sha256(F1+F2+F3).digest()
    F4 = bytes(a^b for a,b in zip(h, constant))
    ```
    F4 is the final fragment, ASCII: `_polyglot}`. (~20 min)
14. **Reassemble the full flag:** `progctf{the_three_faces_of_a_single_b1n_polyglot}`. Submit. (~5 min)

## Total estimated time: 4–5 hours

## Why this is Cursed Depths
- Forces the player to identify and exercise THREE distinct file format handlers on the same bytes.
- Each fragment uses a different stego technique (LSB, ZIP comment, orphan PDF object).
- The fourth-fragment derivation requires recognizing that the iTXt chunk holds metadata AND that XOR(SHA-256(F1+F2+F3), constant) is the bridge — neither is obvious without reading the README carefully.
- No tool exists that decodes all four fragments end-to-end.
- Beginners who solve PNG-LSB will find one piece and assume that's the flag; the readme's "fragments" wording forces deeper exploration.

## Implementer note
Powder Monkey: build the polyglot using a tool like `mitra` or hand-craft. Layout:
- 0..N: PNG container (signature, IHDR, IDAT(s), IEND, iTXt with `xorpad=<base64 of 32 random bytes>`).
- N+1..M: PDF body inserted between PNG IEND and ZIP central directory (PNG decoders ignore trailing data; PDF parsers seek backwards from `%%EOF`; ZIP parsers seek backwards from EOCD).
- M+1..end: ZIP central directory + EOCD with one zero-byte entry whose comment is FRAG2.
- Pixel alpha LSBs encode FRAG1.
- One PDF stream object NOT referenced from the page tree contains FRAG3.
- iTXt `xorpad` constant is chosen so that SHA-256(FRAG1+FRAG2+FRAG3) XOR constant = `_polyglot}\x00...padding`. Compute backwards from the desired F4.
- Fragment 1: `FRAG1=progctf{the_thr`
- Fragment 2: `FRAG2=ee_faces_of_a_si`
- Fragment 3: `FRAG3=ngle_b1n_polyglot}` — wait, the spec ends "_polyglot}". Let me consolidate: the assembled flag is `progctf{the_three_faces_of_a_single_b1n_polyglot}`. Split as F1=`progctf{the_thr`, F2=`ee_faces_of_a_si`, F3=`ngle_b1n`, F4=`_polyglot}`. Adjust constants accordingly so SHA-256(F1+F2+F3) XOR constant equals F4 padded to 32 bytes.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, Pillow, pypdf 6.10). The polyglot is hand-crafted (no `mitra`) so it is fully reproducible from the build script. The procedural PNG background uses a SplitMix64-style PRG seeded by `("polyglot_of_the_damned|" + flag)` so two builds produce byte-identical artifacts.

### Layout

```
+----------------------------------------+ offset 0
| PNG signature (8 bytes)                |
| IHDR chunk (200x200 RGBA)              |
| IDAT chunks (image data; F1 in alpha   |
|   LSBs of first 120 pixels)            |
| iTXt chunk: key="xorpad",              |
|   value=base64(32-byte XOR pad)        |
| IEND chunk                             |
+----------------------------------------+ offset 45474
| %PDF-1.4 + binary marker               |
| 6 indirect objects:                    |
|   1: /Catalog → 2                      |
|   2: /Pages → [3]                      |
|   3: /Page (uses /F1, /Contents=5)     |
|   4: /Font Helvetica                   |
|   5: stream (page content)             |
|   6: ORPHAN stream — FlateDecode(F3)   |
| xref + trailer + %%EOF                 |
+----------------------------------------+ offset 46222
| ZIP local file header for "note"       |
|   (file_size=0)                        |
| ZIP central directory record           |
|   (per-entry comment = F2)             |
| EOCD                                   |
+----------------------------------------+ offset 46344
```

The ZIP central directory's LFH offset is patched at build time to be absolute within the polyglot file (`len(png_bytes) + len(pdf_bytes)`), so `unzip -l` and `zipfile.ZipFile` parse the archive correctly even though the LFH is not at byte 0.

### Build + cold-solve trace

```
$ python build/make.py
[poly] SHA256(F1||F2||F3) = 96bb981086dd73d15e4ed0fb6512dd7ab675e05d40658aaf134a68340085857d
[poly] xorpad (base64)    = ycv3fP+6H74qM9D7ZRLderZ14F1AZYqvE0poNACFhX0= (32 raw bytes)
[poly] PNG section: 45474 bytes (200x200 RGBA)
[poly] PDF section: 748 bytes (6 objects, orphan obj 6 carries 16-byte FlateDecode of F3)
[poly] ZIP section: 122 bytes (LFH 34 + CD 66 + EOCD 22)
[poly] polyglot.bin: 46344 bytes

[poly] === self-verify ===
[poly] F1 recovered: b'progctf{the_thr'
[poly] iTXt 'xorpad' recovered (32 bytes)
[poly] F2 recovered (ZIP entry comment): b'ee_faces_of_a_si'
[poly] orphan PDF stream is object #6, decompressed = b'ngle_b1n'
[poly] F4 derived: b'_polyglot}'

RECOVERED: progctf{the_three_faces_of_a_single_b1n_polyglot}
[poly] build OK

$ ls files/
MANIFEST.txt  polyglot.bin

$ file files/polyglot.bin
files/polyglot.bin: PNG image data, 200 x 200, 8-bit/color RGBA, non-interlaced

$ python -c "from PIL import Image; img=Image.open('files/polyglot.bin'); print(img.size, img.mode, img.format)"
(200, 200) RGBA PNG

$ python -c "import zipfile; zf=zipfile.ZipFile('files/polyglot.bin'); print([(i.filename, i.file_size, i.comment) for i in zf.infolist()])"
[('note', 0, b'ee_faces_of_a_si')]

$ python build/cold_solve.py
[player] polyglot.bin: 46344 bytes
[player] PIL opens as PNG, mode=RGBA, size=200x200
[player] F1 (PNG alpha LSB): b'progctf{the_thr'
[player] iTXt xorpad: 32 bytes (base64-decoded)
[player] zipfile finds 1 entry(ies)
[player]   'note': file_size=0, comment=b'ee_faces_of_a_si'
[player] pypdf finds 1 page(s)
[player] referenced object ids: [1, 2, 3, 4, 5]
[player]   orphan obj #6: stream decompresses to b'ngle_b1n'
[player] F3 (orphan PDF stream obj #6): b'ngle_b1n'
[player] F4 (XOR-derived): b'_polyglot}'

RECOVERED: progctf{the_three_faces_of_a_single_b1n_polyglot}
```

(pypdf prints two informational warnings — `invalid pdf header: b'\x89PNG\r'` and `incorrect startxref pointer(1)` — then falls back to `parsing for Object Streams` and succeeds. This is expected: the polyglot's first bytes are the PNG signature, not `%PDF-1.4`. `qpdf` and `mutool` accept the polyglot the same way; strict validators that require `%PDF` in the first 1024 bytes may need to be pointed at the PDF section directly.)

**Anti-leak audit:**
- `grep -ac "progctf" files/polyglot.bin` → 0. F1 is encoded one bit per pixel in the alpha channel; the bytes never appear contiguously in the file.
- `grep -ac "the_three_faces" files/polyglot.bin` → 0. The full assembled flag string never appears anywhere; it is only reconstructible by chaining all four fragment retrievals.
- `grep -ac "the_thr\|ngle_b1n\|polyglot}" files/polyglot.bin` → 0. F1 lives in alpha LSBs (not as bytes), F3 lives FlateDecode-compressed inside an orphan PDF stream, F4 is XOR-derived (never present).
- `grep -ac "ee_faces_of_a_si" files/polyglot.bin` → 1. F2 is intentionally plaintext in the ZIP entry's per-file comment field — the spec requires this hiding spot.
- The 32-byte xorpad in the iTXt 'xorpad' chunk is also visible (as base64) — also intentional per spec.

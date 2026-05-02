"""Build script for polyglot_of_the_damned — produces a single polyglot.bin
that is simultaneously a valid PNG, PDF, and ZIP.

Layout (file offsets, in order):
   0..A  PNG signature + IHDR + IDAT chunks + iTXt(xorpad=...) + IEND
   A..B  PDF body — 1-page document with multiple stream objects, including
         ONE orphan stream containing F3 (FlateDecode-compressed)
   B..   ZIP local file headers + central directory + EOCD whose comment
         carries no flag material; the per-entry "note" comment carries F2

Fragment plan (assembled flag = "progctf{the_three_faces_of_a_single_b1n_polyglot}"):
   F1 = "progctf{the_thr"  (15 chars) → LSB of alpha channel, first 120 pixels
   F2 = "ee_faces_of_a_si" (16 chars) → ZIP entry per-file comment of "note"
   F3 = "ngle_b1n"         (8 chars)  → FlateDecode'd content stream of an
                                        orphan PDF object
   F4 = "_polyglot}"       (10 chars) → derived: SHA-256(F1||F2||F3) XOR xorpad
                                        where xorpad lives in iTXt 'xorpad'

Verification at end re-opens the file as PNG/PDF/ZIP and recovers each
fragment, then assembles + checks the flag.
"""
from __future__ import annotations

import base64
import hashlib
import io
import struct
import zipfile
import zlib
from pathlib import Path

from PIL import Image, PngImagePlugin

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
assert flag == "progctf{the_three_faces_of_a_single_b1n_polyglot}", "flag drift"

# Fragment definitions — these MUST concatenate to the flag in F1+F2+F3+F4 order.
F1 = b"progctf{the_thr"
F2 = b"ee_faces_of_a_si"
F3 = b"ngle_b1n"
F4 = b"_polyglot}"
assert F1 + F2 + F3 + F4 == flag.encode("utf-8")
assert len(F1) == 15
assert len(F2) == 16
assert len(F3) == 8
assert len(F4) == 10


# Determinism --------------------------------------------------------------
def make_rng(seed: bytes):
    h = hashlib.sha256(seed).digest()
    state = [int.from_bytes(h[:8], "big")]

    def rand_byte() -> int:
        # SplitMix64-ish iterator from the PRG state
        state[0] = (state[0] * 0x9E3779B97F4A7C15 + 0xC0FFEE) & ((1 << 64) - 1)
        return (state[0] >> 56) & 0xFF

    return rand_byte


rand_byte = make_rng(b"polyglot_of_the_damned|" + flag.encode("utf-8"))


# ---------------------------------------------------------------------------
# 1. Compute the xorpad so that SHA-256(F1+F2+F3) XOR xorpad == F4 (padded
#    to 32 bytes with 0x00).
# ---------------------------------------------------------------------------
sha = hashlib.sha256(F1 + F2 + F3).digest()
F4_padded = F4 + b"\x00" * (32 - len(F4))
xorpad = bytes(a ^ b for a, b in zip(sha, F4_padded))
xorpad_b64 = base64.b64encode(xorpad).decode("ascii")
print(f"[poly] SHA256(F1||F2||F3) = {sha.hex()}")
print(f"[poly] xorpad (base64)    = {xorpad_b64} ({len(xorpad)} raw bytes)")

# Self-check
assert bytes(a ^ b for a, b in zip(sha, xorpad)) == F4_padded


# ---------------------------------------------------------------------------
# 2. Build the PNG: 200x200 RGBA, sea-themed procedural pattern, with F1
#    encoded into the alpha LSB of the first 120 pixels (row-major), and an
#    iTXt chunk holding the xorpad.
# ---------------------------------------------------------------------------
W, H = 200, 200

img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
pixels = img.load()
# A Marrowtide-themed procedural sea: blue/green stripes with deterministic
# alpha jitter so that LSB modifications don't introduce visible artefacts.
for y in range(H):
    for x in range(W):
        r = (50 + (y // 4) * 2) & 0xFF
        g = (90 + ((x ^ y) // 3)) & 0xFF
        b = (140 + (x // 2)) & 0xFF
        # Alpha mostly opaque (224..254) so flipping LSB barely matters visually.
        a = 224 + (rand_byte() & 0x1E)  # always even, so LSB will be 0 by default
        pixels[x, y] = (r, g, b, a)

# Encode F1 (15 bytes = 120 bits) into alpha LSB of the first 120 pixels.
flag_bits: list[int] = []
for byte in F1:
    for i in range(8):
        flag_bits.append((byte >> (7 - i)) & 1)  # MSB-first per byte
assert len(flag_bits) == 120

idx = 0
for y in range(H):
    for x in range(W):
        if idx >= 120:
            break
        r, g, b, a = pixels[x, y]
        a = (a & 0xFE) | flag_bits[idx]
        pixels[x, y] = (r, g, b, a)
        idx += 1
    if idx >= 120:
        break

# Add iTXt 'xorpad' metadata
meta = PngImagePlugin.PngInfo()
meta.add_itxt("xorpad", xorpad_b64)

png_buf = io.BytesIO()
img.save(png_buf, format="PNG", pnginfo=meta, compress_level=6, optimize=False)
png_bytes = png_buf.getvalue()
print(f"[poly] PNG section: {len(png_bytes)} bytes ({W}x{H} RGBA)")


# ---------------------------------------------------------------------------
# 3. Build the PDF body: 1-page document with multiple stream objects.
#    ONE stream object is an orphan — not referenced by /Pages or any /Kids.
#    Its FlateDecode content == F3.
# ---------------------------------------------------------------------------
def pdf_object(num: int, body: bytes) -> bytes:
    return f"{num} 0 obj\n".encode() + body + b"\nendobj\n"


def pdf_stream(num: int, data: bytes) -> bytes:
    return (
        f"{num} 0 obj\n<< /Length {len(data)} /Filter /FlateDecode >>\nstream\n".encode()
        + data
        + b"\nendstream\nendobj\n"
    )


# Compress F3 with FlateDecode (this is what gets embedded in the orphan stream)
F3_compressed = zlib.compress(F3, level=9)

# Page content stream — draws a small caption so the page renders if opened.
content_stream_text = (
    b"BT\n/F1 12 Tf\n72 720 Td\n(Marrowtide polyglot \\[1 of 3\\]) Tj\nET\n"
)
content_stream_compressed = zlib.compress(content_stream_text, level=9)

# Build PDF objects:
#   1: Catalog → Pages
#   2: Pages   → [Page]
#   3: Page    → uses /F1 from /Resources, /Contents = obj 5
#   4: Font    → Helvetica
#   5: Page content stream (referenced by /Contents)
#   6: ORPHAN stream containing F3 (NOT referenced by anything)
out = io.BytesIO()
out.write(b"%PDF-1.4\n")
out.write(b"%\xe2\xe3\xcf\xd3\n")  # binary marker so type-detectors call this binary

offsets: list[int] = [0]  # 1-indexed (offsets[1] = byte offset of obj 1)

def add(obj_bytes: bytes) -> None:
    offsets.append(out.tell())
    out.write(obj_bytes)


add(pdf_object(1, b"<< /Type /Catalog /Pages 2 0 R >>"))
add(pdf_object(2, b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>"))
add(pdf_object(
    3,
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
    b"/Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>",
))
add(pdf_object(4, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"))
add(pdf_stream(5, content_stream_compressed))
# OBJECT 6 — orphan stream carrying F3. Note: this object number does NOT
# appear in any /Page or /Kids reference.
add(pdf_stream(6, F3_compressed))

# xref + trailer
xref_offset = out.tell()
n_objects = len(offsets)  # includes the [0] entry
out.write(f"xref\n0 {n_objects}\n".encode())
out.write(b"0000000000 65535 f \n")
for off in offsets[1:]:
    out.write(f"{off:010d} 00000 n \n".encode())
out.write(b"trailer\n")
out.write(f"<< /Size {n_objects} /Root 1 0 R >>\n".encode())
out.write(f"startxref\n{xref_offset}\n%%EOF\n".encode())
pdf_bytes = out.getvalue()
print(f"[poly] PDF section: {len(pdf_bytes)} bytes ({n_objects-1} objects, "
      f"orphan obj 6 carries {len(F3_compressed)}-byte FlateDecode of F3)")


# ---------------------------------------------------------------------------
# 4. Build the ZIP section with one zero-byte entry whose per-file comment
#    carries F2. We construct local file header + central directory + EOCD
#    by hand so we can fix the LFH offset to be relative to the start of
#    the polyglot file (the ZIP archive sits at byte offset
#    `len(png_bytes) + len(pdf_bytes)` of the final blob).
# ---------------------------------------------------------------------------
ZIP_PREFIX_LEN = len(png_bytes) + len(pdf_bytes)

# --- local file header for "note" entry (zero-byte file) ----
filename = b"note"
crc = 0  # CRC of empty data
compressed_size = 0
uncompressed_size = 0
mod_time = 0
mod_date = 0x21  # 1980-01-01

lfh = struct.pack(
    "<IHHHHHIIIHH",
    0x04034B50,  # local file header signature
    20,           # version needed
    0,            # general purpose bit flag
    0,            # compression method (stored)
    mod_time,
    mod_date,
    crc,
    compressed_size,
    uncompressed_size,
    len(filename),
    0,            # extra field length
) + filename

# --- central directory record ----
cd = struct.pack(
    "<IHHHHHHIIIHHHHHII",
    0x02014B50,  # central dir header signature
    20,           # version made by
    20,           # version needed
    0,            # general purpose bit flag
    0,            # compression method
    mod_time,
    mod_date,
    crc,
    compressed_size,
    uncompressed_size,
    len(filename),
    0,            # extra field length
    len(F2),      # file comment length
    0,            # disk number start
    0,            # internal file attributes
    0,            # external file attributes
    ZIP_PREFIX_LEN,  # offset of LFH (absolute in the polyglot file)
) + filename + F2

# --- EOCD ----
eocd = struct.pack(
    "<IHHHHIIH",
    0x06054B50,
    0,            # disk number
    0,            # disk where CD starts
    1,            # CD records on this disk
    1,            # total CD records
    len(cd),      # size of CD
    ZIP_PREFIX_LEN + len(lfh),  # offset of CD start (absolute)
    0,            # archive comment length
)

zip_bytes = lfh + cd + eocd
print(f"[poly] ZIP section: {len(zip_bytes)} bytes "
      f"(LFH {len(lfh)} + CD {len(cd)} + EOCD {len(eocd)})")


# ---------------------------------------------------------------------------
# 5. Concatenate and write the polyglot.
# ---------------------------------------------------------------------------
polyglot_bytes = png_bytes + pdf_bytes + zip_bytes
out_path = OUT / "polyglot.bin"
out_path.write_bytes(polyglot_bytes)
print(f"[poly] polyglot.bin: {len(polyglot_bytes)} bytes")


# ---------------------------------------------------------------------------
# 6. Self-verify: re-open the polyglot through PIL/pypdf/zipfile and recover
#    each fragment. Assemble. Compare to flag.
# ---------------------------------------------------------------------------
print()
print("[poly] === self-verify ===")

# F1 — alpha LSB
img2 = Image.open(out_path)
assert img2.mode == "RGBA", f"PNG mode {img2.mode!r}, expected RGBA"
pix = img2.load()
bits: list[int] = []
for y in range(H):
    for x in range(W):
        if len(bits) >= 120:
            break
        bits.append(pix[x, y][3] & 1)
    if len(bits) >= 120:
        break
F1_recovered = bytearray()
for i in range(0, len(bits), 8):
    b = 0
    for j in range(8):
        b = (b << 1) | bits[i + j]
    F1_recovered.append(b)
F1_recovered = bytes(F1_recovered)
assert F1_recovered == F1, f"F1 mismatch: got {F1_recovered!r}, want {F1!r}"
print(f"[poly] F1 recovered: {F1_recovered!r}")

# xorpad — iTXt
text_meta = img2.text  # PIL exposes iTXt entries as dict-like
assert "xorpad" in text_meta, f"no 'xorpad' iTXt entry; got keys {list(text_meta.keys())}"
xorpad_recovered = base64.b64decode(text_meta["xorpad"])
assert xorpad_recovered == xorpad
print(f"[poly] iTXt 'xorpad' recovered ({len(xorpad_recovered)} bytes)")

# F2 — ZIP entry per-file comment
zf = zipfile.ZipFile(str(out_path))
assert len(zf.infolist()) == 1
note_entry = zf.infolist()[0]
assert note_entry.filename == "note"
assert note_entry.file_size == 0
F2_recovered = note_entry.comment
assert F2_recovered == F2, f"F2 mismatch: got {F2_recovered!r}, want {F2!r}"
print(f"[poly] F2 recovered (ZIP entry comment): {F2_recovered!r}")

# F3 — orphan PDF stream
from pypdf import PdfReader
reader = PdfReader(str(out_path))
print(f"[poly] PDF root catalog: {reader.trailer.get('/Root')}")
# Walk every indirect object; collect ones not referenced by any page
referenced_objs: set[int] = set()
for page in reader.pages:
    referenced_objs.add(page.indirect_reference.idnum)
    for k, v in page.items():
        if hasattr(v, "indirect_reference") and v.indirect_reference is not None:
            referenced_objs.add(v.indirect_reference.idnum)
        if k == "/Contents":
            referenced_objs.add(v.indirect_reference.idnum)
        if k == "/Resources":
            try:
                resources = v.get_object() if hasattr(v, "get_object") else v
                fonts = resources.get("/Font", {})
                if hasattr(fonts, "get_object"):
                    fonts = fonts.get_object()
                for fk, fv in fonts.items():
                    if hasattr(fv, "indirect_reference") and fv.indirect_reference is not None:
                        referenced_objs.add(fv.indirect_reference.idnum)
            except Exception:
                pass

# Collect every object id that has a stream
F3_recovered: bytes | None = None
for obj_id, off in reader.xref.get(0, {}).items() if isinstance(reader.xref, dict) else []:
    pass  # placeholder — we'll iterate differently below

# Simpler: iterate object numbers 1..N and decompress any stream we haven't
# referenced. The orphan should contain F3.
n_objs = max(reader.xref[0].keys()) if 0 in reader.xref else 0
for obj_num in range(1, n_objs + 1):
    try:
        obj = reader.get_object(obj_num)
    except Exception:
        continue
    if not hasattr(obj, "get_data"):
        continue
    if obj_num in referenced_objs:
        continue
    try:
        stream_data = obj.get_data()
    except Exception:
        continue
    if stream_data == F3:
        F3_recovered = stream_data
        print(f"[poly] orphan PDF stream is object #{obj_num}, decompressed = {stream_data!r}")
        break

assert F3_recovered == F3, f"F3 mismatch: got {F3_recovered!r}, want {F3!r}"

# F4 — derived
sha2 = hashlib.sha256(F1_recovered + F2_recovered + F3_recovered).digest()
F4_padded_recovered = bytes(a ^ b for a, b in zip(sha2, xorpad_recovered))
F4_recovered = F4_padded_recovered.rstrip(b"\x00")
assert F4_recovered == F4, f"F4 mismatch: got {F4_recovered!r}, want {F4!r}"
print(f"[poly] F4 derived: {F4_recovered!r}")

assembled = (F1_recovered + F2_recovered + F3_recovered + F4_recovered).decode()
print(f"\nRECOVERED: {assembled}")
assert assembled == flag, f"flag mismatch: got {assembled!r}, want {flag!r}"


# ---------------------------------------------------------------------------
# manifest
# ---------------------------------------------------------------------------
manifest = (
    "Polyglot of the Damned — player-served file\n"
    "===============================================\n"
    "polyglot.bin — a single file with three faces. file/binwalk it.\n"
    "Three fragments live in three formats; the fourth is forged from the rest.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")
print("[poly] build OK")

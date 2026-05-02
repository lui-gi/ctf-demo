"""Cold-solve harness for polyglot_of_the_damned.

Replays the player's intended path:
  1. Identify the polyglot — file/binwalk shows PNG header + PDF header + ZIP CD.
  2. F1 — Open polyglot.bin as a PNG with PIL; mode is RGBA. Read the alpha
     LSB of the first 120 pixels in row-major order, pack MSB-first → 15 bytes
     starting "progctf{the_thr".
  3. F2 — Open polyglot.bin as a ZIP with zipfile; one entry "note" with
     file_size=0; its per-file comment is "ee_faces_of_a_si".
  4. F3 — Open polyglot.bin as a PDF with pypdf; iterate every indirect
     object and decompress the stream of any object NOT referenced by the
     /Pages tree. The orphan stream (object 6) decompresses to "ngle_b1n".
  5. F4 — Read the iTXt 'xorpad' chunk from the PNG (32-byte base64);
     compute SHA-256(F1+F2+F3) XOR xorpad → first 10 bytes are "_polyglot}".
  6. Concatenate F1+F2+F3+F4 → flag.

Run:
  python build/cold_solve.py
"""
from __future__ import annotations

import base64
import hashlib
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader

ISLAND = Path(__file__).resolve().parent.parent
PATH = ISLAND / "files" / "polyglot.bin"

print(f"[player] polyglot.bin: {PATH.stat().st_size} bytes")

# --- F1: PNG alpha-LSB ----------------------------------------------------
img = Image.open(PATH)
assert img.mode == "RGBA", f"PNG mode {img.mode!r}, expected RGBA"
W, H = img.size
print(f"[player] PIL opens as PNG, mode={img.mode}, size={W}x{H}")

px = img.load()
bits: list[int] = []
for y in range(H):
    for x in range(W):
        if len(bits) >= 120:
            break
        bits.append(px[x, y][3] & 1)
    if len(bits) >= 120:
        break
F1 = bytearray()
for i in range(0, 120, 8):
    b = 0
    for j in range(8):
        b = (b << 1) | bits[i + j]
    F1.append(b)
F1 = bytes(F1)
print(f"[player] F1 (PNG alpha LSB): {F1!r}")

# --- iTXt xorpad ----------------------------------------------------------
text_meta = img.text
assert "xorpad" in text_meta, f"no 'xorpad' iTXt entry; keys={list(text_meta)}"
xorpad = base64.b64decode(text_meta["xorpad"])
print(f"[player] iTXt xorpad: {len(xorpad)} bytes (base64-decoded)")

# --- F2: ZIP entry comment ------------------------------------------------
zf = zipfile.ZipFile(PATH)
entries = zf.infolist()
print(f"[player] zipfile finds {len(entries)} entry(ies)")
assert len(entries) == 1
note = entries[0]
print(f"[player]   {note.filename!r}: file_size={note.file_size}, comment={note.comment!r}")
F2 = note.comment
assert note.file_size == 0
assert note.filename == "note"

# --- F3: orphan PDF stream ------------------------------------------------
reader = PdfReader(str(PATH))
print(f"[player] pypdf finds {len(reader.pages)} page(s)")

# Compute the set of object ids that ARE referenced from the page tree
referenced: set[int] = set()
for page in reader.pages:
    referenced.add(page.indirect_reference.idnum)
    for k, v in page.items():
        if hasattr(v, "indirect_reference") and v.indirect_reference is not None:
            referenced.add(v.indirect_reference.idnum)
        if k == "/Resources":
            try:
                resources = v.get_object() if hasattr(v, "get_object") else v
                fonts = resources.get("/Font", {})
                if hasattr(fonts, "get_object"):
                    fonts = fonts.get_object()
                for fk, fv in fonts.items():
                    if hasattr(fv, "indirect_reference") and fv.indirect_reference is not None:
                        referenced.add(fv.indirect_reference.idnum)
            except Exception:
                pass
# /Catalog and /Pages are always implicitly part of the tree
catalog_root = reader.trailer["/Root"]
referenced.add(catalog_root.indirect_reference.idnum)
referenced.add(catalog_root["/Pages"].indirect_reference.idnum)

print(f"[player] referenced object ids: {sorted(referenced)}")

# Iterate every object id; decompress streams that are NOT referenced
n_objs = max(reader.xref[0].keys())
F3: bytes | None = None
orphan_id = None
for obj_num in range(1, n_objs + 1):
    if obj_num in referenced:
        continue
    try:
        obj = reader.get_object(obj_num)
    except Exception:
        continue
    if not hasattr(obj, "get_data"):
        continue
    try:
        data = obj.get_data()
    except Exception:
        continue
    print(f"[player]   orphan obj #{obj_num}: stream decompresses to {data!r}")
    F3 = data
    orphan_id = obj_num
    break

assert F3 is not None, "no orphan PDF stream found"
print(f"[player] F3 (orphan PDF stream obj #{orphan_id}): {F3!r}")

# --- F4: derive via SHA-256 + XOR -----------------------------------------
sha = hashlib.sha256(F1 + F2 + F3).digest()
F4_padded = bytes(a ^ b for a, b in zip(sha, xorpad))
F4 = F4_padded.rstrip(b"\x00")
print(f"[player] F4 (XOR-derived): {F4!r}")

# --- assemble -------------------------------------------------------------
flag = (F1 + F2 + F3 + F4).decode()
print(f"\nRECOVERED: {flag}")

expected = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
assert flag == expected, f"mismatch: got {flag!r}, want {expected!r}"

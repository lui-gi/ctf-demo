"""Build script for message_in_a_bottle — produces files/bottle.png + MANIFEST.

Generates a small abstract "bottle on a beach" scene in pure Pillow (no external
assets — keeps the build deterministic + airgap-friendly), encodes it as a valid
PNG, then appends the marker bytes AFTER the IEND chunk's CRC. Browsers and image
viewers stop parsing at IEND, so the file renders normally; tools like `strings`
or a hex editor reveal the trailing message.
"""
from __future__ import annotations

import hashlib
import io
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

# 1. Compose a small bottle-on-beach scene. ~240x160, RGB, no metadata.
W, H = 320, 200
img = Image.new("RGB", (W, H), (220, 198, 158))  # sand cream
draw = ImageDraw.Draw(img)

# Sky band — soft horizon gradient.
for y in range(80):
    band = int(180 - y * 0.4)
    draw.line([(0, y), (W, y)], fill=(band, band + 20, 200), width=1)

# Sea band with a few wave-line strokes.
for y in range(80, 120):
    band = int(80 + (y - 80) * 1.6)
    draw.line([(0, y), (W, y)], fill=(40, 60 + (y - 80), 90 + (y - 80) * 2), width=1)
for i in range(6):
    yy = 90 + i * 4
    draw.line([(0, yy), (W, yy)], fill=(255, 255, 255), width=1)

# A wet-sand foreshore.
for y in range(120, H):
    band = int(170 + (y - 120) * 0.6)
    draw.line([(0, y), (W, y)], fill=(band, band - 10, band - 40), width=1)

# Bottle: a tilted rounded rectangle in dark green-glass.
bx, by = 200, 130
draw.polygon([(bx, by), (bx + 56, by - 8), (bx + 60, by + 30), (bx + 4, by + 38)],
             fill=(20, 70, 40), outline=(10, 30, 20))
# Cork stub
draw.rectangle([(bx - 8, by - 4), (bx + 4, by + 4)], fill=(150, 110, 60), outline=(80, 50, 20))

# A small rolled paper inside (dim hint, not a pixel-leaked flag)
draw.line([(bx + 18, by + 18), (bx + 32, by + 18)], fill=(240, 230, 200), width=2)

img = img.filter(ImageFilter.GaussianBlur(radius=0.4))

# 2. Encode as PNG into a bytes buffer first so we can append after IEND.
png_buf = io.BytesIO()
img.save(png_buf, format="PNG", optimize=True)
png_bytes = png_buf.getvalue()

# Sanity: a valid PNG ends with the IEND chunk: length(4) + "IEND" + crc(4).
# IEND has zero data length, so the structure is: 00 00 00 00 49 45 4E 44 <crc4>.
iend_marker = b"\x00\x00\x00\x00IEND"
iend_pos = png_bytes.rfind(iend_marker)
assert iend_pos != -1, "IEND chunk missing — Pillow produced an unexpected PNG"
iend_end = iend_pos + len(iend_marker) + 4  # include the 4 CRC bytes
trailing = png_bytes[iend_end:]
assert trailing == b"", f"unexpected bytes after IEND CRC: {trailing!r}"

# 3. Append the marker.
marker = f"\nX marks the spot — {flag}\n".encode("utf-8")
final = png_bytes + marker

(OUT / "bottle.png").write_bytes(final)

# 4. MANIFEST
manifest_lines: list[str] = []
for fname in sorted(p.name for p in OUT.iterdir() if p.name != "MANIFEST.txt"):
    data = (OUT / fname).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    manifest_lines.append(f"{fname}\tsize={len(data)}\tsha256={sha}")
manifest_lines.append("")
manifest_lines.append("# How to solve:")
manifest_lines.append("#   strings bottle.png | grep progctf")
manifest_lines.append("#   ... OR open in a hex editor; trailing ASCII appears after the IEND chunk's CRC.")
(OUT / "MANIFEST.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

# 5. Self-verify: the file is still a valid PNG (Pillow re-decode succeeds).
with Image.open(OUT / "bottle.png") as recheck:
    recheck.verify()

# 6. Anti-leak: the flag literal must appear EXACTLY ONCE, AFTER the IEND CRC.
data = (OUT / "bottle.png").read_bytes()
flag_bytes = flag.encode("utf-8")
assert data.count(flag_bytes) == 1, f"flag appears {data.count(flag_bytes)} times — must be 1"
flag_pos = data.find(flag_bytes)
new_iend_pos = data.rfind(iend_marker)
new_iend_end = new_iend_pos + len(iend_marker) + 4
assert flag_pos > new_iend_end, f"flag at byte {flag_pos} appears BEFORE IEND end at {new_iend_end} — must be after"

print(f"OK message_in_a_bottle built. png={len(png_bytes)} bytes + {len(marker)} trailing = {len(final)} total. flag_pos={flag_pos} (after IEND end {new_iend_end})")

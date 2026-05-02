"""Build script for exif_of_the_drowned — produces files/wreck.jpg + MANIFEST.

Generates a moody grayscale "shipwreck" abstract scene in Pillow, saves as JPEG,
then writes EXIF tags via piexif (or Pillow's ExifTags) so the flag appears ONLY
in UserComment + XPComment. ImageDescription is kept benign so the first tag a
player reads is a misdirect; the flag requires actually walking the EXIF tree.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
from PIL.ExifTags import Base as ExifBase   # newer Pillow: enum keys
import piexif  # pulled in transitively by Pillow on Windows; otherwise fallback below

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)

flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()

# 1. Compose a moody grayscale shipwreck scene.
W, H = 480, 320
img = Image.new("L", (W, H), 30)
draw = ImageDraw.Draw(img)
# Sky gradient (low contrast, gloomy)
for y in range(180):
    g = int(60 + y * 0.4)
    draw.line([(0, y), (W, y)], fill=g)
# Distant ocean
for y in range(180, 220):
    g = int(40 + (y - 180) * 0.6)
    draw.line([(0, y), (W, y)], fill=g)
# Foreshore
for y in range(220, H):
    g = int(70 - (y - 220) * 0.3)
    draw.line([(0, y), (W, y)], fill=g)
# A broken hull silhouette
hull_x, hull_y = 140, 180
draw.polygon([(hull_x, hull_y), (hull_x + 220, hull_y - 12),
              (hull_x + 200, hull_y + 60), (hull_x - 20, hull_y + 50)],
             fill=12, outline=4)
# Splintered mast
draw.line([(hull_x + 100, hull_y - 12), (hull_x + 120, hull_y - 110)], fill=8, width=3)
draw.line([(hull_x + 120, hull_y - 110), (hull_x + 116, hull_y - 80)], fill=8, width=3)
# Ripples on the foreshore
for i in range(0, W, 16):
    draw.line([(i, 240 + (i % 20) // 4), (i + 12, 245)], fill=80, width=1)

img = img.convert("RGB").filter(ImageFilter.GaussianBlur(radius=0.6))

# 2. Build the EXIF dict per piexif's API.
def s(text: str) -> bytes:
    return text.encode("utf-8")

def utf16_xp(text: str) -> bytes:
    # Windows XP* tags expect UTF-16LE byte sequence terminated by null word.
    return text.encode("utf-16-le") + b"\x00\x00"

# Latitude/Longitude as rationals for EXIF GPS IFD: degrees, minutes, seconds.
def to_dms(deg: float) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int]]:
    abs_deg = abs(deg)
    d = int(abs_deg)
    m_full = (abs_deg - d) * 60
    m = int(m_full)
    s_val = round((m_full - m) * 60 * 1000)
    return ((d, 1), (m, 1), (s_val, 1000))

LAT, LON = 49.123, -2.456
exif_dict = {
    "0th": {
        piexif.ImageIFD.Make: s("Brass Plate Co."),
        piexif.ImageIFD.Model: s("Tidewater Recoverer"),
        piexif.ImageIFD.Artist: s("Unknown salvager, Tideglass"),
        piexif.ImageIFD.ImageDescription: s("Recovered from the Maribel — date unknown."),
        piexif.ImageIFD.Software: s("DeadwakeSalvage v1.2"),
        piexif.ImageIFD.XPComment: utf16_xp(flag),
    },
    "Exif": {
        # UserComment is prefixed by an 8-byte character-code header; ASCII = "ASCII\0\0\0".
        piexif.ExifIFD.UserComment: b"ASCII\x00\x00\x00" + s(flag),
    },
    "GPS": {
        piexif.GPSIFD.GPSLatitudeRef: b"N",
        piexif.GPSIFD.GPSLatitude: to_dms(LAT),
        piexif.GPSIFD.GPSLongitudeRef: b"W",
        piexif.GPSIFD.GPSLongitude: to_dms(LON),
    },
    "1st": {},
    "thumbnail": None,
}
exif_bytes = piexif.dump(exif_dict)

# 3. Save the JPEG with EXIF embedded.
img.save(OUT / "wreck.jpg", format="JPEG", quality=78, exif=exif_bytes, optimize=True)

# 4. MANIFEST
manifest_lines: list[str] = []
for fname in sorted(p.name for p in OUT.iterdir() if p.name != "MANIFEST.txt"):
    data = (OUT / fname).read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    manifest_lines.append(f"{fname}\tsize={len(data)}\tsha256={sha}")
manifest_lines.append("")
manifest_lines.append("# How to solve:")
manifest_lines.append("#   exiftool wreck.jpg | grep -i comment")
manifest_lines.append("#   ... OR python -c \"from PIL import Image; print(Image.open('wreck.jpg').getexif())\"")
(OUT / "MANIFEST.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

# 5. Self-verify: re-open and confirm the EXIF UserComment carries the flag.
with Image.open(OUT / "wreck.jpg") as recheck:
    raw_exif = recheck.info.get("exif", b"")
loaded = piexif.load(raw_exif)
uc = loaded["Exif"].get(piexif.ExifIFD.UserComment, b"")
assert uc.startswith(b"ASCII\x00\x00\x00"), f"unexpected UserComment header: {uc[:20]!r}"
recovered = uc[8:].decode("utf-8")
assert recovered == flag, f"UserComment round-trip mismatch: {recovered!r} != {flag!r}"

# 6. Anti-leak: ImageDescription must NOT contain the flag (misdirect).
img_desc = loaded["0th"].get(piexif.ImageIFD.ImageDescription, b"")
assert flag.encode("utf-8") not in img_desc, "FAIL: flag leaked into ImageDescription"

# 7. Anti-leak: file name must not be flag.jpg
assert (OUT / "flag.jpg").exists() is False, "FAIL: file named flag.jpg"

# 8. The flag literal can appear inside the JPEG file (it's in EXIF) but NOT after
#    the EOI marker (FFD9) — that would shift this from EXIF to append-stego.
data = (OUT / "wreck.jpg").read_bytes()
eoi_pos = data.rfind(b"\xff\xd9")
flag_pos = data.find(flag.encode("utf-8"))
assert flag_pos != -1, "flag missing from JPEG bytes"
assert flag_pos < eoi_pos, f"flag at byte {flag_pos} appears AFTER EOI marker at {eoi_pos} — must be inside EXIF"

print(f"OK exif_of_the_drowned built. jpeg={len(data)} bytes. UserComment recovered={recovered!r}")

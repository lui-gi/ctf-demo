"""Diagnostic: count flag occurrences, dump root dir, scan ZIP magics."""
import struct
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
data = (ROOT / "files" / "wreck.img").read_bytes()
flag = (ROOT / "flag.txt").read_text(encoding="ascii").strip().encode("ascii")

positions = []
pos = data.find(flag)
while pos != -1:
    positions.append(pos)
    pos = data.find(flag, pos + 1)
print(f"flag occurrences in image: {len(positions)} -> {[hex(p) for p in positions]}")

# Root dir cluster 2 begins at sector 96 (DATA_SEC_START) -> byte 49152
ROOT_OFF = 96 * 512
print(f"root directory at offset {hex(ROOT_OFF)}")
for i in range(0, 4096, 32):
    e = data[ROOT_OFF + i: ROOT_OFF + i + 32]
    if not e or e[0] == 0:
        print(f"  +{i:>4}: end-of-dir marker"); break
    attr = e[11]
    name = bytes(e[0:11])
    size = struct.unpack_from("<L", e, 28)[0]
    fc = (struct.unpack_from("<H", e, 20)[0] << 16) | struct.unpack_from("<H", e, 26)[0]
    if e[0] == 0xE5:
        kind = "DELETED  "
    elif attr & 0x08:
        kind = "VOL_LABEL"
    else:
        kind = "ACTIVE   "
    print(f"  +{i:>4}: {kind} attr=0x{attr:02x} name={name!r} size={size:>6} first_cluster={fc}")

# binwalk-style: scan for ZIP local file header and EOCD magics
def scan(magic):
    out = []
    p = data.find(magic)
    while p != -1:
        out.append(p)
        p = data.find(magic, p + 1)
    return out

lfh = scan(b"PK\x03\x04")
eocd = scan(b"PK\x05\x06")
print(f"PK\\x03\\x04 (local file header) magics: {len(lfh)} -> {[hex(p) for p in lfh]}")
print(f"PK\\x05\\x06 (EOCD) magics: {len(eocd)} -> {[hex(p) for p in eocd]}")
print(f"image size: {len(data)} bytes")

#!/usr/bin/env python3
"""
Replays the player-side intended solve against files/wreck.img:
  1. Scans the raw image for the ZIP local-file-header magic PK\x03\x04
     (and the EOCD magic PK\x05\x06) -- this is what `binwalk -e` /
     `photorec` / a manual `grep -aobP` carve will find.
  2. Reads the ZIP from the carved offsets and prints its archive
     comment from the End-of-Central-Directory record.
  3. Checks that the archive comment equals flag.txt byte-for-byte.

Pass = exits 0 and prints the recovered flag. Fail = exits 1.
"""
from __future__ import annotations

import io
import struct
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "files" / "wreck.img"
FLAG = (ROOT / "flag.txt").read_text(encoding="ascii").strip().encode("ascii")

EOCD_MAGIC = b"PK\x05\x06"
LFH_MAGIC = b"PK\x03\x04"


def carve_zip(blob: bytes) -> bytes:
    lfh = blob.find(LFH_MAGIC)
    if lfh < 0:
        raise SystemExit("FAIL: no PK\\x03\\x04 in image")
    eocd = blob.rfind(EOCD_MAGIC)
    if eocd < 0:
        raise SystemExit("FAIL: no PK\\x05\\x06 in image")
    # EOCD: magic(4) disk(2) start(2) entries_disk(2) entries(2)
    #       cd_size(4) cd_off(4) comment_len(2) comment...
    comment_len = struct.unpack_from("<H", blob, eocd + 20)[0]
    end = eocd + 22 + comment_len
    return blob[lfh:end]


def main() -> None:
    if not IMG.exists():
        raise SystemExit(f"FAIL: {IMG} missing -- run make.py first")
    blob = IMG.read_bytes()
    z_bytes = carve_zip(blob)
    print(f"carved {len(z_bytes)} bytes of ZIP from offset "
          f"{blob.find(LFH_MAGIC)}")

    with zipfile.ZipFile(io.BytesIO(z_bytes)) as z:
        comment = z.comment
        names = [i.filename for i in z.infolist()]
    print(f"contained files: {names}")
    print(f"archive comment: {comment!r}")

    if comment != FLAG:
        raise SystemExit(
            f"FAIL: archive comment {comment!r} != flag {FLAG!r}")

    # Belt-and-braces: the flag string MUST NOT appear in any allocated
    # cluster outside the ZIP. Walk the FAT-marked-deleted-but-cluster-still-
    # populated region only by checking every other byte range.
    z_off = blob.find(LFH_MAGIC)
    z_end = z_off + len(z_bytes)
    pre = blob[:z_off]
    post = blob[z_end:]
    if FLAG in pre or FLAG in post:
        raise SystemExit("FAIL: flag string leaks outside the carved ZIP")

    print(f"PASS: recovered flag = {comment.decode('ascii')}")


if __name__ == "__main__":
    main()

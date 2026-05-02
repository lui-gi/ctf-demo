#!/usr/bin/env python3
"""
Builds files/wreck.img -- a 16 MiB FAT32 image containing several
mundane files plus one *deleted* treasure.zip whose central-directory
archive comment carries the flag.

Pure stdlib. No mkfs.vfat, no loopback mount, no WSL. The script
constructs the FAT32 layout (BPB, FSInfo, two FATs, root directory,
clusters) directly per Microsoft's "FAT: General Overview of On-Disk
Format" v1.03.

Reproducible: deterministic content, deterministic layout, no RNG.

Usage:
    python build/make.py
"""

from __future__ import annotations

import io
import os
import struct
import zipfile
from pathlib import Path

# -- Layout constants ------------------------------------------------------

SECTOR = 512
SPC = 8                       # sectors per cluster -> 4 KiB clusters
RSVD = 32                     # reserved sectors (FAT32 minimum-ish; volume
                              # boot record + FSInfo + spare + alignment)
NUM_FATS = 2
TOTAL_SECTORS = 32 * 1024     # 16 MiB image
HIDDEN = 0
MEDIA = 0xF8

# Each FAT32 entry is 4 bytes. Data sectors == TOTAL - RSVD - 2*FAT_sectors.
# Number of data clusters == data_sectors / SPC. Need FAT_sectors big enough
# to index that many clusters. Closed-form solve below.
def _fat_sectors():
    # Iterate up; small image, finishes immediately.
    for fs in range(1, 4096):
        data_sec = TOTAL_SECTORS - RSVD - NUM_FATS * fs
        if data_sec <= 0:
            continue
        clusters = data_sec // SPC
        # FAT must hold (clusters + 2) entries.
        if fs * SECTOR // 4 >= clusters + 2:
            return fs
    raise RuntimeError("could not size FAT")

FAT_SEC = _fat_sectors()
DATA_SEC_START = RSVD + NUM_FATS * FAT_SEC
TOTAL_DATA_SEC = TOTAL_SECTORS - DATA_SEC_START
TOTAL_CLUSTERS = TOTAL_DATA_SEC // SPC
ROOT_CLUSTER = 2              # FAT32: root is a regular cluster chain

CLUSTER_BYTES = SPC * SECTOR  # 4096

# -- Build artefacts -------------------------------------------------------

ROOT = Path(__file__).resolve().parents[1]
FLAG = (ROOT / "flag.txt").read_text(encoding="ascii").strip().encode("ascii")
OUT_IMG = ROOT / "files" / "wreck.img"
OUT_MANIFEST = ROOT / "files" / "MANIFEST.txt"


def build_treasure_zip() -> bytes:
    """ZIP whose ARCHIVE COMMENT (in EOCD) == flag. Decoy entries inside."""
    buf = io.BytesIO()
    # Force deterministic order, no per-entry comments.
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        # No date_time variability: zipfile defaults to (1980,1,1,0,0,0)
        # only when ZipInfo is used directly. Writestr uses time.localtime,
        # which kills determinism. Build ZipInfo objects with a fixed mtime.
        for name, body in [
            ("decoy_logbook.txt", b"Day 41: still no sign of land. Drank the last of the rum.\n"),
            ("decoy_chart.txt", b"Bearings: nothing of interest. The chest is elsewhere.\n"),
            ("decoy_song.txt", b"Yo ho ho and a bottle of decoy text.\n"),
        ]:
            zi = zipfile.ZipInfo(filename=name, date_time=(1980, 1, 1, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o600 << 16
            z.writestr(zi, body)
        z.comment = FLAG  # the prize: archive-level EOCD comment
    return buf.getvalue()


# Mundane plaintext files (FLAG must NOT appear in any).
MUNDANE_FILES = [
    ("GROG.TXT",
     b"Recipe for grog:\r\n"
     b"  - one part rum\r\n"
     b"  - two parts seawater (filtered)\r\n"
     b"  - lime, if any of the crew still has teeth\r\n"
     b"Stir with a marlinspike. Do not let the cook near it.\r\n"),
    ("CREW.CSV",
     b"name,rank,shore_leave_owed\r\n"
     b"Ezra Tully,bo'sun,3\r\n"
     b"One-Eyed Margaret,quartermaster,1\r\n"
     b"Wet Tom,powder monkey,7\r\n"
     b"Captain Greaves,captain,0\r\n"),
    ("NOTES.TXT",
     b"checking the bilge today\r\n"
     b"the cat caught another rat -- third this week\r\n"
     b"need to re-tar the foredeck before we round the cape\r\n"),
    ("TAXES.TXT",
     b"Quarterly excise return for the schooner Sea-Wraith.\r\n"
     b"Total cargo declared: 0 barrels (we ate them).\r\n"
     b"Owed to the harbourmaster: nil. He owes us, in fact.\r\n"),
    ("TODO.MD",
     b"# things to do before we sink\r\n"
     b"- [ ] re-tar the foredeck\r\n"
     b"- [ ] feed the cat\r\n"
     b"- [x] write a bad will\r\n"),
]


# -- FAT32 helpers ---------------------------------------------------------

def _short_name(name: str) -> bytes:
    """Pack a string into the 11-byte 8.3 FAT short-name field."""
    name = name.upper()
    if "." in name:
        base, ext = name.rsplit(".", 1)
    else:
        base, ext = name, ""
    base = (base + " " * 8)[:8]
    ext = (ext + " " * 3)[:3]
    return (base + ext).encode("ascii")


def _make_dir_entry(short11: bytes, attr: int, first_cluster: int,
                    size: int) -> bytes:
    """One 32-byte FAT directory entry."""
    assert len(short11) == 11
    fc_hi = (first_cluster >> 16) & 0xFFFF
    fc_lo = first_cluster & 0xFFFF
    # Date/time fixed for reproducibility (1980-01-01 00:00:00).
    return struct.pack(
        "<11sBBBHHHHHHHL",
        short11,           # name
        attr,              # attr
        0,                 # NTRes
        0,                 # CrtTimeTenth
        0,                 # CrtTime
        0,                 # CrtDate
        0,                 # LstAccDate
        fc_hi,             # FstClusHI
        0,                 # WrtTime
        0,                 # WrtDate
        fc_lo,             # FstClusLO
        size,              # FileSize
    )


def _write_fat_entry(fat: bytearray, idx: int, value: int) -> None:
    """FAT32 entries are 28-bit (top 4 bits reserved -> keep zero)."""
    struct.pack_into("<L", fat, idx * 4, value & 0x0FFFFFFF)


def build_image() -> None:
    image = bytearray(TOTAL_SECTORS * SECTOR)

    # ---- Boot sector / BPB --------------------------------------------
    # Per FAT32 spec; volume label "WRECK      ", FAT32 type string.
    bpb = bytearray(SECTOR)
    bpb[0:3] = b"\xEB\x58\x90"                  # JMP + NOP
    bpb[3:11] = b"MSWIN4.1"                     # OEM name (most compatible)
    struct.pack_into("<H", bpb, 11, SECTOR)     # BytsPerSec
    bpb[13] = SPC                                # SecPerClus
    struct.pack_into("<H", bpb, 14, RSVD)       # RsvdSecCnt
    bpb[16] = NUM_FATS
    struct.pack_into("<H", bpb, 17, 0)          # RootEntCnt (0 for FAT32)
    struct.pack_into("<H", bpb, 19, 0)          # TotSec16 (0 -> use 32)
    bpb[21] = MEDIA
    struct.pack_into("<H", bpb, 22, 0)          # FATSz16 (0 for FAT32)
    struct.pack_into("<H", bpb, 24, 32)         # SecPerTrk
    struct.pack_into("<H", bpb, 26, 64)         # NumHeads
    struct.pack_into("<L", bpb, 28, HIDDEN)
    struct.pack_into("<L", bpb, 32, TOTAL_SECTORS)
    # FAT32 extended BPB
    struct.pack_into("<L", bpb, 36, FAT_SEC)    # FATSz32
    struct.pack_into("<H", bpb, 40, 0)          # ExtFlags
    struct.pack_into("<H", bpb, 42, 0)          # FSVer
    struct.pack_into("<L", bpb, 44, ROOT_CLUSTER)
    struct.pack_into("<H", bpb, 48, 1)          # FSInfo sector
    struct.pack_into("<H", bpb, 50, 6)          # BkBootSec
    # Reserved 12 bytes already zero.
    bpb[64] = 0x80                               # DrvNum (HDD)
    bpb[65] = 0
    bpb[66] = 0x29                               # BootSig
    struct.pack_into("<L", bpb, 67, 0xDEADBEEF)  # VolID (fixed for repro)
    bpb[71:82] = b"WRECK      "
    bpb[82:90] = b"FAT32   "
    bpb[510:512] = b"\x55\xAA"
    image[0:SECTOR] = bpb
    # Backup boot sector at sector 6.
    image[6 * SECTOR:7 * SECTOR] = bpb

    # ---- FSInfo sector (sector 1) -------------------------------------
    fsinfo = bytearray(SECTOR)
    struct.pack_into("<L", fsinfo, 0, 0x41615252)
    struct.pack_into("<L", fsinfo, 484, 0x61417272)
    # FreeCount / NxtFree -- "unknown" sentinel is fine, mounts still work.
    struct.pack_into("<L", fsinfo, 488, 0xFFFFFFFF)
    struct.pack_into("<L", fsinfo, 492, 0xFFFFFFFF)
    fsinfo[510:512] = b"\x55\xAA"
    image[SECTOR:2 * SECTOR] = fsinfo
    image[7 * SECTOR:8 * SECTOR] = fsinfo  # backup FSInfo

    # ---- Plan cluster allocations -------------------------------------
    # Mundane files first, then treasure.zip last so its clusters sit at the
    # end of the data area where binwalk/photorec carve them cleanly.
    treasure = build_treasure_zip()

    files = list(MUNDANE_FILES)
    plan = []  # list of (name, attr, data_bytes, is_deleted)
    for name, body in files:
        plan.append((name, 0x20, body, False))
    plan.append(("TREASURE.ZIP", 0x20, treasure, True))

    # Allocate clusters sequentially starting at cluster 3 (root is cluster 2).
    next_cluster = 3
    file_layout = []  # (name, attr, first_cluster, chain, size, deleted)
    for name, attr, body, deleted in plan:
        size = len(body)
        n_clusters = max(1, (size + CLUSTER_BYTES - 1) // CLUSTER_BYTES)
        chain = list(range(next_cluster, next_cluster + n_clusters))
        next_cluster += n_clusters
        file_layout.append((name, attr, chain[0], chain, size, body, deleted))
    if next_cluster - 2 > TOTAL_CLUSTERS:
        raise RuntimeError("ran out of clusters")

    # ---- Build FAT in memory -------------------------------------------
    fat_bytes = FAT_SEC * SECTOR
    fat = bytearray(fat_bytes)
    EOC = 0x0FFFFFFF
    # Reserved entries.
    _write_fat_entry(fat, 0, 0x0FFFFFF8)        # media descriptor
    _write_fat_entry(fat, 1, EOC)               # dirty/clean flags
    # Root directory: single cluster (cluster 2), EOC.
    _write_fat_entry(fat, ROOT_CLUSTER, EOC)
    # Each file's chain. For the *deleted* treasure.zip we ALSO clear the
    # FAT chain -- that mirrors what real FAT32 deletion does (the
    # directory entry is marked 0xE5 AND the FAT entries are zeroed).
    # The cluster *contents* survive, which is what file carving relies on.
    for name, attr, fc, chain, size, body, deleted in file_layout:
        if deleted:
            for c in chain:
                _write_fat_entry(fat, c, 0)
        else:
            for prev, nxt in zip(chain, chain[1:]):
                _write_fat_entry(fat, prev, nxt)
            _write_fat_entry(fat, chain[-1], EOC)

    # Write both FAT copies.
    for i in range(NUM_FATS):
        off = (RSVD + i * FAT_SEC) * SECTOR
        image[off:off + fat_bytes] = fat

    # ---- Root directory cluster ----------------------------------------
    root_off = (DATA_SEC_START + (ROOT_CLUSTER - 2) * SPC) * SECTOR
    root_dir = bytearray(CLUSTER_BYTES)
    cursor = 0
    # Volume label entry first.
    root_dir[cursor:cursor + 32] = _make_dir_entry(b"WRECK      ", 0x08, 0, 0)
    cursor += 32
    for name, attr, fc, chain, size, body, deleted in file_layout:
        short = _short_name(name)
        entry = bytearray(_make_dir_entry(short, attr, fc, size))
        if deleted:
            entry[0] = 0xE5  # mark deleted; rest of entry preserved
        root_dir[cursor:cursor + 32] = bytes(entry)
        cursor += 32
    image[root_off:root_off + CLUSTER_BYTES] = root_dir

    # ---- File data clusters --------------------------------------------
    for name, attr, fc, chain, size, body, deleted in file_layout:
        for i, c in enumerate(chain):
            off = (DATA_SEC_START + (c - 2) * SPC) * SECTOR
            chunk = body[i * CLUSTER_BYTES:(i + 1) * CLUSTER_BYTES]
            image[off:off + len(chunk)] = chunk
            # Trailing bytes of last cluster stay 0x00 -- the ZIP's own EOCD
            # marker terminates parsing for the carving tool.

    OUT_IMG.parent.mkdir(parents=True, exist_ok=True)
    OUT_IMG.write_bytes(image)

    # ---- MANIFEST -------------------------------------------------------
    OUT_MANIFEST.write_text(
        "wreck.img    16 MiB FAT32 disk image. Mount read-only or carve.\n",
        encoding="ascii",
    )


def main() -> None:
    if FLAG.startswith(b"progctf{") is False:
        raise SystemExit(f"flag.txt did not contain a progctf flag: {FLAG!r}")
    build_image()
    print(f"wrote {OUT_IMG} ({OUT_IMG.stat().st_size} bytes)")
    print(f"FAT_SEC={FAT_SEC} DATA_SEC_START={DATA_SEC_START} "
          f"TOTAL_CLUSTERS={TOTAL_CLUSTERS}")


if __name__ == "__main__":
    main()

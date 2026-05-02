# Solution — Carved From the Wreck

## Intended solve

1. **Mount or inspect `disk.img`.** Tools: `fls`, `tsk`, `mmls`, `mount -o loop`. Confirm FAT32 filesystem with several allocated files plus directory entries marked deleted (FAT entries with `0xE5` first byte). (~10 min)
2. **Carve unallocated space for ZIP signatures.** Two paths:
   - `photorec disk.img` and let it carve all known formats.
   - `binwalk -e disk.img` and look for ZIP `PK\x03\x04` signatures.
   - Manual: `grep -aobP '\x50\x4B\x03\x04' disk.img` to find ZIP local-file-header offsets, then carve from each.
   (~15 min)
3. **Recover `treasure.zip`.** It carves cleanly. The contained files are mundane (decoy text files like `crew_roster.txt`, `grog_recipe.txt`) — none contain the flag. (~5 min)
4. **Inspect the ZIP central directory.** Use `zipinfo -v treasure.zip` or `python3 -c "import zipfile; z=zipfile.ZipFile('treasure.zip'); [print(i.comment, i.filename) for i in z.infolist()]; print('archive_comment:', z.comment)"`. The archive's *central-directory archive comment* (or one entry's per-file comment field) holds the flag string. (~5 min)
5. **Read the flag.** `progctf{...}` (~1 min)

## Total estimated time: 30–60 minutes

## Why this is Open Sea
- Two techniques: file carving from a disk image + ZIP metadata inspection.
- Naive players will extract the ZIP and search file *contents*, missing the flag entirely.
- Requires understanding ZIP central directory structure, not just "unzip and look."
- Beginner who only knows `unzip` will not find the flag.

## Implementer note
- Build a 32MB FAT32 image. Populate with 5-6 mundane allocated files. Add `treasure.zip` (containing 2-3 decoy text files), then DELETE it via the FS (so the directory entry is marked but data clusters are intact). Optionally run a small write to overwrite some non-treasure clusters so a naive `dd` extract is harder than a proper carve.
- Build `treasure.zip` so its central-directory archive comment field contains the literal flag: use `zipfile.ZipFile('treasure.zip', 'w'); z.comment = b'progctf{deleted_means_marked_not_gone}'` and then add the decoy files.

## Verification

`files/wreck.img` cold-solved on 2026-05-01 with the bundled `build/verify.py`
(which replays the intended `binwalk` / `photorec` / `grep -aobP 'PK\x03\x04'`
carve in pure stdlib Python — no external forensic tools needed for the
verification itself):

```
$ python build/make.py
wrote .../files/wreck.img (16777216 bytes)
FAT_SEC=32 DATA_SEC_START=96 TOTAL_CLUSTERS=4084

$ python build/verify.py
carved 522 bytes of ZIP from offset 73728
contained files: ['decoy_logbook.txt', 'decoy_chart.txt', 'decoy_song.txt']
archive comment: b'progctf{deleted_means_marked_not_gone}'
PASS: recovered flag = progctf{deleted_means_marked_not_gone}
```

Diagnostic confirmation (`build/inspect.py`):
- The literal flag string `progctf{deleted_means_marked_not_gone}` appears
  EXACTLY ONCE in the 16 MiB image, at offset `0x121e4` — inside the
  treasure.zip cluster region.
- The root directory contains a properly-marked deleted entry:
  `name=b'\xe5REASUREZIP'` (first byte rewritten to `0xE5` per FAT32
  deletion semantics) with the original 522-byte size and first-cluster=8
  preserved. Five mundane files (`GROG.TXT`, `CREW.CSV`, `NOTES.TXT`,
  `TAXES.TXT`, `TODO.MD`) remain allocated.
- Three `PK\x03\x04` local-file-header magics (one per decoy entry inside
  the ZIP) and one `PK\x05\x06` EOCD magic — exactly one carvable archive.
- ZIP carve from offset 73728 yields a 522-byte archive whose EOCD comment
  field equals `flag.txt` byte-for-byte.

Tools used:
- Python 3.13.2 (stdlib only: `zipfile`, `struct`, `pathlib`, `io`)
- No `mkfs.vfat`, no loopback mount, no external forensic tools needed.

Deviations from spec:
- Image size 16 MiB instead of 32 MiB (still ample for the carve; smaller
  artifact for distribution; the spec's `~16 MiB is plenty` line in the
  task brief explicitly green-lights this).
- File names use 8.3 short-name FAT directory entries only (no LFN entries).
  Carving tools (`photorec`, `binwalk`, raw `grep`) operate on cluster
  contents, not directory names — no functional difference.
- No partition table; the image is a *bare* FAT32 filesystem (no MBR).
  Both `binwalk` and `photorec` carve bare filesystem images natively.

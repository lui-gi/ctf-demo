# Whispers — Carved From the Wreck

## Whisper 1 (-10%)
The directory entry says the file is deleted, but FAT32 doesn't actually erase the data — it just marks the entry. Carve the unallocated space.

## Whisper 2 (-20% cumulative)
Use `photorec`, `binwalk -e`, or `grep` for the ZIP magic bytes (`PK\\x03\\x04`) in the raw image. Once you have the recovered ZIP, the contained files are decoys. Look at the ZIP's *metadata* — specifically the central directory.

## Whisper 3 (-35% cumulative)
ZIPs have an archive-level comment field stored in the End-of-Central-Directory record. Read it with `zipinfo -v` or with Python's `zipfile` module (`ZipFile.comment`). That comment field holds the Treasure. Final 20%: actually performing the carve cleanly and verifying the recovered ZIP is intact.

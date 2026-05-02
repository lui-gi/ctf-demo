# Carved From the Wreck

We dredged a 32-megabyte FAT32 disk image out of a half-burned thumbdrive someone tried to flush down the Crow's-Nest sink. Most of it is the usual flotsam: a recipe for grog, three pirated novels, a backup of someone's tax return.

But the captain's `treasure.zip` is gone — *deleted*, the directory entry says, but the magnetic ink on a fat32 disk doesn't actually evaporate when you press delete. It's still there, somewhere in the unallocated clusters.

Carve the deleted ZIP back. The Treasure is in a metadata field of the recovered archive — not in any contained file.

## Files
- `disk.img` — 32 MB FAT32 disk image

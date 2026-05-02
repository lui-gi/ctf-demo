# Whispers — Davy Jones's Locker

## Whisper 1 (-10%)
There are two distinct things to extract from the dump: a key (still cached in a running process's heap) and an encrypted SQLite database (deleted from disk, but its pages are still in the filesystem cache). Neither alone is enough.

## Whisper 2 (-20% cumulative)
For the key: dump `gpg-agent`'s heap with Volatility 3, then search for the cached-key magic and walk the cache item linked list to extract the 32-byte key. For the database: scan the dump for `"SQLite format 3\0"` magic at 4 KB-aligned offsets to recover cached pages, then reassemble using the page-1 header's page count and the page numbers in each b-tree node.

## Whisper 3 (-35% cumulative)
Once you have the key (32 raw bytes) and the reassembled `logbook.db`, open it with SQLCipher: `sqlcipher logbook.db` then `PRAGMA key = "x'<hex_key>'";` (note the SQLCipher raw-key PRAGMA syntax — it's unforgiving). Query the tables to find the flag in the `notes` column of one row. Final 20%: actually carving and reassembling the pages cleanly, and identifying the right gpg-agent cache magic for this kernel build.

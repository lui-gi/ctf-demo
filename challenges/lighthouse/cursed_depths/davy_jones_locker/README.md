# Davy Jones's Locker

The salvage divers brought up a 1-gigabyte raw memory dump from the *Tidekeeper*'s ship's-logbook host — a hardened Linux machine that ran a fake gpg-agent and a SQLite database of every officer's shore-leave log, every cargo manifest, every quartermaster's complaint about the rum ration. The host was running when the disk was yanked.

Two artifacts in one chest:
1. The dump still holds an in-memory `gpg-agent` keyring. The cached subkey for the logbook's encrypted database has not yet been wiped from the heap.
2. The logbook database itself was deleted from disk just before capture. Its SQLite pages, however, are still resident in the filesystem cache.

Recover the keyring entry from the live `gpg-agent`'s heap, reconstruct the deleted SQLite blob from cached pages, then decrypt the recovered DB with the recovered key. One row in the decrypted database IS the Treasure.

## Files
- `tidekeeper.lime` — 1GB Linux memory dump (LiME format, kernel 6.1.x)

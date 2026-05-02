# Memory of the Helmsman

When the *Pale Cassandra*'s helmsman went overboard last winter, his Linux laptop went into the brine with him — but the salvage crew managed to dump 256 megabytes of raw memory off the device before the hardware corroded. The dump captured him mid-session: he had just typed something into bash, then run a `gpg --decrypt` command, then died.

The decrypted file is in `/files/sealed.gpg`, also recovered. We have the dump, we have the encrypted file, and we know the helmsman was the kind of careless sailor who edits passphrases in `vim` and never closes them properly.

Find what he was decrypting. The Treasure is in the decrypted contents.

## Files
- `dump.lime` — 256 MB Linux memory dump (Volatility-3 friendly LiME format)
- `sealed.gpg` — the encrypted file the helmsman was opening

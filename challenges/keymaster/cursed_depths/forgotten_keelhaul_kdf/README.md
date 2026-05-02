# The Forgotten Keelhaul KDF

The salvage we pulled off the *Forgotten Keelhaul* this week included a sealed encrypted chest and a sheaf of papers describing the KDF the captain used to lock it. The KDF is custom — the captain's own work, written in Python — a wrapper around PBKDF2 with two distinct quirks: a known short prefix prepended to every password before hashing, and an "iteration counter XOR" in the inner loop the captain almost certainly intended as a hardening trick but which catastrophically reduces the actual entropy of the per-iteration state.

We also have a partial of the captain's password. We know 8 of its 14 characters. The middle 6 are restricted to a small charset (printable lowercase + digits, no specials).

Read the KDF source. Identify the bug. Build a cracker that exploits it. Recover the full password. Decrypt the chest.

## Files
- `kdf.py` — the captain's custom KDF source (with the XOR bug intact)
- `chest.enc` — the encrypted chest (AES-256-GCM, key derived via the KDF)
- `password_partial.txt` — the 8 known chars and positions of the 6 unknowns

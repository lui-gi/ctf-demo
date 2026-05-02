# Whispers — Memory of the Helmsman

## Whisper 1 (-10%)
This is a Linux memory dump. Use Volatility 3 to identify the kernel and enumerate processes — there are several relevant ones running, not just bash.

## Whisper 2 (-20% cumulative)
The helmsman's bash history is recoverable from memory. He used `vim` to edit a file, then `gpg --decrypt` on the supplied `sealed.gpg`. Vim leaves a `.swp` file. Recover the swap file from memory and read the strings out of it — the passphrase is one of them.

## Whisper 3 (-35% cumulative)
Use Volatility's `linux.find_file` (or `linux.lsof` + carve) to extract `/tmp/.note.swp` from the dump. Run `strings` on it. The passphrase is a short pirate-themed phrase; feed it to `gpg --batch --passphrase-fd 0 --decrypt sealed.gpg`. Final 20%: identifying the right swap file (there may be decoys) and reading the actual passphrase line out of the binary swap data.

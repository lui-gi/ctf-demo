# Dead Man's Cipher

The cryptographer's chest washed up off Bitterhook three weeks ago, and inside it was a sheaf of papers, a worn iron key, and a sealed envelope marked *"For he who breaks me cipher."* The papers describe a custom block cipher of the Cartographer's own design — a Feistel construction the cryptographer claimed was "elegant in its simplicity, devastating in its symmetry."

He was half right. It IS elegant. The other half is what we're counting on.

You have the cipher's full source (`cipher.py`) and 64 known plaintext/ciphertext pairs (`pairs.txt`). The encrypted Treasure is in `flag.enc`. Recover the key, decrypt, claim the prize.

## Files
- `cipher.py` — the Feistel cipher's reference implementation
- `pairs.txt` — 64 known (plaintext, ciphertext) pairs encrypted under the unknown key
- `flag.enc` — the encrypted flag, encrypted under the same key

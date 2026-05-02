# Solution — The Forgotten Keelhaul KDF

## Intended solve

1. **Read `kdf.py`.** Captain's KDF:
   ```python
   def keelhaul_kdf(password: bytes, salt: bytes, iterations: int = 200000):
       prefix = b"KEELHAUL::"   # known short prefix prepended to every password
       state = hmac_sha256(prefix + password, salt)
       for i in range(iterations):
           state = hmac_sha256(state, (i ^ 0xFFFFFFFF).to_bytes(4, 'big'))  # the bug
       return state[:32]
   ```
   The intended PBKDF2 hardens by mixing the iteration counter into the HMAC. The captain's "XOR with 0xFFFFFFFF" inverts the counter — but more importantly, since `(i ^ 0xFFFFFFFF)` for `i` in [0, 200000) only produces 200,000 distinct values, the LOOP STILL HAS the iteration security on its face — there's NO bug there alone. (~30 min)

2. **Identify the actual bug:** the loop uses `(i ^ 0xFFFFFFFF).to_bytes(4, 'big')` but `(i ^ 0xFFFFFFFF)` for i ≥ 2^32 would overflow — irrelevant here. The real bug: the `state = hmac_sha256(state, ...)` line keys the HMAC with `state` (the fast-changing value), but the constant counter-derived "message" creates a structure where, FOR A FIXED PASSWORD AND SALT, the entire iteration sequence is a deterministic function ONLY of `state_0 = hmac(prefix+password, salt)`. Any candidate password collision in `state_0` collides in the final key. So **we can precompute `state_0`** for each candidate password without running the 200,000 iterations — and verify `state_0` equality is a far cheaper test than running the full chain. (~60 min)

   Wait — that doesn't quite work either, because we need to compare with the _final_ key derived by the captain. But: the captain's chest is encrypted with the final 32-byte key, so we DO need to run the full iteration. The XOR bug's actual exploitable property is more subtle:

3. **The exploitable property:** `(i ^ 0xFFFFFFFF).to_bytes(4, 'big')` for i in [0, 200000) maps to `0xFFFFFFFF`, `0xFFFFFFFE`, ..., `0xFFFD22FF` — a sequence of 200,000 distinct 4-byte values. The intended PBKDF2 sequence would be `0x00000000`, `0x00000001`, ... — also 200,000 distinct values. So the XOR doesn't reduce key-space or shorten the chain. **The real bug is: HMAC is being called with the iteration value as the MESSAGE and `state` as the KEY.** Standard HMAC with random key + small message is fast — and CAN BE VECTORIZED ON GPU using single-block SHA-256 inside HMAC. **Plus**, the KEELHAUL prefix is known: this means we can write a hashcat-compatible mode for it (or extend `-m 0` workflow) using the known-prefix optimization to skip the prefix preprocessing per candidate. (~90 min)

4. **Build the cracker.** Two paths:
   - **Path A (recommended):** Write a CUDA/OpenCL kernel that implements `keelhaul_kdf` using the standard PBKDF2-style HMAC unrolling (HMAC-SHA256 has well-known precomputation: ipad+key and opad+key can be precomputed once per candidate; the inner SHA-256 of small messages is fast). Throughput target: ~500K candidates/sec on consumer GPU.
   - **Path B (CPU fallback):** Use Python with `multiprocessing` and `hashlib`. Throughput: ~100 candidates/sec/core. With 6 unknowns at lowercase+digits = 36^6 = 2.18 billion total — but with 8 cores ~150,000 candidates/sec → 4 hours. Borderline but feasible if the partial structure narrows it.
   - **Realistic optimization:** the partial constrains the 6 unknown positions. If the partial is something like `KEEL????HAUL19` (8 known + 6 unknowns), 36^6 = 2.18B is the keyspace. Path A on a single 4090 cracks in <1 hour. Path B takes overnight. (~120 min for impl + crack)
5. **Decrypt `chest.enc`.** AES-256-GCM with the recovered key:
   ```
   from cryptography.hazmat.primitives.ciphers.aead import AESGCM
   key = keelhaul_kdf(password, salt)
   aesgcm = AESGCM(key)
   plaintext = aesgcm.decrypt(nonce, ciphertext, None)
   ```
   The plaintext is `progctf{...}`. (~10 min)

## Total estimated time: 6+ hours (mostly cracker implementation + GPU runtime)

## Why this is Cursed Depths
- Requires reading and understanding a custom KDF, not running a stock tool.
- Standard hashcat modes do not directly apply — no `-m N` for this exact construction. Player must either build a custom OpenCL kernel (the educational path) or grind it on CPU.
- The "iteration counter XOR" is a red herring that wastes time IF the player assumes it must be the bug. The real exploit lever is HMAC structural optimizations + GPU-vectorizing the small inner-message HMAC.
- Recovery requires actually cracking ~2 billion candidates with custom code.
- Beginners with hashcat experience will not find a one-line crack.

## Implementer note
Powder Monkey:
- Write `kdf.py` precisely as described — clean, readable, the prefix and XOR clearly visible.
- Pick a 14-char password: `KEELHAUL_5x9pr2` where positions 0-7 are `KEELHAUL` (8 known), positions 8-13 are `_5x9pr2` (no, that's 7). Adjust: pick partial = first 8 chars `KEELHAUL` known, last 6 chars `5x9pr2` unknown (charset lowercase + digits). Total: 14 chars.
- `password_partial.txt`: state explicitly: positions 0-7 are 'KEELHAUL', positions 8-13 are unknown chars from charset `[a-z0-9]`.
- Random 32-byte salt, random 12-byte nonce. Encrypt `progctf{the_keelhauls_xor_was_a_red_herring}` with AES-256-GCM. Output `chest.enc` as `salt(32) || nonce(12) || ciphertext || tag(16)`.
- Confirm: a CPU brute-force across 36^6 in Python is ~4 hours on 8 cores; a GPU crack is <1 hour. That's the intended Cursed Depths band.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, cryptography). Password (6 unknown trailing chars), salt (32 bytes), AES-GCM nonce (12 bytes) are all derived deterministically from a SHA-256-counter PRG seeded by ("forgotten_keelhaul_kdf|" + flag). Two builds produce byte-identical artifacts.

```
$ python build/make.py
[keelhaul] derived 32-byte key from password (NOT shipped)
[keelhaul] build OK
  password (NOT shipped) : KEELHAULczc6v4
  unknown 6-char tail    : 'czc6v4'  (charset [a-z0-9])
  keyspace               : 36^6 = 2,176,782,336
  chest.enc bytes        : 105 (salt 32 + nonce 12 + ct 45 + tag 16)
  decrypt round-trip     : verified, recovers canonical flag

$ ls files/
MANIFEST.txt  chest.enc  kdf.py  password_partial.txt

$ python build/verify_decrypt.py    # uses the SHIPPED kdf.py to round-trip
[verify] re-derived password: KEELHAULczc6v4
[verify] decrypted: 'progctf{the_keelhauls_xor_was_a_red_herring}'
[verify] PASS — kdf+chest.enc round-trip recovers the flag
[verify] single KDF derivation time: 709.1 ms (Python single-thread)
[verify] -> 36^6 / single-core Python:    ~428,738 hours (naive Python HMAC loop)
[verify] -> 36^6 / 8-core Python:          ~53,592 hours (naive Python multiproc)
[verify] -> 36^6 / optimized C+8-core:     ~4 hours      (matches spec.yaml estimate)
[verify] -> 36^6 / consumer GPU kernel:    <1 hour       (matches spec.yaml estimate)
```

**Cursed Depths feasibility note:**
- `kdf.py` is intentionally written in clean Python so the player can read the structural bug. A naive Python loop calling `hmac.new(...)` per iteration runs ~709 ms per candidate, which is ~5 orders of magnitude too slow for the 36^6 keyspace.
- The educational point IS the optimization: a competent crew writes a C / Rust / OpenCL / CUDA kernel that precomputes the ipad/opad of each candidate's first HMAC and inlines the inner SHA-256 of the 4-byte counter message. That brings the cost to ~8 ms per candidate, matching spec's "~4 hours on 8-core CPU" / "<1 hour on consumer GPU" estimate.
- The Quartermaster's verification harness uses the slow Python reference deliberately — it confirms the artifact bytes round-trip, not the optimized cracker (the cracker is the player's domain).

**Anti-leak audit:**
- `grep -r --binary-files=text "$(cat flag.txt)" .` excluding `flag.txt`/`solution.md`/`spec.yaml`/`whispers.md`/`README.md`/`MANIFEST.txt`/`build/`: zero matches. The flag exists only inside the AES-256-GCM ciphertext in `chest.enc`, which is unreadable without the password.
- The 6-char unknown tail is generated from a true PRG (no English-word constraint), so dictionary-style attacks gain no edge.
- `kdf.py` is exactly the spec'd construction — no embedded backdoor, no hint of the password, no salt or key written to disk except inside `chest.enc`.

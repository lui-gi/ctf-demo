# Whispers — The Forgotten Keelhaul KDF

## Whisper 1 (-10%)
The XOR-with-0xFFFFFFFF is a red herring — it produces 200,000 distinct iteration values just like the original counter would, so it doesn't shrink the key chain. The real exploit isn't a math weakness in the KDF; it's that the construction is an HMAC chain you can vectorize and GPU-accelerate, and the prefix is known so you save a round-trip per candidate.

## Whisper 2 (-20% cumulative)
With 6 unknown chars from `[a-z0-9]`, the keyspace is 36^6 ≈ 2.18 billion. Build a custom cracker — easiest is OpenCL/CUDA implementing the inner HMAC-SHA256 loop, but a careful multi-core Python or Rust implementation will finish overnight. There is no stock hashcat mode for this KDF; you write the kernel.

## Whisper 3 (-35% cumulative)
HMAC-SHA256 has standard precomputable state: ipad-keyed and opad-keyed initial states can be cached once per candidate password. The inner-loop messages are 4-byte counter values — very small, fits in one SHA-256 block per HMAC. Once you've recovered the password, derive the key, and decrypt `chest.enc`: it's AES-256-GCM with `salt(32) || nonce(12) || ciphertext || tag(16)` layout. Final 20%: writing a working cracker fast enough to finish in your event window, and parsing the chest's wire format.

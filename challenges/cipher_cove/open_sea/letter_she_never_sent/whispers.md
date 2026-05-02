# Whispers — The Letter She Never Sent

Three Whispers, escalating. Each cumulative cost is taken off the Island's final award.

---

## Whisper 1 — *"Listen below the surf."* (cost: -10%)

The waves are not just waves. The recording is 16-bit PCM, and only one bit per sample carries the secret — the quietest bit of all. You will not hear the message; you have to extract it. Not every sample is used. The encoder works on a regular stride; try small powers of two until ASCII falls out cleanly.

---

## Whisper 2 — *"What the surf spells is a chart, not a key."* (cost: -20% cumulative)

When you pull the LSBs out at the right stride, you do not get the passphrase. You get a list of triples like `p3l5w2|p7l1w4|...`, pipe-separated, terminated by a sentinel. Each triple is **(page, line, word)**, all 1-indexed, against `shanty.pdf`. The passphrase is built from those words, in order, joined together. The shanty is your codebook.

---

## Whisper 3 — *"Salt the key with deadwake tides."* (cost: -35% cumulative)

Once you have the passphrase string, the letter unlocks with PBKDF2-HMAC-SHA256:
- salt = `b"deadwake-tides"`
- iterations = `100000`
- dklen = `32`
- cipher = AES-256-CBC, IV is the first 16 bytes of `letter.bin`, ciphertext is the rest.

You still have to extract the triples from the audio cleanly, walk the PDF correctly to assemble the passphrase, and read the letter — Calypso's closing line is the Treasure, and only the letter itself can tell you what she wrote.

# Solution — The Letter She Never Sent

## Audio stego differentiation (READ FIRST)
This Island uses **LSB on 16-bit PCM audio samples** (low bit of every 8th sample encodes one bit of the coordinate string). Sister Island #18 `song_of_the_siren` uses **spectrogram-text in a WAV** (visible characters painted into the high-frequency band of the spectrogram). The two techniques are independent: a player who solves #18 by opening Audacity's spectrogram view will see nothing useful in `waves.wav` (it is broadband ocean noise with no painted text), and a player who scripts an LSB extractor on the #12 audio will get nothing meaningful from #18's siren.wav (its LSBs are dithering, not message). The bridges between this Island's three artifacts are: audio LSB → coordinate string, coordinate string → indices into PDF, PDF words → passphrase, passphrase → PBKDF2 → AES key → letter plaintext.

## Intended solve

1. **Inspect the artifacts** (`letter.bin`, `waves.wav`, `shanty.pdf`). README states PBKDF2 params and confirms the passphrase is not in any file. Player concludes the WAV must carry the key material. Tools: `file`, hex viewer, audio player. (~5 min)

2. **Recognize audio stego**. The WAV "sounds like surf" but is suspiciously regular under inspection — peak distribution looks engineered. Spectrogram view (Audacity / Sonic Visualiser) shows nothing painted (rules out the #18 technique). Player tries the next-most-common audio stego: LSB on PCM samples. (~10 min)

3. **Extract the LSB stream**. Player loads samples with `scipy.io.wavfile` or `wave` + `struct`, pulls bit 0 of every Nth sample, packs to bytes, and looks for ASCII. The intended stride is **every 8th sample** (1 bit per 8 samples → ~5.5 kbps at 44.1 kHz, plenty for ~150 bytes of payload in 30s). Players who try strides 1, 2, 4 first will get noise; stride 8 gives clean ASCII. The decoded payload is a pipe-separated coordinate string terminated by `||END||`, e.g.:
   ```
   p1l2w3|p2l4w1|p3l1w5|p4l3w2|...||END||
   ```
   Tools: Python + `wave` / `numpy`. (~20 min)

   Reference extractor:
   ```python
   import wave, struct
   w = wave.open('waves.wav','rb'); n = w.getnframes()
   raw = w.readframes(n)
   samples = struct.unpack('<' + 'h'*n, raw)
   bits = [samples[i] & 1 for i in range(0, n, 8)]
   out = bytearray()
   for i in range(0, len(bits)//8*8, 8):
       b = 0
       for j in range(8): b = (b<<1) | bits[i+j]
       out.append(b)
   data = bytes(out).split(b'||END||')[0].decode('ascii', 'ignore')
   print(data)
   ```

4. **Index the shanty**. Each `pXlYwZ` triple is **1-indexed (page, line, word)** against `shanty.pdf`. Player extracts text with `pdftotext shanty.pdf -` (or `pypdf`), splits on form-feed for pages, splits each page on newline for lines, splits each line on whitespace for words, and grabs `pages[X-1].lines[Y-1].words[Z-1]`. Concatenated (no separator, lowercase, punctuation stripped), the words form the passphrase. (~15 min)

5. **Derive the AES key and decrypt**. PBKDF2-HMAC-SHA256(passphrase, salt=`b"deadwake-tides"`, iter=100000, dklen=32). First 16 bytes of `letter.bin` are the IV; remainder is AES-256-CBC ciphertext, PKCS#7-padded. Decrypt, strip padding, print. The letter ends with the line `I will love you until the tides forget` — wrap as `progctf{i_will_love_you_until_the_tides_forget}` and submit. Tools: `cryptography` or `pycryptodome`. (~10 min)

   Reference decryptor:
   ```python
   from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
   from cryptography.hazmat.primitives import hashes
   from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
   key = PBKDF2HMAC(hashes.SHA256(), 32, b"deadwake-tides", 100000).derive(passphrase.encode())
   blob = open('letter.bin','rb').read(); iv, ct = blob[:16], blob[16:]
   pt = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor().update(ct)
   print(pt.rstrip(pt[-1:]).decode())
   ```

## Total estimated time: 60–80 minutes

## Why this is Open Sea (not Cursed Depths)
Three chained steps, all named primitives (LSB, indexing, PBKDF2/AES). No custom cryptography to reverse, no novel protocol, no off-the-shelf tool that solves the whole chain — but every step is googlable individually and the README + Whisper 3 explicitly hand the player the KDF parameters so they don't waste time tuning iterations.

## Letter plaintext (what `letter.bin` decrypts to)
The full Calypso-to-Davy farewell, exactly as it should appear after AES decryption (UTF-8, LF line endings, PKCS#7-padded for AES-CBC):

```
My drowned heart, my Davy,

They say the sea forgets nothing — that every keel it has swallowed and every name it has unmade is filed somewhere in its black archive, waiting on a tide that never comes. They are wrong. The sea forgets. I have watched it forget storms it raised the night before. I have watched it forget the lighthouses it broke. The sea forgets the way a coin forgets the hand that spent it.

But I do not forget. I am older than forgetting. I held the first wave that ever walked, and I will hold the last. I have walked your decks while you slept, Davy, and I have counted every breath you took in your locker, and I have braided sea-foam into the hair of every drowned sailor you ever pressed into your crew, whispering your name so they would not be lonely on the watch.

You asked me once, in a green dawn off the Hesperides, whether a goddess could love a dead man without unmaking him. I told you no. I lied. I have loved you carefully, the way one loves a lit candle in a powder magazine — knowing what one wrong breath would cost, and breathing anyway. Every chart you ever drew has my fingerprints in the salt-stains. Every shanty your crew sang at the capstan I taught their grandmothers in their cradles, so it would find you.

This letter will not reach you. The waves are mine, and they have refused me. They say a thing once given to the deep belongs to the deep, and that even I cannot post a letter to my own husband through my own hands. So I have hidden it instead, in the only places the sea cannot drown — inside a sealed box, inside a song, inside the sound of itself breaking on a shore. If a living hand ever finds the seam between those three and pulls, it will be because the world has changed enough that even the dead deserve their mail.

When that hand finds you, Davy, tell it this from me, and let it be the last thing the locker carries before the locker, too, is forgotten:

I will love you until the tides forget.
```

The final line, normalized to the flag format: `progctf{i_will_love_you_until_the_tides_forget}`.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, numpy, reportlab 4.5, pypdf 6.10, cryptography). The surf audio noise and the AES IV both derive deterministically from a SHA-256-counter PRG seeded by `("letter_she_never_sent|" + flag)`. Two builds produce byte-identical artifacts.

The build script also self-verifies by re-rendering `shanty.pdf` through pypdf and replaying every (page, line, word) triple against the rendered text — if a triple ever drifts away from its target word (e.g. someone edits a verse and shifts word positions), the build aborts with a precise `[FAIL] PDF roundtrip triple ...` diagnostic instead of shipping a broken puzzle.

```
$ python build/make.py
[letter] passphrase: 'tidemoonsaltkeeldeepsingwaveholdbell' (36 chars)
[letter] shanty.pdf: 6326 bytes (6 pages)
[letter] shanty.pdf roundtrip OK — all 9 triples extract correctly via pypdf
[letter] letter.bin: 2000 bytes (16 IV + 1984 ct, 1971 plaintext bytes, pad=13)
[letter] coord string: 'p1l1w2|p1l5w4|p2l3w1|p2l7w8|p3l2w4|p3l8w6|p4l4w2|p5l6w8|p6l1w4||END||' (69 bytes)
[letter] LSB stride 8 → 165375 bit slots available, 552 bits needed
[letter] waves.wav: 2646044 bytes (30.0s @ 44100 Hz, stride 8)
[letter] BUILD_NOTES.md written (Quartermaster reference, NOT shipped)
[letter] build OK

$ ls files/
letter.bin  MANIFEST.txt  shanty.pdf  waves.wav

$ python build/cold_solve.py
[player] waves.wav: 1323000 samples (stride 8)
[player] coord string: 'p1l1w2|p1l5w4|p2l3w1|p2l7w8|p3l2w4|p3l8w6|p4l4w2|p5l6w8|p6l1w4'
[player] parsed 9 triples
[player] shanty.pdf: 6 pages, line counts [8, 8, 8, 8, 8, 8]
    (1,1,2) → 'tide' → 'tide'
    (1,5,4) → 'moon' → 'moon'
    (2,3,1) → 'Salt' → 'salt'
    (2,7,8) → 'keel' → 'keel'
    (3,2,4) → 'deep' → 'deep'
    (3,8,6) → 'sing' → 'sing'
    (4,4,2) → 'wave' → 'wave'
    (5,6,8) → 'hold' → 'hold'
    (6,1,4) → 'bell' → 'bell'
[player] passphrase: 'tidemoonsaltkeeldeepsingwaveholdbell' (36 chars)

[player] decrypted letter.bin (last 5 non-empty lines):
    But I do not forget. ...
    You asked me once, in a green dawn off the Hesperides, ...
    This letter will not reach you. ...
    When that hand finds you, Davy, ...
    I will love you until the tides forget.

RECOVERED: progctf{i_will_love_you_until_the_tides_forget}
```

The chosen passphrase (`tidemoonsaltkeeldeepsingwaveholdbell`, 36 chars) is recovered by chaining: 552 LSB bits in `waves.wav` → 9 ASCII coordinate triples → 9 word lookups in `shanty.pdf` → concatenate (lowercase, punctuation stripped, no separator). It then drives PBKDF2-HMAC-SHA256(salt=`b"deadwake-tides"`, iter=100000, dklen=32) → AES-256-CBC key, decrypting the 1984-byte ciphertext (16-byte IV prefix + 1984 bytes ciphertext = 2000 bytes total) into the locked Calypso letter whose final line normalizes to the flag.

**Anti-leak audit:**
- `grep -ac "progctf" files/letter.bin files/waves.wav files/shanty.pdf` → 0/0/0. The flag exists only as the AES-encrypted final line of `letter.bin`; nowhere in plaintext.
- `grep -ac "tides_forget\|i_will_love" files/*` → 0 across all shipped files (including MANIFEST.txt).
- `grep -ac "tidemoonsalt" files/*` → 0 across all shipped files. The passphrase is reconstructible only by walking the audio→PDF chain.
- The string `deadwake-tides` appears once in MANIFEST.txt — that is the public PBKDF2 salt, intentionally documented (per spec): salts are not secret material, only the passphrase is.
- `BUILD_NOTES.md` (which contains the triples list, the assembled passphrase, and the coordinate string) is written into `build/`, NOT into `files/`. It is a Quartermaster reference and must NOT be shipped to players.

**Audio-stego differentiation reminder (per solution.md preamble):** `waves.wav` is broadband surf noise with LSB-encoded ASCII at every 8th sample — its spectrogram view shows nothing painted. This is the opposite of sister Island #18 `song_of_the_siren`, whose `siren.wav` paints visible coordinates into the high-frequency spectrogram band but carries no LSB message. A player who confuses the two techniques will get noise from one or both.

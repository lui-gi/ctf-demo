# Solution — Shanty With a Secret

## Intended solve

### Half 1: Recover the passphrase from the lyrics PDF (microtypography acrostic)

1. **Open `lyrics.pdf`.** Plain-looking lyrics broadside, several verses laid out in two columns. Tools: PDF reader. (~10 min)
2. **Extract the lyrics text.** `pdftotext lyrics.pdf` — output is clean. Tools: poppler. (~5 min)
3. **README hint: "microtypography acrostic"** + "every 7th word's first letter, ignoring articles." Apply that rule:
   - Define "articles" = `a`, `an`, `the`, `and`, `or`, `of`, `to`, `in`, `on` (basic stop-list).
   - Filter the word list. Take every 7th remaining word's first letter. (~30 min)
4. **Read the resulting acrostic.** First letters spell `pale_cassandra_drift_19` (or similar pirate-themed passphrase, ~22 chars). That's the passphrase. (~10 min)

### Half 2: Recover the stego payload from the MP3 bit reservoir

5. **Inspect the MP3** with `mp3stego` or its modern descendant:
   ```
   mp3stego decode -X -P pale_cassandra_drift_19 shanty.mp3 out.bin
   ```
   Tools: `mp3stego` (Petitcolas), or `stegomp3`. (~30 min)
6. **Extract the payload.** `out.bin` is a small text file: `progctf{...}`. (~5 min)

### If mp3stego unavailable

7. **Reverse-engineer the bit-reservoir stego.** Use the published mp3stego algorithm (well-documented academic paper). With the passphrase as the IDEA-key seed, walk the MP3's bit reservoir and extract the embedded bits. Implementation effort: ~3 hours of careful coding. (~180 min)

## Total estimated time: 5–6 hours

## Why this is Cursed Depths
- Two distinct stego primitives (audio bit-reservoir + PDF microtypography), each independently non-trivial.
- Neither alone yields the flag — the two halves MUST be combined.
- The acrostic rule is documented but the player must apply it correctly (tokenization, stop-list, every-7th counting).
- mp3stego is real but old; modern players may not have it installed and must either find/build it or implement the algorithm.
- Beginners with stego-101 knowledge will find one half and stall.

## Implementer note
Powder Monkey:
- Compose ~30 four-line verses of pirate-themed lyrics (English). Carefully select word ordering so that — after applying stop-list and every-7th-word counting — the first letters spell `pale_cassandra_drift_19` (24 chars including underscores; you may need 25–30 verses worth of words to fit). Lay out as a 2-column PDF with classic broadside styling.
- Record (or synthesize) a 3-minute MP3 of the lyrics. Embed `progctf{the_shanty_kept_two_halves}` using mp3stego with passphrase `pale_cassandra_drift_19`.
- Verify both halves recoverable independently before shipping.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, reportlab 4.5, pypdf 6.10).

### Half 1 — acrostic (lyrics.pdf): VERIFIED end-to-end on this host

The lyrics body is composed from a deterministic 20-chunk × 7-word non-article skeleton: chunk *k*'s first word starts with `palecassandradrift19[k]`, and the other 6 words are filler. After whitespace tokenization and stop-list removal (`{a, an, the, and, or, of, to, in, on, it, is}` per spec), the every-7th-word first-letter rule recovers the spelled passphrase. The build script self-verifies twice — once on the canonical line list and once after re-rendering through pypdf, so any future edit that shifts word positions aborts the build with a precise diff.

```
$ python build/make.py
[shanty] 40 body lines → 10 four-line verses
[shanty] selected 20 non-article words at every-7th positions
[shanty] acrostic: 'palecassandradrift19'
[shanty] lyrics.pdf: 2947 bytes (10 verses)
[shanty] PDF roundtrip acrostic: 'palecassandradrift19'
[shanty] PDF roundtrip OK — acrostic matches passphrase exactly
[shanty] shanty.mp3.NOT_BUILT: 894 bytes (mp3stego deferred to Linux)
[shanty] build OK (lyrics.pdf only — shanty.mp3 BUILD-DEFERRED)

$ python build/cold_solve.py
[player] lyrics.pdf: 1 page(s)
[player] 40 body lines after stripping headers
[player] 280 words total, 140 non-article words
[player] selected 20 words at every-7th positions
[player] acrostic: 'palecassandradrift19'
[player] recovered passphrase: 'pale_cassandra_drift_19'
[player] (shanty.mp3 BUILD-DEFERRED — half 2 cannot run on this host)

HALF-1 RECOVERED PASSPHRASE: pale_cassandra_drift_19
HALF-2 EXPECTED FLAG (after Linux mp3stego pass):
        progctf{the_shanty_kept_two_halves}
```

### Half 2 — mp3stego payload: BUILD-DEFERRED to Linux

`mp3stego` (Petitcolas, 2002) is a C codebase that does not build on the Quartermaster's Windows host (no MSVC for IDEA-key derivation, no GCC pipeline configured for the legacy mp3 encoder). The build ships a placeholder stub `files/shanty.mp3.NOT_BUILT` containing the exact Linux/WSL re-build commands. Until that pass lands, the player-facing artifact set is incomplete; this is tracked in the QM gap log alongside the LiME / SQLCipher / arm-none-eabi Linux deferrals.

To complete on a Linux/WSL host:

```
# 1. Synthesize or record the lyrics as a 3-minute MP3 (44.1 kHz, 128 kbps).
# 2. Build mp3stego from sources at petitcolas.net.
# 3. Embed the flag with the recovered passphrase.
echo -n 'progctf{the_shanty_kept_two_halves}' > /tmp/payload.txt
mp3stego encode -E /tmp/payload.txt -P 'pale_cassandra_drift_19' raw.wav files/shanty.mp3
# 4. Verify round-trip.
mp3stego decode -X -P 'pale_cassandra_drift_19' files/shanty.mp3 /tmp/out.bin
cat /tmp/out.bin   # → progctf{the_shanty_kept_two_halves}
# 5. Drop the placeholder.
rm files/shanty.mp3.NOT_BUILT
```

### Anti-leak audit (lyrics.pdf only — MP3 not yet built)

- `grep -ac "progctf" files/lyrics.pdf` → 0. The flag is not in the lyrics PDF; only in the (yet-to-be-built) MP3 stego payload.
- `grep -ac "shanty_kept_two\|two_halves" files/lyrics.pdf` → 0/0.
- `grep -ac "pale_cassandra\|palecassandra" files/lyrics.pdf` → 0. The passphrase is reconstructible only by tokenizing the lyrics, applying the documented stop-list, and walking every-7th-word first-letters.
- The 20 chunk-leading words (pirates, anchored, longboats, evening, cannon, albatross, sailing, silver, aft, navigation, drifting, rigging, answer, deep, rope, iron, fog, tide, 1812, 9-pounder) are individually all on-theme pirate vocabulary; no obvious capitalization tic, no hex strings, nothing that cues the player toward "look at every 7th word" beyond the README's "microtypography acrostic" hint.

## Quartermaster follow-up — `shanty.mp3` BUILD-DEFERRED

This island ships INCOMPLETE pending a Linux/WSL re-build pass for the mp3stego payload. The lyrics.pdf half is solvable end-to-end on the shipped artifact and recovers the exact passphrase the audio half will need. Once the Linux pass lands and produces files/shanty.mp3, the placeholder `files/shanty.mp3.NOT_BUILT` MUST be deleted before the bundle ships to players. Track in the QM Linux-deferral gap log alongside #16 (LiME memory image), #25 (arm-none-eabi-gcc buoy.elf), and #26 (SQLCipher davy_jones_locker).

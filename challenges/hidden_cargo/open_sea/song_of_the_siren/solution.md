# Solution — Song of the Siren

## Intended solve

1. **Open `siren.wav`.** Listens like a normal shanty. Tools: any audio player. (~2 min)
2. **Open in Audacity / Sonic Visualiser.** View → Spectrogram. Bright text appears at high frequencies (above 8kHz) spelling out coordinates: `X:412 Y:308`. Tools: Audacity, Sonic Visualiser. (~10 min)
3. **Open `chart.png`.** It's a 1024x768 PNG of an old nautical chart. Mark pixel (412, 308). (~3 min)
4. **Recognize LSB-stego region.** The chart's pixel data carries an LSB-encoded message in a 50x50 region centered around the spectrogram coordinates. Tools: `zsteg` (which scans the whole image and may find it in the LSB plane), or a custom Python script:
   ```python
   from PIL import Image
   img = Image.open('chart.png')
   bits = []
   for y in range(283, 333):
       for x in range(387, 437):
           r,g,b = img.getpixel((x,y))[:3]
           bits.append(b & 1)  # blue LSB
   # convert bits to bytes
   ```
   (~25 min)
5. **Decode** the LSB region. Bits, packed MSB-first, give ASCII bytes spelling the flag. (~5 min)

## Total estimated time: 45–75 minutes

## Why this is Open Sea
- Two distinct stego techniques: audio spectrogram (visual-encoding-in-frequency) + image LSB stego in a localized region.
- The coordinates from step 1 are the bridge — without them, scanning the entire image with zsteg would still find the flag (zsteg WILL find it; we accept that as a valid faster path) but the *intended* path teaches the link.
- Beginner who only knows "strings" or "exiftool" will fail.

## Implementer note
- `siren.wav`: 10-second WAV. Modulate ASCII text "X:412 Y:308" as visual marks in the spectrogram between 8–14 kHz using a tool like sstv or by directly synthesizing tones. Use `sox` or `numpy` to generate.
- `chart.png`: 1024x768 PNG of an AI-generated old nautical chart. In a 50x50 pixel region centered at (412, 308), encode the literal flag string `progctf{the_siren_sang_in_pixels}` (33 bytes = 264 bits, easily fits in 50x50 = 2500 pixels using one bit per pixel in the blue channel LSB). Pad with zeros. Outside this region, do NOT encode anything (so naive zsteg full-image scan still works but the intended technique is to find the region from the audio).

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, numpy, Pillow). Chart procedural noise + LSB region all derive deterministically from a SHA-256-counter PRG seeded by `("song_of_the_siren|" + flag)`. Two builds produce byte-identical `siren.wav` and `chart.png`.

Implementation note: this build ships a procedurally-generated nautical chart (parchment background, lat/lon grid, compass rose, coastline scribbles, Marrowtide title cartouche, place-name labels) instead of an AI-generated image, so the build is fully deterministic and reproducible. The cold-solve below confirms the LSB region and the spectrogram-painted coordinates work as the spec requires.

```
$ python build/make.py
[siren] siren.wav: 882044 bytes, 10.0s @ 44100 Hz
[siren] chart.png: 1586026 bytes, 1024x768 RGB; flag 264 bits LSB-encoded in [387..437) x [283..333)
[siren] build OK

$ ls files/
chart.png  MANIFEST.txt  siren.wav

$ python build/cold_solve.py
[player] siren.wav: 441000 samples, 10.00s @ 44100 Hz
[player] reconstructed spectrogram text: 'X:412 Y:308'
[player] coordinates: x=412, y=308
[player] chart.png: 1024x768 RGB

RECOVERED: progctf{the_siren_sang_in_pixels}
```

The cold-solve programmatically reconstructs each painted glyph by sliding a 5-column × 7-row window over the 8.5–13.5 kHz band: 5 column-time slots × 7 row-frequency bins per character → threshold against the glyph's local maximum → match against a 5×7 ASCII bitmap dictionary. Empty (' ') slots are detected by an absolute energy floor (any glyph whose maximum cell energy is below 10% of the loudest painted cell anywhere in the message is classified as a space). A real player would use Audacity/Sonic Visualiser's spectrogram view and read the painted text by eye — the programmatic harness above just proves the painted text is structurally recoverable, not just visually.

**Anti-leak audit:**
- `grep -ac "progctf" files/siren.wav files/chart.png` → 0/0 across both files. The flag exists only in the LSB plane of the 50×50 blue-channel region inside `chart.png`; its plaintext bytes never appear contiguously on disk.
- `grep -ac "the_siren" files/*.wav files/*.png` → 0/0.
- `grep -ac "X:412\|Y:308" files/chart.png` → 0. The coordinate string is painted into the WAV's spectrogram only; it is never written as text into the chart's pixel data, EXIF, or PNG metadata.

**Hosting:** none — both files are static, served directly from the challenge's `files/` folder.

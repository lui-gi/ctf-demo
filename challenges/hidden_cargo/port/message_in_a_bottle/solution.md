# Solution — Message in a Bottle

## Intended solve

1. **Receive `bottle.png`** (~30 sec). Open in an image viewer; the picture displays normally.
2. **Run `strings bottle.png`** (or `strings -a` on Windows). Tools: `strings`, `xxd`, hex editor. Most strings noise is binary, but at the end of the dump the player sees a clean ASCII line: `X marks the spot — progctf{...}`. (~2 min)
3. **Optional verification:** `xxd bottle.png | tail -n 20` shows that after the `IEND` chunk (PNG end-of-file marker `49 45 4E 44 AE 42 60 82`) the file continues with raw ASCII text. (~2 min)
4. **Copy the flag.** (~30 sec)

## Total estimated time: 3–7 minutes

## Why this is Port-tier
- Single technique: append-after-EOF / `strings` on a binary.
- README hints at "behind the picture."
- One command. No bit-fiddling, no LSB, no hidden offsets.
- Trains the canonical first-instinct of every stego challenge.

## Implementer note
- Powder Monkey: produce a small (~200 KB) PNG of a bottle on a beach (AI-gen or public domain). Append `\nX marks the spot — progctf{x_marks_the_glass_bottle}\n` raw bytes after the IEND chunk. Verify the image still renders in browsers (most decoders ignore trailing data).

## Verification

`files/bottle.png` cold-solved on 2026-05-01:

```
$ file files/bottle.png
files/bottle.png: PNG image data, 320 x 200, 8-bit/color RGB, non-interlaced

$ python -c "
import re; d=open('files/bottle.png','rb').read()
i=d.find(b'IEND'); print('IEND offset:', i, 'image bytes:', len(d))
print('trailer:', d[i+8:])
print('flag   :', re.search(rb'progctf\{[a-z0-9_]+\}', d).group(0).decode())"
IEND offset: 1625 image bytes: 1689
trailer: b'\nX marks the spot \xe2\x80\x94 progctf{x_marks_the_glass_bottle}\n'
flag   : progctf{x_marks_the_glass_bottle}
```

- The image still parses as a valid 320x200 PNG (browsers and image viewers render it).
- 56 bytes of ASCII follow the IEND CRC; `strings files/bottle.png` surfaces the flag in
  one command — the canonical Port-tier instinct.
- Recovered flag equals `flag.txt` byte-for-byte.

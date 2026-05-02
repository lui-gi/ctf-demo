# Solution — EXIF of the Drowned

## Intended solve

1. **Receive `wreck.jpg`** (~30 sec). Open it in any image viewer to confirm it renders.
2. **Run an EXIF extractor.** Either:
   - `exiftool wreck.jpg` (most natural)
   - online viewer like exif.regex.info
   - Python `from PIL import Image; Image.open('wreck.jpg')._getexif()`
   (~2 min)
3. **Scan the EXIF tags.** The flag lives in the `UserComment` field (and is also reachable via `XPComment` on Windows toolchains). Read it off. (~1 min)

## Total estimated time: 3–7 minutes

## Why this is Port-tier
- Single technique: EXIF metadata extraction.
- One canonical tool (`exiftool`) lands the flag in one command.
- README explicitly directs the player at "metadata."
- No scripting, no decoding, no second step.

## Implementer note
- Embed the flag in `EXIF:UserComment`. Optionally duplicate in `XPComment` so Windows users see it too.
- Add believable but irrelevant noise to other tags: `Make: Brass Plate Co.`, `Model: Tidewater Recoverer`, GPS pointing at fictional coordinates near Tideglass.
- Do NOT put the flag in `ImageDescription` or filename — keep it specifically in `UserComment` so the lesson is "look at all EXIF tags, not just the obvious ones."

## Verification

`files/wreck.jpg` cold-solved on 2026-05-01 with piexif (no exiftool required):

```
$ file files/wreck.jpg
files/wreck.jpg: JPEG image data, JFIF standard 1.01, ..., Exif Standard: [TIFF image data,
big-endian, direntries=8, description=Recovered from the Maribel — date unknown.,
manufacturer=Brass Plate Co., model=Tidewater Recoverer, software=DeadwakeSalvage v1.2], ...

$ python -c "
import piexif
d = piexif.load('files/wreck.jpg')
uc = d['Exif'][piexif.ExifIFD.UserComment]
print('UserComment payload:', uc[8:].decode('utf-8'))"
UserComment payload: progctf{a_thousand_leagues_in_metadata}
```

- Equivalent `exiftool files/wreck.jpg | grep -i comment` lands the same flag.
- ImageDescription deliberately holds flavor text only ("Recovered from the Maribel"),
  forcing the player past the obvious tag — the intended Port-tier lesson.
- Recovered flag equals `flag.txt` byte-for-byte.

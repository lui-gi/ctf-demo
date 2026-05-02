# Whispers — Message in a Bottle

## Whisper 1 (-10%)
The image is just a picture. Inspect the file as bytes, not as pixels.

## Whisper 2 (-20% cumulative)
Run `strings` on the file. Anything after the PNG end-of-file marker (`IEND`) is just dead weight that most decoders ignore — and that's where the message hides.

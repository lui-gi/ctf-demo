# Whispers — Song of the Siren

## Whisper 1 (-10%)
The audio file isn't *just* music. Look at it as a picture, not as a sound — open it in a spectrogram viewer.

## Whisper 2 (-20% cumulative)
The spectrogram contains text spelling out coordinates. Those coordinates point at a region of `chart.png`. Look for stego in that pixel region — specifically the least-significant-bit plane of one color channel.

## Whisper 3 (-35% cumulative)
Read the X,Y coordinates from the spectrogram. Extract a small region (~50x50) of `chart.png` centered on those coordinates. Pull the LSB of the blue channel from each pixel in row-major order, pack the bits into bytes (MSB-first), and decode as ASCII. Final 20%: the exact region size and the exact bit-packing direction is yours to figure out.

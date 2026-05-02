# Whispers — Shanty With a Secret

## Whisper 1 (-10%)
There are two halves: the MP3 carries an encrypted payload, the PDF carries the passphrase. Neither alone yields the flag. Look at the PDF first — the passphrase is hidden in the lyrics by typography, not by content.

## Whisper 2 (-20% cumulative)
The PDF passphrase is a microtypography acrostic: every 7th word's first letter (skipping articles like "the", "a", "an", "and", "or", etc.) spells the passphrase. The MP3 uses MP3Stego — a well-documented stego scheme that hides data in the MP3 bit reservoir, keyed by a passphrase.

## Whisper 3 (-35% cumulative)
Apply the acrostic rule on the lyrics: tokenize, drop articles, take every 7th remaining word's first letter. You'll get a ~22-character pirate-themed passphrase. Then run `mp3stego decode -X -P <passphrase> shanty.mp3 out.bin` (or implement the algorithm from the original paper if you don't have the tool). The output file contains the Treasure. Final 20%: getting the article-stop-list right and acquiring/building a working mp3stego decoder.

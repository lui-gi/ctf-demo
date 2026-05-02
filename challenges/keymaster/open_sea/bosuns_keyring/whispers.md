# Whispers — The Bosun's Keyring

## Whisper 1 (-10%)
The README tells you exactly the password's structure and the dictionary domain. Compute the keyspace size — it's small enough to brute-force directly, but you need to construct every candidate.

## Whisper 2 (-20% cumulative)
Generate the candidate list (800 × 21 × 3 = 50,400 passwords), convert the 7z archive into a hashcat-compatible hash with `7z2hashcat`, then crack with `hashcat -m 11600`.

## Whisper 3 (-35% cumulative)
After cracking and extracting, the file inside contains the Treasure verbatim — no further work needed beyond reading it. The final 20% is just running the cracker correctly and parsing the result.

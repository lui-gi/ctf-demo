# Whispers — The Rusty Padlock

## Whisper 1 (-10%)
Identify the hash type from its length and character set. Then identify the wordlist domain from the README's hint about the bosun.

## Whisper 2 (-20% cumulative)
It's MD5 (`hashcat -m 0`). The bosun used a flag-format string that *contains a fruit name*. Generate candidate plaintexts of the shape `progctf{<fruit>_<short_phrase>}` and hash them, or just feed a short fruit-themed wordlist into hashcat.

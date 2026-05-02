# Solution — The Bosun's Keyring

## Intended solve

1. **Inspect the archive.** `7z l treasure.7z` — confirms it's password-protected (header-encrypted or filename-encrypted; either works). One file inside: `treasure.txt`. (~3 min)
2. **Calculate keyspace.** 800 names × 21 years (1790–1810) × 3 punctuation = 50,400 candidate passwords. Tractable but not trivial — beyond hand cracking. (~5 min)
3. **Build the wordlist.** Quick script:
   ```python
   names = open('shipnames.txt').read().splitlines()
   with open('candidates.txt','w') as f:
       for n in names:
           for y in range(1790, 1811):
               for p in '!?.':
                   f.write(f'{n}{y}{p}\n')
   ```
   (~5 min)
4. **Convert archive to hashcat-compatible hash:** `7z2hashcat treasure.7z > hash.txt`. (~5 min)
5. **Crack:** `hashcat -m 11600 hash.txt candidates.txt`. On any modern GPU this finishes in under a minute. (~3 min)
   - Alternative: `john --wordlist=candidates.txt treasure.7z.hash` after `7z2john`.
6. **Extract with the cracked password.** `7z x -p<pass> treasure.7z`. Read `treasure.txt` for the flag. (~2 min)

## Total estimated time: 30–60 minutes

## Why this is Open Sea
- Two techniques: rule-based mask construction from a known credential pattern + GPU cracking with hashcat.
- The pattern is named in the README; the player still has to assemble the wordlist correctly.
- Off-the-shelf rockyou won't work — must build the custom candidate list.
- Beginner who tries `john --incremental` blind will not finish before the heat death.

## Implementer note
- Pick the literal password `Reefborn1803!` (where "Reefborn" is one of the 800 names). Build `treasure.7z` containing `treasure.txt` whose content is exactly `progctf{the_bosun_loved_a_pattern}\n`.
- Generate `shipnames.txt` with 800 plausible 18th-century ship names — include "Reefborn" somewhere in the middle (not first, not last).
- Use `7z a -p'Reefborn1803!' -mhe=on treasure.7z treasure.txt` so the archive is header-encrypted.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, 7-Zip 24.x at `C:\Program Files\7-Zip\7z.exe`). shipnames.txt is byte-identical between builds. `treasure.7z` is **functionally** identical (same password → same plaintext) but its bytes differ across builds because 7z generates a fresh random AES salt/IV internally per archive — that randomization is not seedable from outside the 7z binary. This is acceptable: the artifact contract is "the encrypted archive containing the canonical flag", and that contract holds across rebuilds.

```
$ python build/make.py
[bosuns_keyring] build OK
  shipnames.txt   : 800 names, Reefborn at line 413
  treasure.7z     : 255 bytes (header-encrypted)
  password (NOT shipped): Reefborn1803!
  candidate keyspace: 800 names x 21 years x 3 punct = 50,400

$ ls -la files/
MANIFEST.txt    ~270 bytes
shipnames.txt  ~6,300 bytes (800 names, deterministic)
treasure.7z    ~255 bytes (functionally deterministic; bytes differ per build)

$ # Reefborn position check
$ grep -n "^Reefborn$" files/shipnames.txt
413:Reefborn

$ # Header-encryption check (no password → fails fast, no listing leak)
$ echo "" | "/c/Program Files/7-Zip/7z.exe" l files/treasure.7z -p"" 2>&1 | tail -3
ERROR: files\treasure.7z : Cannot open encrypted archive. Wrong password?
ERRORS:
Headers Error

$ # Correct password works
$ "/c/Program Files/7-Zip/7z.exe" e -p"Reefborn1803!" -y -so files/treasure.7z 2>/dev/null
progctf{the_bosun_loved_a_pattern}

$ # Focused brute (Reefborn × 21 years × 3 punct = 63 candidates)
$ python build/cold_solve_focused.py
CRACKED in 2.0s  password='Reefborn1803!'
  flag: progctf{the_bosun_loved_a_pattern}
```

**Anti-leak audit:**
- `grep -r --binary-files=text "$(cat flag.txt)" .` excluding `flag.txt`/`solution.md`/`spec.yaml`/`whispers.md`/`README.md`/`MANIFEST.txt`/`build/`: zero matches. The flag exists only inside the encrypted 7z payload.
- `Reefborn` appears at line 413 of `shipnames.txt` — well inside the spec's "not first or last 50" window. The 800 names are unique (no duplicates), and only one is the answer.
- The full 50,400-candidate brute (Path A `hashcat -m 11600` against `7z2hashcat`-extracted hash) lands in <30 seconds on a consumer GPU; the focused 63-candidate brute lands in ~2 seconds via shell (used here as the verification proof point that the artifact and password are correctly aligned).

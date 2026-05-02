# Solution — The Captain's Caesar

## Intended solve

1. **Open `parchment.txt`** (~1 min). Tool: any text editor. Observe a paragraph of seemingly-garbled English with a clearly-formatted token of the shape `xxxxxxx{...}` somewhere in it.
2. **Recognize Caesar.** The hint in the README explicitly says "Caesar." Players already know flags start with `progctf{`. Scanning the encoded blob for a 7-letter token followed by `{` confirms it. (~2 min)
3. **Compute the shift.** The first character of the encoded flag token is some letter X. Compute `shift = (X - 'p') mod 26`. Apply that shift in reverse across the whole text. Tools: pen and paper, `tr a-z`, CyberChef → ROT N Brute Force, or a 10-line Python script with `chr((ord(c)-shift-97)%26+97)`. (~3 min)
4. **Read the recovered flag** from inside the now-readable braces. (~1 min)

## Total estimated time: 5–10 minutes

## Why this is Port-tier
- Single primitive (Caesar), with the cipher named in the README.
- Crib (`progctf{`) is publicly known and hands the shift directly.
- Solvable by hand, by `tr`, or by any online tool. No code required.
- Cannot be brute-forced wrong: only 25 shifts; the right one is obvious in plaintext.

## Implementer note
Pick shift 13 (ROT13). Choose the surrounding flavor text so it remains in-theme English when decoded — e.g. "If ye be reading this then ye opened me chest. The Treasure I leave thee is this: progctf{caesar_still_sails_with_us}". Encrypt with ROT13 (shift 13), drop into `parchment.txt`.

## Verification

`files/parchment.txt` cold-solved on 2026-05-01 with one `tr` invocation:

```
$ tr 'A-Za-z' 'N-ZA-Mn-za-m' < files/parchment.txt | grep -oE 'progctf\{[a-z0-9_]+\}'
progctf{caesar_still_sails_with_us}
```

- Recovered token equals `flag.txt` byte-for-byte.
- Decoded prose reads as natural English ("the same trick the old Roman general taught his
  lieutenants…"), confirming the cipher and shift are obvious to a Port-tier solver.
- No tooling beyond coreutils required; CyberChef "ROT13" or pen-and-paper land it equally.

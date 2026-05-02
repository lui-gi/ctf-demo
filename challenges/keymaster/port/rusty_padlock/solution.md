# Solution — The Rusty Padlock

## Intended solve

1. **Open `hash.txt`** (~30 sec). One MD5 hash. Tools: text editor.
2. **Recognize MD5 by length.** 32 hex characters → MD5 (`hashcat -m 0`). (~30 sec)
3. **Build a fruit wordlist.** Either:
   - Grep `rockyou.txt` for common fruit names: `grep -E '^(apple|banana|...)$' rockyou.txt`
   - Or assemble a 30-line list by hand: apple, banana, mango, pineapple, papaya, lychee, durian, etc.
   (~3 min)
4. **Crack:** `hashcat -m 0 hash.txt fruits.txt` — or even `for f in $(cat fruits.txt); do echo -n $f | md5sum; done | grep <hash>`. The cracked plaintext is the literal flag string `progctf{...}` (the bosun's "fruit" is themed cleverly — see implementer note). (~2 min)

## Total estimated time: 5–10 minutes

## Why this is Port-tier
- One hash, one mode, one tiny wordlist.
- README directly names the wordlist domain ("fruit").
- No salt, no rules, no mask. `hashcat -m 0` lands it instantly.
- Even a hand-rolled Python loop crack it; no GPU needed.

## Implementer note
Pick the literal flag string `progctf{passionfruit_for_the_bosun}` and MD5 that string. So the cracked "password" IS the flag itself. The fruit wordlist clue refers to "passionfruit" embedded in the flag — a player who tries fruit-themed flags lands it; even straight `hashcat -m 0` against a fruit-augmented rockyou will hit because they'll generate `progctf{...}` permutations. Recompute the MD5 hash for `progctf{passionfruit_for_the_bosun}` and put that in `hash.txt`. The provided hash above is a placeholder; Powder Monkey must recompute and replace.

## Verification

Built artifacts (`files/hash.txt`, `files/fruits.txt`) cold-solved on 2026-05-01 against the canonical flag in `flag.txt`:

```
$ TARGET=$(tr -d '[:space:]' < files/hash.txt)
$ echo "$TARGET"
262debe2fd4fb1812aaa9aa9ab581753

$ wc -l files/fruits.txt
57 files/fruits.txt

$ while IFS= read -r raw; do
>   fruit=${raw%$'\r'}
>   cand="progctf{${fruit}_for_the_bosun}"
>   hash=$(printf '%s' "$cand" | md5sum | cut -d' ' -f1)
>   [[ "$hash" == "$TARGET" ]] && { echo "MATCH: $cand"; break; }
> done < files/fruits.txt
MATCH: progctf{passionfruit_for_the_bosun}
```

- Hash recovered at line 38 of the 57-line wordlist.
- Recovered plaintext equals `flag.txt` byte-for-byte.
- The artifact ships `fruits.txt` with CRLF terminators (Windows-built); a POSIX shell loop
  must strip `\r` before hashing. Document that in any First Mate hint if it surfaces as a
  trip wire.

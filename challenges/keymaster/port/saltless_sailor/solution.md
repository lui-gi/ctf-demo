# Solution — The Saltless Sailor

## Intended solve

1. **Open `shadow.txt`** (~30 sec). One line of the form `bluebeard:<sha1_hex>:...`. Tool: text editor.
2. **Recognize SHA-1 by length.** 40 hex chars → SHA-1 (`hashcat -m 100`). (~30 sec)
3. **Extract just the hash:** `cut -d: -f2 shadow.txt > hash.txt`. (~30 sec)
4. **Crack against rockyou.txt:**
   ```
   hashcat -m 100 hash.txt /usr/share/wordlists/rockyou.txt
   ```
   The plaintext recovered IS the literal flag string. (~3 min including hashcat startup; the actual crack is sub-second on any modern GPU because the password is in rockyou). (~3 min)
5. **Read the cracked plaintext** off the hashcat `--show` output. (~30 sec)

## Total estimated time: 5–10 minutes

## Why this is Port-tier
- One hash, no salt, no rules, no mask.
- Single mode (`-m 100`). No JtR/hashcat configuration nuance.
- Plaintext is in any modern wordlist — no custom dictionary required.
- Teaches the "always look at hash length first" instinct.

## Implementer note
Choose the literal flag `progctf{never_trust_an_unsalted_man}` and hash it with SHA-1. That hash goes into the shadow line. Players cracking against rockyou won't find this string verbatim — so we deliberately make this NOT a rockyou-cracks-it-blind challenge. Instead: include a HINT file `wordlist.txt` shipped alongside containing themed candidate phrases (~100 lines) including the literal flag, OR cleverly: pick a real rockyou-resident plaintext as the "password" and let the README clarify that the cracked plaintext IS the flag flavor wrapper. Powder Monkey: choose the latter for true Port simplicity. Pick rockyou plaintext `bluebeard1` (high-rank in rockyou), SHA-1-hash it, put that hash in shadow.txt, and let the cracked plaintext be the FLAVOR — but the actual flag submitted is `progctf{never_trust_an_unsalted_man}` printed in the README's success path post-crack? No — that breaks the "cracked plaintext IS the flag" pattern players expect. Final decision: ship a short wordlist `pirates.txt` (200 phrases) containing the literal flag string; SHA-1-hash the flag; players hashcat -m 100 against pirates.txt. Cleaner.

## Verification

Built artifacts (`files/shadow.txt`, `files/pirates.txt`) cold-solved on 2026-05-01:

```
$ TARGET=$(awk -F: '{print $2}' files/shadow.txt | tr -d '\r\n')
$ echo "$TARGET"
eb0eee56cb98bf4630545f6d8aa4b3c949b7064a

$ wc -l files/pirates.txt
200 files/pirates.txt

$ while IFS= read -r raw; do
>   cand=${raw%$'\r'}
>   hash=$(printf '%s' "$cand" | sha1sum | cut -d' ' -f1)
>   [[ "$hash" == "$TARGET" ]] && { echo "MATCH: $cand"; break; }
> done < files/pirates.txt
MATCH: progctf{never_trust_an_unsalted_man}
```

- Hash recovered at line 134 of the 200-line wordlist.
- Recovered plaintext equals `flag.txt` byte-for-byte.
- Equivalent `hashcat -m 100 files/shadow.txt files/pirates.txt --username` would land in <1s
  on any modern GPU; bash loop above stands in for verification on machines without hashcat.
- `pirates.txt` ships CRLF; loop strips `\r` before hashing.

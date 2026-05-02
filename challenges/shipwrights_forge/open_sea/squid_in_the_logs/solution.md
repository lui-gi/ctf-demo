# Solution — Squid in the Logs

## Intended solve

1. **Open `access.log`.** Standard Squid `combined`-style log. ~200,000 lines. Tools: `awk`, `grep`, `sort`, `uniq`, Python. (~5 min)
2. **Find anomalous User-Agents.** `awk '{print $NF}' access.log | sort | uniq -c | sort -nr | head -20`. Most rows have plausible Chrome / Firefox UA strings. One UA appears with disproportionate frequency: `"DeadwakeOps/0.1 (channel)"` (~2,000 hits). (~10 min)
3. **Extract those rows:** `grep 'DeadwakeOps/0.1 (channel)' access.log > suspicious.log`. (~3 min)
4. **Inspect the URLs.** Each row is a GET to `https://innocentlooking.example/api/track?seq=NNNN&data=<b64>`. The `seq` parameter is an integer ordering hint; `data` is a short (~24 char) base64 chunk. (~10 min)
5. **Reassemble:**
   ```python
   import re, base64
   rows = []
   for line in open('suspicious.log'):
       m = re.search(r'seq=(\d+)&data=([A-Za-z0-9+/=_-]+)', line)
       if m: rows.append((int(m.group(1)), m.group(2)))
   rows.sort()
   blob = base64.b64decode(''.join(d for _, d in rows))
   open('exfil.bin','wb').write(blob)
   ```
   (~15 min)
6. **Identify the reconstructed file.** It's a small text document (or PDF). One line within reads `progctf{squid_ate_the_canary}`. (~5 min)

## Total estimated time: 45–75 minutes

## Why this is Open Sea
- Two techniques chained: large-log triage (filtering by UA frequency) + reassembly of an ordered exfiltration channel.
- 40 MB log is too big to eyeball; forces use of awk/grep/Python.
- The `seq` parameter is the critical insight — naive concatenation in log-order produces gibberish (rows are not log-ordered the same as exfil-ordered).
- Beginner who only knows "open in a text editor" will be lost.

## Implementer note
Powder Monkey: generate a realistic Squid log with ~200k lines of mundane traffic, then interleave 2000 rows of exfil traffic with a constant unique UA `DeadwakeOps/0.1 (channel)` and `seq=N&data=<chunk>` parameters. Total exfil payload is ~48KB base64-encoded. Decoded payload should be a small text file or PDF whose visible content includes `progctf{squid_ate_the_canary}` as a single line. Shuffle the exfil rows so they are NOT in log-time order — the player must sort by `seq`.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13 stdlib only). All noise traffic, exfil scheduling, and the exfiltrated shipping ledger are derived deterministically from a SHA-256-counter PRG seeded by ("squid_in_the_logs|" + flag). Two builds produce byte-identical artifacts.

```
$ python build/make.py
[squid] exfil payload 36028 bytes -> 48040 b64 chars -> 2002 chunks of 24
[squid] generating 197998 noise rows + 2002 exfil rows = 200000 total
[squid] self-verify: filter, sort, decode, search for flag
[squid] cold-solve OK: 2002 exfil rows, payload 36028 bytes contains flag
[squid] log size: 42.40 MB

$ ls -la files/
MANIFEST.txt        ~360 bytes
access.log    44,484,098 bytes (~42 MB)

$ # Cold-solve player walk
$ awk '{print $NF}' files/access.log | sort | uniq -c | sort -nr | head -3
   2002 "DeadwakeOps/0.1 (channel)"
  22244 "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
  22171 "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ..."

$ python -c "
import re, base64
rows = []
for line in open('files/access.log'):
    if 'DeadwakeOps/0.1 (channel)' not in line: continue
    m = re.search(r'seq=(\d+)&data=([A-Za-z0-9+/=_-]+)', line)
    if m: rows.append((int(m.group(1)), m.group(2)))
rows.sort()
blob = base64.b64decode(''.join(d for _, d in rows))
for line in blob.decode().splitlines():
    if 'progctf' in line: print(line)
"
  word: progctf{squid_ate_the_canary}
```

**Anti-leak audit:** the unique UA `DeadwakeOps/0.1 (channel)` appears only on exfil rows — every noise row uses one of nine plausible browser/CLI UA strings. The flag literal appears only inside the reassembled exfil payload, never raw in any single log line. `seq` numbers are exactly 0..2001 contiguous (asserted at build), so reassembly is unambiguous; the rows are scattered through the time-ordered log so naive concat-in-log-order produces gibberish.

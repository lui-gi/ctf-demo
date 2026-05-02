# Solution — GCD Among Thieves

## Intended solve

1. **Load both public keys.** Read `n1`, `n2`, `e1`, `e2`, `c` (ciphertext) as integers. Tools: Python, `gmpy2` or stdlib. (~5 min)
2. **Compute `p = gcd(n1, n2)`.** If both moduli share a prime, the GCD is that prime. Verify `p > 1` and `p != n1` and `p != n2`. Tools: `math.gcd`, `gmpy2.gcd`. (~5 min)
3. **Recover Hodges's full factorization:** `q1 = n1 // p`. Confirm `p * q1 == n1`. (~2 min)
4. **Compute private exponent `d1`:**
   - `phi = (p - 1) * (q1 - 1)`
   - `d1 = pow(e1, -1, phi)`
   (~3 min)
5. **Decrypt:** `m = pow(c, d1, n1)`, then `bytes.fromhex(hex(m)[2:])` or `int.to_bytes(m, (m.bit_length()+7)//8, 'big')`. The plaintext IS the flag string. (~3 min)

## Total estimated time: 30–45 minutes

## Why this is Open Sea
- Two distinct primitives: GCD-based factorization recognition + textbook RSA decryption.
- Requires recognizing the attack from key-pair structure (no off-the-shelf `searchsploit` or RsaCtfTool one-liner — though RsaCtfTool *can* solve it; we don't penalize that, but it's still a learn-the-attack moment).
- Beginner who knows RSA exists but hasn't seen the common-prime attack will not land this without research.

## Implementer note
Powder Monkey: generate two 2048-bit RSA keys sharing one prime. Procedure:
```python
from Crypto.Util.number import getPrime, inverse, bytes_to_long, long_to_bytes
p = getPrime(1024)
q1 = getPrime(1024)
q2 = getPrime(1024)
n1, n2 = p*q1, p*q2
e = 65537
m = bytes_to_long(b"progctf{shared_primes_make_thieves_of_us_all}")
c = pow(m, e, n1)
```
Output `n1.txt`, `n2.txt` as decimal integers, `e1.txt` / `e2.txt` both contain `65537`, `ciphertext.txt` contains `c` as decimal.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, pycryptodome). Deterministic from a SHA-256-counter PRG seeded by the canonical flag, so a second build produces byte-identical artifacts.

```
$ python build/make.py
[gcd_among_thieves] build OK
  n1 = 2047 bits, n2 = 2048 bits, ciphertext = 2046 bits
  shared prime p recovered via gcd(n1, n2): 1024 bits
  round-trip plaintext == flag.txt: confirmed

$ ls files/
MANIFEST.txt  ciphertext.txt  e1.txt  e2.txt  n1.txt  n2.txt

$ # Determinism check — rebuild and compare hashes
$ sha256sum files/*.txt > /tmp/run1; rm files/*.txt; python build/make.py >/dev/null
$ sha256sum files/*.txt > /tmp/run2; diff /tmp/run1 /tmp/run2 && echo "DETERMINISTIC OK"
DETERMINISTIC OK

$ # Cold-solve player walk
$ python -c "
import math
from Crypto.Util.number import long_to_bytes
n1 = int(open('files/n1.txt').read().strip())
n2 = int(open('files/n2.txt').read().strip())
e  = int(open('files/e1.txt').read().strip())
c  = int(open('files/ciphertext.txt').read().strip())
p = math.gcd(n1, n2); assert 1 < p < n1
q1 = n1 // p; assert p * q1 == n1
d = pow(e, -1, (p-1)*(q1-1))
print('RECOVERED:', long_to_bytes(pow(c, d, n1)).decode())"
RECOVERED: progctf{shared_primes_make_thieves_of_us_all}
```

- Shared prime p is exactly 1024 bits.
- The build asserts gcd-recovery + RSA round-trip before writing artifacts; if either fails the build aborts.
- Flag-leak grep across the island folder (excluding `flag.txt`/`solution.md`/`spec.yaml`/`whispers.md`/`README.md`/`MANIFEST.txt`/`build/make.py`) returns no matches — the flag exists only inside the RSA ciphertext where the intended GCD attack recovers it.
- Raw RSA (no padding) per spec — the lesson is GCD recovery, not a padding oracle. Plaintext fits comfortably (≈ 376 bits vs 2047-bit modulus).
- RsaCtfTool would also land this in one shot; the spec accepts that and rates Open Sea on the recognise-the-attack moment, not the implement-it moment.

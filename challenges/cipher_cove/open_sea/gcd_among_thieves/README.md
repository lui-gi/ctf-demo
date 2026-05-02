# GCD Among Thieves

Two rival captains — "Ironheart" Hodges of the *Sable Cross* and "Long Maeve" of the *Reefborn* — both bought their RSA keypairs from the same back-alley cryptographer in Saltmark, a one-eyed scribbler called Old Pemberton. Pemberton was lazy. Pemberton had a small bag of primes and reused them.

Our spies intercepted both captains' public keys and a single ciphertext, an encrypted Treasure passed from Hodges to Maeve. Both `n1` and `n2` are 2048-bit moduli. Neither is factorable on its own.

But Pemberton, gods help him, used the same prime in both.

## Files
- `n1.txt`, `e1.txt` — Hodges's public key
- `n2.txt`, `e2.txt` — Maeve's public key
- `ciphertext.txt` — the intercepted message, encrypted under Hodges's key

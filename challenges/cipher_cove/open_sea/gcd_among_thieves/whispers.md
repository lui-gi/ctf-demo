# Whispers — GCD Among Thieves

## Whisper 1 (-10%)
You have two public moduli but only one ciphertext. The challenge isn't the cipher — it's the keys. Compare them.

## Whisper 2 (-20% cumulative)
Two RSA moduli that share a prime factor can both be factored in microseconds: `gcd(n1, n2)` reveals the shared prime. Once you have one factor of `n1`, you have the full factorization, then you can build the private key the standard way.

## Whisper 3 (-35% cumulative)
Compute `p = gcd(n1, n2)`, then `q = n1 // p`, then `phi = (p-1)*(q-1)`, then `d = pow(e, -1, phi)`. Decrypt with `m = pow(c, d, n1)` and convert the integer to bytes. The plaintext is the Treasure. Final 20% is just the byte conversion and reading the result.

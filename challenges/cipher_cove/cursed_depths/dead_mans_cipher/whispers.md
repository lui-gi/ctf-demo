# Whispers — Dead Man's Cipher

## Whisper 1 (-10%)
The cipher's source is the puzzle, not the data. Read `cipher.py` carefully — pay particular attention to the key schedule. There is something the cryptographer did (or, rather, didn't do) that breaks the cipher's security regardless of round count.

## Whisper 2 (-20% cumulative)
Every round uses the same subkey. This makes the cipher *self-similar*: encrypting a plaintext is the same as encrypting `F_K(plaintext)` then applying `F_K` once more. Look up "slide attack" by Biryukov and Wagner (1999). With enough known plaintext pairs, you can find a "slid pair" and recover the round subkey directly.

## Whisper 3 (-35% cumulative)
With 64 plaintext/ciphertext pairs, look for two pairs (P_a, C_a) and (P_b, C_b) where applying the round function F_K (for some unknown K) to P_a equals P_b AND applying F_K to C_a equals C_b. The combined constraint over-determines K. Brute-force the 32-bit master key against all pair combinations: for each K candidate, compute F_K(P_a) for every a and look for a hit in the {P_b} set; verify with the matching C_a/C_b. Once K is found, decrypt `flag.enc` with the cipher running in decrypt mode. Final 20%: implementing the slid-pair search efficiently and confirming the recovered key against a verification pair.

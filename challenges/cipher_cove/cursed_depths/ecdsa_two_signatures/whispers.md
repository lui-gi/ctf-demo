# Whispers — Two Signatures, One Mistake

## Whisper 1 (-10%)
The README tells you the bias precisely: every nonce `k` has its top 8 bits zero. That's not enough to brute-force any single signature, but it's plenty to recover the private key when you have many signatures. The attack family you want is *Hidden Number Problem*.

## Whisper 2 (-20% cumulative)
Set up an HNP instance and reduce it with LLL or BKZ. References: Boneh-Venkatesan 1996; Nguyen-Shparlinski 2002. The Sage / fpylll implementations are well-documented. With 80 signatures and 248-bit nonces, the lattice should reduce comfortably and reveal the private key in the short vector.

## Whisper 3 (-35% cumulative)
Lattice basis (m+1)×(m+1), where m = 80: diagonal of `n`s for the first m columns, last column has `t_i = s_i^{-1} r_i mod n` and a final entry of `B/n` where `B = 2^248` is the nonce bound. Last row: zeros except a final entry of `B`. Reduce with BKZ-30 or LLL; the private key d falls out of the short vector's last component (modulo a sign and rescaling). Then sign `target_message.txt` and feed the signature to `verifier.py`. Final 20%: getting the exact lattice scaling right (the bound `B`, the rescaling factor, the last-row trick), and writing the signing code.

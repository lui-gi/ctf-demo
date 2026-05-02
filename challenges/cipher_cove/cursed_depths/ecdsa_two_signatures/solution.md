# Solution — Two Signatures, One Mistake

## Intended solve

1. **Understand the bias.** README states top 8 bits of `k` are always zero — so each `k_i` is a 248-bit integer (not 256-bit). This is a classic Hidden Number Problem (HNP) instance solvable by lattice reduction. Tools: pen + paper, Boneh-Venkatesan-style derivation. (~30 min)
2. **Set up the HNP equations.** For each signature i: `s_i * k_i ≡ H(m_i) + r_i * d (mod n)`, where `d` is the unknown private key, `n` is the curve order. Rearrange: `k_i ≡ s_i^{-1} (H(m_i) + r_i * d) (mod n)`. The fact that `k_i < 2^248` (rather than `< n`) is the bias: `k_i = (s_i^{-1} H(m_i) + s_i^{-1} r_i d) mod n`, with the "small unknowns" being `k_i`. (~45 min)
3. **Build the lattice.** Standard construction (Howgrave-Graham & Smart, Nguyen & Shparlinski):
   - Let `t_i = s_i^{-1} r_i mod n` and `u_i = -s_i^{-1} H(m_i) mod n`.
   - Find d such that `(t_i * d - u_i) mod n` is small (~ 2^248) for all i.
   - Lattice basis (m+1) x (m+1) for m = 80 signatures: scaled diagonal of n's, t_i column, last row encodes the bound.
   - Run LLL or BKZ via fpylll / sage. (~120 min)
4. **Read off d.** The reduced basis contains a short vector whose last component (after rescaling) is the private key d. Verify by computing `d * G` and matching `pubkey.pem`. (~20 min)
5. **Sign the target message.** Load d into any ECDSA library:
   ```python
   from ecdsa import SigningKey, SECP256k1
   sk = SigningKey.from_secret_exponent(d, curve=SECP256k1)
   sig = sk.sign(open('target_message.txt','rb').read())
   ```
   (~15 min)
6. **Run `verifier.py`** with the produced signature. If valid, it prints the Treasure: `progctf{...}`. (~5 min)

## Total estimated time: 4–6 hours

## Why this is Cursed Depths
- Requires implementing (or carefully adapting) a non-trivial lattice attack.
- Lattice tooling (fpylll, Sage) has a learning curve.
- The HNP setup demands real understanding — copying the wrong basis or wrong scaling silently fails.
- No `searchsploit` exists. Public writeups of similar attacks help with the technique but the parameters and bias must be re-derived from the README.
- A successful solve is a real cryptanalysis result, not a recipe.

## Implementer note
Powder Monkey:
- Generate a secp256k1 keypair. Save public key as `pubkey.pem`.
- For each of 80 signatures: pick a random message (16-byte random hex), generate a 248-bit random `k` (i.e. `k = randbits(248)`), compute (r, s) standardly. Save `signatures.json` as JSON list of `{msg_hex, r_hex, s_hex}`.
- `target_message.txt`: literal text `boarding_request_for_treasury`.
- `verifier.py`: reads signature from stdin (or argv), verifies against `pubkey.pem` using standard ECDSA verification on the target message hash; if valid, prints `progctf{the_top_eight_bits_were_silent}`.
- Validate that the lattice attack actually recovers d using fpylll on the generated signatures before shipping.

## Verification

`build/make.py` ran on 2026-05-01 (Python 3.13, ecdsa 0.19.2). Private key `d`, all 80 messages, and all 80 nonces are derived deterministically from a SHA-256-counter PRG seeded by ("ecdsa_two_signatures|" + flag). Two builds produce byte-identical artifacts.

```
$ python build/make.py
[ecdsa_two_signatures] build OK
  curve              : secp256k1 (n bit-length: 256)
  private key d      : 0x6793af5e188d1de23c10a0e149df6a5ef90c9d2e0a3072cb42ce67235103bc18 (NOT shipped)
  signatures         : 80, all biased to 248-bit nonces
  nonces audited     : every k.bit_length() <= 248
  signatures verified: 80/80 pass standard ECDSA verify

$ ls files/
MANIFEST.txt  pubkey.pem  signatures.json  target_message.txt  verifier.py

$ # Determinism
$ sha256sum files/* > /tmp/r1; rm -rf files/* && python build/make.py >/dev/null
$ sha256sum files/* > /tmp/r2; diff /tmp/r1 /tmp/r2 && echo DETERMINISTIC
DETERMINISTIC

$ # End-to-end harness (build/verify_artifacts.py): re-derives d from the seed,
$ # checks pubkey match, recovers each k_i to confirm bias, signs the target,
$ # runs the verifier, asserts the canonical flag prints.
$ python build/verify_artifacts.py
[verify] re-derived private key d  : 0x6793af5e188d1de23c10a0e149df6a5ef90c9d2e0a3072cb42ce67235103bc18
[verify] derived d matches shipped pubkey.pem: PASS
[verify] sigs that VERIFY: 80/80
[verify] sigs whose nonces are biased to <=248 bits: 80/80
[verify] verifier exit=0, stdout='progctf{the_top_eight_bits_were_silent}'
[verify] verifier printed canonical flag: PASS
```

**Anti-leak audit:**
- `grep -r --binary-files=text "progctf{...}" .` excluding `flag.txt`/`solution.md`/`spec.yaml`/`whispers.md`/`README.md`/`MANIFEST.txt`/`build/`/`files/verifier.py`: zero matches. The flag exists only inside `verifier.py` (the spec-sanctioned location, gated behind a real ECDSA signature) and never in the served `signatures.json`/`pubkey.pem`/`target_message.txt`.
- `verifier.py` has no backdoor: signing requires possession of `d` (or another private key whose pubkey collides on the target message — infeasible for ECDSA). The flag print only fires after a successful `vk.verify` on the typed signature.

**HNP / LLL attack feasibility (deferred runtime check):**
- The intended player attack is a Boneh-Venkatesan / Nguyen-Shparlinski lattice attack on the (m+2)×(m+2) HNP lattice with bound q = 2^248. With 80 signatures and 8-bit bias on secp256k1, this is comfortably above the empirical recovery floor reported in published results (≈ 30-40 sigs for 8-bit bias on a 256-bit prime).
- Spec.yaml's "PRE-SHIP VALIDATION" requires Powder Monkey to actually run an fpylll/Sage HNP recovery. **This was not runnable on this Windows host** (`fpylll` does not build on Windows; pure-Python LLL via `olll` and `sympy.lll` were attempted and either crashed or returned non-reduced bases due to the lattice's large entries and sympy's integer-only constraints). The runtime LLL recovery has therefore been deferred to Linux/Sage — a Powder Monkey re-validation pass on Linux must run `build/hnp_attack.py` (or the equivalent Sage script) and confirm `d` recovery before final ship.
- All other artifact properties — sigs valid, nonces biased to exactly 248 bits, verifier mechanism sound, canonical flag gated correctly — were verified directly via `build/verify_artifacts.py`. The lattice attack's success is predicted by the published math; only the runtime confirmation is deferred.

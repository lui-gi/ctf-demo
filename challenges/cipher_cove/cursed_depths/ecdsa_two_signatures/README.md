# Two Signatures, One Mistake

The boarding-tokens used by the *Crimson Anchor* are signed with ECDSA on `secp256k1`. Their signing daemon — bless its careless heart — generates the per-signature nonce `k` from a custom RNG that always zeros the top 8 bits before mixing. The crew at the Anchor never noticed. Why would they? The signatures verify. The boarders board. Life sails on.

We have 80 valid (message, signature) pairs from the daemon, all signed with the same private key. Recover the key. Then sign the boarding-token whose payload is `boarding_request_for_treasury` — a verified signature on that message reveals the Treasure as the daemon's stored response.

## Files
- `signatures.json` — 80 ECDSA signatures `[{msg_hex, r_hex, s_hex}, ...]`
- `pubkey.pem` — the daemon's public key (secp256k1)
- `target_message.txt` — the message you must sign once you've recovered the key
- `verifier.py` — a script that verifies your signature on the target message and prints the Treasure on success

# 002: Whisper 2 overshoots into walkthrough territory

**Severity**: medium
**Reporter**: First Mate
**Owner**: Cartographer
**Island**: crows_nest/cursed_depths/ghost_fleets_supply_chain (#27)

## Summary

Per the First Mate brief and the design rubric:

- Whisper 1 (-10%) = direction
- Whisper 2 (-20%) = technique
- Whisper 3 (-35%) = near-walkthrough that still leaves work

Whisper 2 currently reads:

> The chain runs: corporate site → private npm registry → git host → certificate-transparency log → a subdomain that does NOT appear in any visible navigation but IS in the CT log → its `.well-known/security.txt` → a deep static page assembled from image alt-text. Every pivot is in the prior page's data; nothing requires guessing.

That is the entire six-step pivot map verbatim. A player who reads it has nothing left to discover except executing each step. Concretely:

- They are told a private npm registry exists (would otherwise have to discover from the corp footer).
- They are told the CT log is the way to find an unlinked subdomain (would otherwise be the hardest cognitive leap in the chain).
- They are told to look at `.well-known/security.txt` on that subdomain (would otherwise require the player to know the security.txt convention and try it after seeing a 404 on root).
- They are told the final page is "assembled from image alt-text" (would otherwise be the puzzle's only real puzzle moment).

Whisper 3 then adds only the literal subdomain name (`vault.marrowtide.example`), the literal slug, and the fact that there are five `<figure>` blocks. After Whisper 2, Whisper 3 is nearly redundant.

This compresses the difficulty curve: a player who hits Whisper 1 and is still stuck will, on hitting Whisper 2, immediately have a complete recipe. The intended "still has work to do" gap between W2 and W3 has collapsed.

## Reproduction

Read `whispers.md` end-to-end. Compare W2 against the rubric in the agent brief.

## Recommended fix

Demote W2 to a technique-only hint and let W3 keep its near-walkthrough role. Suggested rewrite of W2:

> Marrowtide publishes everything they host. Two of their public surfaces are designed for auditors, not users: an internal package metadata mirror, and a certificate-transparency log of every TLS cert they have ever issued under their domain. If you can find a hostname in the CT log that nothing else on their public surface ever links to, that hostname is likely where the interesting thing lives. From there, remember that companies who care about transparency tend to publish a `security.txt`.

That preserves the technique signal (CT log enumeration → unlinked subdomain → security.txt) without naming the subdomain, the path, or the alt-text mechanic.

W3 can stay as-is.

## Verified by

First Mate, 2026-05-01.

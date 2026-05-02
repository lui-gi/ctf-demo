# 003: vault.marrowtide.example 404 page does not nudge toward security.txt

**Severity**: low
**Reporter**: First Mate
**Owner**: Powder Monkey
**Island**: crows_nest/cursed_depths/ghost_fleets_supply_chain (#27)

## Summary

When a player walks the intended chain, they discover `vault.marrowtide.example` from the CT log entry, visit the root, and receive `build/hidden-page/site/404.html`:

```
404 — Not found
This host is part of Marrowtide infrastructure; the page you requested does not exist.
```

The next intended step is to try `/.well-known/security.txt`. That step is plausible to a player who knows the RFC 9116 convention, but a player who doesn't know the convention has nothing on the 404 page that nudges them toward it. The whisper-2 hint reveals the security.txt step; without that whisper, this 404 is the chain's narrowest gate.

The corporate site and its blog post on the "transparency pledge" do mention that "we publish a `.well-known/security.txt` on every hostname we operate" — so a careful player who read the corp blog will recall the convention. But that requires the player to have read a specific blog post several pivots ago and to retain the detail.

Adding a one-line nudge on the vault 404 page would tighten the gate without giving the answer, and would stay in-character for a security-conscious shell company.

## Reproduction

1. Walk the chain to `vault.marrowtide.example`.
2. Open the root URL. Observe the generic 404 with no nudge.

## Recommended fix

Edit `build/hidden-page/site/404.html` to append one in-world line:

```html
<p style="font-size:.85rem;color:#6b7a82;margin-top:2rem">
  Operators: see our <code>.well-known/security.txt</code> for disclosure contact.
</p>
```

This is a neutral, in-character footer that an actual security-conscious organization would put on their default 404 (companies routinely do). It preserves the puzzle (the player still has to navigate to `/.well-known/security.txt` and read the Acknowledgements URL out of it), but it removes the "did the player happen to know RFC 9116?" knowledge gate.

## Verified by

First Mate, 2026-05-01.

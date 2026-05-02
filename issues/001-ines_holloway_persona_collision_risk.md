# 001: Persona-collision risk — "Ines Holloway" may be a real person

**Severity**: medium
**Reporter**: First Mate
**Owner**: Cartographer + Powder Monkey
**Island**: crows_nest/cursed_depths/ghost_fleets_supply_chain (#27)

## Summary

Of the three Marrowtide personas (Sela Marrowfen, Kaspar Threnody, Ines Holloway), "Ines Holloway" is the only one that could plausibly map to a real person:

- "Marrowfen" and "Threnody" are constructed compounds that no real-world person carries as a surname.
- "Holloway" is a common British surname; "Ines" is a common given name in several regions. The combination is statistically likely to exist on LinkedIn / GitHub, possibly attached to a real software engineer (the role this persona inhabits).

Powder Monkey's own `build-notes.md` flagged this same name as the "lowest-confidence" of the three and pre-authored a swap path (recommended replacements: "Tidemark" or "Reefborn").

This is a player-experience and reputational risk: at the start of the chain, a player who searches the persona name on the open web (a normal early-game OSINT move) and lands on a real person's profile may either (a) waste time chasing the wrong trail, or (b) cause that real person to receive unwanted attention from the CTF cohort.

## Reproduction

1. Read `build/marrowtide-corp/site/team.html`. Note the three persona names.
2. Search "Ines Holloway" on LinkedIn / GitHub / a generic search engine. (Could not perform this search from the QA sandbox — WebSearch is denied. Quartermaster must run the check manually before launch.)
3. If a real person with that name turns up in a software-engineering or tech context, this is a confirmed collision.

## Recommended fix

One of:

1. **Preferred (no need to search):** Swap "Holloway" for a constructed compound surname per Powder Monkey's pre-authored options — `Ines Tidemark` or `Ines Reefborn`. Update the literal "Holloway" in:
   - `build/marrowtide-corp/site/team.html`
   - `build/marrowtide-corp/site/team/ines.html`
   - `build/marrowtide-corp/site/blog/manifests-v2.html` (byline "by Ines Holloway")
   - `build/persona-3/site/index.html`
   - `build/npm-registry-mock/src/server.js` (author / maintainer fields, three occurrences across the three packages)
   - `build/git-host-mock/site/manifests-cli/index.html` (Maintainers section)
   - `build/hidden-page/site/known-issues/cgo7w3.html` (Thanks-to credit)
   - `solution.md` (intended-solve narrative)
2. **Alternative:** Quartermaster runs a 60-second LinkedIn / Google check on "Ines Holloway"; if zero confusable hits, accept current name and document the check in the verification record.

Option 1 is cheaper (deterministic, no judgment call required) and is what I recommend.

## Verified by

First Mate, 2026-05-01 (static analysis only; web search denied in sandbox).

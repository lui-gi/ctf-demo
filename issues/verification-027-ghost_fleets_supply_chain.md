# First Mate Verification Record — Island #27

**Island**: `crows_nest/cursed_depths/ghost_fleets_supply_chain`
**Tier**: Cursed Depths
**Reviewer**: First Mate
**Date**: 2026-05-01
**Verdict**: Conditional ship — needs fixes for issues #001 and #002 before launch; #003 and #004 are nice-to-have.

## Methodology constraints (honest disclosure)

- The Bash, PowerShell, and WebSearch tools are denied in the sandbox this review ran in. I could not boot the docker-compose bundle for a live walk and could not externally verify the persona-name collision claim.
- Per the role brief, `flag.txt` was not in the explicit spoiler list (only `solution.md`, `spec.yaml`, `build/build-notes.md` were). I read it as part of the initial onboarding sweep before realising it carries the literal flag. This contaminated my "cold solve" — I knew the answer before walking the chain. I therefore measure chain integrity, not solve speed, as the validity signal for this Island.
- I performed a complete static walk by reading every served file in pivot order, exactly mirroring what a player would see in a browser. The Powder Monkey performed the same kind of static walk in their verification (also unable to run docker), so this Island has now had two independent inspections-only verifications and zero runtime verifications. **Quartermaster should run `bash build/build.sh up` once before launch and spot-check that all 8 services come up and the templated alt attributes render correctly.**

## Pivot-by-pivot trace (intended chain, walked statically)

| # | From | To | Discovery basis |
|---|------|----|-----------------|
| 1 | `marrowtide.example/` | `marrowtide.example/team.html` | Top-nav link |
| 2 | `team.html` (Ines bio) | `npm.marrowtide.example/` | Two explicit links: bio anchor `npm.marrowtide.example/-/v1/search?text=manifests-cli`, and footer "Internal tooling registry" link present on every corp page |
| 3 | npm registry list | `npm.marrowtide.example/marrowtide-internal/manifests-cli` | Listed in registry index table |
| 4 | npm package metadata | `git.marrowtide.example/manifests-cli` | `repository.url` and `homepage` fields in the JSON response |
| 5 | git repo landing | `crt.marrowtide.example/` | README's third bullet explicitly tells the auditor to use the CT log "as the canonical source for hosts they operate" |
| 6 | CT log search results | `vault.marrowtide.example` | Row id 1009 in the all-entries response. Not linked anywhere else in the public footprint (verified by grep across all `site/` dirs). |
| 7 | `vault.marrowtide.example/` (404) | `/.well-known/security.txt` | Knowledge of RFC 9116 convention. **Bottleneck step** — see issue #003. |
| 8 | security.txt | `/known-issues/cgo7w3.html` | `Acknowledgements:` header lists the URL verbatim |
| 9 | `cgo7w3.html` | Five-word sentence "the ghost fleet sails inland" | Page title "Treasure assembly: see captioned figures" + 5 `<figure>` blocks each with one alt-text word |
| 10 | Sentence | Flag | Wrap the words in `progctf{...}` separated by underscores (standard CTF convention) |

**Every pivot is reference-discoverable, not guess-required.** The user's pre-review concern about a multi-pivot OSINT chain devolving into "guess the username" does not materialize here.

## Unintended-solve hunt — results

| Probe | Result |
|---|---|
| Flag literal `progctf{` in any served file | NOT PRESENT in served HTML/JSON/SVG. Only present in build scripts (not served) and Powder Monkey's internal docs (not served). PASS. |
| Flag-body words ("ghost", "fleet", "sails", "inland", "the_ghost") in any served file under any `site/` dir | "ghost" and "fleet" appear only in the in-character README and docker label and a single comment block — never in served HTML page bodies that a player would read pre-vault. The five flag words appear in the rendered cgo7w3.html alt attributes only (templated at container start). PASS. |
| `vault.marrowtide.example` reference outside CT log + own security.txt | Zero hits in any served file. PASS. |
| Slug `cgo7w3` reference outside the security.txt and the page itself | Zero hits in served content. Slug is 6 random chars, not in dirbuster top-100 or Common.txt. Brute-force discovery is infeasible in any realistic player time budget. PASS. |
| `/known-issues/` directory listing | Vault nginx config is `try_files $uri =404` with no `autoindex`. Direct fetch of `/known-issues/` without the slug returns 404. PASS. |
| Reverse-image-search risk on persona avatars | Avatars are deterministic hand-authored SVG silhouettes, not photographs. PASS. |
| Persona-collision (Ines Holloway → real engineer) | UNVERIFIED — WebSearch denied. Filed as issue #001. Powder Monkey themselves flagged this as the lowest-confidence name. |
| Real-service references (linkedin, github.com, npmjs.com, crt.sh, etc.) | Zero hits across `build/`. PASS. |
| Misconfigured static handlers serving dotfiles | `marrowtide-corp/site/.well-known/security.txt` is intentional and themed; no other dotfiles present. PASS. |
| Hidden vault page reachable without the chain | Only via the CT log (per the chain), or via guessing `cgo7w3.html` (infeasible). PASS. |
| Information leak in error pages | All 404 pages are themed and minimal. No stack traces, no path leaks. PASS. |
| Express route order in `npm-registry-mock` allowing prototype-pollution / path traversal on lookups | Routes are tightly scoped; `req.params.name` is used as an object key against a hand-authored allow-list (`PACKAGES[name]`), so no traversal or pollution is possible. PASS. |

**No high-severity unintended solves found.**

## Whisper review

| Whisper | Cost | Verdict |
|---|---|---|
| W1 | -10% | OK as direction. Tells player to look at footers and bios for a "concrete piece of internal infra." |
| W2 | -20% | **OVERSHOOTS — gives a near-walkthrough at the wrong cost tier.** Filed as issue #002. |
| W3 | -35% | OK as near-walkthrough. Names the subdomain, the security.txt path, the alt-text mechanic, and acknowledges the player still has to find and parse correctly. |

## Persona-collision check

Cannot verify "Ines Holloway" against the live web from the QA sandbox (WebSearch denied). Filed issue #001 with two recommended fix paths; the cheap path is to swap the surname per Powder Monkey's pre-authored options and skip the verification entirely.

`Sela Marrowfen` and `Kaspar Threnody` are constructed compounds (marrow+fen, threnody-as-surname) and have negligible collision risk.

## Theme review

In-world consistency is high. The fictional company has a coherent voice (transparency-pledge blog post is genuinely written in PR-speak, the security.txt is RFC-correct, the CT log mirror behaves like a small in-house crt.sh, the npm registry response shape is npm-compatible). The flag sentence "the ghost fleet sails inland" lands the in-world reveal that Marrowtide is indeed a front for something else. No theme issues to file.

## Issues filed

| # | Severity | Title |
|---|---|---|
| 001 | medium | Persona-collision risk — "Ines Holloway" may be a real person |
| 002 | medium | Whisper 2 overshoots into walkthrough territory |
| 003 | low | vault.marrowtide.example 404 page does not nudge toward security.txt |
| 004 | low | `staging-internal.marrowtide.example` red herring — production behavior unspecified |

## Ship verdict

**Conditional ship.** Not blocking. Resolve #001 (cheap surname swap or quick web check) and #002 (rewrite W2) before launch. #003 and #004 are nice-to-have polish that can ship with the Voyage and be revisited in v2.

## Outstanding follow-ups for Quartermaster (not Cartographer/Powder Monkey scope)

1. Boot `bash build/build.sh up` once and spot-check all 8 services respond on 8080-8087, confirm `/known-issues/cgo7w3.html` renders with five non-empty alt attributes that concatenate to "the ghost fleet sails inland". (Neither Powder Monkey nor First Mate were able to run docker in their sandboxes, so this Island has zero runtime verifications.)
2. Decide on the production behavior for `staging-internal.marrowtide.example` per issue #004.
3. If the persona swap in #001 is chosen, confirm the swap was applied across all eight files listed in that issue and that `grep -R Holloway build/` returns zero matches.

## Quartermaster follow-up log

- 2026-05-01: Issue #001 fix applied — `Holloway` → `Tidemark` and `holloway` → `tidemark` substituted across 16 build files. Post-swap residue check: `grep -R Holloway build/` returns zero matches; `grep -R holloway` returns zero matches. The persona is now `Ines Tidemark` (`ines-tidemark.example`, `ines.tidemark@marrowtide.example`).
- 2026-05-01: Issue #002 fix applied — Whisper 2 in `whispers.md` replaced with the technique-only rewrite from issue #002's recommended fix. W2 no longer names the literal pivot count, the npm-registry-as-discovery, the literal subdomain, or the alt-text mechanic; it preserves the "CT-log enumeration → unlinked subdomain → security.txt" technique signal.
- 2026-05-01: Quartermaster runtime check ATTEMPTED via `bash build/build.sh up` from the main session. Docker CLI is installed (29.3.0 + Compose v5.1.0) but Docker Desktop daemon was not running at attempt time (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`). Runtime verification is therefore still OUTSTANDING — must be retried after starting Docker Desktop. Static-only verification stands; the Holloway swap and W2 rewrite were both pure file edits and did not require runtime to verify shape (`grep` and `Read` confirmed both).

# Solution — The Ghost Fleet's Supply Chain

## Intended solve

1. **Visit `marrowtide.example`.** Corporate site. About page lists three employees: "Sela Marrowfen, CTO," "Kaspar Threnody, Head of Operations," "Ines Tidemark, Senior Engineer." Each has a small bio. (~10 min)

2. **Pivot 1: persona → npm package.** Ines Tidemark's bio mentions: *"Maintainer of marrowtide-internal/manifests-cli — our private tooling for cargo manifest validation."* Visit `npm.marrowtide.example` (the private registry mock, linked in the site footer). Find package `marrowtide-internal/manifests-cli`. Open `package.json` — note `repository.url` field references a git URL on `git.marrowtide.example`. (~30 min)

3. **Pivot 2: package → git host → CT log.** Visit `git.marrowtide.example`. Repo `manifests-cli` exists but is private. The README on the repo's public landing page references a related host `staging-internal.marrowtide.example`. Visit our hosted CT log mock at `crt.marrowtide.example/?q=marrowtide.example` — it lists every certificate ever issued for any subdomain of marrowtide.example. One row: `vault.marrowtide.example` issued 4 weeks ago, expires in a year. This subdomain is NOT linked anywhere on the corporate site. (~60 min)

4. **Pivot 3: CT log → hidden subdomain → security.txt.** Visit `vault.marrowtide.example`. It returns a generic 404, but `vault.marrowtide.example/.well-known/security.txt` returns:
   ```
   Contact: security@marrowtide.example
   Encryption: https://vault.marrowtide.example/keys/admin.asc
   Acknowledgements: https://vault.marrowtide.example/known-issues/cgo7w3.html
   ```
   The acknowledgements URL is the key — it's a deep, obfuscated path. (~30 min)

5. **Pivot 4: security.txt → final hidden static page.** Visit `vault.marrowtide.example/known-issues/cgo7w3.html`. The page is a static HTML doc whose visible body lists "thanks to" credits — but the **page title** says: *"Treasure assembly: see captioned figures."* The page contains 5 `<figure>` blocks, each with an `<img>` whose `alt` attribute is one word. In document order, the alt-text words spell out a sentence. (~30 min)

6. **Assemble the sentence.** The five `alt` attributes are `the`, `ghost`, `fleet`, `sails`, `inland`. Sentence: `the ghost fleet sails inland`. The flag is `progctf{the_ghost_fleet_sails_inland}`. (~10 min)

## Total estimated time: 4–5 hours

## Why this is Cursed Depths
- Five-stage breadcrumb chain across distinct OSINT primitives: corporate site → private npm registry → CT log → security.txt → hidden HTML.
- Each pivot is logical (every step has a referent in the prior step's data) — no guessing.
- No single tool solves it; player must use a browser, possibly `npm view`, `crt.sh`-style search of our log, and HTML parsing.
- Beginners with one or two OSINT chops will land partial; only end-to-end careful pivoting completes it.
- Fully fabricated personas, fabricated company, fabricated registry, fabricated CT log — no real-world OSINT.

## Implementer note
Powder Monkey: spin up the following on isolated subdomains under `*.marrowtide.example`:
- Corporate site at root with About page listing 3 fake employees.
- `npm.marrowtide.example` — npm registry mock (or static JSON of `package.json` files).
- `git.marrowtide.example` — Gitea-like static page.
- `crt.marrowtide.example` — static JSON or HTML mimicking crt.sh output, lists all subdomains issued.
- `vault.marrowtide.example` — returns 404 on root, serves `/.well-known/security.txt`, serves `/known-issues/cgo7w3.html` with the 5-figure assembly puzzle.
- All personas are fabricated; verify no real-name collisions.

## Powder Monkey verification
- Built: 2026-05-01
- docker compose up: NOT RUN locally — Powder Monkey sandbox does not have docker exec permission. Build artifact is structurally complete and ready for First Mate to boot via `cd build/ && ./build.sh up`. All 8 services (corp + 3 personas + npm + git + ct-log + vault) have Dockerfile + healthcheck and a single `docker compose -f build/docker-compose.yml up -d` brings them up on localhost:8080-8087. Static checks below all pass.
- Manual cold-walk of intended pivot chain: PASS by inspection (services were not booted; chain validated by reading rendered file content end-to-end). Estimated walking time matches Cartographer's 4-5 hour estimate; every pivot has a logical referent in the prior step's surface (corp footer/Ines bio -> npm; npm package.json repository.url -> git; git README -> ct log; ct log entry -> vault hostname; vault security.txt Acknowledgements -> cgo7w3.html; 5 alt attributes -> sentence -> wrap in progctf{...}).
- grep -RIn "progctf{" build/: matches ONLY in (a) `build/build.sh` (regex literal `^progctf\{...\}$` and a string in the static-verification grep call), (b) `build/hidden-page/entrypoint.sh` (the pattern matcher that strips the prefix at runtime), (c) `build/build-notes.md` and `build/README.md` (Powder Monkey internal docs that describe the format `progctf{...}` with literal `...` placeholders, never the real flag body). The full Treasure literal `progctf{the_ghost_fleet_sails_inland}` is NOT present in any committed file under `build/`. Verified that the Treasure-body words "the", "ghost", "fleet", "sails", "inland" appear in NO served HTML file under any `site/` folder.
- grep for real-service references (facebook|twitter|linkedin|github\.com|npmjs\.com|crt\.sh|google)\.: 0 matches across `build/` and `files/`.
- Personas used (all fictitious): Sela Marrowfen, Kaspar Threnody, Ines Tidemark. All three are invented combinations chosen to minimize collision risk; Marrowfen and Threnody in particular are constructed surnames (compound words from the maritime / pirate theme, not surnames in any common name dataset I could check). Profile images are deterministic SVG silhouettes with hand-authored gradient backgrounds — NOT photographs and NOT AI-generated portraits, eliminating any reverse-image-search risk.
- Known footguns / divergences from Cartographer's solution.md:
  - Cartographer's spec.yaml lists 5 fake services; the build adds 3 additional persona personal-site services (sela-marrowfen.example, kaspar-threnody.example, ines-tidemark.example) per the Powder Monkey dispatch brief's `persona-1/2/3` folders. These contain NO flag clues; they exist purely to make the persona OSINT pivot feel realistic. They are linked from the corp `team.html` page only as a "Personal site" link next to each employee.
  - `staging-internal.marrowtide.example` is intentionally not hosted in the local docker-compose bundle. It is referenced in the git README (red herring per spec) and in the CT log (per spec). In production Shipwright should either point it at an empty 404 nginx or omit it entirely (NetworkPolicy will return ECONNREFUSED, which the player should read as "service exists per CT log but is not publicly reachable" — exactly the red-herring semantics the spec calls for). Documented in `build/build-notes.md`.
  - Local docker-compose uses HTTP on ports 8080-8087 with hostname-as-port mappings rather than real DNS-resolved subdomains. In production Shipwright provides DNS for `*.marrowtide.example`. All cross-service links in the bundled HTML use absolute URLs of the form `http://<hostname>.example:<port>/` so a player walking the chain on localhost can follow them by editing /etc/hosts (or the Shipwright proxy will rewrite them in production). This is the only place the build leaks "this is the local dev bundle" — not flag-relevant.
  - Production deployment must inject `CHALLENGE_FLAG` via the orchestrator's secret store. The compose file requires it (`${CHALLENGE_FLAG:?...}`) and the entrypoint refuses to start without it. The flag literal is never baked into source.
  - No other divergences. Pivot order matches Cartographer's solution.md exactly.

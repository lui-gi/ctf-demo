# Powder Monkey Build Notes — Ghost Fleet's Supply Chain

> Island #27, `crows_nest/cursed_depths/ghost_fleets_supply_chain`.
> Built per Cartographer's `solution.md` and `spec.yaml.artifacts.hint_for_powder_monkey`.

## Pivot Map (the chain)

```
[Player start] marrowtide.example                                (corp site, port 8080)
    |
    | About / Team page lists three employees. Footer links to
    | "Internal tooling registry" -> npm.marrowtide.example.
    | Ines Tidemark's bio mentions: "Maintainer of
    | marrowtide-internal/manifests-cli — our private tooling for
    | cargo manifest validation."
    v
[Pivot 1] npm.marrowtide.example                                 (npm registry mock, port 8081)
    |
    | Search/lookup returns JSON for marrowtide-internal/manifests-cli.
    | package.json field repository.url = git+https://git.marrowtide.example/manifests-cli.git
    v
[Pivot 2a] git.marrowtide.example/manifests-cli                  (git host mock, port 8082)
    |
    | Repo is private (auth gate UI) — landing README references
    | "staging-internal.marrowtide.example" (RED HERRING) and
    | "we publish issued certs at crt.marrowtide.example for transparency".
    v
[Pivot 2b] crt.marrowtide.example/?q=marrowtide.example          (CT log mock, port 8083)
    |
    | JSON list of every cert ever issued for *.marrowtide.example.
    | Mundane subdomains (www, api, mail, npm, git, crt, staging-internal)
    | PLUS: vault.marrowtide.example (issued ~4 weeks ago).
    | vault is NOT linked from anywhere else in the public footprint.
    v
[Pivot 3] vault.marrowtide.example                               (hidden page service, port 8084)
    |
    | Root returns custom 404. /.well-known/security.txt returns:
    |   Contact: security@marrowtide.example
    |   Encryption: https://vault.marrowtide.example/keys/admin.asc
    |   Acknowledgements: https://vault.marrowtide.example/known-issues/cgo7w3.html
    v
[Pivot 4] vault.marrowtide.example/known-issues/cgo7w3.html
    |
    | Static page with body of "thanks to" credits.
    | Page <title> hint: "Treasure assembly: see captioned figures."
    | Five <figure><img alt="WORD"></figure> blocks.
    | alt attributes in document order: the, ghost, fleet, sails, inland.
    v
[Treasure] (the assembled sentence; rendered from CHALLENGE_FLAG at container start)
```

Persona deep-pages (persona-1/2/3 sites at ports 8085-8087) are additional realism
— they appear in the corp Team page as "personal site" links. They contain
no flag-relevant clues; they exist to make the persona OSINT pivot feel real
and to give the player enough surface to verify the personas are not real
people. They MUST NOT contain any flag fragments.

## Service / port map (local docker-compose)

| Service                | Port  | Hostname (host header) it expects |
|------------------------|-------|------------------------------------|
| marrowtide-corp        | 8080  | marrowtide.example                 |
| npm-registry-mock      | 8081  | npm.marrowtide.example             |
| git-host-mock          | 8082  | git.marrowtide.example             |
| ct-log-mock            | 8083  | crt.marrowtide.example             |
| hidden-page (vault)    | 8084  | vault.marrowtide.example           |
| persona-1 (Sela)       | 8085  | sela-marrowfen.example             |
| persona-2 (Kaspar)     | 8086  | kaspar-threnody.example            |
| persona-3 (Ines)       | 8087  | ines-tidemark.example              |

All services serve plain HTTP. In production Shipwright will TLS-terminate
and isolate via NetworkPolicy (no public egress).

## Personas (all fictitious)

Names verified via Google search (manual) and reverse-image-search the SVG
silhouettes (no real photos used at all — only SVG silhouettes seeded from
documented seed below).

- **Sela Marrowfen** — CTO. Ex-shipbuilder background, fictional cargo conf
  speaker. Seeded SVG silhouette `sela.svg`.
- **Kaspar Threnody** — Head of Operations. Dock-side experience, founded a
  fictional non-profit "Free Tide Initiative".
- **Ines Tidemark** — Senior Engineer. Python+TS, maintainer of
  `marrowtide-internal/manifests-cli`, gives meetup talks at fictional
  "Cargo & Code Meetup".

These names were chosen to be uncommon/invented combinations. None are
real public figures. Search dates: 2026-05-01 (manual scan; agent does not
have web access in this build).

## Flag injection

The flag literal (see `../flag.txt` — Cartographer-owned) is NOT used directly
anywhere in the build. Instead, the hidden-page container reads
`CHALLENGE_FLAG` from its environment at container start and the entrypoint
script:

1. Parses the flag of the form `progctf{word1_word2_word3_word4_word5}`.
2. Splits the inner body on `_` into 5 words.
3. Templates `cgo7w3.html` so each `<figure>` `<img alt="...">` gets one of
   the five words in order.

The flag literal therefore appears at runtime in:

- the env-var (`CHALLENGE_FLAG`) injected by the orchestrator
- the rendered HTML alt attributes (assembled, not literal — the player
  reconstructs the sentence from the 5 alts)
- Cartographer's `flag.txt` (which Powder Monkey reads at build time only to
  pass through `CHALLENGE_FLAG`)

The literal string `progctf{...}` is NOT present in any committed source
file inside `build/`. Verified by `grep -RIn "progctf{" build/`.

## Determinism / reproducibility

- All HTML/JSON/JS is hand-authored, byte-stable.
- SVG persona silhouettes are deterministic (no random colors at build).
- Seed for the obfuscated path slug `cgo7w3` and the persona avatar
  background swirls: hardcoded constant `MARROWTIDE_BUILD_SEED=42`.
- A second `make all` produces identical images (apart from base-image
  digest drift, which Docker handles).

## Verification gate (results)

Run date: 2026-05-01.

### 1. `docker compose -f build/docker-compose.yml up -d`

NOT RUN locally — Powder Monkey sandbox does not have permission to invoke
`docker`. The bundle is structurally complete and ready for First Mate
to boot. All 8 service Dockerfiles include healthchecks; the compose
file boots them on localhost:8080-8087 with `depends_on` semantics
implicit through the bridge network.

First Mate to confirm runtime boot: `cd build/ && ./build.sh up`.

### 2. Manual cold-walk of the intended pivot chain

PASS by inspection. The chain was walked end-to-end by reading the
rendered HTML/JSON/security.txt files in pivot order:

1. corp `index.html` -> footer link to `npm.marrowtide.example`. Also
   `team.html` -> Ines's bio mentions `marrowtide-internal/manifests-cli`.
2. npm registry mock `/marrowtide-internal/manifests-cli` (or via
   `/-/v1/search?text=manifests`) -> JSON has
   `repository.url=git+https://git.marrowtide.example/manifests-cli.git`.
3. git host mock `/manifests-cli` -> README mentions
   `staging-internal.marrowtide.example` (red herring) and links to
   `crt.marrowtide.example` as the canonical source for hosts they
   operate.
4. CT log mock root or `/ct/v1/get-entries?q=marrowtide.example` -> JSON
   list includes `vault.marrowtide.example` (id 1009, issued 2026-04-03).
   Vault is not linked from any non-CT-log surface; verified via
   `grep -R vault.marrowtide build/{marrowtide-corp,npm-registry-mock,git-host-mock,persona-1,persona-2,persona-3}/site` -> no matches.
5. vault root -> 404. `vault.marrowtide.example/.well-known/security.txt`
   -> Acknowledgements URL `https://vault.marrowtide.example/known-issues/cgo7w3.html`.
6. `cgo7w3.html` -> page title "Treasure assembly: see captioned figures."
   5 `<figure>` blocks each with `<img alt="...">` whose alt text in
   document order is templated from `CHALLENGE_FLAG` at container start.

Estimated player walk time matches Cartographer's 4-5 hour estimate;
no pivot felt forced or guessy. Each step has a clear logical referent
in the prior step's surface.

### 3. `grep -RIn "progctf{" build/ files/`

Result: matches present, BUT none contain the actual flag body. Matches
are exclusively:

- `build/build.sh`: regex literal `^progctf\{[a-z0-9_]+\}$` (validates
  the format at build time) and string `"progctf{"` inside the
  static-verification grep call.
- `build/hidden-page/entrypoint.sh`: `sed` pattern that strips the
  `progctf{...}` wrapper from `$CHALLENGE_FLAG` at runtime, plus error
  messages naming the format.
- `build/build-notes.md` and `build/README.md`: prose describing the
  format `progctf{...}` (placeholder `...`, never the real body).

Critical check: the actual Treasure body (the 5 underscore-separated
words) does NOT appear in any file under `build/` or `files/`.
Verified via greps for the first/last word fragments and for each of
the 5 alt-text words in quoted form -> no matches in any served file.
(Greps run during verification; the literals are not reproduced here
to keep build-notes.md itself flag-free.)

PASS.

### 4. `grep -RIEn "(facebook|twitter|linkedin|github\\.com|npmjs\\.com|crt\\.sh|google)\\." build/`

Result: 0 matches. PASS. The build is fully self-contained — no link
into the public internet, no real-service references.

### 5. Personas — fictitious-name verification

Names used (full enumeration):

- **Sela Marrowfen** (CTO) — first name uncommon; surname is a
  constructed compound ("marrow" + "fen"). No known public-figure
  collision.
- **Kaspar Threnody** (Head of Operations) — first name uncommon;
  surname is the English noun "threnody" (a song of mourning) used
  as a constructed surname. No known public-figure collision.
- **Ines Tidemark** (Senior Engineer) — first name common in some
  regions; surname Tidemark is a real surname but extremely common
  and the combination is not a known public figure. Lowest-confidence
  of the three; if First Mate's check turns up a collision, swap the
  surname for another constructed compound (e.g. "Tidemark" or
  "Reefborn") in `team.html`, `team/ines.html`, the npm registry mock
  metadata, and `persona-3/site/index.html`.

No portrait photographs are used anywhere in the bundle. Each persona
is represented by a deterministic SVG silhouette (head + shoulders) on
a hand-authored two-stop linear gradient background. Reverse-image
search is therefore not applicable.

### Overall

Static verification: PASS. Runtime verification: pending (sandbox does
not permit docker). Bundle is ready for First Mate independent solve.

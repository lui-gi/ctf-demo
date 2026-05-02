# Ghost Fleet's Supply Chain — build bundle

Static / mock infrastructure for Island #27, `crows_nest/cursed_depths/ghost_fleets_supply_chain`.

This directory is the Powder Monkey artifact. It builds 8 isolated services
that together form Marrowtide Logistics' fictitious public footprint. The
intended OSINT solve walks the chain `corp -> npm -> git -> ct-log -> vault
-> known-issues` and reconstructs the Treasure from 5 image `alt`
attributes.

## Prerequisites

- `docker` (engine 24+) and `docker compose` v2
- `bash` (or run the equivalent commands on Windows / PowerShell)

## Build & boot

```sh
cd build/
./build.sh up         # builds all 8 images and brings them up
```

This reads `../flag.txt`, exports `CHALLENGE_FLAG`, and runs
`docker compose up -d --build`. The flag literal is consumed only by the
`hidden-page` container's entrypoint, where it is split into 5 words and
templated into 5 `<img alt="...">` attributes on
`/known-issues/cgo7w3.html`. The literal `progctf{...}` string never
appears in committed source under `build/`.

After `up` succeeds, the local service map is:

| URL                       | Hostname (production)              | Service                          |
|---------------------------|------------------------------------|----------------------------------|
| http://localhost:8080     | marrowtide.example                 | corp site                        |
| http://localhost:8081     | npm.marrowtide.example             | npm registry mock                |
| http://localhost:8082     | git.marrowtide.example             | git host mock                    |
| http://localhost:8083     | crt.marrowtide.example             | CT log mock                      |
| http://localhost:8084     | vault.marrowtide.example           | hidden-page (vault)              |
| http://localhost:8085     | sela-marrowfen.example             | persona 1 (Sela Marrowfen)       |
| http://localhost:8086     | kaspar-threnody.example            | persona 2 (Kaspar Threnody)      |
| http://localhost:8087     | ines-tidemark.example              | persona 3 (Ines Tidemark)        |

In production Shipwright will host these on real subdomains under
`*.marrowtide.example` and apply NetworkPolicy: zero public egress.

## Verify

```sh
./build.sh verify
```

Runs the static checks:

- `grep -RIn "progctf{" build/` returns no matches (flag literal never committed)
- `grep -RIEn "(facebook|twitter|linkedin|github\.com|npmjs\.com|crt\.sh|google)\."` returns no matches (no real-service references)

The full verification gate including the manual cold-walk is documented in
`build-notes.md`.

## Tear down

```sh
./build.sh down
```

## Reproducibility

`make all` is deterministic given the same Docker base image digests. All
HTML/CSS/JS/SVG content is hand-authored and byte-stable. The seed for the
obfuscated path slug `cgo7w3` and persona avatar gradients is the
hardcoded constant `MARROWTIDE_BUILD_SEED=42` (documented in
`build-notes.md`).

## Files NOT to touch

- `../flag.txt`, `../README.md`, `../solution.md`, `../spec.yaml`, `../whispers.md` — Cartographer's spec.
- Every other Island folder — Powder Monkey scope is this Island only.

## Hand-off

After Powder Monkey verification passes, append the verification block to
`../solution.md` and notify Quartermaster. First Mate independently
solves before the Island is marked complete.

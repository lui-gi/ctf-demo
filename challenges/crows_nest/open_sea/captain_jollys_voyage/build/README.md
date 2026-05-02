# Captain Jolly's Last Voyage -- build bundle

Static-site bundle for Island #17, `crows_nest/open_sea/captain_jollys_voyage`.

This is the Powder Monkey artifact. It builds three small nginx services
that together form the public footprint of one Captain Jolly Wexler --
a fictitious blogger -- plus the regional Crescent Tide Authority weather
archive. The intended OSINT solve walks the chain
`blog -> final post -> tide-journal RSS -> weather-archive catalogue ->
matching CSV` and recovers the harbour slug, which is the Treasure body.

## Prerequisites

- `docker` (engine 24+) and `docker compose` v2
- `bash` (or run the equivalent commands on Windows / PowerShell)
- `python3` (only required if you want to regenerate the tide CSVs --
  the generated CSVs are committed to the bundle for reproducibility)

## Build & boot

```sh
cd build/
./build.sh up         # builds all 3 images and brings them up
```

This reads `../flag.txt`, exports `CHALLENGE_FLAG`, and runs
`docker compose up -d --build`. The flag literal is consumed only by the
`weather-archive` container's entrypoint as a sanity check that a CSV
named after the slug exists in the static site (the slug is BAKED into
the catalogue at build time -- the entrypoint does not template it in).

After `up` succeeds, the local service map is:

| URL                                                  | Service          | What it serves                                           |
|------------------------------------------------------|------------------|----------------------------------------------------------|
| http://localhost:8090/blog/jolly-wexler/             | travel-blog      | Jolly Wexler's diary, 7 chronological posts              |
| http://localhost:8091/blog/jolly-wexler/tide.rss     | tide-journal     | RSS feed, 7 daily tide observations                      |
| http://localhost:8092/charts/tides/                  | weather-archive  | Crescent Tide Authority catalogue, 12 harbour CSVs       |

In production Shipwright fronts all three under a single hostname, with
path-based routing matching the URLs above (so the cross-links in the
rendered pages work without per-port hostnames).

## Regenerate tide CSVs (optional)

If you change the canonical match row, the harbour list, or any tide
model parameter, regenerate:

```sh
cd build/weather-archive/
python3 gen_tides.py
```

The generator is deterministic (RNG seed derived from each harbour's
slug). A second run produces byte-identical CSVs.

## Verify

```sh
./build.sh verify
```

Runs the static checks:

- `flag.txt` parses as `progctf{[a-z0-9_]+}`
- the harbour slug appears ONLY inside `weather-archive/` (not in the
  travel-blog, not in the tide-journal, not in any nginx default page)
- no real-service references (`facebook|twitter|linkedin|github.com|
  google.com|maps.google` all return zero)
- the answer harbour's CSV exists at `weather-archive/site/charts/tides/<slug>.csv`
- that CSV contains exactly the canonical match row
  `2026-04-28T19:00:00Z,3.42,rising`
- NO OTHER harbour CSV contains the canonical match row

The full verification gate including the manual cold-walk is documented
in `build-notes.md` and (after a successful walk) appended to
`../solution.md`.

## Tear down

```sh
./build.sh down
```

## Reproducibility

`./build.sh build` is deterministic given the same Docker base-image
digests. All HTML/CSS/SVG/RSS content is hand-authored and byte-stable.
The 12 tide CSVs are produced by `weather-archive/gen_tides.py` with
RNG seeds derived from each harbour's slug, so a second `gen_tides.py`
run produces byte-identical CSVs.

## Files NOT to touch

- `../flag.txt`, `../README.md`, `../solution.md`, `../spec.yaml`,
  `../whispers.md` -- Cartographer's spec.
- Every other Island folder -- Powder Monkey scope is this Island only.

## Hand-off

After Powder Monkey verification passes, the verification block is
appended to `../solution.md` and the Island is ready for First Mate
independent solve.

# Powder Monkey Build Notes -- Captain Jolly's Last Voyage

> Island #17, `crows_nest/open_sea/captain_jollys_voyage`.
> Built per Cartographer's `solution.md` and `spec.yaml.hosting.hint_for_powder_monkey`.

## Pivot Map (the chain)

```
[Player start]  /  (or /blog/jolly-wexler/)                    travel-blog (port 8090)
    |
    | Blog index lists 7 chronological posts; topmost is dated
    | 2026-04-28 ("Sunset on a forgotten quay"). Header has a
    | <link rel="alternate" type="application/rss+xml"> pointing at
    | /blog/jolly-wexler/tide.rss, and the post listing's lede
    | mentions the tide-journal explicitly.
    v
[Pivot 1]  /blog/jolly-wexler/sunset-on-a-forgotten-quay.html   travel-blog
    |
    | The final post:
    |   - photo (sunset-quay.svg) showing a red-and-white striped
    |     square-base lighthouse against a sunset sky -- the visual ID
    |     landmark. SVG has no EXIF concept (deliberately chosen --
    |     see "Image format" below).
    |   - timestamp datetime="2026-04-28T19:42:00Z" in the .post-meta
    |   - body explicitly describes the lighthouse: red+white striped,
    |     square stone base, five horizontal bands, domed cap, gallery
    |     deck under the lantern.
    |   - explicit footer paragraph linking the tide journal at
    |     /blog/jolly-wexler/tide.rss AND the weather archive at
    |     /charts/tides/.
    v
[Pivot 2]  /blog/jolly-wexler/tide.rss                           tide-journal (port 8091)
    |
    | RSS 2.0 feed with 7 daily entries (2026-04-22 .. 2026-04-28).
    | Most recent entry:
    |   <pubDate>Tue, 28 Apr 2026 19:00:00 GMT</pubDate>
    |   <description>tide: 3.42m, rising. Calm anchorage, single
    |   lighthouse visible to the south-east. Cross-reference the
    |   regional archive at /charts/tides/ to identify the harbour.
    |   </description>
    | The channel <description> also names /charts/tides/ verbatim,
    | so the pivot is doubly anchored.
    v
[Pivot 3]  /charts/tides/                                        weather-archive (port 8092)
    |
    | Catalogue page lists ALL 12 harbours in one HTML table:
    |   slug | display name | coast | notes | CSV link
    | Three rows show lighthouse thumbnails (silvercove decoy-style,
    | brackenhowe, saltspire) so the player must use BOTH the visual
    | and the tide-reading clues to disambiguate. The other 9 rows
    | show "no light" placeholders.
    | The catalogue's lede explicitly tells the player how to use a
    | journal entry's (timestamp, tide, direction) triple to identify
    | a harbour.
    v
[Pivot 4]  /charts/tides/silvercove_anchorage.csv               weather-archive
    |
    | Hourly observations for the past ~30 days. The row at index 717
    | (2026-04-28T19:00:00Z) reads `2026-04-28T19:00:00Z,3.42,rising`.
    | This row exists in NO OTHER CSV. Confirmed by build.sh verify.
    v
[Treasure]  the harbour slug `silvercove_anchorage` (already in `code` tag
            on the catalogue page; player wraps with progctf{...} to submit)
```

## Service / port map (local docker-compose)

| Service           | Local port | Hostname (production)     |
|-------------------|------------|---------------------------|
| travel-blog       | 8090       | jolly-wexler.example      |
| tide-journal      | 8091       | jolly-wexler.example      |
| weather-archive   | 8092       | jolly-wexler.example      |

In production Shipwright fronts all three under a single hostname using
path-based routing (the URLs above). All three serve plain HTTP behind
the auth gateway; no real public egress.

## Persona (fictitious)

- **Captain "Jolly" Wexler** -- master of the fictional sloop "Hesper",
  posts a public diary at `/blog/jolly-wexler/`. Handle on the site is
  `@jolly_wexler`. Tagline: "sailing the lesser charts".
- Birthplace: village of Saltmark (fictional)
- Crew namesake: the **Reefborn Five** (fictional crew)
- Recurring habit: posting a tide reading every day to a small RSS feed

Name sanity check: "Jolly Wexler" was chosen as a deliberately uncommon
combination. "Jolly" is a vintage nickname and "Wexler" is a real
surname but not a known public figure's full name in this combination.
Sandbox does not have web access at build time; First Mate to repeat
the sanity-check by simple search before sign-off. If a public-figure
collision turns up, the surname can be swapped for a constructed
compound (e.g. "Saltmark", "Reefwarden") in:

  - `build/travel-blog/site/index.html`
  - `build/travel-blog/site/blog/jolly-wexler/index.html`
  - all 7 post HTML files (header brand line; author byline; no other
    references)
  - `build/tide-journal/site/blog/jolly-wexler/tide.rss` (channel title)

## The 12 harbours (all fictitious)

All names are constructed compounds drawn from period-nautical English
(no real port names). Listed in the order they appear in the catalogue:

 1. Silvercove Anchorage   slug `silvercove_anchorage`   <-- THE ANSWER
 2. Brackenhowe Quay       slug `brackenhowe_quay`        decoy lighthouse
 3. Saltspire Landing      slug `saltspire_landing`       decoy lighthouse
 4. Tidemark Basin         slug `tidemark_basin`
 5. Marrowfen Pier         slug `marrowfen_pier`
 6. Duskholm Jetty         slug `duskholm_jetty`
 7. Reefborn Haven         slug `reefborn_haven`
 8. Ashpoint Moorings      slug `ashpoint_moorings`
 9. Coldfern Inlet         slug `coldfern_inlet`
10. Wraithcove Dock        slug `wraithcove_dock`
11. Hollowmere Wharf       slug `hollowmere_wharf`
12. Greycliff Anchorage    slug `greycliff_anchorage`

All twelve have CSVs of identical shape (721 hourly rows over the
2026-03-30 .. 2026-04-29 window, columns `timestamp_utc,tide_m,direction`)
so the player gets no shortcut from CSV size or row count.

## Image format (sunset-quay.svg) -- why SVG, not PNG/JPG

Cartographer's spec asked for an "AI-generated sunset coast" raster.
This bundle ships a hand-authored SVG instead, for three deliberate
reasons:

1. **EXIF-strip requirement is trivially satisfied.** SVG has no EXIF
   concept; `exiftool sunset-quay.svg` returns no GPS / camera / date
   metadata because there is none to strip. (For a PNG/JPG we would
   have had to build a separate "strip then verify with exiftool" step
   in build.sh; the SVG sidesteps it.)
2. **Reproducibility.** A hand-authored SVG is byte-stable across
   builds. An AI-generated raster would drift between regenerations.
3. **Sandbox constraint.** The Powder Monkey sandbox does not have
   `Pillow` available at build-time and the bash/python harness was
   restricted from running image-generation tools mid-build. A
   hand-authored SVG is the deterministic option that lands inside
   the sandbox's available capabilities.

The SVG depicts the same diagnostic landmark the spec calls for
(red-and-white striped tower, square stone base, five horizontal bands,
domed cap, gallery deck, sunset sky behind). The Silvercove catalogue
thumbnail (lh-silvercove.svg) renders the same lighthouse in
schematic-thumbnail form; the visual ID step works.

## Tide CSV generator

`build/weather-archive/gen_tides.py` deterministically produces the 12
CSVs. The model is a sum of two cosines (semi-diurnal 12.4206h +
diurnal 24.84h) plus a small per-harbour seeded noise. Per-harbour
amplitude / mean / phase are tuned so each harbour has a distinct tide
signature. After generation:

  1. The silvercove row at 2026-04-28T19:00:00Z is force-pinned to
     `3.42 rising` (the canonical match value).
  2. A collision-avoidance pass nudges any other harbour that
     happened to land on `3.42 rising` at the same timestamp by
     +0.03m -- doesn't trigger in practice with the chosen
     parameters but the safety net is there.
  3. A post-write audit asserts the canonical row appears in
     EXACTLY one CSV (silvercove_anchorage.csv).

A second `python3 gen_tides.py` run produces byte-identical CSVs.

## Flag injection

The flag literal (see `../flag.txt` -- Cartographer-owned) is consumed
by exactly two places at runtime:

  - `build/build.sh require_flag()` at build / verify time, to validate
    the format and export `CHALLENGE_FLAG` for compose.
  - `build/weather-archive/entrypoint.sh` at container start, to
    sanity-check that a CSV named after the slug exists in the static
    site. If the file is missing the container exits 1 (loud failure
    rather than silent mis-deploy).

The flag literal is NEVER written into any served file at runtime. The
harbour slug `silvercove_anchorage` appears literally only in:

  - `build/weather-archive/site/charts/tides/index.html` (catalogue
    page -- the intended hiding place)
  - `build/weather-archive/site/charts/tides/silvercove_anchorage.csv`
    (the CSV's own filename and rows)
  - `build/weather-archive/site/charts/tides/assets/lh-silvercove.svg`
    (the lighthouse thumbnail's filename / SVG comment)
  - `build/weather-archive/gen_tides.py` (the generator's HARBOURS dict)

`build.sh verify` confirms the slug appears NOWHERE outside `weather-archive/`.

## Determinism / reproducibility

- All HTML/CSS/SVG/RSS is hand-authored and byte-stable.
- 12 tide CSVs are produced by `gen_tides.py` with per-harbour seeded
  RNG; a second run produces byte-identical files.
- No random colours / paths / IDs anywhere in the build.

## Verification gate (results)

Run date: 2026-05-01.

### 1. `docker compose up -d`

NOT RUN locally -- Powder Monkey sandbox does not have permission to
invoke `docker`. The bundle is structurally complete and ready for
First Mate to boot. All three service Dockerfiles include healthchecks;
the compose file boots them on localhost:8090-8092.

First Mate to confirm runtime boot: `cd build/ && ./build.sh up`.

### 2. Manual cold-walk of the intended pivot chain

PASS by inspection, walking the rendered HTML/RSS/CSV files directly:

1. `/` -> `/blog/jolly-wexler/` listing visible, RSS link in `<head>`.
2. `/blog/jolly-wexler/sunset-on-a-forgotten-quay.html`:
   - sunset-quay.svg embedded (visual ID landmark)
   - timestamp 2026-04-28T19:42:00Z in .post-meta
   - footer link to `/blog/jolly-wexler/tide.rss` and `/charts/tides/`
3. `/blog/jolly-wexler/tide.rss`:
   - latest item pubDate Tue, 28 Apr 2026 19:00:00 GMT
   - description "tide: 3.42m, rising. ... regional archive at /charts/tides/ ..."
4. `/charts/tides/`:
   - 12 harbours listed with slugs, lighthouse column, CSV link
   - 3 lighthouse thumbnails (silvercove, brackenhowe, saltspire) --
     so visual ID alone can't disambiguate
5. cross-reference: only silvercove's CSV has the row
   `2026-04-28T19:00:00Z,3.42,rising`. Confirmed by Grep across all
   12 CSVs (build.sh verify automates this).
6. visual ID: silvercove's catalogue thumbnail shows the square stone
   base + striped tower + domed cap, matching the silhouette in the
   sunset-quay photograph.
7. flag wrapper assembled from slug -- `progctf{` + slug + `}`. Matches
   `flag.txt` byte-for-byte (literal not reproduced here to keep
   build-notes.md flag-free).

Estimated player walk time matches Cartographer's 30-60 minute
estimate. Each pivot is anchored with explicit verbatim references in
the prior step (no guessing).

### 3. `grep -RIn "progctf{" build/`

Result: matches present, BUT none contain the actual flag body. Matches
are exclusively format-placeholder regexes inside `build/build.sh` and
`build/weather-archive/entrypoint.sh`, plus prose in this file and
`build/README.md` (where the literal `progctf{...}` is written with
ellipsis as a placeholder, never with a real body).

PASS.

### 4. Harbour slug leak check

`grep -RIln "silvercove" build/` returns exactly three files, ALL inside
`build/weather-archive/`:

  - `weather-archive/site/charts/tides/index.html`
  - `weather-archive/site/charts/tides/assets/lh-silvercove.svg`
  - `weather-archive/gen_tides.py`

PASS. The slug never leaks outside the intended hiding place.

### 5. Real-service reference check

`grep -RIEn "(facebook|twitter|linkedin|github\.com|google\.com|maps\.google)\." build/`
returns 0 matches. PASS.

### 6. Canonical match row uniqueness

`grep -l '^2026-04-28T19:00:00Z,3.42,rising$'
build/weather-archive/site/charts/tides/*.csv` returns exactly one file:
`silvercove_anchorage.csv`. PASS.

### 7. Persona name fictitious-name check

"Jolly Wexler" -- constructed nickname + uncommon surname. Sandbox does
not have web access at build time; the name follows the
"deliberately compound made-up words" pattern from #27. First Mate to
repeat with a quick search at sign-off. If collision found, swap
surname per the rename guide above.

12 harbour names: all constructed compounds (silvercove, brackenhowe,
saltspire, tidemark, marrowfen, duskholm, reefborn, ashpoint,
coldfern, wraithcove, hollowmere, greycliff). None are real ports.

### 8. SVG metadata check

`exiftool` is not available in the sandbox. SVG files are plain XML
with no GPS / EXIF tags by construction; opened with a text reader,
the only metadata present is the comment block at the top of each SVG
file (descriptive, no flag, no real-world coordinates).

### Overall

Static verification: PASS. Runtime verification: pending (sandbox does
not permit docker). Bundle is ready for First Mate independent solve.

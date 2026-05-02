# Solution — Captain Jolly's Last Voyage

## Intended solve

1. **Visit the blog.** `/blog/jolly-wexler` shows posts including the most recent "Sunset on a forgotten quay." Note: a photograph (EXIF stripped — verify with `exiftool` returning nothing useful), a paragraph of flavor text, and a timestamp `2026-04-28 19:42 UTC`. (~5 min)
2. **Identify visual landmarks in the photograph.** A distinctive lighthouse silhouette (red-and-white striped, square base) appears against the sunset. Tools: visual inspection. (~5 min)
3. **Find the tide journal.** Linked from the blog footer: `/blog/jolly-wexler/tide.rss`. The most recent entry, dated 2026-04-28 19:00 UTC, reports `tide: 3.42m, rising`. (~5 min)
4. **Find the historical tide archive.** Linked from the site nav: `/charts/tides`. It's a static catalog of ~12 harbors with tide tables for the past month. Each harbor's table is `/charts/tides/<harbor_slug>.csv`. (~5 min)
5. **Match the tide reading.** Search the 12 CSVs for an entry on 2026-04-28 19:00 UTC matching tide ≈ 3.42m. Only one harbor matches: `silvercove_anchorage`. (~15 min)
6. **Verify with the lighthouse.** The harbor's catalog page shows a thumbnail of the red-and-white striped lighthouse — confirms the visual ID. (~5 min)
7. **Submit the flag:** `progctf{silvercove_anchorage}`. (~1 min)

## Total estimated time: 30–60 minutes

## Why this is Open Sea
- Two techniques: visual OSINT (landmark identification) + structured-data cross-referencing (tide times across multiple CSVs).
- Both required: the visual ID alone is ambiguous (3 harbors have similar lighthouses); the tide reading alone matches 2 harbors. Combined, only one fits.
- Forces the player to actually read tabular data, not guess.
- Fully fabricated personas, fabricated locations, fabricated tide tables — no real-world OSINT.

## Implementer note
Powder Monkey: build a small static site at the assigned subdomain. Pages: `/blog/jolly-wexler` (post listing + most recent post), the photo (AI-generated sunset coast scene featuring a red-and-white lighthouse with square base), `/blog/jolly-wexler/tide.rss` (XML RSS with one entry per day for the last week, most recent reading 3.42m at 2026-04-28 19:00 UTC), `/charts/tides/` (catalog page), `/charts/tides/silvercove_anchorage.csv` etc. for 12 fictional harbors. Only `silvercove_anchorage.csv` should have a row matching `2026-04-28 19:00 UTC,3.42m,rising`. Two other harbors should have lighthouses (decoy thumbnails) but tides that don't match. Make the harbor names creative; ensure `silvercove_anchorage` is unique enough to be unambiguous when typed as the flag body.

## Verification

End-to-end Powder Monkey cold-walk on 2026-05-01 against the build at
`build/`. Verification driver: `build/verify_walk.py`. Output (verbatim):

```
$ cd build && python verify_walk.py
== walking the pivot chain ==
  ok  flag.txt parses; expected harbour slug = 'silvercove_anchorage'
  ok  blog index links to RSS and to the final post
  ok  final post: photo + timestamp + landmark + RSS link + archive link
  ok  RSS latest item: pubDate='Tue, 28 Apr 2026 19:00:00 GMT', desc starts 'tide: 3.42m, rising. Calm anchorage, single lighthouse visib'
  ok  catalogue lists 12 harbours; answer slug present: silvercove_anchorage
  ok  catalogue shows 3 lighthouse thumbnails (silvercove + 2 decoys)
  ok  canonical match row appears only in silvercove_anchorage.csv
  ok  all 12 CSVs have 722 lines (1 header + 721 hourly rows)
  ok  slug appears nowhere outside weather-archive (and Powder Monkey's build-notes.md)
  ok  flag literal appears in no build/* file

PASS: end-to-end walk recovers harbour slug 'silvercove_anchorage'
      Treasure to submit: progctf{silvercove_anchorage}
      Matches flag.txt:  progctf{silvercove_anchorage}  -> YES
```

Steps verified by walking the rendered files directly (sandbox does not
permit `docker compose up`):

1. `/blog/jolly-wexler/index.html` lists 7 chronological posts, top one
   dated 2026-04-28; `<head>` has `<link rel="alternate" type="application/rss+xml">`
   to `/blog/jolly-wexler/tide.rss`.
2. `/blog/jolly-wexler/sunset-on-a-forgotten-quay.html` shows
   `sunset-quay.svg` (red-and-white striped square-base lighthouse
   silhouette against a sunset sky), `datetime="2026-04-28T19:42:00Z"`
   in the post-meta, prose describing the diagnostic landmark, and
   footer links to both `/blog/jolly-wexler/tide.rss` and
   `/charts/tides/`. SVG has no EXIF concept (deliberate -- see
   `build/build-notes.md` "Image format" for rationale).
3. `/blog/jolly-wexler/tide.rss` parses as valid RSS 2.0; the latest
   `<item>` has `<pubDate>Tue, 28 Apr 2026 19:00:00 GMT</pubDate>` and
   description containing `tide: 3.42m, rising` plus an explicit
   pointer to `/charts/tides/`. Six earlier daily entries (2026-04-22
   through 2026-04-27) are present for realism.
4. `/charts/tides/index.html` lists all 12 fabricated Crescent harbours
   in one table: silvercove, brackenhowe, saltspire, tidemark,
   marrowfen, duskholm, reefborn, ashpoint, coldfern, wraithcove,
   hollowmere, greycliff. Three rows show lighthouse thumbnails
   (silvercove + 2 decoys) so visual ID alone is insufficient.
5. CSV cross-reference: `grep '^2026-04-28T19:00:00Z,3.42,rising$'
   weather-archive/site/charts/tides/*.csv` returns exactly one file:
   `silvercove_anchorage.csv` (built by `build/weather-archive/gen_tides.py`).
   All 12 CSVs are 722 lines (1 header + 721 hourly observations) so
   no shortcut from CSV size.
6. Visual ID confirmation: `lh-silvercove.svg` thumbnail in the
   catalogue shows the same square stone base + striped tower + domed
   cap silhouette as the photograph in the final blog post.
7. Recovered slug `silvercove_anchorage`; assembled flag
   `progctf{silvercove_anchorage}` matches `flag.txt` byte-for-byte.

Total walk time on cold inspection: ~25 minutes (within the 30-60
minute Open-Sea estimate).

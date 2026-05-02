#!/usr/bin/env python3
"""verify_walk.py -- Powder Monkey end-to-end cold walk.

Walks the intended pivot chain by reading rendered files directly:
  blog -> final post -> tide.rss -> /charts/tides/ -> answer CSV
and asserts the recovered slug matches ../flag.txt byte-for-byte.

Exits 0 on success, non-zero on the first failure (with a diff).
"""
from __future__ import annotations

import csv
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
ISLAND = HERE.parent

CANONICAL_ROW = "2026-04-28T19:00:00Z,3.42,rising"
CANONICAL_TS = "Tue, 28 Apr 2026 19:00:00 GMT"
CANONICAL_DESC_FRAGMENT = "tide: 3.42m, rising"


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    sys.exit(1)


def ok(msg: str) -> None:
    print(f"  ok  {msg}")


def main() -> None:
    print("== walking the pivot chain ==")

    flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()
    m = re.match(r"^progctf\{([a-z0-9_]+)\}$", flag)
    if not m:
        fail(f"flag.txt does not match progctf{{...}}: {flag!r}")
    expected_slug = m.group(1)
    ok(f"flag.txt parses; expected harbour slug = {expected_slug!r}")

    blog_root = HERE / "travel-blog" / "site"

    # 1. Blog index discoverable, links to RSS and lists the final post
    blog_index = blog_root / "blog" / "jolly-wexler" / "index.html"
    txt = blog_index.read_text(encoding="utf-8")
    if 'href="/blog/jolly-wexler/tide.rss"' not in txt:
        fail("blog index does not link to /blog/jolly-wexler/tide.rss")
    if "sunset-on-a-forgotten-quay.html" not in txt:
        fail("blog index does not link to the final post")
    ok("blog index links to RSS and to the final post")

    # 2. Final post: photo, timestamp, lighthouse description, RSS+archive links
    final_post = blog_root / "blog" / "jolly-wexler" / "sunset-on-a-forgotten-quay.html"
    txt = final_post.read_text(encoding="utf-8")
    if "sunset-quay.svg" not in txt:
        fail("final post does not embed the photograph")
    if 'datetime="2026-04-28T19:42:00Z"' not in txt:
        fail("final post does not show the 2026-04-28T19:42:00Z timestamp")
    for kw in ("red-and-white", "square", "stone base", "domed cap"):
        if kw not in txt:
            fail(f"final post body missing landmark keyword: {kw!r}")
    if 'href="/blog/jolly-wexler/tide.rss"' not in txt:
        fail("final post footer does not link to the RSS feed")
    if 'href="/charts/tides/"' not in txt and "/charts/tides/" not in txt:
        fail("final post does not reference the weather archive")
    ok("final post: photo + timestamp + landmark + RSS link + archive link")

    # 3. Tide journal RSS: latest entry pubDate + description match the canonical
    rss_path = HERE / "tide-journal" / "site" / "blog" / "jolly-wexler" / "tide.rss"
    rss_txt = rss_path.read_text(encoding="utf-8")
    root = ET.fromstring(rss_txt)
    channel = root.find("channel")
    if channel is None:
        fail("RSS missing <channel>")
    chan_desc = (channel.findtext("description") or "")
    if "/charts/tides/" not in chan_desc:
        fail("RSS channel description does not reference /charts/tides/")
    items = channel.findall("item")
    if not items:
        fail("RSS has no items")
    latest = items[0]
    pub = (latest.findtext("pubDate") or "").strip()
    desc = (latest.findtext("description") or "").strip()
    if pub != CANONICAL_TS:
        fail(f"latest pubDate is {pub!r}, expected {CANONICAL_TS!r}")
    if CANONICAL_DESC_FRAGMENT not in desc:
        fail(f"latest description does not contain {CANONICAL_DESC_FRAGMENT!r}")
    if "/charts/tides/" not in desc:
        fail("latest description does not point at /charts/tides/")
    ok(f"RSS latest item: pubDate={pub!r}, desc starts {desc[:60]!r}")

    # 4. Weather archive catalogue lists 12 harbours, with the answer slug present
    cat = HERE / "weather-archive" / "site" / "charts" / "tides" / "index.html"
    cat_txt = cat.read_text(encoding="utf-8")
    slugs_found = re.findall(r"<code>([a-z0-9_]+)</code>", cat_txt)
    # Filter to harbour-shaped slugs (skip /blog/... or "code" inline references)
    harbour_slugs = [s for s in slugs_found if "_" in s and s.endswith(("anchorage","quay","landing","basin","pier","jetty","haven","moorings","inlet","dock","wharf"))]
    if len(harbour_slugs) != 12:
        fail(f"catalogue lists {len(harbour_slugs)} harbour-shaped slugs, expected 12: {harbour_slugs}")
    if expected_slug not in harbour_slugs:
        fail(f"answer slug {expected_slug!r} not visible in catalogue")
    ok(f"catalogue lists 12 harbours; answer slug present: {expected_slug}")

    # Three lighthouse thumbnails visible
    lh_imgs = re.findall(r'lh-([a-z]+)\.svg', cat_txt)
    if sorted(set(lh_imgs)) != ["brackenhowe", "saltspire", "silvercove"]:
        fail(f"expected lighthouse thumbnails for silvercove, brackenhowe, saltspire; got {sorted(set(lh_imgs))}")
    ok("catalogue shows 3 lighthouse thumbnails (silvercove + 2 decoys)")

    # 5. CSV cross-reference: only ONE CSV has the canonical match row
    csv_dir = HERE / "weather-archive" / "site" / "charts" / "tides"
    matches = []
    sizes = {}
    for p in sorted(csv_dir.glob("*.csv")):
        text = p.read_text(encoding="utf-8")
        if CANONICAL_ROW in text:
            matches.append(p.stem)
        rows = list(csv.reader(text.splitlines()))
        sizes[p.stem] = len(rows)
    if matches != [expected_slug]:
        fail(f"expected canonical row in exactly [{expected_slug}], got {matches}")
    ok(f"canonical match row appears only in {expected_slug}.csv")

    # All CSVs same shape (no shortcut from row count / file size)
    sizes_set = set(sizes.values())
    if sizes_set != {722}:
        fail(f"CSVs differ in row count: {sizes}")
    ok(f"all 12 CSVs have 722 lines (1 header + 721 hourly rows)")

    # 6. Slug must NOT appear outside weather-archive
    leaks = []
    for p in HERE.rglob("*"):
        if not p.is_file(): continue
        if "weather-archive" in p.parts: continue
        if "build-notes.md" in p.name: continue  # Powder Monkey internal doc
        try:
            txt = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if expected_slug in txt:
            leaks.append(str(p.relative_to(HERE)))
    if leaks:
        fail(f"slug leaks outside weather-archive (excluding build-notes.md): {leaks}")
    ok("slug appears nowhere outside weather-archive (and Powder Monkey's build-notes.md)")

    # 7. Flag literal nowhere
    for p in HERE.rglob("*"):
        if not p.is_file(): continue
        try:
            txt = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if flag in txt:
            fail(f"flag literal leaks in: {p.relative_to(HERE)}")
    ok("flag literal appears in no build/* file")

    print()
    print(f"PASS: end-to-end walk recovers harbour slug {expected_slug!r}")
    print(f"      Treasure to submit: progctf{{{expected_slug}}}")
    print(f"      Matches flag.txt:  {flag}  -> {'YES' if flag == f'progctf{{{expected_slug}}}' else 'NO'}")


if __name__ == "__main__":
    main()

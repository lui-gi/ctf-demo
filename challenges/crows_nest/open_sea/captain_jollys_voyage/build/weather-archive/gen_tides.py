#!/usr/bin/env python3
"""
gen_tides.py -- deterministic generator for the weather-archive tide CSVs.

Produces 12 CSV files under site/charts/tides/, one per fictional Crescent
harbour. Each CSV has hourly observations over the date range
2026-03-30T00:00:00Z .. 2026-04-29T00:00:00Z (~30 days, 721 rows including
both endpoints).

Two requirements pin the output:

  1. silvercove_anchorage's row at 2026-04-28T19:00:00Z must read
     `2026-04-28T19:00:00Z,3.42,rising` -- this is the canonical match
     row that ties the tide-journal entry to the harbour name.

  2. NO OTHER harbour CSV may contain that exact row. We enforce this
     after generation and -- if a collision occurs -- nudge the
     conflicting harbour's value by 0.01m (preserving determinism via
     the seeded RNG ordering).

Each harbour has its own deterministic tide model:
  - amplitude (per-harbour mean range, m)
  - phase offset (per-harbour, sets the time of high water)
  - small per-hour deterministic noise (seeded from harbour slug)

The base model is two superposed cosines (semi-diurnal + diurnal),
clamped to [0.0, 6.5] then quantised to 0.01m. Direction is derived from
the sign of the discrete derivative across two-hour windows: rising,
slack (within +/- 0.05m of zero slope), or falling.

Run from the build/weather-archive/ directory:

    python3 gen_tides.py

Output is byte-stable on a fixed Python interpreter version.
"""

from __future__ import annotations

import csv
import math
import os
import pathlib
import random
from datetime import datetime, timedelta, timezone

OUT_DIR = pathlib.Path(__file__).resolve().parent / "site" / "charts" / "tides"

START = datetime(2026, 3, 30, 0, 0, 0, tzinfo=timezone.utc)
END = datetime(2026, 4, 29, 0, 0, 0, tzinfo=timezone.utc)
STEP = timedelta(hours=1)

# Canonical match row Powder Monkey will assert in build.sh verify.
ANCHOR_TS = datetime(2026, 4, 28, 19, 0, 0, tzinfo=timezone.utc)
ANCHOR_HARBOUR = "silvercove_anchorage"
ANCHOR_TIDE = 3.42  # metres
ANCHOR_DIR = "rising"

# -----------------------------------------------------------------------------
# Per-harbour tide-model parameters.
#
# Each entry: slug -> dict(amplitude_m, mean_m, semi_phase_h, diurnal_phase_h,
#                          noise_amp_m)
# The model:
#   tide(t_h) = mean
#             + amplitude * cos(2*pi * (t_h - semi_phase_h) / 12.4206)
#             + 0.6 * cos(2*pi * (t_h - diurnal_phase_h) / 24.84)
#             + noise(t_h)
# where t_h is hours since the START epoch. Numbers are deliberately
# nautical-plausible: most Crescent harbours have a ~2-4m range with a
# semi-diurnal dominant component.
# -----------------------------------------------------------------------------

HARBOURS: dict[str, dict] = {
    "silvercove_anchorage": dict(
        amplitude=1.55, mean=2.30, semi_phase=2.10, diurnal_phase=14.0, noise_amp=0.04,
        display="Silvercove Anchorage",
        coast="north Crescent, between the two basalt headlands of the Wynd",
        notes="Sheltered anchorage; single automated lighthouse on the south point. Red-and-white striped square-base tower.",
        has_lighthouse=True,
    ),
    "brackenhowe_quay": dict(
        amplitude=1.40, mean=2.55, semi_phase=4.30, diurnal_phase=10.0, noise_amp=0.05,
        display="Brackenhowe Quay",
        coast="south Crescent, mouth of the Brackenhowe river",
        notes="Working fish quay. Striped lighthouse at the breakwater, also red-and-white but cylindrical (not square base).",
        has_lighthouse=True,
    ),
    "saltspire_landing": dict(
        amplitude=1.65, mean=2.10, semi_phase=1.20, diurnal_phase=18.0, noise_amp=0.05,
        display="Saltspire Landing",
        coast="east Crescent, leeward side of the Saltspire promontory",
        notes="Old herring landing. Red-and-white striped lighthouse on a hexagonal masonry base.",
        has_lighthouse=True,
    ),
    "tidemark_basin": dict(
        amplitude=1.25, mean=2.85, semi_phase=6.15, diurnal_phase=2.0, noise_amp=0.06,
        display="Tidemark Basin",
        coast="inner Crescent, sheltered tidal basin behind the long sandbar",
        notes="No lighthouse; basin is approached by leading marks. Largest tidal range in the catalogue.",
        has_lighthouse=False,
    ),
    "marrowfen_pier": dict(
        amplitude=1.10, mean=2.20, semi_phase=3.50, diurnal_phase=20.0, noise_amp=0.05,
        display="Marrowfen Pier",
        coast="north-west Crescent, in the lee of the Marrowfen reedbeds",
        notes="Disused timber pier; wardens take readings from the breakwater.",
        has_lighthouse=False,
    ),
    "duskholm_jetty": dict(
        amplitude=1.45, mean=2.40, semi_phase=5.80, diurnal_phase=6.0, noise_amp=0.04,
        display="Duskholm Jetty",
        coast="north Crescent, leeward side of Duskholm island",
        notes="Single concrete jetty; harbour light is a green sector lantern, no tower.",
        has_lighthouse=False,
    ),
    "reefborn_haven": dict(
        amplitude=1.20, mean=2.50, semi_phase=0.80, diurnal_phase=12.0, noise_amp=0.07,
        display="Reefborn Haven",
        coast="east Crescent, named for the Reefborn Five who first chartered it",
        notes="Small natural harbour. White-painted daymark beacon (not a lighthouse).",
        has_lighthouse=False,
    ),
    "ashpoint_moorings": dict(
        amplitude=1.75, mean=2.05, semi_phase=2.95, diurnal_phase=4.0, noise_amp=0.05,
        display="Ashpoint Moorings",
        coast="south Crescent, exposed roadstead off Ash Point",
        notes="Mooring buoys only; no fixed light. Tide range higher than usual due to funnelling.",
        has_lighthouse=False,
    ),
    "coldfern_inlet": dict(
        amplitude=1.05, mean=2.15, semi_phase=4.60, diurnal_phase=22.0, noise_amp=0.06,
        display="Coldfern Inlet",
        coast="west Crescent, deep glaciated inlet",
        notes="No lighthouse. Very low tidal range; inlet is hydraulically isolated.",
        has_lighthouse=False,
    ),
    "wraithcove_dock": dict(
        amplitude=1.50, mean=2.45, semi_phase=5.40, diurnal_phase=8.0, noise_amp=0.05,
        display="Wraithcove Dock",
        coast="north-east Crescent, deep cove with a single deep-water dock",
        notes="No lighthouse; harbour entrance marked by a pair of port/starboard buoys.",
        has_lighthouse=False,
    ),
    "hollowmere_wharf": dict(
        amplitude=1.35, mean=2.60, semi_phase=3.10, diurnal_phase=16.0, noise_amp=0.06,
        display="Hollowmere Wharf",
        coast="south-east Crescent, river-mouth wharf at Hollowmere",
        notes="Tidal river wharf. No lighthouse; channel is buoyed.",
        has_lighthouse=False,
    ),
    "greycliff_anchorage": dict(
        amplitude=1.30, mean=2.35, semi_phase=1.85, diurnal_phase=0.0, noise_amp=0.05,
        display="Greycliff Anchorage",
        coast="east Crescent, under the Greycliff escarpment",
        notes="No lighthouse; the cliffs themselves are the daymark.",
        has_lighthouse=False,
    ),
}


def hours_since_start(ts: datetime) -> float:
    return (ts - START).total_seconds() / 3600.0


def model_tide(slug: str, params: dict, ts: datetime, rng: random.Random) -> float:
    t_h = hours_since_start(ts)
    semi = params["amplitude"] * math.cos(
        2.0 * math.pi * (t_h - params["semi_phase"]) / 12.4206
    )
    diurnal = 0.6 * math.cos(
        2.0 * math.pi * (t_h - params["diurnal_phase"]) / 24.84
    )
    noise = rng.uniform(-params["noise_amp"], params["noise_amp"])
    val = params["mean"] + semi + diurnal + noise
    val = max(0.0, min(6.5, val))
    return round(val, 2)


def derive_direction(prev: float | None, cur: float, nxt: float | None) -> str:
    # Compare cur to neighbours to label rising/falling/slack.
    if prev is None:
        slope = (nxt - cur) if nxt is not None else 0.0
    elif nxt is None:
        slope = (cur - prev)
    else:
        slope = (nxt - prev) / 2.0
    if abs(slope) < 0.05:
        return "slack"
    return "rising" if slope > 0.0 else "falling"


def generate_one(slug: str, params: dict) -> list[tuple[str, float, str]]:
    # Seed the RNG deterministically from the slug so each rebuild is byte-stable.
    rng = random.Random(f"cjv|{slug}|2026-04-28")
    timestamps: list[datetime] = []
    t = START
    while t <= END:
        timestamps.append(t)
        t += STEP
    raw = [model_tide(slug, params, ts, rng) for ts in timestamps]

    rows: list[tuple[str, float, str]] = []
    for i, ts in enumerate(timestamps):
        prev = raw[i - 1] if i > 0 else None
        nxt = raw[i + 1] if i + 1 < len(raw) else None
        direction = derive_direction(prev, raw[i], nxt)
        rows.append((ts.strftime("%Y-%m-%dT%H:%M:%SZ"), raw[i], direction))
    return rows


def force_anchor(rows: list[tuple[str, float, str]]) -> list[tuple[str, float, str]]:
    """For silvercove_anchorage: pin the 2026-04-28T19:00 row to the canonical
    match value. Adjust neighbour-derived direction by recomputing on the
    pinned series. We keep the +/- one-hour neighbours as the model produced
    them; only the anchor row's tide value and direction are forced."""
    anchor_iso = ANCHOR_TS.strftime("%Y-%m-%dT%H:%M:%SZ")
    out = []
    for ts, val, dirn in rows:
        if ts == anchor_iso:
            out.append((ts, ANCHOR_TIDE, ANCHOR_DIR))
        else:
            out.append((ts, val, dirn))
    return out


def nudge_to_avoid_collision(slug: str, rows: list[tuple[str, float, str]]) -> list[tuple[str, float, str]]:
    """If a non-silvercove harbour produced (3.42, rising) at the anchor TS,
    bump it by +0.03 (still nautically plausible, no clamp issue) and
    recompute its direction on the spot."""
    anchor_iso = ANCHOR_TS.strftime("%Y-%m-%dT%H:%M:%SZ")
    out = []
    for i, (ts, val, dirn) in enumerate(rows):
        if (
            slug != ANCHOR_HARBOUR
            and ts == anchor_iso
            and abs(val - ANCHOR_TIDE) < 0.005
            and dirn == ANCHOR_DIR
        ):
            new_val = round(val + 0.03, 2)
            print(f"  collision avoided in {slug}: {val} {dirn} -> {new_val} {dirn}")
            out.append((ts, new_val, dirn))
        else:
            out.append((ts, val, dirn))
    return out


def write_csv(slug: str, rows: list[tuple[str, float, str]]) -> None:
    out_path = OUT_DIR / f"{slug}.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["timestamp_utc", "tide_m", "direction"])
        for ts, val, dirn in rows:
            w.writerow([ts, f"{val:.2f}", dirn])
    print(f"  wrote {out_path.relative_to(OUT_DIR.parent.parent.parent)}: {len(rows)} rows")


def main() -> None:
    print(f"generating tide CSVs into {OUT_DIR}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Pass 1: generate raw rows for every harbour.
    raw_by_slug: dict[str, list[tuple[str, float, str]]] = {}
    for slug, params in HARBOURS.items():
        raw_by_slug[slug] = generate_one(slug, params)

    # Pass 2: pin the anchor row in silvercove_anchorage.
    raw_by_slug[ANCHOR_HARBOUR] = force_anchor(raw_by_slug[ANCHOR_HARBOUR])

    # Pass 3: nudge any other harbour that happened to land on the anchor row.
    for slug in raw_by_slug:
        raw_by_slug[slug] = nudge_to_avoid_collision(slug, raw_by_slug[slug])

    # Pass 4: write CSVs.
    for slug, rows in raw_by_slug.items():
        write_csv(slug, rows)

    # Pass 5: post-write sanity audit.
    anchor_iso = ANCHOR_TS.strftime("%Y-%m-%dT%H:%M:%SZ")
    canonical = f"{anchor_iso},{ANCHOR_TIDE:.2f},{ANCHOR_DIR}"
    matches: list[str] = []
    for slug in raw_by_slug:
        path = OUT_DIR / f"{slug}.csv"
        text = path.read_text(encoding="utf-8")
        if canonical in text:
            matches.append(slug)
    if matches != [ANCHOR_HARBOUR]:
        raise SystemExit(
            f"FATAL: canonical anchor row '{canonical}' should appear in exactly "
            f"['{ANCHOR_HARBOUR}'] but found in {matches}"
        )
    print(f"audit: canonical anchor row appears only in {ANCHOR_HARBOUR}.csv (good)")


if __name__ == "__main__":
    main()

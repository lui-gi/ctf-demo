"""Build script for squid_in_the_logs.

Produces:
  files/access.log     — Squid combined-format access log, ~200k lines, ~40 MB
  files/MANIFEST.txt

Determinism:
  All noise traffic (timestamps, source IPs, URLs, UAs, status codes) and the
  exfil rows (seq order, payload chunks) are derived deterministically from a
  SHA-256-counter PRG seeded by ("squid_in_the_logs|" + flag). Two builds are
  byte-identical.

Exfil channel:
  ~2000 rows with the literal UA 'DeadwakeOps/0.1 (channel)' carrying URL
  parameters seq=N&data=<24-char b64 chunk>. Reassemble in seq-order, b64-decode
  to recover a small text payload whose body includes the canonical flag.
"""
from __future__ import annotations

import base64
import hashlib
from pathlib import Path

ISLAND = Path(__file__).resolve().parent.parent
OUT = ISLAND / "files"
OUT.mkdir(exist_ok=True)
flag = (ISLAND / "flag.txt").read_text(encoding="utf-8").strip()


def make_rng(seed: bytes):
    counter = [0]

    def randbytes(n: int) -> bytes:
        out = b""
        while len(out) < n:
            out += hashlib.sha256(seed + counter[0].to_bytes(8, "big")).digest()
            counter[0] += 1
        return out[:n]

    def randint(a: int, b: int) -> int:
        # uniform-ish in [a, b]
        span = b - a + 1
        nbits = (span - 1).bit_length()
        nbytes = max(1, (nbits + 7) // 8)
        while True:
            x = int.from_bytes(randbytes(nbytes), "big")
            if x < (1 << nbits):
                return a + (x % span)

    def choice(seq):
        return seq[randint(0, len(seq) - 1)]

    return randbytes, randint, choice


randbytes, randint, choice = make_rng(b"squid_in_the_logs|" + flag.encode("utf-8"))


# ---- exfil payload ---------------------------------------------------------
# Build a ~36 KB shipping-ledger document the agent is exfiltrating. Players
# reassemble it and read the flag from the rotated-safehouse-word line.
LEDGER_HEADER = (
    "DEADWAKE LOGISTICS — internal shipping ledger Q1 2026\n"
    "compiled by: the auditor\n"
    "channel:     ops/3 (encrypted)\n"
    "==================================================================\n"
    "\n"
    "rotated safehouse word for the long-dread route is recorded below.\n"
    "all captains update their boarding ledgers within the week. the\n"
    "previous word is burned.\n"
    "\n"
    f"  word: {flag}\n"
    "\n"
    "==================================================================\n"
    "ledger entries (chronological, port arrival order):\n\n"
)
SHIPS = [
    "Long Dread", "Sable Cross", "Reefborn", "Crimson Anchor", "Bilge Tern",
    "Brackenhowe", "Hesperus", "Maribel", "Tideglass", "Bonebound",
    "Ironheart's Wake", "Saltspire", "Gallowstide", "Marrowfen", "Wraithcove",
]
PORTS = [
    "Tortuga", "Marrowtide", "Bitterhook", "Saltmark", "Greycliff",
    "Ashpoint", "Coldfern", "Hollowmere", "Reefborn Bay", "Duskholm",
    "Tideglass Reach", "Silvercove", "Brackenhowe Quay",
]
CARGO = [
    "salt-pork (12 barrels)", "iron nails (3 crates)", "linen bolts (8 bales)",
    "hemp rope (24 coils)", "tar (6 barrels)", "sealing wax (2 chests)",
    "spiced rum (4 demijohns)", "navigation charts (1 portfolio)",
    "telescopes (3, polished brass)", "sailmaker's needles (1 box)",
    "powder, fine grade (2 kegs)", "boatswain's whistles (12)",
    "lamp oil (8 jars)", "dried biscuit (40 sacks)", "salted cod (12 barrels)",
]

ledger_lines = []
target_bytes = 36_000  # ~36 KB plain → ~48 KB b64 → ~2000 24-char chunks
i = 0
while sum(len(s) for s in ledger_lines) + len(LEDGER_HEADER) < target_bytes:
    day = (i % 90) + 1
    ship = choice(SHIPS)
    port = choice(PORTS)
    cargo = choice(CARGO)
    fee = 100 + randint(0, 4900)
    ledger_lines.append(
        f"  d+{day:02d}  {ship:18s}  ->  {port:18s}  cargo: {cargo:32s}  fee: {fee:5d} dbl\n"
    )
    i += 1

payload_text = (LEDGER_HEADER + "".join(ledger_lines)).encode("utf-8")

b64_full = base64.b64encode(payload_text).decode("ascii")

# Chunk into 24-char base64 segments. Pad with 'A' (which decodes to a
# zero byte) so the final chunk fills a constant 24 chars; we will use the
# total length on decode side via base64 padding rules naturally.
CHUNK = 24
chunks = [b64_full[i : i + CHUNK] for i in range(0, len(b64_full), CHUNK)]
# Pad final chunk to CHUNK chars with '=' so b64 decode survives. b64 standard
# allows trailing '=' anywhere only at end; final chunk will already be padded
# correctly because b64encode produced a length-multiple-of-4 string.
NUM_EXFIL = len(chunks)
print(f"[squid] exfil payload {len(payload_text)} bytes -> {len(b64_full)} b64 chars -> {NUM_EXFIL} chunks of {CHUNK}")

# ---- noise traffic generators ---------------------------------------------
NOISE_DOMAINS = [
    "stackoverflow.com", "github.com", "news.ycombinator.com", "wikipedia.org",
    "reddit.com", "duckduckgo.com", "imgur.com", "pypi.org",
    "developer.mozilla.org", "rfc-editor.org", "kernel.org", "python.org",
    "dockerhub.io", "npmjs.com", "crates.io", "rubygems.org",
    "weather.example", "transit.example", "shippingnews.example",
    "tradejournal.example", "cargonews.example", "lighthousekeepers.example",
]
NOISE_PATHS = [
    "/", "/index.html", "/api/v1/users", "/static/js/app.js",
    "/static/css/main.css", "/login", "/dashboard", "/help/faq",
    "/posts/2026/03/long-dread-shipping", "/topics/python/asyncio",
    "/q/4203947/threading", "/wiki/Caesar_cipher", "/r/sailing/comments/abc",
    "/blog/2026-04-15", "/about", "/contact", "/api/v1/orders/142",
    "/static/img/logo.svg", "/static/img/header.png", "/healthz",
    "/_next/static/chunks/main.js", "/favicon.ico", "/manifest.json",
    "/api/v2/feed", "/search?q=long+dread+shipping", "/calendar/april-2026",
]
NOISE_UAS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
    'curl/8.5.0',
    'Wget/1.21.4',
    'python-requests/2.31.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
]
EXFIL_UA = 'DeadwakeOps/0.1 (channel)'
EXFIL_HOST = "innocentlooking.example"

STATUS_CODES = [(200, 0.78), (304, 0.10), (302, 0.05), (404, 0.04), (403, 0.02), (500, 0.01)]
status_pool = []
for code, w in STATUS_CODES:
    status_pool.extend([code] * int(w * 100))

NUM_NOISE = 200_000 - NUM_EXFIL
print(f"[squid] generating {NUM_NOISE} noise rows + {NUM_EXFIL} exfil rows = {NUM_NOISE + NUM_EXFIL} total")

# Timestamps span 90 days (one quarter). Squid combined log uses standard time format.
import time as _time
START_TS = 1735689600  # 2025-01-01 00:00:00 UTC (deterministic anchor)
SPAN_SEC = 90 * 24 * 3600

# Squid combined-format example:
#   192.168.10.20 - - [01/Jan/2025:00:00:01 +0000] "GET /index.html HTTP/1.1" 200 1432 "-" "Mozilla/5.0 ..."
def fmt_squid_line(ts: int, ip: str, method: str, host: str, path: str, code: int, size: int, ref: str, ua: str) -> str:
    t = _time.gmtime(ts)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    timestr = f"{t.tm_mday:02d}/{months[t.tm_mon-1]}/{t.tm_year}:{t.tm_hour:02d}:{t.tm_min:02d}:{t.tm_sec:02d} +0000"
    return f'{ip} - - [{timestr}] "{method} https://{host}{path} HTTP/1.1" {code} {size} "{ref}" "{ua}"\n'


def random_ip() -> str:
    return f"10.42.{randint(0, 255)}.{randint(1, 254)}"


# Build all rows with a (random_ts, line) tuple, then sort by ts to get the
# realistic in-time-order log Squid would produce. Exfil rows get scattered
# random timestamps too so they're shuffled among noise.
rows: list[tuple[int, str]] = []

for _ in range(NUM_NOISE):
    ts = START_TS + randint(0, SPAN_SEC - 1)
    ip = random_ip()
    method = choice(["GET", "GET", "GET", "GET", "GET", "POST", "GET", "HEAD"])
    host = choice(NOISE_DOMAINS)
    path = choice(NOISE_PATHS)
    code = choice(status_pool)
    size = randint(120, 480_000)
    ref = "-" if randint(0, 4) == 0 else f"https://{choice(NOISE_DOMAINS)}/"
    ua = choice(NOISE_UAS)
    rows.append((ts, fmt_squid_line(ts, ip, method, host, path, code, size, ref, ua)))

# Exfil rows. Pick one consistent IP for the exfil agent to look slightly
# realistic (one workstation phoning home), but scatter the timestamps so they
# appear shuffled in the log timeline.
EXFIL_IP = f"10.42.{randint(0, 255)}.{randint(1, 254)}"
for seq, chunk in enumerate(chunks):
    ts = START_TS + randint(0, SPAN_SEC - 1)
    path = f"/api/track?seq={seq}&data={chunk}"
    code = 200
    size = randint(80, 320)
    rows.append((ts, fmt_squid_line(ts, EXFIL_IP, "GET", EXFIL_HOST, path, code, size, "-", EXFIL_UA)))

# Sort by ts → realistic log
rows.sort(key=lambda r: r[0])

# Write
log_path = OUT / "access.log"
with log_path.open("w", encoding="utf-8") as fh:
    for _, line in rows:
        fh.write(line)

manifest = (
    "Squid in the Logs — player-served files\n"
    "==========================================\n"
    f"access.log    — Squid combined-format access log, {len(rows)} lines, "
    f"{log_path.stat().st_size:,} bytes\n"
    "                 Most rows are noise traffic to common domains; one\n"
    "                 covert exfil channel is hidden in there.\n"
)
(OUT / "MANIFEST.txt").write_text(manifest, encoding="utf-8")

# Self-verify: simulated cold-solve must recover the literal flag
print("[squid] self-verify: filter, sort, decode, search for flag")
import re
ex_rows = []
for line in log_path.read_text(encoding="utf-8").splitlines():
    if EXFIL_UA in line:
        m = re.search(r"seq=(\d+)&data=([A-Za-z0-9+/=_-]+)", line)
        if m:
            ex_rows.append((int(m.group(1)), m.group(2)))
ex_rows.sort()
seqs = [s for s, _ in ex_rows]
assert seqs == list(range(NUM_EXFIL)), f"seq numbers not 0..{NUM_EXFIL-1} contiguous"
recovered = base64.b64decode("".join(d for _, d in ex_rows))
assert flag.encode() in recovered, "flag not present in reassembled exfil payload"
print(f"[squid] cold-solve OK: {len(ex_rows)} exfil rows, payload {len(recovered)} bytes contains flag")
print(f"[squid] log size: {log_path.stat().st_size / 1_000_000:.2f} MB")

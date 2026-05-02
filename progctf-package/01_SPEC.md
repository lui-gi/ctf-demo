# progctf — Technical Specification

**Event name:** progctf
**Hosting group:** Deadwake
**Theme:** Pirate / Age of Sail
**Total challenges:** 30
**Flag format:** `progctf{lowercase_snake_case}` — regex `^progctf\{[a-z0-9_]+\}$`

---

## 1. Architecture

```
CLIENT      React SPA  •  Live leaderboard (WS)  •  Mock terminal (xterm.js iframe)
              │
EDGE        CDN + Load Balancer (Cloudflare / NGINX)  →  Auth gateway (JWT, rate limiting)
              │
API         Core REST (Node.js / Fastify)  •  WebSocket server (Socket.io)  •  Admin API
              │
SERVICES    Flag validator (hashed)  •  Scoring engine  •  Challenge sandbox (Docker)  •  Auth (email + JWT)
              │
DATA        PostgreSQL  •  Redis (sessions + Charts cache)  •  Object storage (challenge files)
              │
INFRA       Docker / K8s  •  CI/CD  •  Monitoring + logging
```

## 2. Database Schema (PostgreSQL)

```sql
-- Pirates (players)
CREATE TABLE pirates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,           -- argon2id
  crew_id UUID REFERENCES crews(id),
  role TEXT NOT NULL DEFAULT 'pirate',   -- pirate | admin
  created_at TIMESTAMPTZ DEFAULT now(),
  banned_at TIMESTAMPTZ
);

-- Crews (teams)
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  flag_emoji TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  banned_at TIMESTAMPTZ
);

-- Islands (challenges)
CREATE TABLE islands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,                -- cursed_ports | cipher_cove | shipwrights_forge | lighthouse | crows_nest | hidden_cargo | keymaster
  difficulty TEXT NOT NULL,              -- port | open_sea | cursed_depths
  description_md TEXT NOT NULL,
  base_points INT NOT NULL,
  current_points INT NOT NULL,           -- updated by scoring engine
  flag_hash TEXT NOT NULL,               -- argon2id of canonical flag
  files_url TEXT,                        -- object storage prefix
  sandbox_image TEXT,                    -- docker image tag if hosted
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | published | archived
  first_blood_crew UUID REFERENCES crews(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Whispers (hints)
CREATE TABLE whispers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  island_id UUID REFERENCES islands(id) ON DELETE CASCADE,
  ordinal INT NOT NULL,                  -- 1, 2, 3
  body_md TEXT NOT NULL,
  cost_points INT NOT NULL DEFAULT 0
);

-- Submissions (every flag attempt)
CREATE TABLE submissions (
  id BIGSERIAL PRIMARY KEY,
  pirate_id UUID REFERENCES pirates(id),
  crew_id UUID REFERENCES crews(id),
  island_id UUID REFERENCES islands(id),
  submitted TEXT NOT NULL,               -- raw submitted text (NOT hashed — for audit)
  is_correct BOOLEAN NOT NULL,
  awarded_points INT NOT NULL DEFAULT 0,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON submissions (crew_id, island_id);
CREATE INDEX ON submissions (created_at);

-- Hint reveals (audit which Crew burned which Whisper)
CREATE TABLE whisper_reveals (
  crew_id UUID REFERENCES crews(id),
  whisper_id UUID REFERENCES whispers(id),
  cost_paid INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (crew_id, whisper_id)
);
```

## 3. REST API (Core)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/sign-articles` | none | Register a Pirate |
| POST | `/api/auth/board` | none | Login (returns JWT) |
| POST | `/api/crews` | pirate | Create a Crew |
| POST | `/api/crews/join` | pirate | Join via invite code |
| GET | `/api/islands` | pirate | List all *published* Islands (sanitized — no flag) |
| GET | `/api/islands/:slug` | pirate | Island detail |
| POST | `/api/islands/:slug/submit` | pirate | Submit a Treasure (rate-limited: 5/min/Crew/Island) |
| POST | `/api/islands/:slug/whisper/:n` | pirate | Reveal Whisper n (deducts points) |
| GET | `/api/charts` | pirate | Top Crews snapshot |
| GET | `/api/charts/me` | pirate | My Crew's standing + solved Islands |

## 4. Admin API

All routes gated by `role=admin`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/islands` | Create Island |
| PATCH | `/admin/islands/:id` | Edit Island |
| DELETE | `/admin/islands/:id` | Delete Island |
| POST | `/admin/islands/:id/files` | Upload challenge files |
| PATCH | `/admin/islands/:id/status` | draft / published / archived |
| POST | `/admin/islands/:id/whispers` | Add a Whisper |
| GET | `/admin/islands/:id/stats` | Solve count, first-blood, attempt count |
| POST | `/admin/sandbox/:id/rebuild` | Rebuild challenge container |
| POST | `/admin/charts/recalc` | Force leaderboard recalc + Redis flush |
| POST | `/admin/crews/:id/ban` | Ban a Crew |
| POST | `/admin/pirates/:id/ban` | Ban a Pirate |
| GET | `/admin/submissions?island_id=&crew_id=` | Submission log |
| POST | `/admin/voyage/freeze` | Freeze The Charts (no more submissions accepted) |
| POST | `/admin/voyage/unfreeze` | Unfreeze |

## 5. Scoring Engine

**Dynamic decay formula** (per Island):

```
current_points = max(
  floor_pct * base_points,
  base_points * (1 - decay_rate * solves)
)
```

- `floor_pct = 0.40` (Cursed Depths never drops below 40% of base)
- `decay_rate = 0.02` for Open Sea / Cursed Depths
- `decay_rate = 0.01` for Port (decays slower)

**First-blood bonus:** +25 pts to the first Crew to solve any Cursed Depths Island. Awarded once. Announced via WebSocket broadcast.

**Whisper cost:** subtracted from awarded points if Crew reveals before solving:
- Whisper 1: -10%
- Whisper 2: -20%
- Whisper 3: -35%
(Cumulative; revealing all three caps the maximum award at ~35% of current points.)

## 6. Flag Validator

```
submit(raw):
  1. Validate format with regex ^progctf\{[a-z0-9_]+\}$  → reject if no match
  2. Rate-limit check (Redis): 5 attempts / minute / Crew / Island
  3. Already-solved check: reject if Crew already has correct submission
  4. Hash raw with argon2id using island.flag_hash params
  5. Constant-time compare
  6. Log submission (correct or not)
  7. If correct: award points (current_points - whisper_penalty), check first-blood, broadcast Charts update
```

## 7. WebSocket Events

Server → Client:
- `charts.update` — full top-20 snapshot every 5s + on every solve
- `charts.first_blood` — `{ island_slug, crew_name, awarded_at }`
- `voyage.frozen` / `voyage.unfrozen`
- `island.published` / `island.archived` (admin actions)

## 8. Frontend Routes

- `/` — landing (Sign the Articles / Board)
- `/voyage` — category grid (the 7 Categories as island clusters on a parchment map)
- `/voyage/:category` — Islands in that category
- `/voyage/:category/:slug` — Island detail + submission box + Whispers
- `/charts` — The Charts (live)
- `/crew/:name` — Crew profile
- `/terminal` — xterm.js iframe (mock terminal for Crow's Nest / Lighthouse challenges that benefit from a CLI feel)
- `/admin/*` — admin panel (gated)

## 9. Sandbox Strategy

Each hosted Island runs as its own container, behind the auth gateway. Per-Crew instance OR shared instance — Cartographer specifies per Island.

- **Per-Crew instance** (preferred for Cursed Ports / web exploitation): each Crew gets a fresh container on first visit, torn down after 30 min idle. Prevents Crews from breaking each other's environments.
- **Shared instance**: read-only artifact challenges (a hosted file server, a single PCAP download). Safe to share.

K8s `Job` or `Deployment` per Island. Network policy: container can only egress to localhost — no external internet.

## 10. Security (Platform Itself)

- All flag comparisons constant-time
- Argon2id flag hashing (m=64MB, t=3, p=4)
- JWT with 8h expiry, refresh tokens
- Per-Crew rate limit on submissions
- Per-IP rate limit on auth endpoints (10/min)
- Strict CSP, no inline JS
- Submission log includes IP + UA for forensic review
- Admin actions all logged with admin pirate_id
- Object storage signed URLs only (no public buckets)

## 11. Bounty / Placements

Final standings on The Charts at freeze:
- 🥇 **Pirate King** — 1st place Crew
- 🥈 **Emperor Yonko** — 2nd place
- 🥉 **Warlord of the Sea** — 3rd place

Tiebreaker: earliest timestamp of last scoring submission wins (i.e. the Crew that locked their score in first).

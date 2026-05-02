# progctf — Backend (Bosun)

Fastify + Socket.io API powering The Voyage. Pirate-themed CTF backend with hashed flag validator, dynamic decay scoring, admin API, and live Charts WebSocket.

## Stack
- Node 20 + TypeScript (NodeNext)
- Fastify 4 + plugins (cors, jwt, cookie, rate-limit, websocket)
- Socket.io for live Charts
- PostgreSQL via `pg`
- Redis via `ioredis` (rate limit, charts cache, voyage freeze state)
- argon2id for flag + password hashing
- zod for env + payload validation
- vitest for unit tests

## Local dev

```bash
pnpm install
cp .env.example .env
# Run migrations against your local Postgres:
psql "$DB_URL" -f ../db/migrations/001_initial.sql
psql "$DB_URL" -f ../db/migrations/002_voyage_state.sql
pnpm dev
```

If `pnpm` isn't installed, `npm install` works as fallback.

## Tests

```bash
pnpm test
```

Unit tests cover the load-bearing services: validator, scoring engine, JWT auth.

## Smoke test

```bash
bash scripts/smoke.sh
```

Exercises register → board → create crew → submit (malformed/wrong/correct) → charts.

## Routes
See `openapi.yaml` for the full surface.

- `POST /api/auth/sign-articles` — register a Pirate
- `POST /api/auth/board` — login (issues JWT in httpOnly cookie)
- `POST /api/crews` — create a Crew
- `POST /api/crews/join` — join via invite code
- `GET  /api/islands` — list published Islands (no flag_hash)
- `GET  /api/islands/:slug` — Island detail
- `POST /api/islands/:slug/submit` — submit a Treasure (rate-limited 5/min/Crew/Island)
- `POST /api/islands/:slug/whisper/:n` — reveal Whisper n
- `GET  /api/charts` — top-20 Crews
- `GET  /api/charts/me` — my Crew's standing

Admin routes under `/admin/*` (role=admin JWT required, every mutation audit-logged).

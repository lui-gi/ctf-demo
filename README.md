# progctf

**progctf** is a pirate-themed Capture-the-Flag platform (event flavor: *Deadwake → progsu*). The backend (**Bosun**) is Fastify + Postgres + Redis + Socket.io; the frontend (**Helmsman**) is Vite + React + Zustand + Tailwind + GSAP. The current build ships **30 challenges across 7 themed clusters**. The homepage hero is a GSAP-driven scene that drifts from sunny weather into a stormy Flying Dutchman — that's expected when you hit `localhost:5173`, not a bug.

This README is the local-dev quickstart. The prod runbook lives in `OPERATOR_RUNBOOK.md`.

---

## Prerequisites

- **Docker Desktop** — running, with the WSL2 backend or Hyper-V backend enabled.
- **Node.js 20+** — the running stack is on **v24.14.0**, that works.
- **Windows-native pnpm 10+** — see the Windows-only callout below. *Critical.*

---

## Boot the stack — three commands

```powershell
# 1. Data tier (Postgres :5433, Redis :6380)
docker compose -f infra/docker-compose.dev.yml up -d

# 2. Backend (Bosun) — http://127.0.0.1:4000
cd backend
pnpm install            # first checkout / after deps change
pnpm dev                # tsx watch — leave running

# 3. Frontend (Helmsman) — http://localhost:5173
cd frontend
pnpm install            # first checkout
pnpm dev                # vite — leave running
```

`pnpm dev` in `backend/` auto-loads `backend/.env` via tsx's `--env-file` flag (already wired in `package.json`). No inline env-var ceremony needed.

> **If you wipe `backend/.env`:** copy `backend/.env.example` to `backend/.env` and tweak. Without `.env`, Bosun crashes at startup because `loadEnv()` (zod) fails — `JWT_SECRET` and `ARGON2_PEPPER` have no defaults.

---

## Verify the boot

```powershell
curl http://localhost:5173/api/voyage/state    # 200 {"ok":true,"frozen":false}
curl http://localhost:5173/                    # 200 (Vite SPA)
curl http://127.0.0.1:4000/health              # 200 {"ok":true,"name":"progctf-backend",...}
```

The health endpoint is `/health` (not `/healthz`).

---

## First-time setup (after a fresh DB)

```powershell
# Seed the 30 islands from challenges/<cluster>/<tier>/<slug>/spec.yaml
cd backend
pnpm seed:islands

# Promote your account to admin
pnpm promote-admin <your-email@example.com>
```

**Then log out and log back in.** The admin cookie is set on login, *not* on role change — promoting an existing logged-in session won't unlock the admin panel until you re-issue the cookie. Real footgun.

A bundled test admin already lives in the dev DB:

| field    | value                          |
| -------- | ------------------------------ |
| email    | `quartermaster@deadwake.test`  |
| password | `Trade-Wind-2026!`             |
| role     | admin                          |

---

## Important paths in the running stack

- **Frontend:** `http://localhost:5173` — use `localhost`, **not** `127.0.0.1`. Vite's dev server binds IPv6-only on Windows; `127.0.0.1` will refuse the connection.
- **Backend:** `http://127.0.0.1:4000` — use `127.0.0.1`, **not** `localhost`. Bosun binds `0.0.0.0` (IPv4-only); `localhost` resolves to IPv6 `[::1]` first on Windows and would mismatch.
- **SPA proxy:** `/api/*` and `/socket.io` are proxied frontend → backend (see `frontend/vite.config.ts`).
- **Routes** (post-pivot, 2026-05-02 vocab):
  `/`, `/login`, `/signup`, `/challenges`, `/challenges/:cat`, `/challenges/:cat/:slug`, `/leaderboard`, `/team/:name`, `/closing`, `/admin/*`, `/terminal`.

---

## Windows-only callout — LOAD-BEARING

> **All Node tooling on this host runs from Windows-native pnpm only.** Do **not** run `pnpm install` from a WSL shell — pnpm symlinks get written with `/mnt/c/...` `NODE_PATH` and Windows Node can't resolve them. `pnpm dev` then fails with `Cannot find module 'tsx/dist/cli.mjs'` even though the file is physically there.
>
> WSL is reserved exclusively for the deferred Linux/Sage/`arm-none-eabi` pass on the six challenge artifacts that need a Linux toolchain (challenges #16, #24, #25, #26, #29, plus the Docker compose runtimes for #9 / #10 / #21 / #22 / #27).

---

## Common fixes

- **`tsx is not recognized` / `vite is not recognized`** — `node_modules` was installed under WSL. From Windows-native PowerShell, in both `backend/` and `frontend/`:
  ```powershell
  Remove-Item -Recurse -Force node_modules
  pnpm install
  ```
- **Backend boots, frontend boots, but login fails silently** — check `frontend/vite.config.ts` proxy target is `http://127.0.0.1:4000` (not `localhost` — IPv6 mismatch).
- **`/api/voyage/state` returns 404** — `backend/src/routes/voyage.ts` not registered in `server.ts`. (It is, in the current build. If you ever wipe and reseed, the route registration is independent of DB state.)
- **`pnpm dev` exits with `Invalid environment config: JWT_SECRET ...`** — `backend/.env` is missing or corrupt. Recreate from `backend/.env.example`.

---

## Test commands

```powershell
# Backend (vitest, 78 tests)
cd backend
pnpm test

# Frontend (vitest, 16 tests)
cd frontend
pnpm test
```

---

## Where things live (one-line each)

- `backend/src/routes/` — Fastify route plugins (auth, islands, charts, crews, voyage, admin)
- `backend/src/ws/` — Socket.io bus (charts updates, freeze events, first-blood ticker)
- `backend/src/auth/jwt.ts` — JWT + cookie issuance
- `backend/src/services/validator.ts` — argon2id flag verification
- `backend/scripts/{promote-admin,seed-islands}.mjs` — ops helpers (read `DB_URL` / `ARGON2_PEPPER` from `process.env`; export them inline if running outside `pnpm dev`)
- `frontend/src/routes/Landing.tsx` — homepage GSAP hero (sunny → stormy Dutchman)
- `frontend/src/routes/{Voyage,Category,Island,Charts,Crew,Board,SignArticles}.tsx` — player pages (filenames keep the themed flavor; URLs are plain English)
- `frontend/src/admin/` — admin panel (lazy-loaded, separate bundle)
- `frontend/src/ui/DifficultyPill.tsx` — color-coded tier pill (used everywhere difficulty appears)
- `frontend/src/theme/strings.ts` — central UI copy table (themed narrative + plain chrome)
- `challenges/<cluster>/<tier>/<slug>/spec.yaml` — locked challenge specs (30 total)

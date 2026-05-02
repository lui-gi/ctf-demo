# progctf — Helmsman (frontend)

The player-facing SPA for **progctf**, the progsu pirate-themed Capture the Flag event.
Built with Vite + React 18 + TypeScript.

## Prerequisites

- Node.js 20+
- pnpm 9+ (or npm as fallback)

## Install

```bash
pnpm install
# or
npm install
```

## Run dev server

The Vite dev server runs on `http://localhost:5173` and proxies `/api` and
`/socket.io` to Bosun's backend on `http://localhost:3000`.

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

The admin panel is code-split into its own bundle (`admin-*.js`) via
`React.lazy` + a `manualChunks` rule. Players who never visit `/admin/*`
do not download admin code.

## Tests

Unit / contract tests (vitest):

```bash
pnpm test
```

End-to-end (Playwright):

```bash
pnpm test:e2e
```

The E2E happy-path spec auto-skips when Bosun's backend is not reachable
on `http://localhost:3000` — see `playwright/happy-path.spec.ts`.

## Layout

```
src/
  theme/        colors, typography, global CSS, themed copy table
  ui/           Button, Modal, Toast, Input, Card, Badge, Skeleton, Spinner
  auth/         AuthProvider, RequireAuth, RequireAdmin
  api/          REST clients (islands, crews, charts, admin)
  ws/           Socket.io client w/ exponential backoff
  routes/       Player-facing routes (mirroring spec §8)
  components/   LiveCharts, MockTerminalIframe
  admin/        Admin panel — lazy-loaded, separate bundle
  lib/          Markdown wrapper (react-markdown + DOMPurify)
test/           vitest unit + contract tests
playwright/     Playwright E2E specs
```

## Hard rules baked in

- JWT lives in an httpOnly cookie set by the backend; the SPA never reads it.
- All UI copy goes through `src/theme/strings.ts` — no hardcoded English in components.
- Markdown (descriptions, Whispers) is sanitized via `rehype-sanitize` plus a
  DOMPurify pass before render.
- WebSocket Charts auto-reconnect with exponential backoff (1s → 2s → 4s → 8s → 16s, capped).
- 429 submission responses surface a themed cooldown countdown.
- Strict CSP on `index.html`; no inline JS anywhere.

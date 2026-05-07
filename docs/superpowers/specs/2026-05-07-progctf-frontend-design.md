# progctf Frontend Design Spec

**Date:** 2026-05-07
**Scope:** Frontend only (React + Vite). Backend and sponsor landing page are out of scope.
**Event scale:** ~300 concurrent players.

---

## Overview

progctf is a pirate-themed jeopardy-style CTF platform with 7 challenge categories and 30 total challenges (8 easy, 12 medium, 10 hard). The frontend is a single-page application that goes live when the event starts — no pre-event countdown or coming-soon state.

---

## Visual Identity

| Element | Spec |
|---|---|
| Background | Deep navy (`#03082e` → `#0a1a5c` gradient) |
| Hero | Moonlit ocean illustration — moon top-left, starfield, rocky coast at bottom |
| Wordmark | `progctf` — *prog* in white italic, **ctf** in amber (`#ffb347`) italic, monospace font |
| Accent color | Amber `#ffb347` (buttons, flag inputs, active states) |
| Secondary text | Steel blue `#8ab4e8` |
| Success | Green `#4dbb88` |
| Error | Red `#cc4444` |

Inspiration: `inspiration.jpg` (deep ocean night scene). Logo asset: `progctf-logo.png`.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS — no component library, fully custom components |
| State | React Context for auth; component-local state for page data |
| Testing | Vitest + React Testing Library |

---

## Pages & Routing

### Public (unauthenticated)

| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Deep Ocean hero, login + register CTAs. Redirects to `/dashboard` if already authenticated. |
| `/login` | Login | Centered auth card, no top nav. |
| `/register` | Register | Username, email, password. No crew creation at registration. |

### Authenticated

| Route | Page | Notes |
|---|---|---|
| `/dashboard` | Dashboard | Personal stats, challenge progress summary, recent solves. |
| `/challenges` | Category Grid | 7 category cards with icon, name, progress bar, solved/total count. |
| `/challenges/:category` | Category Page | Challenge cards for one category. Breadcrumb back to grid. |
| `/challenges/:category/:slug` | Challenge Page | Two-column layout (see below). |
| `/bounties` | Leaderboard | Crew rankings — name, total points, solve count. 30-second poll. |
| `/crew` | Crew Page | View crew members, invite link, leave crew. Create or join a crew. |
| `/profile` | Profile | Personal stats and solve history. |

A route guard wraps all authenticated routes — unauthenticated visitors are redirected to `/login`. The 404 page uses the Deep Ocean theme with a "Back to Challenges" link.

---

## Navigation

**TopNav** — present on all authenticated pages, absent on login/register:
- Left: *progctf* wordmark (links to `/dashboard`)
- Center/right: Challenges · Bounties · Crew · Profile · Logout
- Far right inline: crew name + current rank (e.g. `Crew: Jolly Roger · #4`), refreshed every 30 seconds

**AuthLayout** — login and register pages use a centered card wrapper with no top nav.

---

## Challenge Page Layout

The challenge page (`/challenges/:category/:slug`) uses a full-page two-column layout:

**Left column — embed panel:**
- Breadcrumb: `Challenges › [Category] › [Challenge Name]`
- Challenge title, difficulty badge, point value
- Embedded challenge content (iframe or file download links)

**Right column — questions panel:**
- Labeled "Questions"
- Ordered list of guiding sub-questions, each with:
  - Question text (e.g. "What IP address does the attacker use?")
  - Text input + Submit button
  - Inline correct/incorrect feedback (green checkmark + points earned, or shake animation)
- Divider
- Flag submission: amber-styled `FlagInput` with `progctf{...}` placeholder + "Submit Flag" button

Both columns scroll independently. Questions are submitted individually — no page reload on submission.

---

## Pirate Theming

| Standard term | progctf term |
|---|---|
| Teams | Crews |
| Leaderboard / Scoreboard | Bounties |

All other labels (Challenges, Profile, Submit, Dashboard, etc.) use standard English. Pirate flavor is used in decorative copy, empty states, and error messages only.

---

## Component Architecture

### Layout components
- `RootLayout` — deep navy background, fonts, mounts TopNav
- `TopNav` — wordmark, nav links, crew rank badge, logout
- `AuthLayout` — centered card for login/register, no nav

### Page components (one per route)
Each page owns its own data fetching via `fetch` + local React state.

### Shared UI components
| Component | Purpose |
|---|---|
| `CategoryCard` | Category overview card — icon, name, progress bar, solved/total count |
| `ChallengeCard` | Individual challenge card within a category — name, difficulty badge, points, solved state |
| `QuestionBlock` | Single guiding question with input, submit, correct/incorrect state |
| `FlagInput` | Amber-styled flag field with `progctf{...}` placeholder |
| `DifficultyBadge` | Easy (green) / Medium (yellow) / Hard (red) pill |
| `SolveToast` | Pop-up notification on correct answer |
| `CrewBadge` | Inline crew name + rank, used in TopNav and Profile |

---

## Data Flow

**Authentication:**
- JWT returned on login/register, stored in `localStorage`
- All API requests send `Authorization: Bearer <token>`
- `AuthContext` holds decoded user, exposes `login`, `logout`, `isAuthenticated`
- 401 from any request → clear JWT → redirect to `/login`

**Challenge data:**
- Category list fetched once on `ChallengesPage` mount
- Individual challenge (questions, embed, points) fetched on `ChallengePage` mount
- No global challenge store — pages own their data

**Answer submission:**
- Each `QuestionBlock` POSTs independently on submit
- Response: `{ correct: boolean, pointsEarned: number }`
- Component updates local state — no page reload

**Bounties (leaderboard):**
- Fetched on `BountiesPage` mount, polled every 30 seconds
- Shows: rank, crew name, total points, solve count

**Crew rank in TopNav:**
- Polled every 30 seconds via `AuthContext`
- Lightweight fetch — crew name + rank only

---

## Error Handling

| Scenario | Behavior |
|---|---|
| API fetch failure | Page-level error state: themed message + retry button |
| Wrong answer | Inline "Incorrect" + shake animation on `QuestionBlock` |
| Auth expiry (401) | Clear JWT, redirect to `/login` |
| Unknown route | 404 page with "Back to Challenges" link |

---

## Testing

- **Vitest + React Testing Library** for component tests
- Priority coverage: `QuestionBlock` (correct/incorrect states), `FlagInput` submission, route guard redirect
- No E2E tests in scope — event deadline prioritizes component tests
- Manual QA checklist before go-live: login, crew creation/join, challenge submission, bounties refresh, mobile responsiveness

---

## Out of Scope

- Sponsor landing page (planned separately)
- Admin panel / challenge management UI
- Pre-event countdown / coming-soon page
- WebSocket real-time updates (30-second poll is sufficient at this scale)

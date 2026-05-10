# Auth Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Login and Register pages to match the Landing Page's atmospheric aesthetic — deep-navy starfield background, frosted-glass card, and on-brand form typography.

**Architecture:** `AuthLayout.tsx` owns all background visuals and the card shell; the two page components (`LoginPage.tsx`, `RegisterPage.tsx`) receive only form-element styling updates. No logic, routing, or API changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, inline styles for values not in the Tailwind config.

---

### Task 1: Restyle AuthLayout — background scene and frosted-glass card

**Files:**
- Modify: `frontend/src/components/layout/AuthLayout.tsx`

These are pure visual changes. Verify in a browser after implementing (`npm run dev` in `frontend/`).

- [ ] **Step 1: Replace AuthLayout with the new implementation**

Replace the entire file content with:

```tsx
import { Outlet, Link } from 'react-router-dom'

const STARS: [number, number, number, number][] = [
  [8, 5, 2, 0.70], [15, 12, 1, 0.40], [23, 3, 1, 0.60], [31, 18, 2, 0.50],
  [42, 8, 1, 0.35], [55, 4, 2, 0.65], [63, 15, 1, 0.45], [71, 7, 1, 0.55],
  [79, 11, 2, 0.40], [87, 3, 1, 0.70], [92, 19, 1, 0.30], [4, 28, 1, 0.50],
  [18, 35, 2, 0.40], [29, 22, 1, 0.60], [47, 30, 1, 0.35], [58, 25, 2, 0.50],
  [67, 32, 1, 0.45], [76, 28, 1, 0.55], [84, 22, 2, 0.40], [93, 35, 1, 0.30],
  [11, 42, 1, 0.50], [36, 45, 2, 0.40], [52, 38, 1, 0.60], [74, 43, 1, 0.35],
  [89, 48, 2, 0.45],
]

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #010310 0%, #03082e 55%, #0a1a52 100%)' }}
    >
      {/* Star field */}
      {STARS.map(([x, y, size, opacity], i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#fff',
            opacity,
          }}
        />
      ))}

      {/* Moon */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5%',
          left: '4%',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 36%, #ffffff 0%, #f5edd8 45%, #d4c280 100%)',
          boxShadow: '0 0 30px 14px rgba(255,248,215,0.18), 0 0 70px 36px rgba(200,225,255,0.08)',
        }}
      />

      {/* Logo */}
      <Link
        to="/"
        className="relative font-mono font-black italic text-3xl tracking-wide mb-8"
        style={{ zIndex: 10 }}
      >
        <span className="text-white">prog</span>
        <span
          className="text-teal"
          style={{ textShadow: '0 0 24px rgba(62,207,190,0.70), 0 0 55px rgba(62,207,190,0.35)' }}
        >
          ctf
        </span>
      </Link>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-[10px] p-8"
        style={{
          zIndex: 10,
          background: 'rgba(5, 12, 40, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(62, 207, 190, 0.30)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.50), 0 0 18px rgba(62,207,190,0.08)',
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

Run the dev server if not already running:
```bash
cd frontend && npm run dev
```

Open `http://localhost:5173/login`. Confirm:
- Deep navy gradient background
- Star field visible across the screen
- Moon in top-left corner
- `progctf` logo above a frosted-glass card with a subtle teal border
- Form renders inside the card

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AuthLayout.tsx
git commit -m "feat(auth): atmospheric background and frosted-glass card"
```

---

### Task 2: Restyle LoginPage — heading and input focus

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Update the heading**

Replace:
```tsx
<h2 className="text-xl font-bold text-white mb-6 text-center">Login</h2>
```

With:
```tsx
<p
  className="font-mono font-bold text-xs tracking-[0.4em] uppercase text-center mb-6"
  style={{
    color: '#d8ffe9',
    textShadow: '0 0 12px rgba(0,255,136,0.55), 0 0 28px rgba(57,255,20,0.35)',
  }}
>
  Login
</p>
```

- [ ] **Step 2: Update input focus color**

In both `<input>` elements, replace `focus:border-steel` with `focus:border-teal`.

Email input — replace:
```tsx
className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
```
With:
```tsx
className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-teal"
```

Password input — same replacement (`focus:border-steel` → `focus:border-teal`).

- [ ] **Step 3: Verify visually**

Open `http://localhost:5173/login`. Confirm:
- Heading reads "LOGIN" in small all-caps mono with a green glow
- Clicking into an input shows a teal border on focus (not steel blue)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(auth): restyle login heading and input focus to match hero"
```

---

### Task 3: Restyle RegisterPage — heading and input focus

**Files:**
- Modify: `frontend/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Update the heading**

Replace:
```tsx
<h2 className="text-xl font-bold text-white mb-6 text-center">Create Account</h2>
```

With:
```tsx
<p
  className="font-mono font-bold text-xs tracking-[0.4em] uppercase text-center mb-6"
  style={{
    color: '#d8ffe9',
    textShadow: '0 0 12px rgba(0,255,136,0.55), 0 0 28px rgba(57,255,20,0.35)',
  }}
>
  Create Account
</p>
```

- [ ] **Step 2: Update input focus color**

In all three `<input>` elements (username, email, password), replace `focus:border-steel` with `focus:border-teal`.

Each input currently has:
```tsx
className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-steel"
```

Change to:
```tsx
className="w-full bg-navy-950 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-teal"
```

- [ ] **Step 3: Verify visually**

Open `http://localhost:5173/register`. Confirm:
- Heading reads "CREATE ACCOUNT" in small all-caps mono with a green glow
- All three inputs show teal border on focus
- Existing tests still pass: `cd frontend && npm run test`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/RegisterPage.tsx
git commit -m "feat(auth): restyle register heading and input focus to match hero"
```

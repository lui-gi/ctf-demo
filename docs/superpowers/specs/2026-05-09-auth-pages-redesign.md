# Auth Pages Redesign

**Date:** 2026-05-09
**Scope:** `AuthLayout.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`

## Goal

Bring the Login and Register pages up to the visual standard of the Landing Page hero — atmospheric, on-brand, cohesive — without changing any form logic or routing.

## Architecture

Two files change; no new files are needed.

- **`AuthLayout.tsx`** owns the full-screen background scene and the frosted-glass card shell. It renders the `progctf` logo link above the card and the `<Outlet />` inside it.
- **`LoginPage.tsx` / `RegisterPage.tsx`** remain pure form content. They have no layout awareness and no structural changes — only form element styling updates.

## Background Scene (AuthLayout)

Full-screen deep-navy gradient matching the hero:

```
linear-gradient(180deg, #010310 0%, #03082e 55%, #0a1a52 100%)
```

Layered on top:

- **Star field** — ~30 scattered `div` dots at varying sizes (1–2px), positions, and opacities (0.3–0.8). Same static approach used in the hero.
- **Moon** — top-left corner, `~72px` circle, `radial-gradient(circle at 36% 36%, #ffffff, #f5edd8, #d4c280)`, warm box-shadow glow `rgba(255,248,215,0.22)`.

No cloud overlay, no water/hills silhouette — stars and moon only.

## Card

Centered via `min-h-screen flex flex-col items-center justify-center`.

- `background: rgba(5, 12, 40, 0.75)`
- `backdrop-filter: blur(12px)`
- `border: 1px solid rgba(62, 207, 190, 0.30)` — subtle teal
- `box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 18px rgba(62,207,190,0.08)` — faint outer glow
- `border-radius: 10px`
- `width: 100%, max-width: 24rem (max-w-sm)`, `padding: 2rem`

## Logo

Above the card (`mb-8`), unchanged from current implementation:

```jsx
<Link to="/" className="font-mono font-black italic text-3xl tracking-wide">
  <span className="text-white">prog</span>
  <span className="text-teal">ctf</span>
</Link>
```

## Form Element Styling

**Page heading** ("Login" / "Create Account"):
- `font-mono font-bold text-xs tracking-[0.4em] uppercase`
- Color: `#d8ffe9`
- `text-shadow: 0 0 12px rgba(0,255,136,0.55), 0 0 28px rgba(57,255,20,0.35)`
- Matches the "Encrypted Treasures" sign treatment

**Labels:** keep `text-steel` (`#8ab4e8`), `text-xs`

**Inputs:**
- Background: `bg-navy-950`
- Border: `border border-navy-700`
- Focus: `focus:border-teal focus:outline-none` — replaces current `focus:border-steel`

**Submit button:** unchanged — `bg-amber text-navy-950 font-bold` — amber is the app-wide action color

**Cross-page links** ("No account? Register" / "Already have an account? Login"):
- Unchanged — `text-amber hover:underline`

## Out of Scope

- No changes to form validation logic or API calls
- No animations on the card or form elements
- No changes to routing or `RedirectIfAuth` behavior

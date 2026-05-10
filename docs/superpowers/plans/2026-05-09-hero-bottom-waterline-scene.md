# Hero Bottom Waterline Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three ambient, bobbing decorative elements (treasure chest, skull, skeletal hand) to the waterline at the bottom of the hero section.

**Architecture:** Convert the existing self-closing water surface `div` in `LandingPage.tsx` into a container, add three SVG stand-ins as absolutely-positioned children, and wire up independent CSS bob animations via a new keyframe in the hero's existing `<style>` block. PNG assets drop in later by swapping the SVG tags for `<img>` tags — the CSS classes stay the same.

**Tech Stack:** React (TSX), inline CSS-in-JSX `<style>` block, GSAP already present but not used here, Vite dev server, Vitest

---

## File Map

| Action | Path |
|---|---|
| Modify | `frontend/src/pages/LandingPage.tsx` |

No new files until real assets arrive. When they do, drop them in `frontend/public/assets/` and run Task 3.

---

## Task 1: Add CSS keyframe and element styles

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` (hero `<style>` block, ~line 634)

- [ ] **Step 1: Locate the hero `<style>` block**

  Open `frontend/src/pages/LandingPage.tsx`. Find the `<style>` tag inside the hero `<div>` — it starts around line 634 with `@keyframes shipFloat`. The block ends with a closing backtick (`` ` ``) before `</style>`.

- [ ] **Step 2: Append the new CSS before the closing backtick**

  Add the following block immediately before the closing `` `}</style> `` of the hero style tag:

  ```css
          /* ── Hero water elements ── */
          .hero-water-chest {
            position: absolute;
            bottom: 0;
            left: 12%;
            width: clamp(70px, 8vw, 110px);
            pointer-events: none;
            user-select: none;
            filter: drop-shadow(0 0 10px rgba(62,207,190,0.25));
            animation: heroElemBob 5.2s ease-in-out infinite;
          }
          .hero-water-skull-wrap {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            pointer-events: none;
            user-select: none;
          }
          .hero-water-skull {
            display: block;
            width: clamp(40px, 5vw, 65px);
            filter: drop-shadow(0 0 10px rgba(62,207,190,0.25));
            animation: heroElemBob 4.0s ease-in-out 1.4s infinite;
          }
          .hero-water-hand {
            position: absolute;
            bottom: 0;
            right: 18%;
            width: clamp(35px, 4vw, 55px);
            pointer-events: none;
            user-select: none;
            filter: drop-shadow(0 0 10px rgba(62,207,190,0.25));
            animation: heroElemBob 3.6s ease-in-out 0.7s infinite;
          }
          @keyframes heroElemBob {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-6px); }
          }
          @media (max-width: 640px) {
            .hero-water-chest { width: clamp(42px, 6vw, 66px); }
            .hero-water-skull { width: clamp(24px, 4vw, 39px); }
            .hero-water-hand  { width: clamp(21px, 3vw, 33px); }
          }
  ```

- [ ] **Step 3: Run existing tests to confirm nothing broke**

  ```bash
  cd frontend && npm run test
  ```

  Expected: all tests pass (the CSS change touches no logic).

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/pages/LandingPage.tsx
  git commit -m "style(hero): add water element CSS classes and heroElemBob keyframe"
  ```

---

## Task 2: Add the three SVG stand-ins to the water div

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` (~line 530, the water surface div)

- [ ] **Step 1: Locate the water surface div**

  Find the comment `{/* Water surface (existing) */}` around line 529. The div currently self-closes with `/>`:

  ```tsx
  {/* Water surface (existing) */}
  <div
    className="absolute pointer-events-none"
    style={{
      zIndex: 3,
      bottom: 0, left: 0, right: 0,
      height: '22%',
      background: 'linear-gradient(180deg, transparent 0%, #071535 25%, #09184a 60%, #0a1a52 100%)',
    }}
  />
  ```

- [ ] **Step 2: Convert to a container and add the three SVG elements**

  Replace the self-closing div with:

  ```tsx
  {/* Water surface (existing) */}
  <div
    className="absolute pointer-events-none"
    style={{
      zIndex: 3,
      bottom: 0, left: 0, right: 0,
      height: '22%',
      background: 'linear-gradient(180deg, transparent 0%, #071535 25%, #09184a 60%, #0a1a52 100%)',
    }}
  >
    {/* Chest — stand-in SVG, replace with <img src="/assets/hero-chest.png"> when asset is ready */}
    <svg aria-hidden className="hero-water-chest" viewBox="0 0 100 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 36 Q50 8 92 36" fill="#4a3015" stroke="#7a4f00" strokeWidth="1.5"/>
      <rect x="8" y="36" width="84" height="36" rx="2" fill="#3a2410" stroke="#7a4f00" strokeWidth="1.5"/>
      <rect x="8" y="38" width="84" height="6" fill="#c8a000" opacity="0.7"/>
      <rect x="40" y="44" width="20" height="14" rx="2" fill="#c8a000" opacity="0.85"/>
      <circle cx="50" cy="51" r="3" fill="#3a2410"/>
      <ellipse cx="18" cy="70" rx="7" ry="3.5" fill="#c8a000" opacity="0.65"/>
      <ellipse cx="84" cy="68" rx="5" ry="3" fill="#c8a000" opacity="0.5"/>
    </svg>

    {/* Skull — wrapper handles x-centering so the bob keyframe only uses translateY */}
    {/* Stand-in SVG, replace inner <svg> with <img src="/assets/hero-skull.png"> when asset is ready */}
    <div aria-hidden className="hero-water-skull-wrap">
      <svg className="hero-water-skull" viewBox="0 0 60 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 30 a24 24 0 0 1 48 0" fill="#d4cfbd" stroke="#8a8070" strokeWidth="1.5"/>
        <rect x="10" y="30" width="40" height="16" rx="3" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1.2"/>
        <ellipse cx="20" cy="24" rx="7" ry="8" fill="#09184a"/>
        <ellipse cx="40" cy="24" rx="7" ry="8" fill="#09184a"/>
        <path d="M27 32 L30 28 L33 32 Z" fill="#09184a"/>
        <line x1="16" y1="38" x2="16" y2="46" stroke="#8a8070" strokeWidth="2"/>
        <line x1="24" y1="38" x2="24" y2="46" stroke="#8a8070" strokeWidth="2"/>
        <line x1="36" y1="38" x2="36" y2="46" stroke="#8a8070" strokeWidth="2"/>
        <line x1="44" y1="38" x2="44" y2="46" stroke="#8a8070" strokeWidth="2"/>
      </svg>
    </div>

    {/* Hand — stand-in SVG, replace with <img src="/assets/hero-hand.png"> when asset is ready */}
    <svg aria-hidden className="hero-water-hand" viewBox="0 0 50 82" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="19" y="54" width="12" height="28" rx="3" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
      <ellipse cx="25" cy="52" rx="12" ry="9" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
      <rect x="6" y="18" width="6" height="34" rx="3" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
      <rect x="14" y="10" width="6" height="42" rx="3" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
      <rect x="22" y="4" width="6" height="48" rx="3" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
      <rect x="30" y="10" width="6" height="42" rx="3" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
      <rect x="38" y="24" width="5" height="28" rx="2.5" fill="#c8c3b0" stroke="#8a8070" strokeWidth="1"/>
    </svg>
  </div>
  ```

- [ ] **Step 3: Start dev server and visually verify**

  ```bash
  cd frontend && npm run dev
  ```

  Open the landing page. At the bottom of the hero section you should see:
  - A small treasure chest shape at the left side of the waterline, slowly bobbing
  - A skull shape centered on the moonlight streak, bobbing slightly faster
  - A skeletal hand shape on the right side, barely moving
  - All three have a faint teal glow (drop-shadow)
  - The water gradient still masks their lower halves
  - On a narrow viewport (<640px) the elements scale down but stay visible

- [ ] **Step 4: Run existing tests**

  ```bash
  cd frontend && npm run test
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/pages/LandingPage.tsx
  git commit -m "feat(hero): add ambient waterline elements — chest, skull, skeletal hand"
  ```

---

## Task 3: Swap SVG stand-ins for real PNG assets (run when assets are ready)

**Files:**
- Drop assets: `frontend/public/assets/hero-chest.png`, `hero-skull.png`, `hero-hand.png`
- Modify: `frontend/src/pages/LandingPage.tsx` (three element replacements)

Assets should be PNGs with transparent backgrounds, art style matching `progctf-ship-removebg-preview.png`.

- [ ] **Step 1: Copy assets into place**

  ```bash
  # Confirm files are present
  ls frontend/public/assets/hero-chest.png frontend/public/assets/hero-skull.png frontend/public/assets/hero-hand.png
  ```

- [ ] **Step 2: Replace chest SVG with img**

  Find the chest `<svg aria-hidden className="hero-water-chest" ...>` block (everything up to and including its closing `</svg>`) and replace with:

  ```tsx
  <img aria-hidden alt="" src="/assets/hero-chest.png" className="hero-water-chest" />
  ```

- [ ] **Step 3: Replace skull SVG with img**

  Inside the `.hero-water-skull-wrap` div, replace the `<svg className="hero-water-skull" ...>` block with:

  ```tsx
  <img alt="" src="/assets/hero-skull.png" className="hero-water-skull" />
  ```

- [ ] **Step 4: Replace hand SVG with img**

  Find the hand `<svg aria-hidden className="hero-water-hand" ...>` block and replace with:

  ```tsx
  <img aria-hidden alt="" src="/assets/hero-hand.png" className="hero-water-hand" />
  ```

- [ ] **Step 5: Visually verify**

  ```bash
  cd frontend && npm run dev
  ```

  Confirm real assets appear at the waterline with the same bob animations and teal drop-shadow. Check that the water gradient still clips their lower halves naturally.

- [ ] **Step 6: Commit**

  ```bash
  git add frontend/public/assets/hero-chest.png frontend/public/assets/hero-skull.png frontend/public/assets/hero-hand.png frontend/src/pages/LandingPage.tsx
  git commit -m "feat(hero): swap waterline SVG stand-ins for real PNG assets"
  ```

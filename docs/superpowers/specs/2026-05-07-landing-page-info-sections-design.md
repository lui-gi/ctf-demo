# Landing Page Info Sections Design

**Date:** 2026-05-07
**Scope:** `frontend/src/pages/LandingPage.tsx` only. Adds scrollable informational sections below the existing hero.

---

## Overview

The current landing page is a full-screen hero. This spec adds a long-scroll experience below the hero: four sections that reveal as the user scrolls — About, Challenge Categories, Sponsors, and Sponsored Categories — followed by a final CTA.

---

## Hero CTA Changes

The existing CTA row (`[Join the Hunt] [Login]`) is replaced with:

- **[Learn More]** — teal primary button, smooth-scrolls to the About section (`#about`)
- **[↓]** — square border button (same style as the existing Login button), also smooth-scrolls to `#about`

The Login button is removed from the hero CTA row. Login/Register remain in the top nav.

---

## Sections

### 1. About

**Anchor:** `id="about"`

**Heading:** "Plunder the depths. Claim your bounty."
**Label:** "What is progctf?" (teal, small caps)
**Body copy:**
> progctf is a 48-hour pirate-themed jeopardy-style Capture the Flag competition. Navigate 7 challenge categories spanning web exploitation, cryptography, forensics, and more. Form a crew, solve challenges, earn points — and etch your name into the bounty board.

**Stats row** (below body copy):
| Value | Label |
|---|---|
| 30 | Challenges |
| 7 | Categories |
| 48h | Duration |
| 3 | Difficulty tiers |

---

### 2. Challenge Categories

**Background:** Slightly darker panel (`#020820`) to visually separate from About.
**Label:** "Challenge Categories"
**Heading:** "Seven seas to conquer."
**Subtext:** "Each category hides treasures at three depths — easy, medium, and hard. No crew has ever claimed them all."

**Category cards** (auto-fill grid, min 220px columns):

| Icon | Name | Subtitle | Flavor copy |
|---|---|---|---|
| ⚓ | Cursed Ports | Web Exploitation | Find the cracks in the hull and take the wheel. |
| 🔐 | Cipher Cove | Cryptography | Crack ancient codes and hidden messages of the deep. |
| 🔧 | Shipwright's Forge | Network & Log Analysis | Trace the ship's path through turbulent waters. |
| 🔦 | Lighthouse | Forensics | Illuminate what others buried in the dark. |
| 🔭 | Crow's Nest | OSINT | Scout the horizon and find what no map will show you. |
| 📦 | Hidden Cargo | Steganography | Secrets hidden in plain sight within the cargo hold. |
| 🗝️ | Keymaster | Password Cracking | Every lock has a weakness if you know where to look. |

Each card: dark navy background (`#071230`), 1px navy border, hover state brightens the border to teal, category name in white bold, subtitle and flavor copy in steel blue.

---

### 3. Sponsors

**Label:** "Sponsors"
**Heading:** "Made possible by."
**Subtext:** "progctf is supported by industry leaders who believe in growing the next generation of security professionals."

**Sponsor cards** — flex row, `flex: 1 1 200px` so they fill the row equally. Generous vertical padding for future logo placement. Text centered. Sponsors: **CrowdStrike**, **Sophos**, **Equifax**.

---

### 4. Sponsored Categories

**Label:** "Sponsored Categories"
**Heading:** "Hunt for bigger bounties."
**Subtext:** "Select categories are sponsored by industry partners. Challenges in these categories are crafted around real tools, techniques, and scenarios from the sponsor's world — and the rewards reflect it. Solve a sponsored challenge, earn a larger prize."

**Cards** (auto-fill grid, min 260px columns) — one per sponsor. Each card has:
- Teal 3px top accent bar
- "SPONSOR" label in teal small caps
- Sponsor name in white, large
- "Sponsoring: [Category]" line in steel/white
- Flavor description
- "★ Bonus prizes" callout in teal

Placeholder sponsor → category assignments (TBD — update when confirmed):
- CrowdStrike → Cursed Ports
- Sophos → Lighthouse
- Equifax → Cipher Cove

---

### 5. Final CTA

Centered, gradient background fading back to the page dark. Heading: "Ready to set sail?" Subtext: "Registration is free. Your crew is waiting." Button: **Join the Hunt** → `/register`.

---

## Section Dividers

Between each section: a full-width 1px horizontal line with a linear gradient (`transparent → rgba(62,207,190,0.25) → transparent`). Gives a subtle teal glow effect without a hard border.

---

## Scroll Behavior

`scrollIntoView({ behavior: 'smooth' })` on both hero CTAs targeting `#about`. No scroll-reveal animations in scope — sections are statically rendered.

---

## Layout & Styling Constraints

- All sections: `padding: 80px 24px`, `max-width: 960px`, `margin: 0 auto`
- Background: hero gradient continues; about/sponsored-categories use `#010310`; categories/sponsors use `#020820`
- Headings: white (`#fff`), bold, `clamp(1.6rem, 3.5vw, 2.4rem)`
- Section labels: teal (`#3ecfbe`), 11px, bold, `letter-spacing: 0.3em`, uppercase
- Body / secondary text: steel blue (`#8ab4e8`)
- The existing `overflow-hidden` on the hero wrapper must be changed to allow the page to scroll past it

---

## Files to Modify

- `frontend/src/pages/LandingPage.tsx` — all changes contained here

# Hero Bottom — Composed Waterline Scene

**Date:** 2026-05-09
**Status:** Approved

## Summary

Add three ambient, animated decorative elements to the bottom of the hero section to fill the currently unused waterline space. The elements are purely atmospheric — no interaction, no functionality. They sit at the waterline inside the existing water surface div and bob independently using CSS keyframe animations.

## Placement

The three elements are absolutely positioned children inside the existing water surface `div` (bottom 22% of the hero, `zIndex: 3`). The existing water gradient already masks their lower halves, selling the "floating on / emerging from water" effect without any extra DOM.

| Element | Horizontal position | Description |
|---|---|---|
| Chest | ~12% from left | Half-submerged, slightly tilted, one or two coins spilling out |
| Skull | ~50% from left | Centered on the moonlight streak, floating upright at the surface |
| Hand | ~82% from left | Skeletal hand with wrist submerged, fingers reaching upward |

## Animation

Each element has its own independent CSS `bob` keyframe (vertical `translateY` only), intentionally out of phase so they never sync. Mirrors the existing `shipFloat` pattern.

| Element | Duration | Delay | Amplitude |
|---|---|---|---|
| Chest | 5.2s | 0s | ±5px |
| Skull | 4.0s | 1.4s | ±7px |
| Hand | 3.6s | 0.7s | ±4px |

Each element also gets a `drop-shadow` filter in teal (`rgba(62,207,190,0.25)`) to match the ship's ambient glow and keep all elements visually cohesive.

No `prefers-reduced-motion` handling — excluded by design decision.

## Assets

Three PNGs with transparent backgrounds, to be AI-generated and placed in `/public/assets/`. Art style must match the existing ship asset (`progctf-ship-removebg-preview.png`) — same color temperature and level of detail.

| File | Description |
|---|---|
| `hero-chest.png` | Side/three-quarter view, half-submerged angle, coin or two spilling out |
| `hero-skull.png` | Top-down or slight three-quarter view, floating flat on the surface |
| `hero-hand.png` | Skeletal hand/wrist from below, fingers reaching upward |

Until real assets are available, the implementation uses inline SVG stand-ins so the layout is testable immediately.

## Responsive Behavior

Below 640px, all three elements scale to ~60% of their desktop size. Layout stays the same (chest left, skull center, hand right) — no elements are hidden.

## Implementation Scope

- Edit `LandingPage.tsx` only — add elements inside the existing water surface `div`
- Add a `heroElementBob` keyframe to the existing `<style>` block in the hero section
- No new dependencies, no new files (until assets arrive)

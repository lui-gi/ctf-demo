/**
 * One-shot debug: dump the computed `color` of each section's eyebrow
 * + the computed style of a few other "did the rule win" suspects.
 */
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Probe brand-wordmark hover behavior — verify (a) hover state holds
// ghost-glow color, (b) un-hover snaps back instantly with no transition.
const brand = await page.locator('.app-header-brand').first();
const baseColor = await brand.evaluate((el) => getComputedStyle(el).color);
await brand.hover();
await page.waitForTimeout(400); // animation completes (320ms + buffer)
const hoveredColor = await brand.evaluate((el) => getComputedStyle(el).color);
const hoveredTransition = await brand.evaluate(
  (el) => getComputedStyle(el).transitionDuration,
);
// Move cursor away to a definitely-non-brand element
await page.mouse.move(700, 700);
await page.waitForTimeout(50);
const afterUnhoverColor = await brand.evaluate(
  (el) => getComputedStyle(el).color,
);
const baseTransition = await brand.evaluate(
  (el) => getComputedStyle(el).transitionDuration,
);
console.log('\nBrand hover behaviour:');
console.log(`  base.color:           ${baseColor}`);
console.log(`  hovered.color:        ${hoveredColor}`);
console.log(`  hovered.transition:   ${hoveredTransition}`);
console.log(`  unhover@50ms.color:   ${afterUnhoverColor}`);
console.log(`  base.transition:      ${baseTransition}`);

// Probe bottle layout — verify the slot has a stable max-width and the
// rotated child isn't wider than the slot allows.
const bottleGeo = await page.evaluate(() => {
  const slot = document.querySelector('.scene-abyss__bottle-slot');
  const bottle = document.querySelector('.scene-abyss__bottle');
  if (!slot || !bottle) return null;
  const r1 = slot.getBoundingClientRect();
  const r2 = bottle.getBoundingClientRect();
  return {
    slot: { w: Math.round(r1.width), h: Math.round(r1.height) },
    bottle: { w: Math.round(r2.width), h: Math.round(r2.height) },
    bottleTransform: getComputedStyle(bottle).transform,
  };
});
console.log('\nBottle layout:');
console.log(`  slot:    ${JSON.stringify(bottleGeo.slot)}`);
console.log(`  bottle:  ${JSON.stringify(bottleGeo.bottle)}`);
console.log(`  bottle transform: ${bottleGeo.bottleTransform}`);

const dump = await page.evaluate(() => {
  const get = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const cs = getComputedStyle(el);
    return {
      sel,
      classes: el.className,
      color: cs.color,
      fontFamily: cs.fontFamily,
      textShadow: cs.textShadow,
    };
  };
  return {
    beachEyebrow: get('.scene-beach__eyebrow'),
    surfaceEyebrow: get('.scene-surface__eyebrow'),
    midEyebrow: get('.scene-mid__eyebrow'),
    abyssEyebrow: get('.scene-abyss__eyebrow'),
    brandWordmark: get('.app-header-brand'),
    titleName: get('.scene-beach__title-name'),
    bottle: get('.scene-abyss__bottle'),
    bottleSlot: get('.scene-abyss__bottle-slot'),
  };
});

for (const [k, v] of Object.entries(dump)) {
  console.log(`\n${k}:`);
  for (const [k2, v2] of Object.entries(v)) {
    console.log(`  ${k2}: ${v2}`);
  }
}

await browser.close();

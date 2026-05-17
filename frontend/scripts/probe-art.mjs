import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const data = await page.evaluate(() => {
  const items = ['.art-palm--left', '.art-palm--right', '.art-chest', '.art-waves', '.art-godrays'];
  return items.map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel,
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      visibility: cs.visibility,
      display: cs.display,
      transform: cs.transform,
      zIndex: cs.zIndex,
      opacity: cs.opacity,
    };
  });
});

for (const d of data) console.log(JSON.stringify(d));
await browser.close();

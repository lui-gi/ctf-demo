import { chromium } from '@playwright/test';

const URL = 'http://localhost:5173/';
const OUT = '/Users/oninactive/dev/ctf-demo/frontend/.seam-screenshots/';

async function reveal(page, w, tag) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(600);
  const sel = 'section[aria-label="Treasure reveal"]';
  const y = await page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return r.top + window.scrollY;
  }, sel);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}chest-${tag}-resting.png` });

  const btn = await page.$(`${sel} button[aria-label^="Open"]`);
  await btn.click();
  await page.waitForTimeout(160);
  await page.screenshot({ path: `${OUT}chest-${tag}-mid.png` });
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}chest-${tag}-burst.png` });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}chest-${tag}-settled.png` });
  console.log(`  ✓ ${tag} (${w}px)`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const [w, h, tag] of [[1440, 900, 'd'], [375, 740, 'm']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await reveal(page, w, tag);
    await ctx.close();
  }
  await browser.close();
})();

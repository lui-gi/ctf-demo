import { chromium } from '@playwright/test';
const URL = 'http://localhost:5173/';
const OUT = '/Users/oninactive/dev/ctf-demo/frontend/.seam-screenshots/';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const reveal = document.querySelector('section[aria-label="Treasure reveal"]');
  const about = document.querySelector('section');
  const r = reveal.getBoundingClientRect();
  return { revealTop: r.top + scrollY, revealH: r.height };
});
// scroll so the bottom of the chest section + start of About are framed
await page.evaluate((y) => scrollTo(0, y), info.revealTop + info.revealH - 520);
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}seam-chest-about.png` });
console.log('revealH=', Math.round(info.revealH));
await browser.close();

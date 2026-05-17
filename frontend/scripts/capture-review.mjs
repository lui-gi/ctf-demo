/**
 * Targeted screenshots for art-port review:
 *   - beach-1440.png            Beach section composed (wordmark + palms + sun + chest)
 *   - beach-375.png             Same on mobile
 *   - right-palm-closeup.png    Tight crop on the right palm to confirm mirror reads natural
 *   - surface-1440.png          Surface section + Beach→Surface seam wave check
 *   - mid-1440.png              Mid-Ocean parchment grid in context
 */
import { chromium } from '@playwright/test';

const TARGET_URL = 'http://localhost:5173/';
const OUT = new URL('../.seam-screenshots/', import.meta.url).pathname;

async function shotSection(page, sceneSelector, file, viewportH) {
  const rect = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { y: r.top + window.scrollY, h: r.height };
  }, sceneSelector);
  if (!rect) throw new Error(`Missing ${sceneSelector}`);
  await page.evaluate((y) => window.scrollTo(0, y), rect.y);
  // Wait long enough for any GSAP entry tween to settle (~640ms for the
  // 7-card stagger in Challenges) plus a frame buffer.
  await page.waitForTimeout(900);
  await page.screenshot({
    path: `${OUT}${file}`,
    clip: { x: 0, y: 0, width: page.viewportSize().width, height: Math.min(viewportH, rect.h) },
  });
  console.log(`  ✓ ${file}`);
}

(async () => {
  console.log('Capturing review screenshots from', TARGET_URL);
  const browser = await chromium.launch({ headless: true });
  try {
    // Desktop: beach + surface + mid sections
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      // Dismiss the intro overlay if present (plays on every page load
      // since sessionStorage gating was removed). Escape key is bound
      // to skip; fall through if no overlay rendered.
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(700);
      await shotSection(page, 'section.scene-beach',      'beach-1440.png',      900);
      await shotSection(page, 'section.scene-challenges', 'challenges-1440.png', 900);
      await shotSection(page, 'section.scene-sponsors',   'sponsors-1440.png',   900);
      await shotSection(page, 'section.scene-about',      'about-1440.png',      900);
      await shotSection(page, 'section.scene-abyss',      'abyss-1440.png',      900);

      // Tight abyss close-up: crop to the Dutchman's bbox + bottle so
      // the composition reads at full SVG resolution.
      const abyssRect = await page.evaluate(() => {
        const el = document.querySelector('section.scene-abyss');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { y: r.top + window.scrollY, h: r.height };
      });
      if (abyssRect) {
        await page.evaluate((y) => window.scrollTo(0, y), abyssRect.y);
        await page.waitForTimeout(900);
        await page.screenshot({
          path: `${OUT}abyss-closeup-1440.png`,
          clip: { x: 200, y: 80, width: 1100, height: 720 },
        });
        console.log('  ✓ abyss-closeup-1440.png');
      }

      // Right palm close-up: tight crop on the right palm bbox + a little
      // negative space around it so the mirror context is visible.
      const palm = await page.evaluate(() => {
        const el = document.querySelector('.art-palm--right');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      if (palm) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(150);
        const padX = 40;
        const padY = 30;
        const x = Math.max(0, Math.floor(palm.x - padX));
        const y = Math.max(0, Math.floor(palm.y - padY));
        const w = Math.min(1440 - x, Math.ceil(palm.w + padX * 2));
        const h = Math.min(900 - y, Math.ceil(palm.h + padY * 2));
        await page.screenshot({
          path: `${OUT}right-palm-closeup.png`,
          clip: { x, y, width: w, height: h },
        });
        console.log('  ✓ right-palm-closeup.png');
      }
      await ctx.close();
    }

    // Mobile beach
    {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(600);
      await shotSection(page, 'section.scene-beach', 'beach-375.png', 1100);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
})();

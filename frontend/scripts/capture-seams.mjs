/**
 * Capture seam + full-page screenshots of the Landing route from the
 * already-running Vite dev server (http://localhost:5173/).
 *
 * Output: ./.seam-screenshots/
 *   - full-page-1440.png     : full page at 1440x900 desktop
 *   - full-page-1024.png     : full page at 1024x800 tablet
 *   - full-page-375.png      : full page at 375x812 mobile
 *   - seam-beach-surface.png : 240px band centred on the Beach↔Surface boundary
 *   - seam-surface-mid.png   : 240px band centred on the Surface↔Mid boundary
 *   - seam-mid-abyss.png     : 240px band centred on the Mid↔Abyss boundary
 *   - reduced-motion-1440.png: full page at 1440px with prefers-reduced-motion
 *
 * Also dumps any console messages or page errors to stdout so we can
 * surface them in the trip report.
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const TARGET_URL = 'http://localhost:5173/';
const OUT = new URL('../.seam-screenshots/', import.meta.url).pathname;

const messages = [];
const errors = [];

/**
 * The Landing route plays a ~4.6s cinematic intro on every visit, which
 * sits on top of the page and would obscure every screenshot we take.
 * The overlay listens for Escape/Space/click to skip; we just press
 * Escape and wait for the unmount, then for any landing-side
 * scroll-triggered tweens to settle.
 */
async function dismissIntroIfPresent(page) {
  const present = await page
    .locator('[data-testid="intro-overlay"]')
    .first()
    .isVisible()
    .catch(() => false);
  if (!present) return;
  await page.keyboard.press('Escape');
  await page
    .locator('[data-testid="intro-overlay"]')
    .first()
    .waitFor({ state: 'detached', timeout: 2000 })
    .catch(() => {});
  // Give the landing's first paint a moment to settle after the overlay
  // unmounts so screenshot pixels reflect the resting state.
  await page.waitForTimeout(120);
}

async function captureFullPage(browser, width, height, label, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    ...opts,
  });
  const page = await ctx.newPage();
  page.on('console', (msg) =>
    messages.push(`[${label} console.${msg.type()}] ${msg.text()}`),
  );
  page.on('pageerror', (err) =>
    errors.push(`[${label} pageerror] ${err.message}`),
  );
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  // Pre-fire ScrollTrigger entries: scroll to the bottom of the page so
  // every ScrollTrigger fires its tween, then back to top for the
  // fullPage capture. Without this, the Challenges card-entry GSAP tween
  // is still mid-fade-in when Playwright's fullPage routine renders that
  // band of pixels, and the cards come out invisible.
  await page.evaluate(() =>
    window.scrollTo(0, document.body.scrollHeight),
  );
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.screenshot({
    path: `${OUT}full-page-${label}.png`,
    fullPage: true,
  });
  await ctx.close();
  console.log(`  ✓ full-page-${label}.png`);
}

async function captureSeams(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on('console', (msg) =>
    messages.push(`[seam console.${msg.type()}] ${msg.text()}`),
  );
  page.on('pageerror', (err) =>
    errors.push(`[seam pageerror] ${err.message}`),
  );
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);
  await page.waitForTimeout(500);

  // Measure each scene's geometry. Scenes are ordered: Beach, Surface,
  // Mid-ocean, Abyss. The seams are at the bottom of every scene except
  // the last.
  const measurements = await page.evaluate(() => {
    const scenes = [...document.querySelectorAll('section.scene')];
    return scenes.map((el) => {
      const r = el.getBoundingClientRect();
      // Convert client rect to absolute document position.
      return {
        cls: el.className,
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        height: r.height,
      };
    });
  });
  console.log('  scene geometry:');
  for (const m of measurements) {
    console.log(
      `    ${m.cls.replace('scene scene-', '').padEnd(8)} y=${Math.round(m.top)}→${Math.round(m.bottom)} h=${Math.round(m.height)}`,
    );
  }

  const seams = [
    { name: 'beach-challenges', y: measurements[0].bottom },
    { name: 'challenges-sponsors', y: measurements[1].bottom },
    { name: 'sponsors-about', y: measurements[2].bottom },
    { name: 'about-abyss', y: measurements[3].bottom },
  ];
  const STRIP = 240; // total band height around each seam
  for (const s of seams) {
    // Scroll so the seam sits at the centre of the viewport.
    const targetScroll = Math.max(0, Math.round(s.y - 450));
    await page.evaluate((y) => window.scrollTo(0, y), targetScroll);
    await page.waitForTimeout(200);
    // Clip to a horizontal strip centred on the seam in the viewport.
    const seamYInViewport = s.y - targetScroll;
    const clipY = Math.max(0, Math.round(seamYInViewport - STRIP / 2));
    await page.screenshot({
      path: `${OUT}seam-${s.name}.png`,
      clip: { x: 0, y: clipY, width: 1440, height: STRIP },
    });
    console.log(`  ✓ seam-${s.name}.png (clipped y=${clipY})`);
  }

  await ctx.close();
}

(async () => {
  console.log('Capturing screenshots from', TARGET_URL);
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('· full-page captures');
    await captureFullPage(browser, 1440, 900, '1440');
    await captureFullPage(browser, 1024, 800, '1024');
    await captureFullPage(browser, 375, 812, '375');

    console.log('· reduced-motion capture');
    await captureFullPage(browser, 1440, 900, 'reduced-motion-1440', {
      reducedMotion: 'reduce',
    });

    console.log('· seam captures');
    await captureSeams(browser);
    console.log('· hero close-up (subhead detail)');
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      await dismissIntroIfPresent(page);
      await page.waitForTimeout(400);
      const titleRect = await page.evaluate(() => {
        const el = document.querySelector('.scene-beach__title');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      if (titleRect) {
        const pad = 80;
        await page.screenshot({
          path: `${OUT}hero-closeup.png`,
          clip: {
            x: Math.max(0, titleRect.x - pad),
            y: Math.max(0, titleRect.y - pad),
            width: Math.min(1440, titleRect.w + pad * 2),
            height: Math.min(900, titleRect.h + pad * 2),
          },
        });
        console.log('  ✓ hero-closeup.png');
      }
      await ctx.close();
    }

    console.log('· bottle close-up');
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      await dismissIntroIfPresent(page);
      await page.evaluate(() => {
        document
          .querySelector('.scene-abyss__bottle-slot')
          ?.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(300);
      const slotRect = await page.evaluate(() => {
        const el = document.querySelector('.scene-abyss__bottle-slot');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      if (slotRect) {
        const pad = 70;
        await page.screenshot({
          path: `${OUT}bottle-closeup.png`,
          clip: {
            x: Math.max(0, slotRect.x - pad),
            y: Math.max(0, slotRect.y - pad),
            width: Math.min(1440, slotRect.w + pad * 2),
            height: Math.min(900, slotRect.h + pad * 2),
          },
        });
        console.log('  ✓ bottle-closeup.png');
      }
      await ctx.close();
    }

    console.log('· hover capture (cluster card)');
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      await dismissIntroIfPresent(page);
      // Scroll to challenges and hover the third card.
      await page.evaluate(() => {
        const grid = document.querySelector('.scene-challenges__grid');
        grid?.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(200);
      const card = page.locator('.scene-challenges__card').nth(2);
      await card.hover();
      await page.waitForTimeout(260); // animation settles (200ms ease-out)
      const grid = await page.evaluate(() => {
        const el = document.querySelector('.scene-challenges__grid');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      if (grid) {
        await page.screenshot({
          path: `${OUT}hover-card.png`,
          clip: {
            x: Math.max(0, grid.x - 12),
            y: Math.max(0, grid.y - 12),
            width: Math.min(1440, grid.w + 24),
            height: Math.min(900, grid.h + 24),
          },
        });
        console.log('  ✓ hover-card.png');
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  if (messages.length || errors.length) {
    const log = [
      `Console messages (${messages.length}):`,
      ...messages,
      '',
      `Page errors (${errors.length}):`,
      ...errors,
    ].join('\n');
    writeFileSync(`${OUT}console.log`, log);
    console.log(`\nLog → ${OUT}console.log`);
  } else {
    console.log('\nNo console messages or page errors captured.');
  }
})();

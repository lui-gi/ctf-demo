/**
 * Targeted screenshots for the intro overlay review:
 *
 *   intro-beat1-still.png       — t≈900ms,  chest still on abyss floor, fish drift
 *   intro-beat2-bounce.png      — t≈2100ms, chest mid-bounce (left/right shake)
 *   intro-beat3-burst.png       — t≈2900ms, lid open, gold burst growing
 *   intro-beat4-flash.png       — t≈3500ms, peak flash, bg swap hidden
 *   intro-beat5-reveal.png      — t≈4150ms, beach revealed, wordmark fading in
 *   intro-resting.png           — overlay gone, real beach hero in resting state
 *   intro-reduced-motion.png    — prefers-reduced-motion: reduce, intro never plays
 *   intro-reload.png            — intro plays again on reload (no sessionStorage gate)
 *
 * Each visit clears sessionStorage so the gate is exercised cleanly.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const TARGET_URL = 'http://localhost:5173/';
const OUT = new URL('../.seam-screenshots/', import.meta.url).pathname;

await mkdir(OUT, { recursive: true });

async function shot(page, file) {
  await page.screenshot({
    path: `${OUT}${file}`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log(`  ✓ ${file}`);
}

(async () => {
  console.log('Capturing intro screenshots from', TARGET_URL);
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  try {
    // ── First-visit: intro plays. Sample mid-beat frames. ──────────
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) =>
        consoleErrors.push(`[pageerror] ${err.message}`),
      );

      // Make sure no prior session has flagged intro-seen.
      await page.addInitScript(() => {
        try {
          window.sessionStorage.removeItem('progctf_intro_seen_v1');
        } catch {}
      });
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
      // Wait for the overlay node to be in the DOM, then sample beats.
      const t0 = Date.now();
      await page.waitForSelector('[data-testid="intro-overlay"]', {
        timeout: 4000,
      });
      // Intro is ~4.5s. Sample five frames at hand-tuned offsets
      // relative to overlay-found. Each shot adds ~80-100ms latency.
      await page.waitForTimeout(800); // → Beat 1 still (~900ms timeline)
      await shot(page, 'intro-beat1-still.png');
      console.log(`    [${Date.now() - t0}ms]`);
      await page.waitForTimeout(1100); // → Beat 2 bounce (~2100ms)
      await shot(page, 'intro-beat2-bounce.png');
      console.log(`    [${Date.now() - t0}ms]`);
      await page.waitForTimeout(700); // → Beat 3 burst growing (~2900ms)
      await shot(page, 'intro-beat3-burst.png');
      console.log(`    [${Date.now() - t0}ms]`);
      await page.waitForTimeout(450); // → Beat 4 peak flash (~3500ms)
      await shot(page, 'intro-beat4-flash.png');
      console.log(`    [${Date.now() - t0}ms]`);
      await page.waitForTimeout(550); // → Beat 5 wordmark on beach (~4150ms)
      await shot(page, 'intro-beat5-reveal.png');
      console.log(`    [${Date.now() - t0}ms]`);

      // Wait for overlay to fully unmount, then capture resting state.
      await page.waitForFunction(
        () => !document.querySelector('[data-testid="intro-overlay"]'),
        null,
        { timeout: 8000 },
      );
      await page.waitForTimeout(150);
      await shot(page, 'intro-resting.png');

      await ctx.close();
    }

    // ── Reduced-motion: intro must NOT play, beach renders immediately ──
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      const hasOverlay = await page.$('[data-testid="intro-overlay"]');
      if (hasOverlay) {
        console.warn('  ⚠ overlay rendered under reduced-motion (expected none)');
      } else {
        console.log('  ✓ reduced-motion: no overlay');
      }
      await shot(page, 'intro-reduced-motion.png');
      await ctx.close();
    }

    // ── Reload: intro plays AGAIN (sessionStorage gate removed) ─────
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
      const hasOverlay = await page.waitForSelector(
        '[data-testid="intro-overlay"]',
        { timeout: 4000 },
      );
      if (hasOverlay) {
        console.log('  ✓ reload: overlay plays again (gate removed)');
      } else {
        console.warn('  ⚠ reload: overlay not found (expected to play)');
      }
      await page.waitForTimeout(800); // sample a still frame
      await shot(page, 'intro-reload.png');
      await ctx.close();
    }

    // ── Skip-on-Escape: overlay must unmount immediately on Esc ────
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        try {
          window.sessionStorage.removeItem('progctf_intro_seen_v1');
        } catch {}
      });
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="intro-overlay"]', {
        timeout: 4000,
      });
      await page.waitForTimeout(150); // overlay is up, mid-Beat-1
      await page.keyboard.press('Escape');
      // Overlay must be gone immediately.
      await page.waitForFunction(
        () => !document.querySelector('[data-testid="intro-overlay"]'),
        null,
        { timeout: 1000 },
      );
      console.log('  ✓ Escape skip: overlay removed');
      await shot(page, 'intro-skipped-resting.png');
      const seen = await page.evaluate(() =>
        window.sessionStorage.getItem('progctf_intro_seen_v1'),
      );
      console.log(`  sessionStorage progctf_intro_seen_v1 = ${seen}`);
      await ctx.close();
    }

    if (consoleErrors.length) {
      console.log('\nConsole errors / warnings during first-visit run:');
      consoleErrors.forEach((m) => console.log('  ' + m));
    } else {
      console.log('\nNo console errors during first-visit run.');
    }
  } finally {
    await browser.close();
  }
})();

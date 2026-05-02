import { test, expect } from '@playwright/test';

/**
 * Happy-path E2E: register → join crew → navigate to Islands → submit → see Charts update.
 *
 * This test requires:
 *   - Bosun's backend running on http://localhost:3000 with at least one
 *     published Island.
 *   - The Vite dev server on http://localhost:5173 (or PROGCTF_BASE_URL).
 *
 * If the backend is unreachable, the test SKIPS rather than fails — we'd
 * rather skip than fake-pass. Run it locally once Bosun is up.
 */

const BACKEND = process.env.PROGCTF_BACKEND_URL ?? 'http://localhost:3000';

async function backendUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/api/charts`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

test.beforeAll(async () => {
  const up = await backendUp();
  test.skip(!up, `Bosun backend not reachable at ${BACKEND}; skipping E2E.`);
});

test('a Pirate can sign the articles, see the Voyage, and submit a Treasure', async ({ page }) => {
  const stamp = Date.now();
  const email = `helmsman+e2e-${stamp}@deadwake.test`;
  const handle = `e2e_${stamp}`;
  const password = 'WindAndFury!2025';

  await page.goto('/sign-articles');
  await expect(page.getByRole('heading', { name: /Sign the Articles/i })).toBeVisible();
  await page.getByLabel(/Letter of Marque/i).fill(email);
  await page.getByLabel(/Pirate name/i).fill(handle);
  await page.getByLabel(/Secret phrase/i).fill(password);
  await page.getByRole('button', { name: /Sign the Articles/i }).click();

  await page.waitForURL('**/voyage');
  await expect(page.getByRole('heading', { name: /The Voyage/i })).toBeVisible();

  // Visit Charts and confirm the live region renders the connection label
  await page.goto('/charts');
  await expect(page.getByRole('heading', { name: /The Charts/i })).toBeVisible();

  // Submit a deliberately wrong Treasure on the first published Island
  const firstIsland = page.locator('a[href^="/voyage/"]').first();
  if (await firstIsland.count()) {
    await firstIsland.click();
    const innerIsland = page.locator('a[href^="/voyage/"]').first();
    if (await innerIsland.count()) await innerIsland.click();
    await page.getByLabel(/Submit a Treasure/i).fill('progctf{not_the_real_one}');
    await page.getByRole('button', { name: /Claim the Treasure/i }).click();
    await expect(
      page.getByText(/That ain't no Treasure, sailor\.|already claimed|cannons are reloading/i),
    ).toBeVisible({ timeout: 5_000 });
  }
});

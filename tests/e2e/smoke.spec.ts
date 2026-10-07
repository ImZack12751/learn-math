import { expect, test, type Page } from '@playwright/test';

/** Collects console errors and any request that leaves the app's own origin. */
function watch(page: Page) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol.startsWith('http')) {
      external.push(request.url());
    }
  });
  return { errors, external };
}

test('landing page renders the hero, progress and stages with no external requests', async ({
  page,
}) => {
  const seen = watch(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Iterate' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Begin with Stage 1/ })).toBeVisible();
  await expect(page.getByText('Reviews today')).toBeVisible();
  await expect(page.getByText('Depth', { exact: true })).toBeVisible();
  await expect(page.locator('#stages ol > li')).toHaveCount(9);
  await page.waitForLoadState('networkidle');
  expect(seen.external).toEqual([]);
  expect(seen.errors).toEqual([]);
});

test('the live WebGL2 renderer starts (shaders compile) and never makes the page janky', async ({
  page,
}) => {
  const seen = watch(page);
  await page.goto('./');
  const host = page.locator('[data-fractal]');
  // A shader or context failure would switch to the still before ever starting.
  await expect(host).toHaveAttribute('data-renderer-started', 'true');
  // Software-only WebGL (as in CI) may be too slow: then the frame guard must have switched to
  // the still image, and either way the page keeps its own frame rate.
  await page.waitForTimeout(4000);
  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = () => {
          frames++;
          if (performance.now() - start < 1000) requestAnimationFrame(tick);
          else resolve(frames);
        };
        requestAnimationFrame(tick);
      }),
  );
  expect(fps).toBeGreaterThanOrEqual(40);
  expect(seen.errors).toEqual([]);
});

test('reduced motion freezes the fractal to a pre-rendered still', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('./');
  const host = page.locator('[data-fractal]');
  await expect(host).toHaveAttribute('data-fractal', 'still');
  const img = host.locator('img');
  await expect(img).toHaveAttribute('src', /generated\/stills\/obsidian-julia\.webp$/);
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
  await context.close();
});

test('themes switch live from the Display menu and persist across reloads', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'obsidian');
  await page.getByRole('button', { name: 'Display' }).click();
  await page
    .getByRole('dialog', { name: 'Display settings' })
    .getByText('Pearl', { exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pearl');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pearl');
});

test('a topic deep link shows its header with fingerprint and prerequisites', async ({ page }) => {
  const seen = watch(page);
  await page.goto('./topic/s2-fractional-exponents');
  await expect(page.getByRole('heading', { level: 1, name: 'Fractional exponents' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Zero and negative exponents' })).toBeVisible();
  await expect(page.getByRole('meter', { name: /Mastery of Fractional exponents/ })).toBeVisible();
  const thumb = page.locator('img.thumb').first();
  await expect.poll(() => thumb.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(512);
  expect(seen.errors).toEqual([]);
});

test('keyboard users can skip to content first', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

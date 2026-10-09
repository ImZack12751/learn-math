import { expect, test, type Page } from '@playwright/test';

const LESSON = './topic/s2-fractional-exponents';

function watchErrors(page: Page) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('request', (r) => {
    const host = new URL(r.url()).hostname;
    if (r.url().startsWith('http') && !['localhost', '127.0.0.1'].includes(host))
      external.push(r.url());
  });
  return { errors, external };
}

test('the fractional exponents lesson shows every part, in order', async ({ page }) => {
  const seen = watchErrors(page);
  await page.goto(LESSON);
  const headings = [
    'Where this leads',
    'From first principles',
    'Step by step, then on your own',
    'Fresh problems, every time',
    'Remember',
    'Five questions, mixed',
  ];
  for (const name of headings)
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  const order = await Promise.all(
    headings.map((name) =>
      page
        .getByRole('heading', { level: 2, name })
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
    ),
  );
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the next topic' })).toBeVisible();
  expect(seen.errors).toEqual([]);
});

test('a worked example checks the learner’s own answer and names a misconception', async ({
  page,
}) => {
  await page.goto(LESSON);
  const example = page.locator('section#examples > div > div').filter({ hasText: 'on your own' });
  await example.getByRole('button', { name: 'Type as plain text instead' }).click();
  const input = example.getByRole('textbox', { name: /worked example/ });

  // −9 is what reading the negative exponent as a negative number gives for 27^(−2/3).
  await input.fill('-9');
  await example.getByRole('button', { name: 'Check' }).click();
  await expect(example.getByText('Not quite.')).toBeVisible();
  await expect(example.getByText('Reading a negative exponent as a negative number')).toBeVisible();

  await input.fill('1/9');
  await expect(example.getByText('Reads as')).toBeVisible();
  await example.getByRole('button', { name: 'Check' }).click();
  await expect(example.getByText('Solved. The full working is above.')).toBeVisible();
});

test('practice offers hints, then the solution one step at a time', async ({ page }) => {
  const seen = watchErrors(page);
  await page.goto(LESSON);
  const practice = page.locator('#practice');
  await practice.scrollIntoViewIfNeeded();
  await practice.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(practice.getByText('Nudge')).toBeVisible();
  await practice.getByRole('button', { name: 'Show the solution step by step' }).click();
  await expect(practice.getByText('Solution')).toBeVisible();
  // The MathLive field loads from the app itself, fonts included.
  await expect(practice.locator('math-field')).toBeAttached();
  await page.waitForLoadState('networkidle');
  expect(seen.external).toEqual([]);
  expect(seen.errors).toEqual([]);
});

test('the power ladder recalculates when the base changes', async ({ page }) => {
  await page.goto(LESSON);
  const ladder = page.locator('figure').filter({ hasText: 'Equal steps from 0 to 1' });
  await ladder.getByRole('group', { name: 'Base' }).getByText('64', { exact: true }).click();
  await ladder
    .getByRole('group', { name: 'Equal steps from 0 to 1' })
    .getByText('6', { exact: true })
    .click();
  await expect(ladder.getByText(/Each step multiplies by/)).toContainText('2');
  await expect(ladder.locator('tbody tr')).toHaveCount(7);
});

import { expect, test } from '@playwright/test';

async function openLanding(page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { name: 'TUFF.BABY' })).toBeVisible();
}

async function motionState(page) {
  return page.evaluate(() => {
    const fist = getComputedStyle(document.querySelector('.fist__shape'));
    const type = getComputedStyle(document.querySelector('.wordmark__motion'));
    const matrix = new DOMMatrixReadOnly(fist.transform);
    return {
      cursorScale: Math.hypot(matrix.a, matrix.b),
      textBlur: type.filter === 'none' ? 0 : Number.parseFloat(type.filter.slice(5)),
      textTransform: type.transform,
      grainAnimation: getComputedStyle(document.querySelector('.grain')).animationName,
    };
  });
}

async function moveFast(page) {
  await page.mouse.move(200, 440);
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(i % 2 ? 240 : 1200, 440 + i * 2);
    await page.waitForTimeout(18);
  }
}

test('renders the local white wordmark without runtime or asset errors', async ({ page }) => {
  const errors = [];
  const failedAssets = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failedAssets.push(`${response.status()} ${response.url()}`);
  });
  await openLanding(page);
  await expect(page).toHaveTitle('TUFF.BABY');
  const typography = await page.locator('.wordmark__motion').evaluate((element) => ({
    fontLoaded: document.fonts.check('48px Anton'),
    fontFamily: getComputedStyle(element).fontFamily,
    color: getComputedStyle(element).color,
  }));
  expect(typography.fontLoaded).toBe(true);
  expect(typography.fontFamily).toContain('Anton');
  expect(typography.color).toBe('rgb(255, 255, 255)');
  const bounds = await page.locator('.wordmark__fit').boundingBox();
  expect(bounds.x).toBeGreaterThan(0);
  expect(bounds.x + bounds.width).toBeLessThan(1440);
  expect(bounds.width).toBeGreaterThan(1440 * 0.9);
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
});

test('fast movement enlarges the fist and shakes and blurs the wordmark, then settles', async ({ page }) => {
  await openLanding(page);
  await page.mouse.move(100, 440);
  await expect(page.locator('.fist__shape')).toBeVisible();
  const idle = await motionState(page);
  expect(idle.cursorScale).toBeCloseTo(1);
  expect(idle.textBlur).toBe(0);

  await moveFast(page);
  const moving = await motionState(page);
  expect(moving.cursorScale).toBeGreaterThan(2);
  expect(moving.textBlur).toBeGreaterThan(0.5);
  expect(moving.textTransform).not.toBe(idle.textTransform);

  await expect.poll(async () => (await motionState(page)).cursorScale).toBeLessThan(1.01);
  await expect.poll(async () => (await motionState(page)).textBlur).toBe(0);
  await expect(page.locator('.fist__shape')).toBeVisible();
});

test('respects reduced motion while preserving the fist cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page);
  const before = await motionState(page);
  await moveFast(page);
  const after = await motionState(page);
  await expect(page.locator('.fist__shape')).toBeVisible();
  expect(after.cursorScale).toBe(1);
  expect(after.textBlur).toBe(0);
  expect(after.textTransform).toBe(before.textTransform);
  expect(after.grainAnimation).toBe('none');
});

test('fits narrow touch screens without showing a fake cursor or scrolling', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => document.fonts.ready);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const bounds = await page.locator('.wordmark__fit').boundingBox();
      return bounds.x >= 0 && bounds.x + bounds.width <= viewport.width
        && bounds.y >= 0 && bounds.y + bounds.height <= viewport.height;
    }).toBe(true);
    await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
    await expect(page.locator('.fist__shape')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height);
  }
  await context.close();
});

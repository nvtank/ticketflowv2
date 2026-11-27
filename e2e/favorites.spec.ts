import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const password = 'TixFlowDemo!2026';
const catalog = '/events?q=Tech+Innovation+Summit';
const detail = '/events/tech-innovation-summit';
const heartName = 'Yêu thích Tech Innovation Summit';
const favoriteEndpoint = '**/api/v1/me/favorites/*';

test.beforeAll(() => {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://tixflow_test:tixflow_test_only@127.0.0.1:55443/tixflow_test';
  const parsed = new URL(url);
  if (
    !['localhost', '127.0.0.1'].includes(parsed.hostname) ||
    parsed.port !== '55443' ||
    parsed.pathname !== '/tixflow_test'
  )
    throw new Error('Favorites E2E requires the isolated local test database.');
  // Use Node directly so seeding also works on Windows, where pnpm is a shell shim.
  execFileSync(process.execPath, ['apps/api/dist/seed.js'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: url, DEMO_PASSWORD: password },
  });
});

async function registerCustomer(request: APIRequestContext) {
  const email = `favorites-${randomUUID()}@example.test`;
  const response = await request.post('/api/v1/auth/register', {
    data: { email, password, name: 'Favorites Customer' },
  });
  expect(response.status()).toBe(201);
  return email;
}

async function login(page: Page, email: string) {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

test('returns from login, saves a favorite across reloads, and removes it from the list', async ({
  page,
  request,
}) => {
  const email = await registerCustomer(request);
  await page.goto(catalog);
  await page.getByRole('button', { name: heartName }).click();
  await expect(page).toHaveURL(
    (url) => url.pathname === '/login' && url.searchParams.get('next') === catalog,
  );
  await login(page, email);
  await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === catalog);

  const heart = page.getByRole('button', { name: heartName });
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  const added = page.waitForResponse(
    (response) =>
      response.url().includes('/me/favorites/') && response.request().method() === 'PUT',
  );
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  expect((await added).ok()).toBe(true);

  await page.reload();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Xem chi tiết', exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === detail);
  await expect(heart).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Favorites', exact: true }).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByRole('heading', { name: 'Tech Innovation Summit' })).toBeVisible();
  const removed = page.waitForResponse(
    (response) =>
      response.url().includes('/me/favorites/') && response.request().method() === 'DELETE',
  );
  await heart.click();
  expect((await removed).ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Bạn chưa lưu sự kiện nào' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Xem tất cả sự kiện' })).toHaveAttribute(
    'href',
    '/events',
  );
});

test('rolls back the optimistic heart when the save fails', async ({ page, request }) => {
  const email = await registerCustomer(request);
  await page.goto('/login');
  await login(page, email);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('link', { name: 'Yêu thích', exact: true })).toHaveAttribute(
    'href',
    '/favorites',
  );
  await page.goto(detail);
  await expect(page.getByRole('heading', { name: 'Tech Innovation Summit' })).toBeVisible();

  const failure = 'Không thể lưu sự kiện trong lần thử này.';
  let releaseResponse = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(favoriteEndpoint, async (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    await responseGate;
    await route.fulfill({ status: 503, json: { message: failure } });
  });
  const heart = page.getByRole('button', { name: heartName });
  try {
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
  } finally {
    releaseResponse();
  }
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText(failure, { exact: true })).toBeVisible();
});

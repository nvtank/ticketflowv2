import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const password = 'TixFlowDemo!2026';

test.beforeAll(() => {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://tixflow_test:tixflow_test_only@127.0.0.1:55443/tixflow_test';
  const parsed = new URL(url);
  if (
    !['localhost', '127.0.0.1'].includes(parsed.hostname) ||
    parsed.port !== '55443' ||
    parsed.pathname !== '/tixflow_test'
  ) {
    throw new Error('Requires isolated local test DB.');
  }
  execFileSync('pnpm', ['--filter', '@tixflow/api', 'exec', 'node', 'dist/seed.js'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: url,
      DEMO_PASSWORD: password,
      TICKET_SIGNING_KEY: 'test-only-persistent-ticket-signing-key-for-isolated-database-2026',
    },
  });
});

async function expectNoA11yViolations(page: Page, contextLabel: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target, failureSummary: n.failureSummary })),
  }));

  expect(
    summary,
    `Accessibility violations detected on ${contextLabel}:\n${JSON.stringify(summary, null, 2)}`,
  ).toEqual([]);
}

async function registerCustomer(page: Page) {
  await page.goto('/register');
  await page.getByLabel('Họ và tên', { exact: true }).fill('Khách Kiểm Thử A11y');
  await page.getByLabel('Email', { exact: true }).fill(`a11y-${crypto.randomUUID()}@e2e.local`);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
}

test('enforces reduced-motion preferences across intro script and animated home sections', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  // Inline intro script in layout.tsx must skip setting data-tf-intro="playing"
  const introState = await page.evaluate(() => document.documentElement.dataset.tfIntro ?? null);
  expect(introState).not.toBe('playing');

  // Global CSS reduced-motion override disables smooth scrolling
  const scrollBehavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scrollBehavior).toBe('auto');

  // Hero heading remains immediately visible and readable without animation lock
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  const headingOpacity = await heading.evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(headingOpacity).toBe(1);

  await expectNoA11yViolations(page, 'Home (prefers-reduced-motion: reduce)');
});

test('guards WCAG 2.1 AA compliance and interactive semantics across catalog, detail, seat map, checkout and my-tickets', async ({
  page,
}) => {
  // 1. Catalog (/events)
  await page.goto('/events');
  const eventLink = page.getByRole('link', { name: /TixFlow Music Festival/ }).first();
  await expect(eventLink).toBeVisible();
  await expectNoA11yViolations(page, 'Catalog (/events)');

  // 2. Event detail (/events/:slug)
  await eventLink.click();
  await expect(page).toHaveURL(/\/events\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoA11yViolations(page, 'Event Detail (/events/:slug)');

  const slug = page.url().split('/').pop()!;

  // 3. Booking & Seat Map semantics (/events/:slug/booking)
  await registerCustomer(page);
  await page.goto(`/events/${slug}/booking`);
  await expect(page.getByText('Đã kết nối cập nhật trực tiếp', { exact: true })).toBeVisible();

  const availableSeats = page.getByRole('button', { name: /^Ghế [A-Z]+\d+: Còn trống$/ });
  await expect(availableSeats.first()).toBeVisible();

  const firstSeat = availableSeats.first();
  const seatLabel = await firstSeat.getAttribute('aria-label');
  expect(seatLabel).toMatch(/^Ghế [A-Z]+\d+: Còn trống$/);
  await expect(firstSeat).toHaveAttribute('aria-pressed', 'false');

  // Verify keyboard focusability and press toggle
  await firstSeat.focus();
  await expect(firstSeat).toBeFocused();
  await page.keyboard.press('Space');
  await expect(firstSeat).toHaveAttribute('aria-pressed', 'true');

  await expectNoA11yViolations(page, 'Booking Seat Map (seat selected)');

  // Confirm hold and verify live countdown timer role
  await page.getByRole('button', { name: 'Xác nhận giữ ghế', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ghế bạn đang giữ', exact: true })).toBeVisible();
  await expect(page.getByRole('timer', { name: 'Thời gian giữ ghế còn lại' })).toBeVisible();

  // 4. Checkout (/checkout/:orderId)
  await page.getByRole('button', { name: 'Tiếp tục đến đơn hàng', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/[a-f0-9-]+$/);
  await expect(page.getByRole('heading', { name: 'Đơn hàng của bạn', exact: true })).toBeVisible();
  await expect(page.getByRole('timer', { name: 'Thời gian giữ ghế còn lại' })).toBeVisible();
  await expectNoA11yViolations(page, 'Checkout (/checkout/:orderId)');

  // Complete mock payment so customer owns a real ticket for /my-tickets scan
  await page.getByRole('button', { name: 'Thanh toán mô phỏng (local)', exact: true }).click();
  await expect(page).toHaveURL(/\/dev-payments\/[a-f0-9-]+$/);
  await page.getByRole('button', { name: 'Gửi callback trùng', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Thanh toán đã được xác nhận', exact: true }),
  ).toBeVisible({ timeout: 15_000 });

  // 5. My Tickets (/my-tickets and /my-tickets/:id)
  await page.getByRole('link', { name: 'Xem vé của tôi', exact: true }).click();
  await expect(page).toHaveURL(/\/my-tickets$/);
  await expect(page.getByRole('heading', { name: 'Vé của tôi', exact: true })).toBeVisible();
  await expectNoA11yViolations(page, 'My Tickets List (/my-tickets)');

  await page.getByRole('link', { name: 'Xem vé', exact: true }).first().click();
  await expect(page).toHaveURL(/\/my-tickets\/[a-f0-9-]+$/);
  await expect(page.getByRole('img', { name: /^Mã QR vé TF-/ })).toBeVisible();
  await expectNoA11yViolations(page, 'Ticket Detail (/my-tickets/:id)');
});

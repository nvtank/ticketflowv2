import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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
  )
    throw new Error('E2E seed requires the isolated test database.');
  execFileSync('pnpm', ['--filter', '@tixflow/api', 'exec', 'node', 'dist/seed.js'], {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: url, NODE_ENV: 'test', DEMO_PASSWORD: password },
  });
});

async function fillContact(page: Page, name: string, email: string, message: string) {
  await page.getByLabel('Họ và tên', { exact: true }).fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Chủ đề', { exact: true }).selectOption('TICKET');
  await page.getByLabel('Nội dung', { exact: true }).fill(message);
}

test('visitor sends a contact message and an admin handles it', async ({ page }, info) => {
  const id = randomUUID().slice(0, 8);
  const name = `Khách thử ${id}`;
  const email = `contact-${id}@example.test`;
  const message = 'Xin hỏi cách tìm lại vé sau khi đặt.';

  await page.goto('/guide');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Liên hệ' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('heading', { name: 'Liên hệ' })).toBeVisible();
  await expect(page.locator('#contact-website')).toBeAttached();
  await expect(page.locator('#contact-website')).toBeHidden();

  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(page.getByLabel('Họ và tên')).toBeFocused();
  await expect(page.getByLabel('Họ và tên')).toHaveAccessibleDescription(
    'Nhập họ tên ít nhất 2 ký tự.',
  );
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  await fillContact(page, name, email, message);
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã gửi tin nhắn' })).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@tixflow.local');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  if (info.project.name === 'mobile-chromium')
    await page.getByRole('button', { name: 'Mở điều hướng dashboard' }).click();
  await page.getByRole('link', { name: 'Tin nhắn liên hệ' }).click();
  await expect(page).toHaveURL(/\/admin\/messages$/);
  await page.getByLabel('Trạng thái', { exact: true }).selectOption('NEW');
  await page.getByRole('button', { name: `Xem tin nhắn của ${name}` }).click();
  const detail = page.getByRole('dialog', { name: 'Vé và đơn hàng' });
  await expect(detail.getByText(email, { exact: true })).toBeVisible();
  await expect(detail.getByText(message, { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Đánh dấu đã xử lý' }).click();
  await expect(detail.getByRole('status')).toContainText('Đã xử lý');
  await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0);
  await page.getByLabel('Trạng thái', { exact: true }).selectOption('HANDLED');
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText('Đã xử lý');
});

test('contact form explains rate limits and retains the draft', async ({ page }) => {
  await page.route('**/api/v1/contact', (route) =>
    route.fulfill({ status: 429, json: { message: 'Too Many Requests' } }),
  );
  await page.goto('/contact');
  const message = 'Nội dung thử để kiểm tra khi bị giới hạn.';
  await fillContact(page, 'Khách thử', 'rate-limit@example.test', message);
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'đợi một phút' })).toBeVisible();
  await expect(page.getByLabel('Nội dung', { exact: true })).toHaveValue(message);
});

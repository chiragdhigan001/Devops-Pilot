import { test, expect } from '@playwright/test';

const MOCK_USER = { _id: 'user1', name: 'Test User', email: 'test@example.com', role: 'user' };
const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.fake';

test.describe('Auth Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('shows login page with OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('GitHub')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email/i).or(page.getByText(/password/i)).first()).toBeVisible();
  });

  test('successful login navigates to dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_USER, token: FAKE_TOKEN, refreshToken: 'fake_refresh' }),
      });
    });
    await page.route('**/api/auth/me', async (route) => {
      const auth = route.request().headers()['authorization'];
      if (auth === `Bearer ${FAKE_TOKEN}`) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      } else {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) });
      }
    });
    await page.route('**/api/monitoring/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
    });
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Systems Dashboard')).toBeVisible();
  });

  test('successful register navigates to dashboard', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_USER, token: FAKE_TOKEN, refreshToken: 'fake_refresh' }),
      });
    });
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route('**/api/monitoring/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
    });
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/register');
    await page.locator('input[placeholder*="YOUR NAME"]').fill('New User');
    await page.locator('input[type="email"]').fill('new@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Systems Dashboard')).toBeVisible();
  });

  test('OAuth callback with valid tokens authenticates and redirects', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route('**/api/monitoring/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
    });
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(`/oauth/callback?token=${FAKE_TOKEN}&refreshToken=fake_refresh`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('OAuth callback with missing token shows error', async ({ page }) => {
    await page.goto('/oauth/callback');
    await expect(page.getByText(/OAuth authentication failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    });
    await page.route('**/api/monitoring/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
    });
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto(`/oauth/callback?token=${FAKE_TOKEN}&refreshToken=fake_refresh`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.getByText('Log Out').click();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

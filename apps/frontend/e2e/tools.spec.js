import { test, expect } from '@playwright/test';

const MOCK_USER = { _id: 'user1', name: 'Test User', email: 'test@example.com', role: 'user' };
const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.fake';

async function setupAuthRoutes(page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
  });
}

test.describe('AI Tools & Monitoring', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.clear();
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', 'fake_refresh');
    }, FAKE_TOKEN);
    await setupAuthRoutes(page);
  });

  test('AI Tools page shows Dockerfile and Workflow generators', async ({ page }) => {
    await page.goto('/ai');
    await expect(page.getByRole('heading', { name: 'Generate Dockerfile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Generate GitHub Actions Workflow' })).toBeVisible();
  });

  test('AI Tools Dockerfile generation requests API and shows result', async ({ page }) => {
    await page.route('**/api/ai/generate-dockerfile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dockerfile: 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nCMD ["node", "index.js"]' }),
      });
    });

    await page.goto('/ai');
    await page.locator('input[placeholder*="TECH STACK"]').first().fill('Node.js');
    await page.getByRole('button', { name: /generate dockerfile/i }).click();
    await expect(page.getByText('FROM node:20-alpine')).toBeVisible({ timeout: 5000 });
  });

  test('AI Tools Workflow generation requests API and shows result', async ({ page }) => {
    await page.route('**/api/ai/generate-workflow', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workflow: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest' }),
      });
    });

    await page.goto('/ai');
    const stackInputs = page.locator('input[placeholder*="TECH STACK"]');
    await stackInputs.nth(1).fill('Python');
    await page.getByRole('button', { name: /generate workflow/i }).click();
    await expect(page.getByText('name: CI')).toBeVisible({ timeout: 5000 });
  });

  test('Log Analyzer page accepts logs and shows analysis', async ({ page }) => {
    await page.route('**/api/ai/analyze-logs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ analysis: '## Error Detected\nConnection refused\n### Fix\nCheck DB credentials' }),
      });
    });

    await page.goto('/ai/logs');
    await page.locator('textarea').fill('2024-01-01 ERROR: Connection refused');
    await page.getByRole('button', { name: /analyze/i }).click();
    await expect(page.getByText('## Error Detected')).toBeVisible({ timeout: 5000 });
  });

  test('Monitoring page loads with live metrics', async ({ page }) => {
    await page.route('**/api/monitoring/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/metrics')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [{ value: 45 }], ram: [{ value: 62 }] }) });
      } else if (url.includes('/logs')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['10:00:00 INFO: Server started', '10:00:01 WARN: High memory']) });
      } else if (url.includes('/insights')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ text: 'CPU usage elevated', time: new Date().toISOString(), color: 'text-warning' }]) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      }
    });

    await page.goto('/monitoring');
    await expect(page.getByText('System Monitoring')).toBeVisible();
    await expect(page.getByText('Live Orchestration Logs')).toBeVisible();
  });

  test('/deployments redirects to /projects', async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/monitoring/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
    });

    await page.goto('/deployments');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('sidebar navigation items are present', async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/monitoring/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
    });

    await page.goto('/dashboard');

    const sidebarLinks = ['Overview', 'Projects', 'Deployments', 'AI Assistant', 'Monitoring', 'Logs'];
    for (const link of sidebarLinks) {
      await expect(page.getByText(link).first()).toBeVisible();
    }
  });
});

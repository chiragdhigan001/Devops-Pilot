import { test, expect } from '@playwright/test';

const MOCK_USER = { _id: 'user1', name: 'Test User', email: 'test@example.com', role: 'user' };
const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.fake';

const MOCK_PROJECTS = [
  { _id: 'proj1', name: 'My App', githubRepo: 'user/my-app', subdomain: 'my-app', deploymentStatus: 'running', ownerId: 'user1', createdAt: new Date().toISOString() },
  { _id: 'proj2', name: 'API Service', githubRepo: 'user/api-service', subdomain: 'api-service', deploymentStatus: 'idle', ownerId: 'user1', createdAt: new Date().toISOString() },
];

async function setupAuthRoutes(page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
  });
  await page.route('**/api/monitoring/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cpu: [], ram: [], totalDeployments: 0, activeProjects: 0, totalProjects: 0, insights: [] }) });
  });
}

test.describe('Projects CRUD', () => {

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

  test('lists projects', async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROJECTS) });
    });

    await page.goto('/projects');
    await expect(page.getByText('My App')).toBeVisible();
    await expect(page.getByText('API Service')).toBeVisible();
  });

  test('shows empty state when no projects', async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/projects');
    await expect(page.getByText(/no projects found/i)).toBeVisible();
  });

  test('creates a new project', async ({ page }) => {
    let projects = [];
    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newProj = { _id: 'proj3', ...body, deploymentStatus: 'idle', ownerId: 'user1', createdAt: new Date().toISOString() };
        projects = [newProj];
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newProj) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(projects) });
      }
    });

    await page.goto('/projects');
    await page.getByText('+ New Project').click();
    await page.locator('input[placeholder="PROJECT NAME"]').fill('New Test Project');
    await page.locator('input[placeholder="GITHUB REPO (user/repo)"]').fill('user/test-repo');
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText('New Test Project')).toBeVisible({ timeout: 5000 });
  });

  test('deletes a project', async ({ page }) => {
    let projects = [...MOCK_PROJECTS];
    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'DELETE') {
        const id = route.request().url().split('/').pop();
        projects = projects.filter((p) => p._id !== id);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(projects) });
      }
    });

    await page.goto('/projects');
    await expect(page.getByText('My App')).toBeVisible();

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete/i }).first().click();
    await expect(page.getByText('My App')).not.toBeVisible();
  });

  test('navigates to project detail on click', async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROJECTS) });
    });

    await page.goto('/projects');
    await page.getByText('My App').click();
    await expect(page).toHaveURL(/\/projects\/proj1/);
  });
});

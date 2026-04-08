import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';

test.describe('Table Builder Module E2E Workflows', () => {
  let app: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // Launch the Electron app directly
    // Using the built electron output so we don't rely on Vite dev server here
    // Make sure we have run `npm run build` beforehand
    app = await electron.launch({
      args: ['.', '--no-sandbox'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // Get the first window that the app opens
    page = await app.firstWindow();
  });

  test.afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should launch app and navigate to Table Builder', async () => {
    await page.waitForLoadState('domcontentloaded');
    
    // Verify it loads the Reseonix main UI
    await expect(page.locator('.rd-sidebar')).toBeVisible({ timeout: 15000 });
    
    // Click on Table Builder in the sidebar navigation
    // We assume the sidebar has a link with text like 'Tables' or a known class.
    // Based on standard module structure, maybe look for text or data-module
    const tableBuilderLink = page.getByText('Table Builder', { exact: false }).first();
    await tableBuilderLink.click();

    // Verify Table Dashboard or module header appears
    const header = page.getByRole('heading', { name: /Table Builder|Tables/i });
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should open Create New Table wizard and proceed to Table Canvas', async () => {
    // Click "Create Table" or "New Table" button
    const createBtn = page.getByRole('button', { name: /Create Table|New Table|Blank/i }).first();
    await createBtn.click();

    // Wait for Wizard overlay
    const wizardHeader = page.getByText('Create New Table');
    await expect(wizardHeader).toBeVisible();

    // Step 1: Source (Select Blank)
    const blankOption = page.getByText('Blank Table');
    await blankOption.click();
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 2: Type
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 3: Structure
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 4: Metadata
    const titleInput = page.getByPlaceholder('e.g. Baseline Characteristics');
    await titleInput.fill('E2E Automated Table');
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 5: Style -> Finish
    await page.getByRole('button', { name: /Create Table/i }).click();

    // Verify it navigates into the Canvas
    // We should see "TableCanvas" or the specific Table Title
    await expect(page.getByText('E2E Automated Table').first()).toBeVisible({ timeout: 10000 });
    
    // Verify grid is visible
    const grid = page.locator('.tb-canvas-grid-body');
    await expect(grid).toBeVisible();
  });

  test('should edit a cell in the table grid', async () => {
    // Double click the first standard cell to open editor
    const firstCell = page.locator('.tb-grid-cell-content').first();
    await firstCell.dblclick();

    // Type something in the input
    const editorInput = page.locator('input.tb-cell-editor-input, textarea.tb-cell-editor-input').first();
    await expect(editorInput).toBeVisible();
    await editorInput.fill('Test Content 123');
    await editorInput.press('Enter');

    // Verify cell content updated
    await expect(firstCell).toHaveText('Test Content 123');
  });
});

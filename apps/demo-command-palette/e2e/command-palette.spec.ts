import {expect, test, type Page} from '@playwright/test';

function palette(page: Page) {
  return page.locator('tini-command-palette');
}

function paletteSearchInput(page: Page) {
  return page.locator('tini-command-palette input').first();
}

async function openPalette(page: Page) {
  await page.getByRole('button', {name: 'Open Palette'}).click();
  await expect(palette(page)).toContainText('Command Palette');
}

async function searchCommands(page: Page, query: string) {
  await paletteSearchInput(page).fill(query);
}

test.beforeEach(async ({page}) => {
  await page.goto('/');
});

test('opens the palette with Ctrl+K and shows available commands', async ({
  page,
}) => {
  await page.keyboard.press('Control+K');

  await expect(palette(page)).toContainText('Say Hello');
  await expect(palette(page)).toContainText('Async Task');
  await expect(palette(page)).toContainText('Search Commands');
});

test('opens with Ctrl+Shift+P and closes with Escape', async ({page}) => {
  await page.keyboard.press('Control+Shift+P');

  await expect(paletteSearchInput(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(paletteSearchInput(page)).not.toBeVisible();
});

test('shows an empty state when no commands match the search', async ({
  page,
}) => {
  await openPalette(page);
  await searchCommands(page, 'no-such-command');

  await expect(palette(page)).toContainText('Команды не найдены.');
});

test('executes the hello command and records it in recent history', async ({
  page,
}) => {
  await openPalette(page);
  await searchCommands(page, 'hello');
  await page.keyboard.press('Enter');

  await expect(page.getByTestId('live-status')).toHaveText(
    'Hello command executed successfully.'
  );
  await expect(page.getByTestId('recent-commands')).toContainText('Say Hello');
});

test('executes the sequence shortcut g h without opening the palette', async ({
  page,
}) => {
  await page.keyboard.press('g');
  await page.keyboard.press('h');

  await expect(page.getByTestId('live-status')).toHaveText(
    'Hello command executed successfully.'
  );
});

test('runs a navigation command and updates the browser path', async ({
  page,
}) => {
  await openPalette(page);
  await searchCommands(page, 'about');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByTestId('recent-commands')).toContainText(
    'Перейти к About'
  );
  await expect(paletteSearchInput(page)).not.toBeVisible();
});

test('submits command arguments through the palette form', async ({page}) => {
  await openPalette(page);
  await searchCommands(page, 'Search Commands');
  await page.keyboard.press('Enter');

  await expect(palette(page)).toContainText('Аргументы для команды');

  const argumentInput = page.locator('tini-command-palette .args input').first();
  await argumentInput.fill('docs');
  await page.getByRole('button', {name: 'Запустить'}).click();

  await expect(page.getByTestId('live-status')).toHaveText(
    'Search command executed with query: docs'
  );
});

test('closes the arguments form with Escape and returns to search mode', async ({
  page,
}) => {
  await openPalette(page);
  await searchCommands(page, 'Search Commands');
  await page.keyboard.press('Enter');

  await expect(palette(page)).toContainText('Аргументы для команды');
  await page.keyboard.press('Escape');

  await expect(palette(page)).not.toContainText('Аргументы для команды');
  await expect(paletteSearchInput(page)).toBeVisible();
});

test('shows the command error inside the palette', async ({page}) => {
  await openPalette(page);
  await searchCommands(page, 'Fail Command');
  await page.keyboard.press('Enter');

  await expect(page.locator('tini-command-palette [role="alert"]')).toHaveText(
    'Demo failure: command crashed intentionally.'
  );
  await expect(paletteSearchInput(page)).toBeVisible();
});

test('cancels a running async command with Escape', async ({page}) => {
  await openPalette(page);
  await searchCommands(page, 'Async Task');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');

  await expect(page.getByTestId('live-status')).toHaveText(
    'Async task cancelled.'
  );
});

test('persists the selected theme after reload', async ({page}) => {
  await page.getByRole('button', {name: 'Dark mode'}).click();

  await expect(page.getByTestId('live-status')).toHaveText(
    'Theme switched to dark.'
  );
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', {name: 'Light mode'})).toBeVisible();

  await page.reload();

  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', {name: 'Light mode'})).toBeVisible();
});

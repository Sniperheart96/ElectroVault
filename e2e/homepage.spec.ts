import { test, expect } from '@playwright/test';

/**
 * E2E Tests für die Homepage
 * Phase 0: Grundlegende Navigation und Rendering
 */

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Prüfe, dass die Seite geladen wurde
    await expect(page).toHaveTitle(/ElectroVault/i);
  });

  test('should display the main navigation', async ({ page }) => {
    await page.goto('/');

    // Prüfe auf Navigations-Elemente
    // Anpassung an tatsächliche Implementierung notwendig
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
  });

  test('should have working links in navigation', async ({ page }) => {
    await page.goto('/');

    // Beispiel: Klick auf "Components" Link
    // Diese Tests werden angepasst, sobald die tatsächliche Navigation existiert
    const componentsLink = page.getByRole('link', { name: /komponenten|components/i });

    // Wenn der Link existiert, prüfe Navigation
    const linkCount = await componentsLink.count();
    if (linkCount > 0) {
      await componentsLink.first().click();
      await expect(page).toHaveURL(/\/components/);
    }
  });

  test('should be responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Homepage - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Homepage sollte innerhalb von 3 Sekunden laden
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Homepage - Accessibility', () => {
  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');

    // Prüfe auf grundlegende a11y-Struktur
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // Genau ein H1-Element

    const main = page.locator('main');
    await expect(main).toBeVisible(); // main-Element vorhanden
  });

  test('should have valid lang attribute', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const lang = await html.getAttribute('lang');

    // Deutsche oder englische Sprache
    expect(['de', 'en']).toContain(lang);
  });
});

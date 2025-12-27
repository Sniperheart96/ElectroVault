/**
 * Website Test Script mit Playwright
 * Prüft die ElectroVault Website und liest Browser-Konsole aus
 */
import { chromium, type ConsoleMessage, type Page } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TestResult {
  page: string;
  status: 'pass' | 'fail' | 'error';
  loadTime: number;
  consoleMessages: { type: string; text: string }[];
  errors: string[];
  screenshots?: string;
}

async function testPage(page: Page, url: string, name: string): Promise<TestResult> {
  const consoleMessages: { type: string; text: string }[] = [];
  const errors: string[] = [];

  // Konsolen-Nachrichten sammeln
  page.on('console', (msg: ConsoleMessage) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // Fehler sammeln
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  const startTime = Date.now();

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    if (!response) {
      return {
        page: name,
        status: 'error',
        loadTime,
        consoleMessages,
        errors: ['No response received'],
      };
    }

    const status = response.status();

    // Screenshot bei Fehlern
    let screenshot: string | undefined;
    if (status >= 400 || errors.length > 0) {
      const screenshotPath = `./screenshots/${name.replace(/\//g, '_')}-error.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      screenshot = screenshotPath;
    }

    return {
      page: name,
      status: status < 400 && errors.length === 0 ? 'pass' : 'fail',
      loadTime,
      consoleMessages,
      errors,
      screenshots: screenshot,
    };
  } catch (error) {
    return {
      page: name,
      status: 'error',
      loadTime: Date.now() - startTime,
      consoleMessages,
      errors: [(error as Error).message],
    };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('ElectroVault Website Test');
  console.log('='.repeat(60));
  console.log(`\nTesting: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'ElectroVault-Test/1.0',
  });

  const pagesToTest = [
    { url: '/', name: 'Homepage' },
    { url: '/components', name: 'Components' },
    { url: '/categories', name: 'Categories' },
    { url: '/manufacturers', name: 'Manufacturers' },
    { url: '/auth/signin', name: 'Sign In' },
  ];

  const results: TestResult[] = [];

  for (const pageConfig of pagesToTest) {
    const page = await context.newPage();
    console.log(`Testing: ${pageConfig.name}...`);

    const result = await testPage(page, `${BASE_URL}${pageConfig.url}`, pageConfig.name);
    results.push(result);

    // Status ausgeben
    const statusIcon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
    console.log(`  ${statusIcon} ${result.page} (${result.loadTime}ms)`);

    if (result.errors.length > 0) {
      console.log(`    Errors:`);
      result.errors.forEach((e) => console.log(`      - ${e}`));
    }

    // Console errors/warnings ausgeben
    const consoleErrors = result.consoleMessages.filter((m) => m.type === 'error');
    const consoleWarnings = result.consoleMessages.filter((m) => m.type === 'warning');

    if (consoleErrors.length > 0) {
      console.log(`    Console Errors (${consoleErrors.length}):`);
      consoleErrors.slice(0, 5).forEach((m) => console.log(`      - ${m.text.substring(0, 100)}`));
    }

    if (consoleWarnings.length > 0) {
      console.log(`    Console Warnings (${consoleWarnings.length}):`);
      consoleWarnings.slice(0, 3).forEach((m) => console.log(`      - ${m.text.substring(0, 100)}`));
    }

    await page.close();
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const errored = results.filter((r) => r.status === 'error').length;

  console.log(`\nTotal: ${results.length} pages tested`);
  console.log(`  ✓ Passed: ${passed}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  ⚠ Errors: ${errored}`);

  // Detaillierte Konsolen-Ausgabe
  console.log('\n' + '='.repeat(60));
  console.log('Detailed Console Output');
  console.log('='.repeat(60));

  for (const result of results) {
    if (result.consoleMessages.length > 0) {
      console.log(`\n[${result.page}]`);
      result.consoleMessages.forEach((m) => {
        const prefix = m.type === 'error' ? '❌' : m.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${prefix} [${m.type}] ${m.text.substring(0, 200)}`);
      });
    }
  }

  await browser.close();

  // Exit code basierend auf Ergebnis
  if (failed > 0 || errored > 0) {
    process.exit(1);
  }
}

// Auth-Flow testen
async function testAuthFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('Auth Flow Test');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages: { type: string; text: string }[] = [];
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  try {
    // 1. Zur Sign-In Seite navigieren
    console.log('\n1. Navigating to sign-in page...');
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });

    // 2. Prüfen ob Keycloak-Button vorhanden ist
    const signInButton = await page.locator('button:has-text("Keycloak")').first();
    const buttonExists = await signInButton.isVisible().catch(() => false);

    if (buttonExists) {
      console.log('   ✓ Keycloak sign-in button found');

      // 3. Klicken und Redirect prüfen
      console.log('\n2. Clicking sign-in button...');
      await signInButton.click();

      // Warten auf Navigation (entweder Keycloak oder Fehler)
      await page.waitForURL(/keycloak|error|localhost:8080/, { timeout: 10000 }).catch(() => {});

      const currentUrl = page.url();
      if (currentUrl.includes('localhost:8080') || currentUrl.includes('keycloak')) {
        console.log('   ✓ Redirected to Keycloak');
        console.log(`   URL: ${currentUrl}`);
      } else if (currentUrl.includes('error')) {
        console.log('   ✗ Redirected to error page');
        console.log(`   URL: ${currentUrl}`);
      } else {
        console.log(`   ? Unexpected URL: ${currentUrl}`);
      }
    } else {
      console.log('   ✗ Keycloak sign-in button not found');

      // Screenshot machen
      await page.screenshot({ path: './screenshots/signin-page.png', fullPage: true });
      console.log('   Screenshot saved to ./screenshots/signin-page.png');
    }
  } catch (error) {
    console.log(`   Error: ${(error as Error).message}`);
  }

  // Console-Ausgabe
  if (consoleMessages.length > 0) {
    console.log('\n   Console messages:');
    consoleMessages.forEach((m) => {
      console.log(`     [${m.type}] ${m.text.substring(0, 150)}`);
    });
  }

  await browser.close();
}

// Hauptprogramm
async function main() {
  // Screenshots-Ordner erstellen
  const fs = await import('fs');
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
  }

  await runTests();
  await testAuthFlow();
}

main().catch(console.error);

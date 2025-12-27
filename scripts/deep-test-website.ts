/**
 * Deep Website Test Script mit Playwright
 * Umfassende Prüfung der ElectroVault Website
 */
import { chromium, type Page, type BrowserContext } from 'playwright';

// URLs müssen mit NEXTAUTH_URL und tatsächlicher Konfiguration übereinstimmen
const BASE_URL = process.env.TEST_URL || 'http://192.168.178.80:3000';
const API_URL = process.env.API_URL || 'http://192.168.178.80:3001';

interface ConsoleEntry {
  type: string;
  text: string;
  location?: string;
}

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
}

interface TestReport {
  timestamp: string;
  baseUrl: string;
  pages: PageReport[];
  networkErrors: NetworkError[];
  summary: {
    totalPages: number;
    passed: number;
    failed: number;
    totalConsoleErrors: number;
    totalConsoleWarnings: number;
    totalNetworkErrors: number;
    avgLoadTime: number;
  };
}

interface PageReport {
  name: string;
  url: string;
  status: 'pass' | 'fail';
  httpStatus: number;
  loadTime: number;
  title: string;
  consoleMessages: ConsoleEntry[];
  elements: {
    links: number;
    buttons: number;
    images: number;
    forms: number;
  };
  accessibility: {
    imagesWithoutAlt: number;
    linksWithoutText: number;
  };
  errors: string[];
}

class WebsiteTester {
  private browser: any;
  private context: BrowserContext | null = null;
  private networkErrors: NetworkError[] = [];

  async init() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'ElectroVault-DeepTest/1.0',
    });

    // Netzwerk-Fehler global abfangen
    this.context!.on('response', (response) => {
      if (response.status() >= 400) {
        this.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });
  }

  async testPage(url: string, name: string): Promise<PageReport> {
    const page = await this.context!.newPage();
    const consoleMessages: ConsoleEntry[] = [];
    const errors: string[] = [];

    // Console Messages sammeln
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url,
      });
    });

    // Page Errors sammeln
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    const startTime = Date.now();
    let httpStatus = 0;
    let title = '';

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      httpStatus = response?.status() || 0;
      title = await page.title();
    } catch (error) {
      errors.push((error as Error).message);
    }

    const loadTime = Date.now() - startTime;

    // Elemente zählen
    const elements = {
      links: await page.locator('a').count(),
      buttons: await page.locator('button').count(),
      images: await page.locator('img').count(),
      forms: await page.locator('form').count(),
    };

    // Accessibility prüfen
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    const linksWithoutText = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      let count = 0;
      links.forEach((link) => {
        if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
          count++;
        }
      });
      return count;
    });

    await page.close();

    const hasErrors = errors.length > 0 || httpStatus >= 400;
    const consoleErrors = consoleMessages.filter((m) => m.type === 'error');

    return {
      name,
      url,
      status: hasErrors || consoleErrors.length > 0 ? 'fail' : 'pass',
      httpStatus,
      loadTime,
      title,
      consoleMessages,
      elements,
      accessibility: {
        imagesWithoutAlt,
        linksWithoutText,
      },
      errors,
    };
  }

  async testAPI(): Promise<{ endpoint: string; status: number; ok: boolean }[]> {
    const endpoints = [
      '/health',
      '/api/v1/categories',
      '/api/v1/categories/tree',
      '/api/v1/manufacturers',
      '/api/v1/packages',
      '/api/v1/components',
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_URL}${endpoint}`);
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 0,
          ok: false,
        });
      }
    }

    return results;
  }

  async testLoginFlow(): Promise<{
    success: boolean;
    steps: { step: string; success: boolean; details?: string }[];
  }> {
    const page = await this.context!.newPage();
    const steps: { step: string; success: boolean; details?: string }[] = [];

    try {
      // Step 1: Sign-In Seite laden
      await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });
      const signinLoaded = (await page.title()).includes('ElectroVault');
      steps.push({
        step: 'Load sign-in page',
        success: signinLoaded,
        details: await page.title(),
      });

      // Step 2: Keycloak Button finden
      const button = page.locator('button:has-text("Keycloak")');
      const buttonVisible = await button.isVisible().catch(() => false);
      steps.push({
        step: 'Find Keycloak button',
        success: buttonVisible,
      });

      if (buttonVisible) {
        // Step 3: Button klicken
        await button.click();
        await page.waitForURL(/keycloak|8080/, { timeout: 10000 }).catch(() => {});

        const redirectedToKeycloak = page.url().includes('8080');
        steps.push({
          step: 'Redirect to Keycloak',
          success: redirectedToKeycloak,
          details: page.url(),
        });

        if (redirectedToKeycloak) {
          // Step 4: Login-Formular prüfen
          const usernameField = page.locator('#username');
          const passwordField = page.locator('#password');
          const loginButton = page.locator('#kc-login');

          const formPresent =
            (await usernameField.isVisible().catch(() => false)) &&
            (await passwordField.isVisible().catch(() => false)) &&
            (await loginButton.isVisible().catch(() => false));

          steps.push({
            step: 'Keycloak login form present',
            success: formPresent,
          });

          if (formPresent) {
            // Step 5: Login versuchen
            await usernameField.fill('testuser');
            await passwordField.fill('test123');
            await loginButton.click();

            await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 }).catch(() => {});

            const loggedIn = page.url().startsWith(BASE_URL) && !page.url().includes('error');
            steps.push({
              step: 'Complete login',
              success: loggedIn,
              details: page.url(),
            });
          }
        }
      }
    } catch (error) {
      steps.push({
        step: 'Unexpected error',
        success: false,
        details: (error as Error).message,
      });
    }

    await page.close();

    return {
      success: steps.every((s) => s.success),
      steps,
    };
  }

  async runFullTest(): Promise<TestReport> {
    await this.init();

    console.log('='.repeat(70));
    console.log('ElectroVault Deep Website Test');
    console.log('='.repeat(70));
    console.log(`\nTimestamp: ${new Date().toISOString()}`);
    console.log(`Frontend: ${BASE_URL}`);
    console.log(`API: ${API_URL}\n`);

    // 1. API Tests
    console.log('-'.repeat(70));
    console.log('API Health Check');
    console.log('-'.repeat(70));

    const apiResults = await this.testAPI();
    for (const result of apiResults) {
      const icon = result.ok ? '✓' : '✗';
      console.log(`  ${icon} ${result.endpoint} (${result.status})`);
    }

    // 2. Page Tests
    console.log('\n' + '-'.repeat(70));
    console.log('Page Tests');
    console.log('-'.repeat(70));

    const pagesToTest = [
      { url: '/', name: 'Homepage' },
      { url: '/components', name: 'Components List' },
      { url: '/categories', name: 'Category Browser' },
      { url: '/manufacturers', name: 'Manufacturers List' },
      { url: '/auth/signin', name: 'Sign In Page' },
      { url: '/auth/signout', name: 'Sign Out Page' },
      { url: '/auth/error', name: 'Error Page' },
    ];

    const pageReports: PageReport[] = [];

    for (const pageConfig of pagesToTest) {
      console.log(`\nTesting: ${pageConfig.name}`);
      const report = await this.testPage(`${BASE_URL}${pageConfig.url}`, pageConfig.name);
      pageReports.push(report);

      const icon = report.status === 'pass' ? '✓' : '✗';
      console.log(`  ${icon} HTTP ${report.httpStatus} | ${report.loadTime}ms | "${report.title}"`);
      console.log(
        `    Elements: ${report.elements.links} links, ${report.elements.buttons} buttons, ${report.elements.images} images`
      );

      if (report.accessibility.imagesWithoutAlt > 0) {
        console.log(`    ⚠ ${report.accessibility.imagesWithoutAlt} images without alt text`);
      }

      const consoleErrors = report.consoleMessages.filter((m) => m.type === 'error');
      if (consoleErrors.length > 0) {
        console.log(`    ❌ ${consoleErrors.length} console errors:`);
        consoleErrors.slice(0, 3).forEach((e) => {
          console.log(`       - ${e.text.substring(0, 80)}...`);
        });
      }

      if (report.errors.length > 0) {
        console.log(`    ❌ Page errors:`);
        report.errors.forEach((e) => console.log(`       - ${e}`));
      }
    }

    // 3. Login Flow Test
    console.log('\n' + '-'.repeat(70));
    console.log('Login Flow Test');
    console.log('-'.repeat(70));

    const loginResult = await this.testLoginFlow();
    for (const step of loginResult.steps) {
      const icon = step.success ? '✓' : '✗';
      console.log(`  ${icon} ${step.step}`);
      if (step.details) {
        console.log(`      ${step.details.substring(0, 80)}`);
      }
    }

    // 4. Network Errors
    if (this.networkErrors.length > 0) {
      console.log('\n' + '-'.repeat(70));
      console.log('Network Errors');
      console.log('-'.repeat(70));

      // Deduplizieren
      const uniqueErrors = Array.from(new Map(this.networkErrors.map((e) => [e.url, e])).values());
      uniqueErrors.forEach((e) => {
        console.log(`  ✗ ${e.status} ${e.statusText}: ${e.url.substring(0, 60)}...`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('Summary');
    console.log('='.repeat(70));

    const passed = pageReports.filter((r) => r.status === 'pass').length;
    const failed = pageReports.filter((r) => r.status === 'fail').length;
    const totalConsoleErrors = pageReports.reduce(
      (sum, r) => sum + r.consoleMessages.filter((m) => m.type === 'error').length,
      0
    );
    const totalConsoleWarnings = pageReports.reduce(
      (sum, r) => sum + r.consoleMessages.filter((m) => m.type === 'warning').length,
      0
    );
    const avgLoadTime = Math.round(
      pageReports.reduce((sum, r) => sum + r.loadTime, 0) / pageReports.length
    );

    console.log(`\n  Pages: ${passed}/${pageReports.length} passed`);
    console.log(`  API Endpoints: ${apiResults.filter((r) => r.ok).length}/${apiResults.length} ok`);
    console.log(`  Login Flow: ${loginResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Console Errors: ${totalConsoleErrors}`);
    console.log(`  Console Warnings: ${totalConsoleWarnings}`);
    console.log(`  Network Errors: ${this.networkErrors.length}`);
    console.log(`  Avg Load Time: ${avgLoadTime}ms`);

    const overallSuccess = failed === 0 && totalConsoleErrors === 0 && loginResult.success;
    console.log(`\n  Overall: ${overallSuccess ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

    await this.browser.close();

    return {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      pages: pageReports,
      networkErrors: this.networkErrors,
      summary: {
        totalPages: pageReports.length,
        passed,
        failed,
        totalConsoleErrors,
        totalConsoleWarnings,
        totalNetworkErrors: this.networkErrors.length,
        avgLoadTime,
      },
    };
  }
}

// Main
const tester = new WebsiteTester();
tester.runFullTest().catch(console.error);

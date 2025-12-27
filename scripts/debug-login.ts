/**
 * Debug Login Flow
 */
import { chromium } from 'playwright';

// Muss mit NEXTAUTH_URL übereinstimmen!
const BASE_URL = 'http://192.168.178.80:3000';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false }); // Sichtbar für Debugging
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Alle Netzwerk-Requests loggen
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`❌ ${response.status()} ${response.url()}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`Console Error: ${msg.text()}`);
    }
  });

  console.log('1. Navigating to sign-in page...');
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState('networkidle');
  console.log(`   Current URL: ${page.url()}`);

  console.log('\n2. Clicking Keycloak button...');
  await page.locator('button:has-text("Keycloak")').click();

  console.log('\n3. Waiting for Keycloak...');
  await page.waitForURL(/8080/, { timeout: 10000 });
  console.log(`   Current URL: ${page.url()}`);

  console.log('\n4. Filling login form...');
  await page.locator('#username').fill('testuser');
  await page.locator('#password').fill('test123');

  console.log('\n5. Submitting login...');
  await page.locator('#kc-login').click();

  console.log('\n6. Waiting for redirect...');
  await page.waitForTimeout(5000);
  console.log(`   Current URL: ${page.url()}`);

  // Cookies anzeigen
  const cookies = await context.cookies();
  console.log('\n7. Cookies:');
  cookies.forEach((c) => {
    console.log(`   ${c.name}: ${c.value.substring(0, 50)}...`);
  });

  // Session-Status prüfen
  console.log('\n8. Checking session API...');
  const sessionResponse = await page.goto(`${BASE_URL}/api/auth/session`);
  const sessionData = await sessionResponse?.json();
  console.log('   Session:', JSON.stringify(sessionData, null, 2));

  await page.waitForTimeout(3000);
  await browser.close();
}

debugLogin().catch(console.error);

import { chromium } from 'playwright';

async function checkConsoleErrors() {
  const url = process.argv[2] || 'http://192.168.178.80:3000/';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages: { type: string; text: string }[] = [];
  const networkErrors: { url: string; status: number; statusText: string }[] = [];

  // Collect console messages
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // Collect network errors
  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  // Collect page errors
  page.on('pageerror', (error) => {
    consoleMessages.push({
      type: 'pageerror',
      text: error.message,
    });
  });

  try {
    console.log(`Loading ${url} ...\n`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for any async errors
    await page.waitForTimeout(3000);

    console.log('=== CONSOLE MESSAGES ===\n');
    if (consoleMessages.length === 0) {
      console.log('No console messages found.\n');
    } else {
      for (const msg of consoleMessages) {
        const prefix = msg.type === 'error' ? '❌ ERROR' :
                       msg.type === 'warning' ? '⚠️ WARNING' :
                       msg.type === 'pageerror' ? '💥 PAGE ERROR' :
                       `ℹ️ ${msg.type.toUpperCase()}`;
        console.log(`${prefix}: ${msg.text}\n`);
      }
    }

    console.log('\n=== NETWORK ERRORS (4xx/5xx) ===\n');
    if (networkErrors.length === 0) {
      console.log('No network errors found.\n');
    } else {
      for (const err of networkErrors) {
        console.log(`❌ ${err.status} ${err.statusText}: ${err.url}\n`);
      }
    }

    // Check for visible error states on the page
    console.log('\n=== PAGE CONTENT CHECK ===\n');
    const title = await page.title();
    console.log(`Page title: ${title}`);

    const loginButton = await page.$('text=Anmelden');
    console.log(`Login button visible: ${loginButton !== null}`);

    const errorText = await page.$('text=Error');
    console.log(`Error text visible: ${errorText !== null}`);

  } catch (error) {
    console.error('Failed to load page:', error);
  } finally {
    await browser.close();
  }
}

checkConsoleErrors();

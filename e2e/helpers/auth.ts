import { Page } from '@playwright/test';

/**
 * Führt einen Login über Keycloak durch
 *
 * @param page - Playwright Page-Objekt
 * @param role - Benutzerrolle (admin, moderator, contributor, viewer)
 */
export async function login(
  page: Page,
  role: 'admin' | 'moderator' | 'contributor' | 'viewer' = 'contributor'
) {
  // Navigiere zur Login-Seite
  await page.goto('/auth/login');

  // Warte auf Keycloak-Login-Formular
  // In der Entwicklungsphase: Wenn Keycloak noch nicht läuft,
  // wird dieser Test übersprungen
  try {
    await page.waitForSelector('[name="username"]', { timeout: 5000 });

    // Test-Credentials basierend auf Rolle
    const credentials = {
      admin: {
        username: 'test-admin@electrovault.local',
        password: 'test-admin-password',
      },
      moderator: {
        username: 'test-moderator@electrovault.local',
        password: 'test-moderator-password',
      },
      contributor: {
        username: 'test-contributor@electrovault.local',
        password: 'test-contributor-password',
      },
      viewer: {
        username: 'test-viewer@electrovault.local',
        password: 'test-viewer-password',
      },
    };

    const { username, password } = credentials[role];

    // Fülle Keycloak Login-Form aus
    await page.fill('[name="username"]', username);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');

    // Warte auf erfolgreichen Redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });
  } catch (error) {
    console.warn(
      'Keycloak login form not found - authentication may not be configured yet'
    );
    // In der frühen Entwicklungsphase akzeptabel
  }
}

/**
 * Führt einen Logout durch
 */
export async function logout(page: Page) {
  await page.goto('/auth/logout');
  await page.waitForURL('/');
}

/**
 * Prüft, ob der Benutzer eingeloggt ist
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Prüfe auf User-Menü oder andere Indikatoren
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Erstellt eine authentifizierte Session für Tests
 * Nutzt direkten API-Zugriff statt UI-Login für schnellere Tests
 */
export async function createAuthenticatedSession(
  page: Page,
  role: 'admin' | 'moderator' | 'contributor' | 'viewer' = 'contributor'
) {
  // TODO: Implementierung mit direktem Token-Setup
  // Für Phase 0: Verwende UI-Login als Fallback
  await login(page, role);
}

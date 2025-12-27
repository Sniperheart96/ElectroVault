import { PrismaClient } from '@prisma/client';

// Separate Prisma-Instanz für Tests
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

/**
 * Bereinigt alle Tabellen in der Test-Datenbank
 * Wird verwendet, um einen sauberen Zustand für jeden Test zu garantieren
 */
export async function cleanDatabase() {
  // Liste aller Tabellen (außer Migrations-Tabelle)
  const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  // Alle Tabellen leeren (CASCADE löscht auch abhängige Daten)
  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      await testPrisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`
      );
    }
  }
}

/**
 * Schließt die Datenbankverbindung
 * Sollte in afterAll() Hooks aufgerufen werden
 */
export async function disconnectDatabase() {
  await testPrisma.$disconnect();
}

/**
 * Factory-Funktion für Test-Daten
 * Erstellt Test-Entitäten mit sinnvollen Defaults
 */
export const factories = {
  /**
   * Erstellt eine Test-Kategorie
   */
  async createCategory(overrides: Partial<any> = {}) {
    return testPrisma.category.create({
      data: {
        slug: `test-category-${Date.now()}`,
        name: { de: 'Test Kategorie', en: 'Test Category' },
        level: 0,
        ...overrides,
      },
    });
  },

  /**
   * Erstellt ein Test-CoreComponent
   */
  async createCoreComponent(overrides: Partial<any> = {}) {
    const category = overrides.category || (await this.createCategory());

    return testPrisma.coreComponent.create({
      data: {
        slug: `test-component-${Date.now()}`,
        name: { de: 'Test Bauteil', en: 'Test Component' },
        categoryId: category.id,
        ...overrides,
      },
    });
  },
};

# ElectroVault - KI-Kontext

## Projektübersicht

**ElectroVault** ist eine Community-gepflegte Datenbank für elektrische Bauteile mit Fokus auf:
- Historische und moderne Komponenten (Röhren bis Nanotechnologie)
- Geräte-Reparatur-Dokumentation
- Schaltplan-Digitalisierung
- Umfassende Metadaten (Gefahrstoffe, Datierung, Militär-Specs, ECAD)

## Tech-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14+ (App Router), TailwindCSS, shadcn/ui |
| Backend | Fastify, Prisma, PostgreSQL |
| Auth | Keycloak + next-auth |
| Storage | MinIO (S3-kompatibel) |
| Monorepo | Turborepo + pnpm |
| Sprache | Deutsch (i18n-ready) |

## Kritische Domain-Konzepte

### 2-Ebenen-Bauteil-Architektur

```
CoreComponent (Logisches Bauteil)
    ↓ 1:n
ManufacturerPart (Konkretes Produkt)
```

- **CoreComponent** = Herstellerunabhängig (z.B. "555 Timer")
- **ManufacturerPart** = Konkretes Produkt eines Herstellers (z.B. "TI NE555P")

### Attribut-Scope

| Scope | Bedeutung | Beispiel |
|-------|-----------|----------|
| COMPONENT | Gilt für alle Hersteller | Pinanzahl, Grundkapazität |
| PART | Herstellerspezifisch | Toleranz, ESR, Lebensdauer |
| BOTH | Typisch auf Component, garantiert auf Part | Kapazitätswert |

### Lokalisierung (LocalizedString)

Alle Freitextfelder werden als JSON gespeichert:

```typescript
type LocalizedString = {
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  zh?: string;
};

// Beispiel
{ "de": "Kondensator", "en": "Capacitor" }
```

**Fallback-Kette:** Angefragte Sprache → Englisch → Erste verfügbare

### Kategorie-Hierarchie

```
Domain → Family → Type → Subtype (4 Ebenen)

Beispiel:
Passive Components → Capacitors → Electrolytic → Aluminum Electrolytic
```

### Lifecycle-Status

| Status | Bedeutung |
|--------|-----------|
| ACTIVE | In Produktion, empfohlen |
| NRND | Not Recommended for New Designs |
| EOL | End of Life angekündigt |
| OBSOLETE | Nicht mehr erhältlich |

## Benutzer-Rollen

| Rolle | Rechte |
|-------|--------|
| ADMIN | Vollzugriff, Benutzerverwaltung |
| MODERATOR | Inhalte freigeben, bearbeiten |
| CONTRIBUTOR | Inhalte erstellen, eigene bearbeiten |
| VIEWER | Nur lesen |

## Projektstruktur

```
electrovault/
├── .claude/                    # KI-Kontext & Agenten
│   ├── CLAUDE.md              # Dieses Dokument
│   └── agents/                # Agenten-Definitionen
├── apps/
│   ├── web/                   # Next.js Frontend + Admin
│   └── api/                   # Fastify Backend
├── packages/
│   ├── database/              # Prisma Schema & Extensions
│   ├── schemas/               # Zod-Validierung (shared)
│   ├── auth/                  # Keycloak/next-auth Wrapper
│   ├── ui/                    # shadcn/ui Komponenten
│   └── shared/                # Utils, Types, Constants
├── docker/                    # Container-Configs
└── docs/                      # Dokumentation
```

## Häufige Befehle

```bash
# Entwicklung
pnpm dev          # Alle Apps starten (Frontend :3000, API :3001)
pnpm build        # Production Build
pnpm lint         # ESLint + Prettier
pnpm test         # Vitest Tests ausführen

# Datenbank
pnpm db:migrate   # Prisma Migration ausführen
pnpm db:seed      # Seed-Daten laden
pnpm db:studio    # Prisma Studio öffnen
pnpm db:reset     # Datenbank zurücksetzen (Vorsicht!)
```

## Server-Umgebung

```
Server: Windows Server 2019 (ITME-SERVER)
PostgreSQL: Port 5432 (ElectroVault_Dev)
Keycloak: Port 8080 (Realm: electrovault)
MinIO: Port 9000/9001 (Bucket: electrovault-files)
```

## Wichtige Konventionen

1. **Soft-Delete** - Nichts wird physisch gelöscht (`deletedAt` Timestamp)
2. **Audit-Logging** - Jede Mutation wird protokolliert
3. **Zod-First** - Schema einmal definieren, überall nutzen
4. **Deutsche UI** - Aber i18n-ready für spätere Übersetzungen
5. **TypeScript strict** - Keine `any` Types erlaubt
6. **Keine Dummy-Daten in Fallbacks** - Fallback-Funktionen dürfen NIEMALS Dummy- oder Fake-Daten zurückgeben

## Fehlerbehandlung - Kritische Regel

**Fallback-Funktionen dürfen niemals fehlerhaften Code verschleiern!**

```typescript
// ❌ FALSCH - Verschleiert den Fehler mit Dummy-Daten
function getComponent(id: string) {
  try {
    return database.findById(id);
  } catch (error) {
    return { id: 'dummy', name: 'Fallback Component' }; // VERBOTEN!
  }
}

// ✅ RICHTIG - Fehler wird sichtbar gemacht
function getComponent(id: string) {
  try {
    return database.findById(id);
  } catch (error) {
    logger.error('Failed to fetch component', { id, error });
    throw new ComponentNotFoundError(id); // Oder: return null mit Fehlerbehandlung im UI
  }
}

// ✅ RICHTIG - Fallback mit klarer Fehlermeldung
function getLocalizedName(data: LocalizedString, locale: string): string {
  const value = data[locale] ?? data['en'] ?? Object.values(data)[0];
  if (!value) {
    console.error(`No localized value found for any language`, { data, locale });
    return '[MISSING TRANSLATION]'; // Sichtbarer Fehler, keine Fake-Daten
  }
  return value;
}
```

**Regeln:**
- Ein Fallback darf den Absturz verhindern, aber der Fehler MUSS sichtbar werden
- Logging ist Pflicht bei jedem Fallback
- Sichtbare Indikatoren im UI (z.B. `[FEHLER]`, `[MISSING]`) statt unsichtbarer Fake-Daten
- Im Zweifel: Lieber einen Fehler werfen als stillschweigend falsche Daten liefern

## Verfügbare Agenten

Spezialisierte Agenten für verschiedene Aufgabenbereiche:

| Agent | Datei | Fokus |
|-------|-------|-------|
| Infrastructure | `agents/infrastructure-agent.md` | Server, Docker, Backups |
| Database | `agents/database-agent.md` | Prisma, Migrationen |
| Auth | `agents/auth-agent.md` | Keycloak, Rollen |
| API | `agents/api-agent.md` | Fastify, Services |
| Component Data | `agents/component-data-agent.md` | Elektronik-Domain |
| Frontend | `agents/frontend-agent.md` | Next.js, UI |
| Testing | `agents/testing-agent.md` | Tests, CI/CD |

---

*Letzte Aktualisierung: 2025-12-27*

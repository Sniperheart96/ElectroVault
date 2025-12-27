# ElectroVault - Implementierungsplan

> **Letzte Aktualisierung:** 2025-12-27
> **Aktueller Status:** Phase 0 ✅ Abgeschlossen | Phase 1 ✅ Implementiert (Migration pending)

## Phasen-Übersicht

| Phase | Status | Fortschritt | Beschreibung |
|-------|--------|-------------|--------------|
| **Phase 0** | ✅ Abgeschlossen | 100% | Projekt-Setup, Monorepo, Prisma-Schema, Docker |
| **Phase 1** | ✅ Implementiert | 95% | Datenbank-Schema, Backend API, Auth, Seed-Daten |
| **Phase 2** | ⏳ Bereit | 0% | CRUD-APIs, Attribut-System, Validierung |
| **Phase 3** | ⏳ Geplant | 0% | Frontend, Admin-UI, Formulare |
| **Phase 4** | ⏳ Geplant | 0% | Suche, Filter, Datei-Upload |
| **Phase 5** | ⏳ Geplant | 0% | Geräte-DB, Schaltpläne |

---

## Projektübersicht

**ElectroVault** ist eine Community-gepflegte Datenbank für elektrische Bauteile mit Fokus auf:
- Historische und moderne Komponenten (Röhren bis Nanotechnologie)
- Umfassende Metadaten (Gefahrstoffe, Datierung, Militär-Specs, ECAD)
- Schaltplan-Digitalisierung für historische Geräte
- Wiederverwendbares Authentifizierungssystem

---

## Tech-Stack (Entschieden)

### Kern-Technologien

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14+ (App Router), React 18, TailwindCSS |
| Backend | Node.js, Fastify, Prisma ORM |
| Datenbank | PostgreSQL (bereits vorhanden) |
| Auth | Keycloak (Self-Hosted) + next-auth |
| File Storage | MinIO (S3-kompatibel, Self-Hosted) |
| Monorepo | Turborepo + pnpm |
| Sprache | Deutsch (i18n-ready für spätere Übersetzungen) |

### Entwicklungs-Beschleuniger (Bibliotheken)

| Aufgabe | Bibliothek | Erspart |
|---------|------------|---------|
| **Einheiten-Parsing** | `mathjs` | Eigene SI-Multiplikatoren & Regex für "100µF" → 0.0001F |
| **Schema-Validierung** | `Zod` + `fastify-type-provider-zod` | Doppelte Interface-Definitionen |
| **Formulare** | `react-hook-form` + `@hookform/resolvers/zod` | Manuelle Form-States & Validierung |
| **Audit/Soft-Delete** | Prisma Client Extensions | Boilerplate für jede Entität |
| **UI-Komponenten** | `shadcn/ui` | Eigene Design-System-Entwicklung |
| **Tabellen/Listen** | `@tanstack/react-table` + shadcn | Pagination, Sorting, Filtering |

> **Entscheidung: Kein Refine**
>
> Refine wurde gestrichen weil:
> 1. Es eigene UI-Libraries mitbringt (Mantine/Ant Design) → Design-Bruch mit shadcn/ui
> 2. Wir haben bereits Zod-Schemas → CRUD-Forms sind mit react-hook-form trivial
> 3. Ein `/admin`-Ordner im Next.js App Router reicht völlig aus
> 4. Konsistente Codebase ist wichtiger als "magische" Generierung

### Beispiel: Einheiten mit mathjs

```typescript
import { unit, Unit } from 'mathjs';

// Benutzer gibt "100µF" ein
const input = "100 uF";
const parsed = unit(input);

// Automatisch normalisiert zu SI-Einheit (Farad)
const normalizedValue = parsed.toNumber('F'); // 0.0001

// Für die Datenbank
await prisma.attributeValue.create({
  data: {
    displayValue: "100µF",           // Für Anzeige
    normalizedValue: normalizedValue, // 0.0001 für Filter-Queries
  }
});

// Filter-Query: "Kondensatoren zwischen 10µF und 100µF"
const minF = unit("10 uF").toNumber('F');  // 0.00001
const maxF = unit("100 uF").toNumber('F'); // 0.0001

await prisma.attributeValue.findMany({
  where: {
    normalizedValue: { gte: minF, lte: maxF }
  }
});
```

### Beispiel: Zod + Fastify

```typescript
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

// Schema einmal definieren - gilt für API UND Frontend
const ComponentSchema = z.object({
  mpn: z.string().min(1).max(255),
  manufacturerId: z.string().uuid(),
  categoryId: z.string().uuid(),
  attributes: z.record(z.unknown()).default({}),
});

// Fastify Route mit automatischer Validierung
fastify.withTypeProvider<ZodTypeProvider>().post('/components', {
  schema: {
    body: ComponentSchema,
  },
}, async (request) => {
  // request.body ist bereits validiert und typisiert!
  return componentService.create(request.body);
});

// Gleiches Schema im Frontend
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(ComponentSchema),
});
```

---

## Internationalisierung (i18n)

### Grundprinzipien

1. **Mindestens eine Sprache** - Jedes lokalisierte Feld braucht mindestens einen Wert (egal welche Sprache)
2. **Fallback-Kette** - Angefragte Sprache → Englisch → Erste verfügbare Sprache
3. **Alle Freitextfelder sind mehrsprachig** - Jede Nutzereingabe wird pro Sprache erfasst
4. **UI und Content getrennt** - UI-Texte via next-intl, DB-Inhalte via JSON-Felder
5. **Keine Zwangsübersetzung** - Deutsche Nutzer können rein deutsche Inhalte erstellen

### Unterstützte Sprachen

| Code | Sprache | Bemerkung |
|------|---------|-----------|
| `en` | English | Bevorzugter Fallback |
| `de` | Deutsch | - |
| `fr` | Français | - |
| `es` | Español | - |
| `zh` | 中文 | - |

> **Erweiterbar:** Neue Sprachen können jederzeit hinzugefügt werden, da JSON-Struktur flexibel ist.

### Technische Umsetzung

#### 1. Lokalisierte Felder (LocalizedString)

Alle Freitextfelder werden als JSON gespeichert:

```typescript
// Type Definition
type LocalizedString = {
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  zh?: string;
  [locale: string]: string | undefined;
};

// Beispiel: Nur deutsche Beschreibung
{ "de": "Präzisions-Timer-IC" }

// Beispiel: Mehrsprachig
{
  "en": "Precision Timer IC",
  "de": "Präzisions-Timer-IC",
  "fr": "Circuit minuterie de précision"
}
```

#### 2. Prisma-Schema Pattern

```prisma
model CoreComponent {
  // Lokalisierte Felder als JSON:
  name              Json    // LocalizedString - { "de": "...", "en": "..." }
  shortDescription  Json?   // LocalizedString (optional)
  fullDescription   Json?   // LocalizedString (optional)

  // Nicht lokalisiert (technische Werte):
  slug              String  @unique  // URL-slug bleibt einsprachig
}
```

#### 3. Fallback-Logik (TypeScript Helper)

```typescript
// packages/shared/src/i18n/localized-string.ts

export type Locale = 'en' | 'de' | 'fr' | 'es' | 'zh';
export const FALLBACK_LOCALE: Locale = 'en';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'de', 'fr', 'es', 'zh'];

export interface LocalizedString {
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  zh?: string;
  [key: string]: string | undefined;
}

/**
 * Löst einen lokalisierten String auf mit Fallback-Kette:
 * 1. Angefragte Sprache
 * 2. Englisch (bevorzugter Fallback)
 * 3. Erste verfügbare Sprache
 */
export function t(
  localized: LocalizedString | null | undefined,
  locale: Locale
): string {
  if (!localized) return '';

  // 1. Versuche angefragte Sprache
  if (localized[locale]) {
    return localized[locale]!;
  }

  // 2. Fallback zu Englisch
  if (localized.en) {
    return localized.en;
  }

  // 3. Erste verfügbare Sprache
  for (const fallbackLocale of SUPPORTED_LOCALES) {
    if (localized[fallbackLocale]) {
      return localized[fallbackLocale]!;
    }
  }

  return '';
}

/**
 * Gibt zurück, welche Sprache tatsächlich verwendet wurde
 */
export function resolveLocale(
  localized: LocalizedString | null | undefined,
  requestedLocale: Locale
): { value: string; actualLocale: Locale; isFallback: boolean } | null {
  if (!localized) return null;

  // Direkte Übereinstimmung
  if (localized[requestedLocale]) {
    return {
      value: localized[requestedLocale]!,
      actualLocale: requestedLocale,
      isFallback: false,
    };
  }

  // Englisch Fallback
  if (localized.en) {
    return {
      value: localized.en,
      actualLocale: 'en',
      isFallback: true,
    };
  }

  // Erste verfügbare
  for (const locale of SUPPORTED_LOCALES) {
    if (localized[locale]) {
      return {
        value: localized[locale]!,
        actualLocale: locale,
        isFallback: true,
      };
    }
  }

  return null;
}

/**
 * Prüft ob mindestens eine Sprache ausgefüllt ist
 */
export function hasAnyTranslation(value: unknown): value is LocalizedString {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return SUPPORTED_LOCALES.some(
    locale => typeof obj[locale] === 'string' && obj[locale].length > 0
  );
}

/**
 * Gibt alle verfügbaren Sprachen zurück
 */
export function getAvailableLocales(localized: LocalizedString): Locale[] {
  return SUPPORTED_LOCALES.filter(
    locale => localized[locale] && localized[locale]!.length > 0
  );
}

/**
 * Erstellt oder aktualisiert eine Übersetzung
 */
export function setTranslation(
  existing: LocalizedString | undefined,
  locale: Locale,
  value: string
): LocalizedString {
  const result = { ...existing };
  if (value.trim()) {
    result[locale] = value.trim();
  } else {
    delete result[locale];
  }
  return result;
}
```

#### 4. Zod-Schema für Validierung

```typescript
// packages/schemas/src/localized.schema.ts

import { z } from 'zod';
import { SUPPORTED_LOCALES } from '@electrovault/shared';

// Mindestens eine Sprache muss ausgefüllt sein
export const LocalizedStringSchema = z.object({
  en: z.string().optional(),
  de: z.string().optional(),
  fr: z.string().optional(),
  es: z.string().optional(),
  zh: z.string().optional(),
}).refine(
  data => Object.values(data).some(v => v && v.length > 0),
  { message: 'At least one language must be provided' }
);

// Für optionale lokalisierte Felder (darf auch komplett leer sein)
export const OptionalLocalizedStringSchema = z.object({
  en: z.string().optional(),
  de: z.string().optional(),
  fr: z.string().optional(),
  es: z.string().optional(),
  zh: z.string().optional(),
}).optional().nullable();

// Verwendung in anderen Schemas
export const CoreComponentCreateSchema = z.object({
  name: LocalizedStringSchema,                    // Pflichtfeld, mind. 1 Sprache
  shortDescription: OptionalLocalizedStringSchema, // Optional
  fullDescription: OptionalLocalizedStringSchema,  // Optional
  slug: z.string().min(1),                        // Nicht lokalisiert
  categoryId: z.string().uuid(),
});
```

#### 5. React-Komponente für Eingabe

```tsx
// packages/ui/src/components/localized-input.tsx

interface LocalizedInputProps {
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  label: string;
  required?: boolean;  // = mindestens eine Sprache
  multiline?: boolean;
  defaultLocale?: Locale;  // Welcher Tab initial aktiv
}

export function LocalizedInput({
  value,
  onChange,
  label,
  required,
  multiline,
  defaultLocale = 'de'  // Deutsche Nutzer starten mit Deutsch
}: LocalizedInputProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>(defaultLocale);
  const availableLocales = getAvailableLocales(value);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>

      {/* Sprach-Tabs */}
      <Tabs value={activeLocale} onValueChange={setActiveLocale}>
        <TabsList>
          {SUPPORTED_LOCALES.map(locale => (
            <TabsTrigger key={locale} value={locale}>
              {locale.toUpperCase()}
              {value[locale] && <Check className="ml-1 h-3 w-3" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Eingabefeld */}
      {multiline ? (
        <Textarea
          value={value[activeLocale] || ''}
          onChange={e => onChange(setTranslation(value, activeLocale, e.target.value))}
          placeholder={`${label} (${activeLocale.toUpperCase()})`}
        />
      ) : (
        <Input
          value={value[activeLocale] || ''}
          onChange={e => onChange(setTranslation(value, activeLocale, e.target.value))}
          placeholder={`${label} (${activeLocale.toUpperCase()})`}
        />
      )}

      {/* Info: Was wird anderen Nutzern angezeigt? */}
      {availableLocales.length > 0 && !value[activeLocale] && (
        <p className="text-sm text-muted-foreground">
          💡 Nutzer ohne {activeLocale.toUpperCase()}-Übersetzung sehen:
          "{t(value, activeLocale)}" ({resolveLocale(value, activeLocale)?.actualLocale.toUpperCase()})
        </p>
      )}

      {/* Warnung wenn Pflichtfeld leer */}
      {required && availableLocales.length === 0 && (
        <p className="text-sm text-destructive">
          ⚠️ Mindestens eine Sprache muss ausgefüllt werden
        </p>
      )}
    </div>
  );
}
```

### Betroffene Felder (Übersicht)

#### CoreComponent (logisches Bauteil)

| Feld | Lokalisiert | Begründung |
|------|-------------|------------|
| `name` | ✅ Ja | "Capacitor" vs "Kondensator" |
| `slug` | ❌ Nein | URL-Pfad, technisch |
| `shortDescription` | ✅ Ja | Nutzerbeschreibung |
| `fullDescription` | ✅ Ja | Ausführliche Beschreibung |
| `commonAttributes` | ❌ Nein | Technische Werte (JSON) |

#### CategoryTaxonomy

| Feld | Lokalisiert | Begründung |
|------|-------------|------------|
| `name` | ✅ Ja | "Resistors" vs "Widerstände" |
| `slug` | ❌ Nein | URL-Pfad |
| `description` | ✅ Ja | Kategoriebeschreibung |

#### AttributeDefinition

| Feld | Lokalisiert | Begründung |
|------|-------------|------------|
| `name` | ❌ Nein | Technischer Schlüssel ("capacitance") |
| `displayName` | ✅ Ja | "Capacitance" vs "Kapazität" |
| `unit` | ❌ Nein | SI-Einheiten sind universal ("F", "Ω") |

#### ManufacturerMaster

| Feld | Lokalisiert | Begründung |
|------|-------------|------------|
| `name` | ❌ Nein | Firmenname ist universal |
| `description` | ✅ Ja | Beschreibung der Firma |

#### Device (Geräte-DB)

| Feld | Lokalisiert | Begründung |
|------|-------------|------------|
| `name` | ✅ Ja | Gerätename kann übersetzt werden |
| `description` | ✅ Ja | Gerätebeschreibung |
| `modelNumber` | ❌ Nein | Technische Bezeichnung |

#### Alle Freitext-Notizen

| Model | Feld | Lokalisiert |
|-------|------|-------------|
| `PartRelationship` | `notes` | ✅ Ja |
| `ComponentConceptRelation` | `notes` | ✅ Ja |
| `HazardousMaterial` | `details` | ✅ Ja |
| `PinMapping` | `pinFunction` | ✅ Ja |
| `PositionReplacement` | `notes` | ✅ Ja |
| `AuditLog` | `comment` | ✅ Ja |

### API-Design für Lokalisierung

```typescript
// GET /api/components/:id
// Header: Accept-Language: de

// Response - Felder werden automatisch aufgelöst:
{
  "id": "...",
  "name": "Kondensator",              // Aufgelöst für "de"
  "name_locales": ["de", "en"],       // Verfügbare Sprachen
  "name_all": {                       // Alle Übersetzungen (für Edit-Modus)
    "de": "Kondensator",
    "en": "Capacitor"
  },
  "mpn": "CAP-100UF-25V"              // Nicht lokalisiert
}

// POST /api/components
// Body enthält LocalizedString-Objekte:
{
  "name": {
    "de": "Kondensator"    // Nur Deutsch - völlig OK!
  },
  "shortDescription": {
    "de": "Ein passives Bauelement",
    "en": "A passive electronic component"
  }
}
```

### UI-Internationalisierung (next-intl)

Für statische UI-Texte (Buttons, Labels, Fehlermeldungen):

```
apps/web/
├── messages/
│   ├── en.json
│   ├── de.json
│   ├── fr.json
│   └── ...
└── i18n.ts
```

```typescript
// apps/web/messages/de.json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "loading": "Lädt..."
  },
  "components": {
    "title": "Bauteile",
    "createNew": "Neues Bauteil erstellen",
    "noResults": "Keine Bauteile gefunden"
  },
  "i18n": {
    "fallbackNotice": "Anzeige in {locale}, da keine deutsche Übersetzung vorhanden",
    "addTranslation": "Übersetzung hinzufügen",
    "availableIn": "Verfügbar in: {locales}"
  }
}
```

---

## Entwicklungsumgebung

### Aktuelle Situation

| Komponente | Ort | Status |
|------------|-----|--------|
| VS Code + Claude Code | Windows-Entwicklungsrechner (lokal) | ✓ Läuft |
| Projektordner | Windows Server 2019 (`\\ITME-SERVER\Projekte\ElectroVault`) | ✓ Zugriff vorhanden |
| PostgreSQL Development Server | Windows Server 2019 (Port 5432) | ✓ Vorhanden, läuft |
| Keycloak | Windows Server 2019 (Port 8080) | ✓ Installiert, läuft |
| MinIO | Windows Server 2019 (Port 9000/9001) | ✓ Installiert, läuft |

### Benötigte Zugriffe & Voraussetzungen

#### Auf dem lokalen Entwicklungsrechner:
- [ ] **Node.js 20 LTS** - Runtime für Frontend/Backend
- [ ] **pnpm** - Package Manager (`npm install -g pnpm`)
- [ ] **Docker Desktop** - Für lokale Keycloak/MinIO Instanzen (empfohlen für Entwicklung)

#### Netzwerk-Zugriff zum Server:
- [ ] **PostgreSQL Port 5432** - Muss vom Entwicklungsrechner erreichbar sein
- [ ] **Keycloak Port 8080** - Falls auf Server gehostet
- [ ] **MinIO Ports 9000/9001** - Falls auf Server gehostet

#### Auf dem Windows Server 2019 (falls Docker dort läuft):
- [ ] **Docker** oder **Podman** Installation
- [ ] Alternativ: Keycloak & MinIO als Windows-Services

### Gewähltes Setup

| Service | Wo | Status |
|---------|-----|--------|
| PostgreSQL Development Server | Windows Server 2019 (Port 5432) | ✓ Läuft (existierender Server) |
| Keycloak | Windows Server 2019 (Port 8080) | ✓ Läuft als Windows-Dienst |
| MinIO | Windows Server 2019 (Port 9000/9001) | ✓ Läuft als Windows-Dienst |
| Next.js (Frontend) | Lokal | Entwicklung mit Hot-Reload |
| Fastify (Backend) | Lokal | Entwicklung mit Hot-Reload |

### Entwicklungsrechner-Status

| Software | Status |
|----------|--------|
| Node.js | ✓ Installiert |
| pnpm | ⏳ Muss installiert werden (`npm install -g pnpm`) |
| Docker Desktop | ❌ Nicht benötigt (Services laufen auf Server) |

### Server-Installation (Phase 0)

Auf dem Windows Server 2019 müssen installiert werden:

#### Option A: Docker auf Windows Server (Empfohlen)
```powershell
# Windows Server Container Feature aktivieren
Install-WindowsFeature -Name Containers

# Docker installieren (Docker EE oder Docker Desktop)
# Dann via docker-compose.yml alle Services starten
```

#### Option B: Native Installation (ohne Docker)
1. **Keycloak**: Als Windows-Service mit NSSM oder als Java-Anwendung
2. **MinIO**: Als Windows-Service (minio.exe server)

---

## Credentials & Umgebungsvariablen

### Dateistruktur

```
electrovault/
├── .env.example          # Template (wird committed)
├── .env.local            # Echte Credentials (gitignored!)
├── .env.development      # Entwicklungs-Overrides (optional)
├── .env.production       # Produktion-Overrides (optional)
└── .gitignore            # Muss .env.local ausschließen
```

### .env.example (Template)

```env
# ============================================
# ElectroVault - Umgebungsvariablen
# ============================================
# Kopiere diese Datei nach .env.local und fülle die Werte aus
# NIEMALS echte Credentials in .env.example eintragen!

# === PostgreSQL ===
DATABASE_HOST=ITME-SERVER
DATABASE_PORT=5432
DATABASE_NAME=ElectroVault_Dev
DATABASE_USER=ElectroVault_dev_user
DATABASE_PASSWORD=password
# Prisma Connection String (wird automatisch zusammengebaut)
DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public"

# === Keycloak ===
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=

# === MinIO (S3-kompatibel) ===
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=electrovault-files

# === Anwendung ===
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
WEB_PORT=3000

# === Sicherheit ===
JWT_SECRET=
SESSION_SECRET=
```

### Konfigurierte Credentials

| Variable | Wert | Status |
|----------|------|--------|
| `DATABASE_HOST` | `ITME-SERVER` | ✓ |
| `DATABASE_PORT` | `5432` | ✓ |
| `DATABASE_NAME` | `ElectroVault_Dev` | ✓ |
| `DATABASE_USER` | `ElectroVault_dev_user` | ✓ |
| `DATABASE_PASSWORD` | *(in .env.local)* | ✓ |
| Server-Zugang | `Administrator` | ✓ |

**Hinweis:** Passwörter werden nur in `.env.local` gespeichert, niemals in Git!

---

## Projektstruktur

```
electrovault/
├── .claude/                    # KI-Kontext & Agenten
│   ├── CLAUDE.md              # Hauptkontext-Dokument
│   └── agents/                # Agenten-Definitionen
├── .github/workflows/         # CI/CD
├── apps/
│   ├── web/                   # Next.js Frontend + Admin
│   └── api/                   # Fastify Backend
├── packages/
│   ├── auth/                  # Wiederverwendbares Auth-Package (next-auth wrapper)
│   ├── database/              # Prisma Schema & Client + Soft-Delete Extension
│   ├── schemas/               # Zod-Schemas (shared zwischen API & Frontend)
│   ├── ui/                    # Shared UI Components (shadcn/ui)
│   └── shared/                # Types, Constants, Utils, mathjs Einheiten-Helpers
├── docker/
│   ├── docker-compose.yml     # Dev-Stack (PostgreSQL, Keycloak, MinIO)
│   └── keycloak/              # Realm-Konfiguration
└── docs/                      # Dokumentation
```

### Package-Details

#### `packages/schemas/` - Zod-Validierung (NEU)

```
packages/schemas/
├── src/
│   ├── component.schema.ts    # ComponentCreateSchema, ComponentUpdateSchema
│   ├── manufacturer.schema.ts
│   ├── device.schema.ts
│   ├── user.schema.ts
│   └── index.ts               # Re-exports
└── package.json
```

**Vorteil:** Ein Schema, drei Verwendungen:
1. **API:** Fastify Request-Validierung
2. **Frontend:** react-hook-form Validierung
3. **Types:** TypeScript-Typen automatisch generiert (`z.infer<typeof Schema>`)

#### `packages/shared/` - Utilities

```
packages/shared/
├── src/
│   ├── units/
│   │   ├── parser.ts          # mathjs-basiertes Einheiten-Parsing
│   │   ├── normalize.ts       # "100µF" → { display: "100µF", normalized: 0.0001 }
│   │   └── categories.ts      # Welche Einheiten pro Kategorie erlaubt
│   ├── constants/
│   │   └── enums.ts           # UserRole, ComponentStatus, etc.
│   └── index.ts
└── package.json
```

#### `packages/database/` - Prisma + Extensions

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                # Seed-Daten (Kategorien, Packages)
├── src/
│   ├── client.ts              # Prisma Client mit Extensions
│   ├── extensions/
│   │   ├── soft-delete.ts     # Automatisches Soft-Delete
│   │   └── audit-log.ts       # Automatisches Audit-Logging
│   └── index.ts
└── package.json
```

```typescript
// packages/database/src/client.ts
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './extensions/soft-delete';
import { auditLogExtension } from './extensions/audit-log';

export const prisma = new PrismaClient()
  .$extends(softDeleteExtension)
  .$extends(auditLogExtension);

// Jetzt funktioniert Soft-Delete automatisch:
await prisma.component.delete({ where: { id } }); // Setzt nur deletedAt!
await prisma.component.findMany();                 // Filtert gelöschte automatisch aus
```

---

## Datenbank-Schema (Kernentitäten)

Basierend auf dem Konzeptdokument, implementiert mit Prisma.

### Architektur-Entscheidung: Trennung von Konzept und Produkt

> **Wichtig:** Das Schema trennt zwischen **logischen Bauteilen** (CoreComponent) und
> **konkreten Hersteller-Produkten** (ManufacturerPart). Diese Trennung löst fundamentale Probleme:
>
> - **Keine Duplikate:** "NE555" existiert einmal, nicht 50x pro Hersteller
> - **Klare Verantwortung:** Generische Infos vs. herstellerspezifische Daten
> - **Automatische Alternativen:** Alle ManufacturerParts eines CoreComponent sind potenzielle Ersatzteile
> - **Historische Korrektheit:** "Welcher NE555 war 1985 verfügbar?"

```
┌─────────────────────────────────────────────────────────────────┐
│                    CoreComponent                                 │
│  "NE555" - Präzisions-Timer-IC (herstellerunabhängig)           │
│  - Generische Beschreibung & typische Werte                     │
│  - Kategorie: ICs → Timer                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ManufacturerPart│ │ManufacturerPart│ │ManufacturerPart│
│ TI NE555P     │  │ ST NE555N     │  │ ON MC1455P1  │
│ DIP-8, ACTIVE │  │ DIP-8, EOL    │  │ DIP-8, ACTIVE│
│ ±1% Toleranz  │  │ ±2% Toleranz  │  │ ±1.5% Tol.   │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Haupttabellen

| Tabelle | Beschreibung |
|---------|--------------|
| **Stammdaten** | |
| `CategoryTaxonomy` | Hierarchischer Kategoriebaum (Domain→Family→Type→Subtype) |
| `ManufacturerMaster` | Hersteller mit CAGE-Code, Akquisitionshistorie |
| `PackageMaster` | Bauformen (THT, SMD, etc.) mit Maßen |
| **Bauteile (2-Ebenen-Modell)** | |
| `CoreComponent` | Logisches Bauteil, herstellerunabhängig (z.B. "555 Timer") |
| `ManufacturerPart` | Konkretes Produkt eines Herstellers (z.B. "TI NE555P") |
| **Attribute (mit Scope)** | |
| `AttributeDefinition` | Attribut-Definitionen pro Kategorie mit Scope (COMPONENT/PART/BOTH) |
| `ComponentAttributeValue` | Attributwerte auf CoreComponent-Ebene (typische Werte) |
| `PartAttributeValue` | Attributwerte auf ManufacturerPart-Ebene (garantierte Werte) |
| **Beziehungen & Details** | |
| `PartRelationship` | Nachfolger/Alternativen zwischen ManufacturerParts |
| `ComponentConceptRelation` | Beziehungen auf Konzept-Ebene (z.B. "556 ist Dual-555") |
| `PinMapping` | Pin-Zuordnung pro ManufacturerPart |
| `HazardousMaterial` | Gefahrstoff-Flags pro ManufacturerPart |
| **Dateien** | |
| `PartDatasheet` | Datenblätter pro ManufacturerPart |
| `PartImage` | Bilder pro ManufacturerPart |
| `EcadFootprint` | ECAD-Dateien pro Package |
| **Geräte-DB (Phase 5)** | |
| `Device` | Geräte mit Chassis-Revision |
| `DeviceDocument` | Handbücher, Schaltpläne, Service-Manuals |
| `Assembly` | Baugruppen innerhalb eines Geräts |
| `ComponentPosition` | Bauteil-Positionen mit Lötpunkten |
| `PositionReplacement` | Dokumentierte Ersatz-Bauteile von Nutzern |
| **System** | |
| `User` | Benutzer (sync mit Keycloak) |
| `AuditLog` | Zentrale Änderungshistorie für ALLE Entitäten |

### Attribut-Scope: COMPONENT vs PART vs BOTH

Attribute werden pro Kategorie definiert und haben einen **Scope**, der bestimmt, wo die Werte erfasst werden:

| Scope | Bedeutung | Beispiele |
|-------|-----------|-----------|
| `COMPONENT` | Gilt für alle Hersteller-Varianten | Kapazität, Spannung, Pinanzahl, Dielektrikum |
| `PART` | Kann pro Hersteller unterschiedlich sein | Toleranz, ESR, Lebensdauer, Temperaturkoeffizient |
| `BOTH` | Typischer Wert auf Component, garantierter auf Part | hFE bei Transistoren, Timing-Accuracy |

#### BOTH-Logik: Vererbung mit Override

```
┌─────────────────────────────────────────────────────────────────┐
│                     AttributeScope: BOTH                         │
├─────────────────────────────────────────────────────────────────┤
│  Part-Wert vorhanden?                                           │
│       │                                                          │
│       ├── NEIN → Zeige Component-Wert (geerbt, grau/kursiv)     │
│       │          "Typischer Wert, nicht herstellerspezifisch"   │
│       │                                                          │
│       └── JA ──┬── Gleich → Zeige Part-Wert ✓ (bestätigt)       │
│                │                                                 │
│                └── Anders → Zeige Part-Wert ⚠️ (Abweichung!)    │
└─────────────────────────────────────────────────────────────────┘
```

#### Beispiel: Transistor BC547

| Attribut | Scope | CoreComponent (typisch) | Philips BC547B | Fairchild BC547 |
|----------|-------|-------------------------|----------------|-----------------|
| Typ | COMPONENT | NPN | - | - |
| vCEO | COMPONENT | 45V | - | - |
| hFE | BOTH | 100-300 | *(geerbt)* | 110-800 ⚠️ |
| Rth | PART | - | 200 K/W | 250 K/W |

#### TypeScript: Attribut-Auflösung für BOTH-Scope

```typescript
interface ResolvedAttribute {
  value: string;
  source: 'component' | 'part';
  isOverride: boolean;
  isDeviation: boolean;
}

function resolveAttribute(
  definition: AttributeDefinition,
  componentValue: ComponentAttributeValue | null,
  partValue: PartAttributeValue | null
): ResolvedAttribute | null {

  switch (definition.scope) {
    case 'COMPONENT':
      // Nur Component-Wert (gilt für alle Hersteller)
      return componentValue ? {
        value: componentValue.displayValue,
        source: 'component',
        isOverride: false,
        isDeviation: false,
      } : null;

    case 'PART':
      // Nur Part-Wert (herstellerspezifisch)
      return partValue ? {
        value: partValue.displayValue,
        source: 'part',
        isOverride: false,
        isDeviation: false,
      } : null;

    case 'BOTH':
      // Part überschreibt Component, falls vorhanden
      if (partValue) {
        return {
          value: partValue.displayValue,
          source: 'part',
          isOverride: true,
          isDeviation: partValue.isDeviation,  // Markiert Abweichung
        };
      }
      if (componentValue) {
        return {
          value: componentValue.displayValue,
          source: 'component',
          isOverride: false,
          isDeviation: false,
        };
      }
      return null;
  }
}

// UI-Darstellung basierend auf resolved.source und resolved.isDeviation
// - component + !isDeviation → grau/kursiv (geerbt)
// - part + !isDeviation → normal (bestätigt) ✓
// - part + isDeviation → normal mit Warnung ⚠️
```

### Vollständiges Prisma-Schema (Bauteile-Datenbank)

```prisma
// ============================================
// BAUTEILE-DATENBANK (Phase 1-4)
// 2-Ebenen-Architektur: CoreComponent (Konzept) → ManufacturerPart (Produkt)
// ============================================

// ============================================
// ENUMS
// ============================================

enum ManufacturerStatus {
  ACTIVE      // Aktiv produzierend
  ACQUIRED    // Übernommen
  DEFUNCT     // Nicht mehr existent
  UNKNOWN     // Unbekannt
}

enum MountingType {
  THROUGH_HOLE    // THT / bedrahtet
  SMD             // Oberflächenmontage
  CHASSIS         // Chassis-Montage
  PANEL           // Frontplatten-Montage
  WIRE_LEAD       // Drahtanschluss
  OTHER
}

enum ComponentStatus {
  DRAFT           // Entwurf
  PENDING_REVIEW  // Wartet auf Freigabe
  ACTIVE          // Aktiv/Freigegeben
  ARCHIVED        // Archiviert
  REJECTED        // Abgelehnt
}

enum PartStatus {
  DRAFT           // Entwurf
  PENDING_REVIEW  // Wartet auf Freigabe
  ACTIVE          // Aktiv/Freigegeben
  ARCHIVED        // Archiviert
  REJECTED        // Abgelehnt
}

enum LifecycleStatus {
  ACTIVE          // Aktiv produziert
  NRND            // Not Recommended for New Designs
  EOL             // End of Life angekündigt
  OBSOLETE        // Nicht mehr erhältlich
  UNKNOWN
}

enum AttributeDataType {
  DECIMAL         // Numerische Werte (Kapazität, Spannung)
  INTEGER         // Ganzzahlen (Pin-Anzahl)
  STRING          // Text (Dielektrikum-Typ: "X7R", "C0G")
  BOOLEAN         // Ja/Nein (Polarisiert)
  RANGE           // Bereichswert (hFE: 100-300)
}

enum AttributeScope {
  COMPONENT   // Nur auf CoreComponent-Ebene (gilt für alle Hersteller)
  PART        // Nur auf ManufacturerPart-Ebene (herstellerspezifisch)
  BOTH        // Component = typisch, Part = garantiert (mit Override)
}

enum RelationshipType {
  SUCCESSOR           // Neuere Version
  PREDECESSOR         // Ältere Version
  ALTERNATIVE         // Anderer Hersteller, kompatibel
  FUNCTIONAL_EQUIV    // Gleiche Funktion, andere Specs
  VARIANT             // Gleiche Serie, andere Specs
  SECOND_SOURCE       // Lizenzierte Kopie
  COUNTERFEIT_RISK    // Bekanntes Fälschungsrisiko
}

enum ConceptRelationType {
  DUAL_VERSION        // 556 ist Dual-555
  QUAD_VERSION        // LM324 ist Quad-LM358
  LOW_POWER_VERSION   // NE555 → ICM7555 (CMOS)
  HIGH_SPEED_VERSION  // Standard → High-Speed Variante
  MILITARY_VERSION    // Commercial → Military Grade
  AUTOMOTIVE_VERSION  // Standard → AEC-Q qualifiziert
  FUNCTIONAL_EQUIV    // Gleiche Funktion, anderer Aufbau
}

enum HazardousMaterialType {
  PCB_CAPACITOR   // Polychlorierte Biphenyle (alte Kondensatoren)
  ASBESTOS        // Asbest
  MERCURY         // Quecksilber (Thyratrons, Relais)
  RADIOACTIVE     // Radioaktiv (Ra-226, Th, Co-60)
  LEAD            // Blei (Lot)
  CADMIUM         // Cadmium
  BERYLLIUM       // Beryllium
  OTHER
}

enum PinType {
  POWER
  GROUND
  INPUT
  OUTPUT
  BIDIRECTIONAL
  NC            // No Connect
  ANALOG
  DIGITAL
  CLOCK
  OTHER
}

enum ImageType {
  PHOTO
  DIAGRAM
  PINOUT
  APPLICATION
  OTHER
}

enum EcadFormat {
  KICAD
  EAGLE
  ALTIUM
  ORCAD
  STEP       // 3D-Modell
  OTHER
}

enum EcadModelType {
  SYMBOL
  FOOTPRINT
  MODEL_3D
}

enum UserRole {
  ADMIN           // Volle Rechte
  MODERATOR       // Kann freigeben/ablehnen
  CONTRIBUTOR     // Kann erstellen/bearbeiten
  VIEWER          // Nur lesen
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE      // Soft-Delete
  RESTORE     // Wiederherstellung
  MERGE       // Zusammenführung von Duplikaten
  APPROVE     // Freigabe durch Moderator
  REJECT      // Ablehnung durch Moderator
}

// ============================================
// STAMMDATEN
// ============================================

// Kategorie-Hierarchie (Domain → Family → Type → Subtype)
model CategoryTaxonomy {
  id              String   @id @default(uuid()) @db.Uuid
  name            Json     // LocalizedString: { "de": "Kondensatoren", "en": "Capacitors" }
  slug            String   @unique @db.VarChar(255)
  level           Int      // 1=Domain, 2=Family, 3=Type, 4=Subtype

  parentId        String?  @db.Uuid
  parent          CategoryTaxonomy?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        CategoryTaxonomy[] @relation("CategoryHierarchy")

  description     Json?    // LocalizedString (optional)
  iconUrl         String?  @db.VarChar(512)
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)

  // Relationen
  coreComponents       CoreComponent[]
  attributeDefinitions AttributeDefinition[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([parentId])
  @@index([level])
  @@index([slug])
}

// Hersteller mit Akquisitionshistorie
model ManufacturerMaster {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(255)
  slug            String   @unique @db.VarChar(255)

  cageCode        String?  @db.VarChar(5)    // NATO CAGE Code (5 Zeichen)
  countryCode     String?  @db.VarChar(2)    // ISO 3166-1 alpha-2
  website         String?  @db.VarChar(512)
  logoUrl         String?  @db.VarChar(512)

  // Firmenhistorie (Übernahmen)
  acquiredById    String?  @db.Uuid
  acquiredBy      ManufacturerMaster?  @relation("AcquisitionHistory", fields: [acquiredById], references: [id])
  acquisitions    ManufacturerMaster[] @relation("AcquisitionHistory")
  acquisitionDate DateTime?

  status          ManufacturerStatus @default(ACTIVE)
  foundedYear     Int?
  defunctYear     Int?

  aliases         ManufacturerAlias[]
  parts           ManufacturerPart[]  // Alle Produkte dieses Herstellers
  devices         Device[]

  description     Json?    // LocalizedString (optional)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String?  @db.Uuid
  createdBy       User?    @relation(fields: [createdById], references: [id])

  @@index([cageCode])
  @@index([slug])
}

// Alternative Namen für Hersteller
model ManufacturerAlias {
  id             String   @id @default(uuid()) @db.Uuid
  manufacturerId String   @db.Uuid
  manufacturer   ManufacturerMaster @relation(fields: [manufacturerId], references: [id], onDelete: Cascade)

  aliasName      String   @db.VarChar(255)
  aliasType      String?  @db.VarChar(50)  // brand, former_name, trade_name

  @@unique([manufacturerId, aliasName])
  @@index([aliasName])
}

// Bauformen / Gehäuse
model PackageMaster {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(255)  // "DIP-14", "TO-220", "0805"
  slug            String   @unique @db.VarChar(255)

  // Maße in mm
  lengthMm        Decimal? @db.Decimal(10, 4)
  widthMm         Decimal? @db.Decimal(10, 4)
  heightMm        Decimal? @db.Decimal(10, 4)
  pitchMm         Decimal? @db.Decimal(10, 4)  // Pin-Abstand

  mountingType    MountingType

  pinCount        Int?
  pinCountMin     Int?     // Für variable Packages
  pinCountMax     Int?

  // Standards
  jedecStandard   String?  @db.VarChar(100)
  eiaStandard     String?  @db.VarChar(100)

  drawingUrl      String?  @db.VarChar(512)

  parts           ManufacturerPart[]  // Alle Parts mit diesem Package
  ecadFootprints  EcadFootprint[]

  description     String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([mountingType])
  @@index([slug])
}

// ============================================
// 2-EBENEN-BAUTEIL-ARCHITEKTUR
// ============================================
// CoreComponent = Das abstrakte/logische Bauteil (herstellerunabhängig)
// ManufacturerPart = Das konkrete Produkt eines Herstellers

// === EBENE 1: LOGISCHES BAUTEIL (herstellerunabhängig) ===
model CoreComponent {
  id              String   @id @default(uuid()) @db.Uuid

  // Identifikation (lokalisiert)
  name            Json     // LocalizedString: { "de": "Kondensator", "en": "Capacitor" }
  slug            String   @unique @db.VarChar(255)
  series          String?  @db.VarChar(255)   // Produktserie (z.B. "555 Timer") - nicht lokalisiert

  // Kategorie-Zuordnung
  categoryId      String   @db.Uuid
  category        CategoryTaxonomy @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  // Beschreibungen (lokalisiert)
  shortDescription Json?   // LocalizedString (optional)
  fullDescription  Json?   // LocalizedString (optional)

  // Typische Eigenschaften (gelten für ALLE Hersteller-Varianten)
  // Wird durch ComponentAttributeValue mit scope=COMPONENT ergänzt
  commonAttributes Json    @default("{}")

  // Volltextsuche (PostgreSQL tsvector)
  searchVector    Unsupported("tsvector")?

  // Status
  status          ComponentStatus @default(DRAFT)

  // Relationen zu Hersteller-Produkten
  manufacturerParts ManufacturerPart[]

  // Suchbare Attribute (nur scope=COMPONENT oder scope=BOTH)
  attributeValues   ComponentAttributeValue[]

  // Konzept-Beziehungen (z.B. "556 ist Dual-555")
  conceptRelations      ComponentConceptRelation[] @relation("SourceConcept")
  relatedFromConcepts   ComponentConceptRelation[] @relation("TargetConcept")

  // Geräte-Verknüpfungen (Phase 5) - auf Konzept-Ebene
  devicePositions ComponentPosition[]

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String?  @db.Uuid
  createdBy       User?    @relation("ComponentCreator", fields: [createdById], references: [id])
  lastEditedById  String?  @db.Uuid
  lastEditedBy    User?    @relation("ComponentEditor", fields: [lastEditedById], references: [id])

  // Soft-Delete
  deletedAt       DateTime?
  deletedById     String?  @db.Uuid
  deletedBy       User?    @relation("ComponentDeleter", fields: [deletedById], references: [id])

  // HINWEIS: name ist JSON (LocalizedString), daher kein Standard-Index möglich
  // Volltextsuche wird über searchVector (tsvector) realisiert
  @@index([categoryId])
  @@index([status])
  @@index([deletedAt])
}

// Konzept-Beziehungen zwischen CoreComponents
// z.B. "556 ist Dual-555", "ICM7555 ist CMOS-Version von NE555"
model ComponentConceptRelation {
  id              String   @id @default(uuid()) @db.Uuid

  sourceId        String   @db.Uuid
  source          CoreComponent @relation("SourceConcept", fields: [sourceId], references: [id], onDelete: Cascade)

  targetId        String   @db.Uuid
  target          CoreComponent @relation("TargetConcept", fields: [targetId], references: [id], onDelete: Cascade)

  relationType    ConceptRelationType

  notes           Json?    // LocalizedString (optional)

  createdById     String?  @db.Uuid
  createdBy       User?    @relation("ConceptRelationCreator", fields: [createdById], references: [id])
  createdAt       DateTime @default(now())

  @@unique([sourceId, targetId, relationType])
  @@index([sourceId])
  @@index([targetId])
}

// === EBENE 2: HERSTELLER-PRODUKT (konkretes Teil) ===
model ManufacturerPart {
  id              String   @id @default(uuid()) @db.Uuid

  // Zugehöriges logisches Bauteil
  coreComponentId String   @db.Uuid
  coreComponent   CoreComponent @relation(fields: [coreComponentId], references: [id], onDelete: Restrict)

  // Hersteller
  manufacturerId  String   @db.Uuid
  manufacturer    ManufacturerMaster @relation(fields: [manufacturerId], references: [id], onDelete: Restrict)

  // Identifikation
  mpn             String   @db.VarChar(255)   // Manufacturer Part Number: "NE555P", "LM555CN"
  orderingCode    String?  @db.VarChar(255)   // Bestellnummer (kann von MPN abweichen)

  // Package
  packageId       String?  @db.Uuid
  package         PackageMaster? @relation(fields: [packageId], references: [id], onDelete: SetNull)

  // Physische Eigenschaften
  weightGrams     Decimal? @db.Decimal(10, 4)

  // Historische Datierung
  dateCodeFormat  String?  @db.VarChar(50)    // EIA, Philips, etc.
  introductionYear Int?
  discontinuedYear Int?

  // Compliance (herstellerspezifisch!)
  rohsCompliant   Boolean?
  reachCompliant  Boolean?

  // Militär / Industrie
  nsn             String?  @db.VarChar(13)    // NATO Stock Number
  milSpec         String?  @db.VarChar(100)   // MIL-STD Referenz

  // Status
  status          PartStatus @default(DRAFT)
  lifecycleStatus LifecycleStatus @default(ACTIVE)

  // Gefahrstoffe (herstellerspezifisch!)
  hazardousMaterials HazardousMaterial[]

  // Pin-Mapping (kann zwischen Herstellern variieren!)
  pinMappings     PinMapping[]

  // Datenblätter & Bilder (herstellerspezifisch!)
  datasheets      PartDatasheet[]
  images          PartImage[]
  ecadModels      PartEcadModel[]

  // Suchbare Attribute (nur scope=PART oder scope=BOTH mit Override)
  attributeValues PartAttributeValue[]

  // Beziehungen zwischen Parts (Nachfolger, Alternativen)
  relationships   PartRelationship[] @relation("SourcePart")
  relatedTo       PartRelationship[] @relation("TargetPart")

  // Ersatz-Dokumentation in Geräten (Phase 5)
  replacements    PositionReplacement[]

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String?  @db.Uuid
  createdBy       User?    @relation("PartCreator", fields: [createdById], references: [id])
  lastEditedById  String?  @db.Uuid
  lastEditedBy    User?    @relation("PartEditor", fields: [lastEditedById], references: [id])

  // Soft-Delete
  deletedAt       DateTime?
  deletedById     String?  @db.Uuid
  deletedBy       User?    @relation("PartDeleter", fields: [deletedById], references: [id])

  @@unique([manufacturerId, mpn])
  @@index([mpn])
  @@index([coreComponentId])
  @@index([manufacturerId])
  @@index([packageId])
  @@index([nsn])
  @@index([status])
  @@index([lifecycleStatus])
  @@index([deletedAt])
  @@index([orderingCode])
}

// ============================================
// ATTRIBUT-SYSTEM MIT SCOPE
// ============================================
// Attribute werden pro Kategorie definiert und haben einen Scope:
// - COMPONENT: Gilt für alle Hersteller (z.B. Kapazität, Pinanzahl)
// - PART: Kann pro Hersteller variieren (z.B. Toleranz, ESR)
// - BOTH: Typischer Wert auf Component, garantierter auf Part (mit Override)

model AttributeDefinition {
  id              String   @id @default(uuid()) @db.Uuid

  // Zugehörige Kategorie (Kondensator, Transistor, etc.)
  categoryId      String   @db.Uuid
  category        CategoryTaxonomy @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  // Attribut-Metadaten
  name            String   @db.VarChar(100)   // "capacitance", "voltage", "hfe"
  displayName     Json     // LocalizedString: { "de": "Kapazität", "en": "Capacitance" }
  unit            String?  @db.VarChar(50)    // "F", "V", "Ω", null für dimensionslose Werte
  dataType        AttributeDataType           // DECIMAL, INTEGER, STRING, BOOLEAN, RANGE

  // === SCOPE: Wo wird dieses Attribut erfasst? ===
  scope           AttributeScope @default(PART)
  // COMPONENT = Nur auf CoreComponent (gilt für alle Hersteller)
  // PART = Nur auf ManufacturerPart (herstellerspezifisch)
  // BOTH = Component = typischer Wert, Part = garantierter Wert (Override)

  // Für Bereichs-Filter
  isFilterable    Boolean  @default(true)
  isRequired      Boolean  @default(false)

  // SI-Einheit für Normalisierung
  siUnit          String?  @db.VarChar(20)    // "F" für Farad (auch wenn Display "µF" zeigt)
  siMultiplier    Decimal? @db.Decimal(20, 10) // 0.000001 für µF → F

  sortOrder       Int      @default(0)

  // Werte auf beiden Ebenen
  componentValues ComponentAttributeValue[]
  partValues      PartAttributeValue[]

  @@unique([categoryId, name])
  @@index([categoryId])
  @@index([scope])
}

// Attribut-Werte auf CoreComponent-Ebene (typische Werte)
model ComponentAttributeValue {
  id              String   @id @default(uuid()) @db.Uuid

  componentId     String   @db.Uuid
  component       CoreComponent @relation(fields: [componentId], references: [id], onDelete: Cascade)

  definitionId    String   @db.Uuid
  definition      AttributeDefinition @relation(fields: [definitionId], references: [id])

  // Wert als String (für Anzeige)
  displayValue    String   @db.VarChar(255)   // "100µF", "25V", "100-300"

  // Normalisierter Wert für Filterung (in SI-Einheit)
  normalizedValue Decimal? @db.Decimal(30, 15)

  // Für RANGE-Typen: Min/Max separat
  normalizedMin   Decimal? @db.Decimal(30, 15)
  normalizedMax   Decimal? @db.Decimal(30, 15)

  // String-Wert für nicht-numerische Attribute
  stringValue     String?  @db.VarChar(255)

  @@unique([componentId, definitionId])
  @@index([componentId])
  @@index([definitionId])
  @@index([normalizedValue])
}

// Attribut-Werte auf ManufacturerPart-Ebene (garantierte Werte)
model PartAttributeValue {
  id              String   @id @default(uuid()) @db.Uuid

  partId          String   @db.Uuid
  part            ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  definitionId    String   @db.Uuid
  definition      AttributeDefinition @relation(fields: [definitionId], references: [id])

  // Wert als String (für Anzeige)
  displayValue    String   @db.VarChar(255)   // "100µF ±5%", "25V", "110-800"

  // Normalisierter Wert für Filterung (in SI-Einheit)
  normalizedValue Decimal? @db.Decimal(30, 15)

  // Für RANGE-Typen: Min/Max separat
  normalizedMin   Decimal? @db.Decimal(30, 15)
  normalizedMax   Decimal? @db.Decimal(30, 15)

  // String-Wert für nicht-numerische Attribute
  stringValue     String?  @db.VarChar(255)

  // Ist dieser Wert vom Component-Wert abweichend? (für BOTH-Scope)
  isDeviation     Boolean  @default(false)

  @@unique([partId, definitionId])
  @@index([partId])
  @@index([definitionId])
  @@index([normalizedValue])
  @@index([stringValue])
}

// ============================================
// BEZIEHUNGEN & DETAILS (auf ManufacturerPart-Ebene)
// ============================================

// Gefahrstoff-Flags (herstellerspezifisch!)
model HazardousMaterial {
  id          String   @id @default(uuid()) @db.Uuid
  partId      String   @db.Uuid
  part        ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  materialType HazardousMaterialType
  details     Json?    // LocalizedString (optional)

  @@unique([partId, materialType])
}

// Bauteil-Beziehungen zwischen ManufacturerParts (Nachfolger, Alternativen)
model PartRelationship {
  id              String   @id @default(uuid()) @db.Uuid

  sourceId        String   @db.Uuid
  source          ManufacturerPart @relation("SourcePart", fields: [sourceId], references: [id], onDelete: Cascade)

  targetId        String   @db.Uuid
  target          ManufacturerPart @relation("TargetPart", fields: [targetId], references: [id], onDelete: Cascade)

  relationshipType RelationshipType

  confidence      Int      @default(100)  // 0-100%
  notes           Json?    // LocalizedString (optional)

  createdById     String?  @db.Uuid
  createdBy       User?    @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())

  @@unique([sourceId, targetId, relationshipType])
  @@index([sourceId])
  @@index([targetId])
}

// Pin-Zuordnung (herstellerspezifisch - kann zwischen Herstellern variieren!)
model PinMapping {
  id           String   @id @default(uuid()) @db.Uuid
  partId       String   @db.Uuid
  part         ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  pinNumber    String   @db.VarChar(20)   // Physischer Pin (1, A1, etc.)
  pinName      String   @db.VarChar(100)  // Logischer Name (VCC, GND, etc.)
  pinFunction  Json?    // LocalizedString - Beschreibung der Pin-Funktion
  pinType      PinType?

  maxVoltage   Decimal? @db.Decimal(10, 4)
  maxCurrent   Decimal? @db.Decimal(10, 4)

  @@unique([partId, pinNumber])
  @@index([partId])
}

// ============================================
// DATEIEN (auf ManufacturerPart-Ebene)
// ============================================

// Datenblätter (herstellerspezifisch!)
model PartDatasheet {
  id           String   @id @default(uuid()) @db.Uuid
  partId       String   @db.Uuid
  part         ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  url          String   @db.VarChar(512)
  fileName     String?  @db.VarChar(255)
  fileSize     Int?     // Bytes
  mimeType     String?  @db.VarChar(100)

  version      String?  @db.VarChar(50)
  language     String?  @db.VarChar(10)   // ISO 639-1
  publishDate  DateTime?

  isPrimary    Boolean  @default(false)

  createdAt    DateTime @default(now())
  createdById  String?  @db.Uuid
  createdBy    User?    @relation("DatasheetUploader", fields: [createdById], references: [id])

  @@index([partId])
}

// Bilder (herstellerspezifisch!)
model PartImage {
  id           String   @id @default(uuid()) @db.Uuid
  partId       String   @db.Uuid
  part         ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  url          String   @db.VarChar(512)
  thumbnailUrl String?  @db.VarChar(512)
  altText      String?  @db.VarChar(255)

  imageType    ImageType @default(PHOTO)
  sortOrder    Int      @default(0)
  isPrimary    Boolean  @default(false)

  createdAt    DateTime @default(now())
  createdById  String?  @db.Uuid
  createdBy    User?    @relation("ImageUploader", fields: [createdById], references: [id])

  @@index([partId])
}

// ECAD-Dateien auf Package-Ebene (Footprints)
model EcadFootprint {
  id           String   @id @default(uuid()) @db.Uuid
  packageId    String   @db.Uuid
  package      PackageMaster @relation(fields: [packageId], references: [id], onDelete: Cascade)

  name         String   @db.VarChar(255)
  ecadFormat   EcadFormat
  fileUrl      String   @db.VarChar(512)

  ipcName      String?  @db.VarChar(255)  // IPC-7351 Bezeichnung

  createdAt    DateTime @default(now())
  createdById  String?  @db.Uuid
  createdBy    User?    @relation("FootprintUploader", fields: [createdById], references: [id])

  @@index([packageId])
  @@index([ecadFormat])
}

// ECAD-Modelle auf ManufacturerPart-Ebene (Symbole, 3D)
model PartEcadModel {
  id           String   @id @default(uuid()) @db.Uuid
  partId       String   @db.Uuid
  part         ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  modelType    EcadModelType
  ecadFormat   EcadFormat
  fileUrl      String   @db.VarChar(512)

  createdAt    DateTime @default(now())
  createdById  String?  @db.Uuid
  createdBy    User?    @relation("EcadModelUploader", fields: [createdById], references: [id])

  @@index([partId])
}

// ============================================
// BENUTZER-SYSTEM
// ============================================

model User {
  id              String   @id @default(uuid()) @db.Uuid

  // Keycloak Subject ID
  externalId      String   @unique @db.VarChar(255)

  // Gecachte Benutzerdaten
  email           String   @unique @db.VarChar(255)
  username        String   @unique @db.VarChar(100)
  displayName     String?  @db.VarChar(255)
  avatarUrl       String?  @db.VarChar(512)

  role            UserRole @default(VIEWER)

  // Profil
  bio             String?  @db.Text
  location        String?  @db.VarChar(255)
  website         String?  @db.VarChar(512)

  preferences     Json     @default("{}")

  isActive        Boolean  @default(true)
  lastLoginAt     DateTime?

  // === Relationen: Stammdaten ===
  createdManufacturers ManufacturerMaster[]

  // === Relationen: CoreComponent (logisches Bauteil) ===
  createdComponents    CoreComponent[] @relation("ComponentCreator")
  editedComponents     CoreComponent[] @relation("ComponentEditor")
  deletedComponents    CoreComponent[] @relation("ComponentDeleter")
  createdConceptRelations ComponentConceptRelation[] @relation("ConceptRelationCreator")

  // === Relationen: ManufacturerPart (Hersteller-Produkt) ===
  createdParts         ManufacturerPart[] @relation("PartCreator")
  editedParts          ManufacturerPart[] @relation("PartEditor")
  deletedParts         ManufacturerPart[] @relation("PartDeleter")
  createdRelationships PartRelationship[]

  // === Relationen: Dateien ===
  uploadedDatasheets   PartDatasheet[] @relation("DatasheetUploader")
  uploadedImages       PartImage[] @relation("ImageUploader")
  uploadedFootprints   EcadFootprint[] @relation("FootprintUploader")
  uploadedEcadModels   PartEcadModel[] @relation("EcadModelUploader")

  // Audit-Log Referenz (ein User kann viele Änderungen haben)
  auditLogs            AuditLog[]

  // === Relationen: Geräte-DB (Phase 5) ===
  positionReplacements PositionReplacement[]
  createdDevices       Device[] @relation("DeviceCreator")
  deletedDevices       Device[] @relation("DeviceDeleter")
  uploadedDocuments    DeviceDocument[] @relation("DocumentUploader")
  createdAssemblies    Assembly[] @relation("AssemblyCreator")
  deletedAssemblies    Assembly[] @relation("AssemblyDeleter")
  createdPositions     ComponentPosition[] @relation("PositionCreator")
  deletedPositions     ComponentPosition[] @relation("PositionDeleter")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([externalId])
  @@index([email])
  @@index([username])
}

// HINWEIS: UserRole ist bereits oben definiert (bei den anderen Enums)

// ============================================
// HINWEIS: ComponentRevision UND UserActivity wurden ENTFERNT
// Beide werden durch das zentrale AuditLog ersetzt!
// Keine parallelen Logging-Systeme mehr.
// ============================================
```

### PostgreSQL Volltextsuche Setup

Nach der Migration muss der Trigger für `searchVector` erstellt werden:

```sql
-- packages/database/prisma/migrations/XXXXXX_add_search_vector_trigger/migration.sql

-- Funktion zum Aktualisieren des Suchvektors
CREATE OR REPLACE FUNCTION update_component_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('german', COALESCE(NEW.name->>'de', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.name->>'en', '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW."shortDescription"->>'de', '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."shortDescription"->>'en', '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.series, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger bei INSERT oder UPDATE
CREATE TRIGGER component_search_vector_update
  BEFORE INSERT OR UPDATE ON "CoreComponent"
  FOR EACH ROW
  EXECUTE FUNCTION update_component_search_vector();

-- GIN Index für schnelle Volltextsuche
CREATE INDEX component_search_idx ON "CoreComponent" USING GIN ("searchVector");
```

**Nutzung in Prisma:**
```typescript
// Volltextsuche
const results = await prisma.$queryRaw`
  SELECT * FROM "CoreComponent"
  WHERE "searchVector" @@ plainto_tsquery('german', ${searchTerm})
  OR "searchVector" @@ plainto_tsquery('english', ${searchTerm})
  ORDER BY ts_rank("searchVector", plainto_tsquery('german', ${searchTerm})) DESC
`;
```

### Kritische Felder für historische Bauteile

Diese Felder sind auf `ManufacturerPart`-Ebene, da sie herstellerspezifisch sind:

- `nsn` - NATO Stock Number für Militär-Surplus
- `milSpec` - MIL-STD Referenz
- `hazardousMaterials` - PCB, Asbest, Quecksilber, Radioaktiv, Blei
- `dateCodeFormat` - EIA-Datumscodes
- `rohsCompliant` / `reachCompliant` - Compliance-Status
- `lifecycleStatus` - ACTIVE, NRND, EOL, OBSOLETE

---

## Audit-Trail & Soft-Delete Policy

### Grundprinzipien

1. **Keine harten Löschungen** - Alle Daten werden nur soft-deleted (`deletedAt` Timestamp)
2. **Vollständige Änderungshistorie** - Jede Änderung wird mit Nutzer, Zeitstempel und vorherigen Werten protokolliert
3. **Unveränderliche Audit-Logs** - Audit-Einträge können nicht bearbeitet oder gelöscht werden
4. **Ein einziges Audit-System** - `AuditLog` ersetzt `ComponentRevision` (keine Redundanz)

> **Wichtig:** Die Tabelle `ComponentRevision` wird ENTFERNT. Ein einziges `AuditLog` mit
> `WHERE entityType = 'Component' AND entityId = '...'` reicht völlig aus und vermeidet
> Inkonsistenzen sowie doppelten Speicherverbrauch.

### Soft-Delete Implementation

Alle Haupt-Entitäten erhalten diese Felder:

```prisma
// Soft-Delete Felder (auf allen relevanten Tabellen)
deletedAt     DateTime?  // NULL = aktiv, Timestamp = gelöscht
deletedById   String?    @db.Uuid
deletedBy     User?      @relation("DeletedBy", fields: [deletedById], references: [id])
```

**Betroffene Tabellen:**
- `CoreComponent` (logisches Bauteil)
- `ManufacturerPart` (Hersteller-Produkt)
- `ManufacturerMaster`
- `PackageMaster`
- `CategoryTaxonomy`
- `Device`
- `Assembly`
- `ComponentPosition`
- `User` (Benutzer-Accounts)

### Kaskadierendes Soft-Delete

Bei Soft-Delete eines `CoreComponent` müssen alle zugehörigen `ManufacturerPart`s ebenfalls soft-deleted werden:

```typescript
async softDeleteComponent(id: string, userId: string) {
  await this.prisma.$transaction([
    // CoreComponent soft-delete
    this.prisma.coreComponent.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: userId }
    }),
    // Alle zugehörigen ManufacturerParts soft-delete
    this.prisma.manufacturerPart.updateMany({
      where: { coreComponentId: id },
      data: { deletedAt: new Date(), deletedById: userId }
    }),
    // Audit-Log
    this.prisma.auditLog.create({
      data: {
        entityType: 'CoreComponent',
        entityId: id,
        action: 'DELETE',
        userId,
      }
    })
  ]);
}
```

**Betroffene Kaskaden:**
- `CoreComponent` → `ManufacturerPart`
- `Device` → `Assembly` → `ComponentPosition`
- `CategoryTaxonomy` → Alle Kinder (rekursiv)

### createdById Strategie

Für Konsistenz gilt:
- `createdById` ist **optional** bei allen Entitäten
- Bei System-Importen (Bulk, Migration) kann es `null` sein
- Bei User-Aktionen muss es gesetzt werden (Service-Layer Validierung)

Falls später ein System-User gewünscht ist:
```sql
INSERT INTO "User" (id, "externalId", email, username, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'SYSTEM', 'system@electrovault.local', 'SYSTEM', 'ADMIN');
```

### Audit-Trail Tabelle

```prisma
// Zentrale Audit-Log Tabelle für ALLE Änderungen
model AuditLog {
  id            String   @id @default(uuid()) @db.Uuid

  // Was wurde geändert?
  entityType    String   @db.VarChar(100)  // "Component", "Manufacturer", etc.
  entityId      String   @db.Uuid

  // Welche Aktion?
  action        AuditAction  // CREATE, UPDATE, DELETE, RESTORE

  // Wer hat geändert?
  userId        String   @db.Uuid
  user          User     @relation(fields: [userId], references: [id])

  // Wann?
  createdAt     DateTime @default(now())

  // IP-Adresse für zusätzliche Nachverfolgung
  ipAddress     String?  @db.VarChar(45)  // IPv6 kompatibel
  userAgent     String?  @db.VarChar(500)

  // Was genau wurde geändert?
  // Für UPDATE: enthält nur die geänderten Felder
  changes       Json     // {"field": {"old": "x", "new": "y"}}

  // Vollständiger Snapshot VOR der Änderung (für Wiederherstellung)
  previousState Json?

  // Optionaler Kommentar des Nutzers (lokalisiert)
  comment       Json?    // LocalizedString

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@index([action])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE      // Soft-Delete
  RESTORE     // Wiederherstellung
  MERGE       // Zusammenführung von Duplikaten
  APPROVE     // Freigabe durch Moderator
  REJECT      // Ablehnung durch Moderator
}
```

### Beispiel: Änderungsprotokoll für ein Bauteil

```json
{
  "entityType": "Component",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "UPDATE",
  "userId": "user-123",
  "createdAt": "2025-12-26T15:30:00Z",
  "ipAddress": "192.168.1.100",
  "changes": {
    "shortDescription": {
      "old": "NPN Transistor",
      "new": "NPN Transistor, universell einsetzbar"
    },
    "attributes": {
      "old": {"hfe": 100},
      "new": {"hfe": 110, "vce_max": 30}
    }
  },
  "previousState": { /* kompletter Snapshot */ },
  "comment": "hFE-Wert aus Datenblatt korrigiert"
}
```

### Query-Anpassungen

Alle Standard-Queries filtern automatisch gelöschte Einträge:

```typescript
// Repository-Pattern mit automatischem Soft-Delete Filter
class ComponentRepository {
  async findMany(options) {
    return this.prisma.coreComponent.findMany({
      where: {
        ...options.where,
        deletedAt: null  // Automatisch nur aktive Einträge
      }
    });
  }

  // Explizite Methode für gelöschte Einträge (nur Admin)
  async findDeleted(options) {
    return this.prisma.coreComponent.findMany({
      where: {
        ...options.where,
        deletedAt: { not: null }
      }
    });
  }

  // Soft-Delete mit Audit-Log
  async softDelete(id: string, userId: string, comment?: string) {
    const entity = await this.findById(id);

    await this.prisma.$transaction([
      // Soft-Delete
      this.prisma.coreComponent.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: userId
        }
      }),
      // Audit-Log
      this.prisma.auditLog.create({
        data: {
          entityType: 'Component',
          entityId: id,
          action: 'DELETE',
          userId,
          previousState: entity,
          comment
        }
      })
    ]);
  }
}
```

### Wiederherstellung (Restore)

Gelöschte Einträge können wiederhergestellt werden:

```typescript
async restore(id: string, userId: string, comment?: string) {
  await this.prisma.$transaction([
    this.prisma.coreComponent.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null
      }
    }),
    this.prisma.auditLog.create({
      data: {
        entityType: 'Component',
        entityId: id,
        action: 'RESTORE',
        userId,
        comment
      }
    })
  ]);
}
```

### UI-Anforderungen

1. **Änderungshistorie auf jeder Detail-Seite**
   - Zeigt alle Änderungen chronologisch
   - Diff-Ansicht für Änderungen
   - Link zum Nutzer-Profil

2. **"Gelöschte anzeigen" Toggle (nur Moderatoren)**
   - Ermöglicht Einsicht in gelöschte Einträge
   - Restore-Button für Wiederherstellung

3. **Änderungskommentar bei wichtigen Aktionen**
   - Optional bei Updates
   - Pflicht bei Löschungen

---

## Zwei separate Bereiche

Die Anwendung besteht aus zwei logisch getrennten Bereichen:

### 1. Bauteile-Datenbank (Phase 1-4)
- **Fokus:** Allgemeine Daten über existierende/historische Bauteile
- **Inhalt:** Spezifikationen, Datenblätter, Bauformen, Hersteller
- **Frage:** "Was ist ein BC547 und wo bekomme ich ihn?"

### 2. Geräte-Reparatur-Datenbank (Phase 5+)
- **Fokus:** Konkrete Verbauung in realen Geräten
- **Inhalt:** Welche Bauteile sind wo verbaut, was wurde ersetzt
- **Frage:** "Welche Bauteile sind in meinem Grundig TV verbaut und was kann ich als Ersatz nehmen?"

**Verknüpfung:** `ComponentPosition.componentId` → `CoreComponent.id` (logisches Bauteil)
**Ersatz-Dokumentation:** `PositionReplacement.replacementPartId` → `ManufacturerPart.id` (konkretes Ersatzteil)

---

## Geräte-Datenbank Schema (Phase 5)

```
┌─────────────────────────────────────────────────────────────────┐
│                           Device                                 │
│  (Grundig TV Modell X, Baujahr 1965)                            │
├─────────────────────────────────────────────────────────────────┤
│  id, name, modelNumber, manufacturer, productionStart/End       │
│  description, serialNumberPattern                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────────┐
│  DeviceDocument   │ │   Assembly    │ │      (weitere         │
│  (Handbuch, Plan) │ │  (Baugruppe)  │ │      Assemblies)      │
└───────────────────┘ └───────┬───────┘ └───────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      ComponentPosition        │
              │  (C12 - Elko 100µF @ Netzteil)│
              ├───────────────────────────────┤
              │  refDesignator: "C12"         │
              │  description: "Filter-Elko"   │
              │  componentId → Bauteile-DB    │
              │  positionX/Y (auf Foto/Plan)  │
              └───────────────┬───────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│      SolderPoint        │     │    PositionReplacement      │
│  (Lötpunkt 1, 2, ...)   │     │  (Nutzer X hat Y verwendet) │
├─────────────────────────┤     ├─────────────────────────────┤
│  pointNumber: 1         │     │  replacementComponentId     │
│  connectedTo: "GND"     │     │  userId (wer hat ersetzt)   │
│  netName: "VCC"         │     │  notes: "Funktioniert gut"  │
│  traceWidth (optional)  │     │  successRating: 5/5         │
└─────────────────────────┘     └─────────────────────────────┘
```

### Prisma-Schema Erweiterung (Phase 5)

```prisma
// ============================================
// GERÄTE-REPARATUR-DATENBANK
// ============================================

model Device {
  id                String   @id @default(uuid()) @db.Uuid
  name              Json     // LocalizedString: { "de": "Grundig Zauberspiegel" }
  modelNumber       String?  @db.VarChar(255)  // "Type 2147" - nicht lokalisiert

  // Chassis-Revision: Gleiches Gehäuse, aber innen völlig anders!
  // z.B. "Grundig Zauberspiegel 1964" vs "1965" können unterschiedliche Platinen haben
  chassisRevision   String?  @db.VarChar(100)  // "Rev. A", "Chassis 2B" - nicht lokalisiert
  serialNumberPattern String? @db.VarChar(255) // Regex für Seriennummern

  manufacturerId    String?  @db.Uuid
  manufacturer      ManufacturerMaster? @relation(fields: [manufacturerId], references: [id], onDelete: SetNull)

  productionStart   Int?     // Jahr
  productionEnd     Int?     // Jahr

  category          DeviceCategory  // TV, RADIO, AMPLIFIER, etc.
  description       Json?    // LocalizedString (optional)

  documents         DeviceDocument[]
  assemblies        Assembly[]

  createdById       String   @db.Uuid
  createdBy         User?    @relation("DeviceCreator", fields: [createdById], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Soft-Delete
  deletedAt         DateTime?
  deletedById       String?  @db.Uuid
  deletedBy         User?    @relation("DeviceDeleter", fields: [deletedById], references: [id])

  @@index([chassisRevision])
  @@index([manufacturerId])
  @@index([deletedAt])
  @@index([productionStart])
  @@index([productionEnd])
  @@unique([manufacturerId, modelNumber, chassisRevision])
}

model DeviceDocument {
  id          String   @id @default(uuid()) @db.Uuid
  deviceId    String   @db.Uuid
  device      Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  title       String   @db.VarChar(255)
  type        DocumentType  // MANUAL, SCHEMATIC, SERVICE_MANUAL, PHOTO
  fileUrl     String   @db.VarChar(512)
  pageCount   Int?
  language    String?  @db.VarChar(10)

  uploadedById String  @db.Uuid
  uploadedBy   User?   @relation("DocumentUploader", fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now())

  @@index([deviceId])
}

model Assembly {
  id          String   @id @default(uuid()) @db.Uuid
  deviceId    String   @db.Uuid
  device      Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  name        Json     // LocalizedString: { "de": "Netzteil", "en": "Power Supply" }
  description Json?    // LocalizedString (optional)
  sortOrder   Int      @default(0)

  // Foto/Schaltplan dieser Baugruppe
  media       AssemblyMedia[]
  positions   ComponentPosition[]

  createdById String   @db.Uuid
  createdBy   User?    @relation("AssemblyCreator", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Soft-Delete
  deletedAt   DateTime?
  deletedById String?  @db.Uuid
  deletedBy   User?    @relation("AssemblyDeleter", fields: [deletedById], references: [id])

  @@index([deviceId])
  @@index([deletedAt])
}

model AssemblyMedia {
  id          String   @id @default(uuid()) @db.Uuid
  assemblyId  String   @db.Uuid
  assembly    Assembly @relation(fields: [assemblyId], references: [id], onDelete: Cascade)

  type        MediaType  // PHOTO, SCHEMATIC, PCB_LAYOUT
  fileUrl     String   @db.VarChar(512)
  caption     String?  @db.VarChar(500)
  sortOrder   Int      @default(0)

  // Für interaktive Bauteil-Markierungen
  width       Int?
  height      Int?

  // Relation zu ComponentPosition (welche Bauteile sind auf diesem Bild markiert?)
  positions   ComponentPosition[]

  createdAt   DateTime @default(now())

  @@index([assemblyId])
}

model ComponentPosition {
  id            String   @id @default(uuid()) @db.Uuid
  assemblyId    String   @db.Uuid
  assembly      Assembly @relation(fields: [assemblyId], references: [id], onDelete: Cascade)

  refDesignator String   @db.VarChar(50)   // "C12", "R5", "Q3"
  description   Json?    // LocalizedString: "Filter-Kondensator"

  // Verknüpfung zur Bauteile-Datenbank (logisches Bauteil, optional)
  componentId   String?  @db.Uuid
  component     CoreComponent? @relation(fields: [componentId], references: [id])

  // Falls Bauteil nicht in DB: Freitext-Beschreibung (lokalisiert)
  componentDescription Json?   // LocalizedString: "100µF 25V Elko axial"

  // Position auf dem Baugruppen-Bild (für interaktive Ansicht)
  positionX     Float?
  positionY     Float?
  mediaId       String?  @db.Uuid
  media         AssemblyMedia? @relation(fields: [mediaId], references: [id])

  solderPoints  SolderPoint[]
  replacements  PositionReplacement[]

  createdById   String   @db.Uuid
  createdBy     User?    @relation("PositionCreator", fields: [createdById], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Soft-Delete
  deletedAt     DateTime?
  deletedById   String?  @db.Uuid
  deletedBy     User?    @relation("PositionDeleter", fields: [deletedById], references: [id])

  @@index([assemblyId])
  @@index([componentId])
  @@index([deletedAt])
}

model SolderPoint {
  id          String   @id @default(uuid()) @db.Uuid
  positionId  String   @db.Uuid
  position    ComponentPosition @relation(fields: [positionId], references: [id], onDelete: Cascade)

  pointNumber Int      // 1, 2, 3...
  label       String?  @db.VarChar(50)  // "+" , "-", "Anode"

  // Für Schaltplan-Rekonstruktion
  netName     String?  @db.VarChar(100)  // "VCC", "GND", "NET_1"
  connectedTo String?  @db.VarChar(255)  // Verbunden mit welchem anderen Punkt?

  notes       Json?    // LocalizedString (optional)

  @@index([positionId])
}

model PositionReplacement {
  id                      String   @id @default(uuid()) @db.Uuid
  positionId              String   @db.Uuid
  position                ComponentPosition @relation(fields: [positionId], references: [id], onDelete: Cascade)

  // Welches Ersatzteil wurde verwendet? (konkretes Hersteller-Produkt!)
  replacementPartId       String?  @db.Uuid
  replacementPart         ManufacturerPart? @relation(fields: [replacementPartId], references: [id])

  // Falls nicht in DB: Freitext
  replacementDescription  String?  @db.VarChar(500)

  // Wer hat das dokumentiert?
  userId                  String   @db.Uuid
  user                    User @relation(fields: [userId], references: [id])

  // Bewertung
  successRating           Int?     // 1-5 Sterne
  notes                   Json?    // LocalizedString: "Funktioniert, aber wird warm"

  createdAt               DateTime @default(now())

  @@index([positionId])
  @@index([replacementPartId])
  @@index([userId])
}

enum DeviceCategory {
  TV
  RADIO
  AMPLIFIER
  RECEIVER
  TURNTABLE
  TAPE_DECK
  OSCILLOSCOPE
  MULTIMETER
  POWER_SUPPLY
  COMPUTER
  OTHER
}

enum DocumentType {
  MANUAL
  SERVICE_MANUAL
  SCHEMATIC
  PARTS_LIST
  PHOTO
  OTHER
}

enum MediaType {
  PHOTO
  SCHEMATIC
  PCB_LAYOUT
  WIRING_DIAGRAM
}
```

---

## API-Design (REST)

```
# Bauteile-Datenbank (Phase 1-4)
/api/auth/*           - OAuth-Callbacks, Token-Refresh
/api/components/*     - CRUD, Suche, Revisionen, Beziehungen
/api/manufacturers/*  - Hersteller-Verwaltung
/api/categories/*     - Kategorie-Baum
/api/packages/*       - Bauformen
/api/search           - Volltextsuche
/api/users/*          - Benutzerprofile

# Geräte-Reparatur-Datenbank (Phase 5)
/api/devices/*                           - Geräte CRUD
/api/devices/:id/documents               - Dokumente (Handbücher, Schaltpläne)
/api/devices/:id/assemblies              - Baugruppen
/api/assemblies/:id/media                - Baugruppen-Medien
/api/assemblies/:id/positions            - Bauteil-Positionen
/api/positions/:id/solder-points         - Lötpunkte
/api/positions/:id/replacements          - Ersatz-Dokumentationen
/api/components/:id/used-in              - "Wo ist dieses Bauteil verbaut?"
```

---

## Auth-Package (Wiederverwendbar)

> **Wichtig: Next.js + Keycloak SSR**
> Keycloak mit Next.js (App Router) und Server Side Rendering zu verheiraten ist komplex
> (Middleware-Handling, Token-Refresh im Server-Context).
>
> **Empfehlung:** Nutze `next-auth` (Auth.js v5) mit dem Keycloak-Provider als Basis,
> anstatt das Rad komplett neu zu erfinden. Das Package `@electrovault/auth` wrappt
> dann next-auth und bietet eine einheitliche API für Frontend und Backend.

### Technologie-Entscheidung

| Komponente | Lösung |
|------------|--------|
| Next.js Frontend | `next-auth` (Auth.js v5) mit Keycloak-Provider |
| Fastify Backend | Eigenes Plugin mit `jose` für JWT-Validierung |
| Shared | Token-Typen, Role-Enums, Middleware-Helpers |

### Package-Struktur

```
packages/auth/
├── src/
│   ├── next/           # Next.js spezifisch (next-auth wrapper)
│   │   ├── auth.ts     # NextAuth Konfiguration
│   │   ├── middleware.ts
│   │   └── hooks.ts    # useAuth, useSession
│   ├── fastify/        # Fastify Plugin
│   │   ├── plugin.ts
│   │   └── decorators.ts
│   └── shared/         # Gemeinsam genutzt
│       ├── types.ts
│       ├── roles.ts
│       └── jwt.ts
└── package.json
```

### Nutzung

```typescript
// Next.js (Frontend)
import { auth, signIn, signOut } from '@electrovault/auth/next';

// In Server Component
const session = await auth();

// In Client Component
import { useSession } from '@electrovault/auth/next';
const { data: session } = useSession();
```

```typescript
// Fastify (Backend)
import { authPlugin, requireRole } from '@electrovault/auth/fastify';

fastify.register(authPlugin, {
  keycloakUrl: process.env.KEYCLOAK_URL,
  realm: 'electrovault',
});

// Route mit Authentifizierung
fastify.get('/api/protected', {
  preHandler: [requireRole('CONTRIBUTOR')],
}, async (request, reply) => {
  // request.user ist verfügbar
});
```

**Exports:**
- Next.js: `auth`, `signIn`, `signOut`, `useSession`, `SessionProvider`
- Fastify: `authPlugin`, `requireAuth`, `requireRole`
- Shared: `UserRole`, `JwtPayload`, `verifyToken`

---

## Testing-Strategie

### Test-Stack

| Typ | Technologie | Beschreibung |
|-----|-------------|--------------|
| Unit Tests | `Vitest` | Schnelle Unit-Tests für Services, Utils, Hooks |
| Integration Tests | `Vitest` + `Supertest` | API-Endpunkt-Tests mit echtem Fastify-Server |
| E2E Tests | `Playwright` | Browser-basierte End-to-End-Tests |
| Component Tests | `Vitest` + `Testing Library` | React-Komponenten isoliert testen |

### Test-Struktur

```
apps/
├── api/
│   ├── src/
│   └── tests/
│       ├── unit/              # Unit-Tests für Services
│       │   └── component.service.test.ts
│       ├── integration/       # API-Tests
│       │   └── components.api.test.ts
│       └── setup.ts           # Test-Setup (Mocks, DB-Reset)
├── web/
│   ├── src/
│   └── tests/
│       ├── components/        # Component-Tests
│       └── e2e/               # Playwright E2E-Tests
packages/
├── shared/
│   └── tests/
│       └── units.test.ts      # mathjs Helper-Tests
```

### Test-Konfiguration

```typescript
// vitest.config.ts (Root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/tests/**'],
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Test-Datenbank

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Test-Datenbank mit separater URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  execSync('pnpm prisma migrate reset --force --skip-seed');
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Tabellen leeren vor jedem Test
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.partAttributeValue.deleteMany(),
    prisma.componentAttributeValue.deleteMany(),
    prisma.manufacturerPart.deleteMany(),
    prisma.coreComponent.deleteMany(),
    prisma.categoryTaxonomy.deleteMany(),
    prisma.manufacturerMaster.deleteMany(),
    prisma.packageMaster.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});
```

### Beispiel: API-Integration-Test

```typescript
// apps/api/tests/integration/components.api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../src/app';

describe('GET /api/components', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  it('should return empty array when no components exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/components',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [], total: 0 });
  });

  it('should return 401 for protected routes without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/components',
      payload: { mpn: 'TEST123' },
    });

    expect(response.statusCode).toBe(401);
  });
});
```

### CI-Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: electrovault_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm prisma generate
      - run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/electrovault_test

      - run: pnpm test:coverage
      - run: pnpm test:e2e
```

---

## Error Handling

### Standardisiertes Error-Response-Format

Alle API-Fehler folgen einem einheitlichen Format:

```typescript
// packages/shared/src/errors/types.ts
interface ApiError {
  success: false;
  error: {
    code: string;           // Maschinenlesbarer Code: "VALIDATION_ERROR"
    message: string;        // Benutzerfreundliche Nachricht
    details?: unknown;      // Zusätzliche Details (Validierungsfehler, etc.)
    requestId?: string;     // Für Support-Anfragen
  };
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

### Error-Codes

| Code | HTTP Status | Beschreibung |
|------|-------------|--------------|
| `VALIDATION_ERROR` | 400 | Ungültige Request-Daten |
| `UNAUTHORIZED` | 401 | Nicht authentifiziert |
| `FORBIDDEN` | 403 | Keine Berechtigung |
| `NOT_FOUND` | 404 | Ressource nicht gefunden |
| `CONFLICT` | 409 | Ressource existiert bereits |
| `RATE_LIMITED` | 429 | Zu viele Anfragen |
| `INTERNAL_ERROR` | 500 | Interner Serverfehler |

### Fastify Error Handler

```typescript
// apps/api/src/plugins/error-handler.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { nanoid } from 'nanoid';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = nanoid(10);

  // Zod-Validierungsfehler
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ungültige Eingabedaten',
        details: error.flatten(),
        requestId,
      },
    });
  }

  // Bekannte App-Fehler
  if (error.code === 'NOT_FOUND') {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message || 'Ressource nicht gefunden',
        requestId,
      },
    });
  }

  // Unbekannte Fehler loggen, aber nicht exponieren
  request.log.error({ err: error, requestId }, 'Unhandled error');

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ein interner Fehler ist aufgetreten',
      requestId,
    },
  });
}
```

### Custom Error-Klassen

```typescript
// packages/shared/src/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} mit ID ${id} nicht gefunden` : `${resource} nicht gefunden`,
      404
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentifizierung erforderlich') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Keine Berechtigung für diese Aktion') {
    super('FORBIDDEN', message, 403);
  }
}
```

---

## Security & Rate Limiting

### Security-Maßnahmen

| Maßnahme | Implementierung | Beschreibung |
|----------|-----------------|--------------|
| Helmet | `@fastify/helmet` | Security-Header (CSP, X-Frame-Options, etc.) |
| CORS | `@fastify/cors` | Cross-Origin Requests konfigurieren |
| Rate Limiting | `@fastify/rate-limit` | Schutz vor Brute-Force/DDoS |
| Input Validation | `Zod` | Strikte Eingabevalidierung |
| SQL Injection | `Prisma` | Parametrisierte Queries (automatisch) |
| XSS | React | Automatisches Escaping + CSP |

### Fastify Security-Plugin

```typescript
// apps/api/src/plugins/security.ts
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export async function securityPlugin(fastify: FastifyInstance) {
  // Security Headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 100,              // Max Requests pro Zeitfenster
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      // Nach IP + User-ID (falls authentifiziert)
      return request.user?.id || request.ip;
    },
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Zu viele Anfragen. Bitte warte ${context.after}.`,
      },
    }),
  });
}
```

### Spezielle Rate-Limits

```typescript
// Strengere Limits für sensitive Endpunkte
fastify.post('/api/auth/login', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
    },
  },
}, loginHandler);

// Höhere Limits für authentifizierte Nutzer
fastify.addHook('preHandler', async (request) => {
  if (request.user?.role === 'ADMIN') {
    request.rateLimit = { max: 1000, timeWindow: '1 minute' };
  }
});
```

### Umgebungsvariablen für Security

```env
# .env.example - Security
ALLOWED_ORIGINS=http://localhost:3000,https://electrovault.example.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Session/Token
JWT_SECRET=            # Mindestens 32 Zeichen, zufällig generiert
SESSION_SECRET=        # Mindestens 32 Zeichen, zufällig generiert
TOKEN_EXPIRY=3600      # 1 Stunde in Sekunden
```

---

## Caching-Strategie

### Cache-Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  TanStack Query (React Query)                        │    │
│  │  - Automatisches Caching & Revalidation             │    │
│  │  - Optimistic Updates                               │    │
│  │  - Background Refetching                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  In-Memory Cache (node-cache)                        │    │
│  │  - Kategorie-Baum (selten geändert)                 │    │
│  │  - Bauformen-Liste                                  │    │
│  │  - TTL: 5-15 Minuten                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PostgreSQL Query Cache                              │    │
│  │  - Prepared Statements (Prisma)                     │    │
│  │  - Connection Pooling                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Frontend: TanStack Query

```typescript
// apps/web/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 Minuten "fresh"
      gcTime: 1000 * 60 * 30,        // 30 Minuten im Cache
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Beispiel: Komponenten-Liste mit Caching
export function useComponents(params: ComponentSearchParams) {
  return useQuery({
    queryKey: ['components', params],
    queryFn: () => api.components.list(params),
    staleTime: 1000 * 60 * 2,  // 2 Minuten für Listen
  });
}

// Beispiel: Kategorie-Baum (selten geändert)
export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.categories.getTree(),
    staleTime: 1000 * 60 * 15,  // 15 Minuten
    gcTime: 1000 * 60 * 60,     // 1 Stunde
  });
}
```

### Backend: In-Memory Cache

```typescript
// apps/api/src/plugins/cache.ts
import NodeCache from 'node-cache';
import { FastifyInstance } from 'fastify';

const cache = new NodeCache({
  stdTTL: 300,        // 5 Minuten Standard-TTL
  checkperiod: 60,    // Cleanup alle 60 Sekunden
});

export async function cachePlugin(fastify: FastifyInstance) {
  // Cache als Decorator verfügbar machen
  fastify.decorate('cache', cache);

  // Cache-Invalidierung bei Änderungen
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      // Relevante Cache-Keys invalidieren
      const resource = request.url.split('/')[2]; // z.B. "components"
      cache.keys()
        .filter(key => key.startsWith(resource))
        .forEach(key => cache.del(key));
    }
  });
}

// Nutzung in Services
class CategoryService {
  async getTree(): Promise<CategoryTree> {
    const cacheKey = 'categories:tree';
    const cached = cache.get<CategoryTree>(cacheKey);

    if (cached) return cached;

    const tree = await this.buildTree();
    cache.set(cacheKey, tree, 900); // 15 Minuten

    return tree;
  }
}
```

### Cache-Invalidierung

```typescript
// Automatische Invalidierung bei Datenänderungen
// packages/database/src/extensions/cache-invalidation.ts
import { Prisma } from '@prisma/client';

export const cacheInvalidationExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        const result = await query(args);
        invalidateModelCache(model);
        return result;
      },
      async update({ model, args, query }) {
        const result = await query(args);
        invalidateModelCache(model);
        return result;
      },
      async delete({ model, args, query }) {
        const result = await query(args);
        invalidateModelCache(model);
        return result;
      },
    },
  },
});

function invalidateModelCache(model: string) {
  // Event emittieren für Cache-Invalidierung
  eventEmitter.emit('cache:invalidate', model.toLowerCase());
}
```

---

## Logging & Monitoring

### Logging-Stack

| Komponente | Technologie | Beschreibung |
|------------|-------------|--------------|
| Backend | `Pino` | Strukturiertes JSON-Logging (Fastify integriert) |
| Frontend | Custom Logger | Fehler an Backend senden |
| Log-Aggregation | Optional: Loki/ELK | Zentrale Log-Sammlung |
| Error-Tracking | Optional: Sentry | Crash-Reports & Performance |

### Pino-Konfiguration

```typescript
// apps/api/src/logger.ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // Pretty-Print nur in Entwicklung
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Zusätzliche Felder
  base: {
    service: 'electrovault-api',
    version: process.env.npm_package_version,
  },

  // Sensible Daten redaktieren
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password'],
    censor: '[REDACTED]',
  },
});

// Fastify mit Pino
const app = fastify({
  logger: logger,
});
```

### Request-Logging

```typescript
// apps/api/src/plugins/request-logger.ts
import { FastifyInstance } from 'fastify';

export async function requestLoggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      userId: request.user?.id,
      ip: request.ip,
    }, 'Request started');
  });

  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });
}
```

### Audit-Logging (Business-Events)

```typescript
// packages/database/src/services/audit.service.ts
import { logger } from '../logger';

export class AuditService {
  async logAction(params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    userId: string;
    changes?: Record<string, unknown>;
    previousState?: unknown;
    ipAddress?: string;
    comment?: string;
  }) {
    // In Datenbank speichern
    const auditEntry = await prisma.auditLog.create({
      data: params,
    });

    // Zusätzlich loggen für Monitoring
    logger.info({
      audit: true,
      ...params,
    }, `Audit: ${params.action} on ${params.entityType}`);

    return auditEntry;
  }
}
```

### Health-Check Endpunkt

```typescript
// apps/api/src/routes/health.ts
import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  // Einfacher Health-Check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Detaillierter Health-Check (nur intern)
  fastify.get('/health/detailed', {
    preHandler: [requireInternalAccess],
  }, async () => {
    const dbHealthy = await checkDatabase();
    const minioHealthy = await checkMinIO();
    const keycloakHealthy = await checkKeycloak();

    const allHealthy = dbHealthy && minioHealthy && keycloakHealthy;

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'ok' : 'error',
        minio: minioHealthy ? 'ok' : 'error',
        keycloak: keycloakHealthy ? 'ok' : 'error',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  });
}

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
```

### Monitoring-Metriken (Optional)

```typescript
// apps/api/src/plugins/metrics.ts
// Optional: Prometheus-kompatible Metriken
import { FastifyInstance } from 'fastify';
import { Counter, Histogram, Registry } from 'prom-client';

const register = new Registry();

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export async function metricsPlugin(fastify: FastifyInstance) {
  fastify.addHook('onResponse', async (request, reply) => {
    httpRequestsTotal.inc({
      method: request.method,
      path: request.routerPath || request.url,
      status: reply.statusCode,
    });

    httpRequestDuration.observe(
      { method: request.method, path: request.routerPath || request.url },
      reply.elapsedTime / 1000
    );
  });

  // Metriken-Endpunkt
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
}
```

---

## KI-Kontext-Strategie

### Warum Agenten?

Spezialisierte Agenten ermöglichen:
- **Fokussiertes Domain-Wissen** - Jeder Agent kennt seinen Bereich im Detail
- **Konsistente Codequalität** - Gleiche Patterns werden konsequent angewendet
- **Reduzierter Kontext** - Nur relevante Informationen werden geladen
- **Wiederverwendbarkeit** - Agenten können projektübergreifend genutzt werden

### Haupt-Kontext: `.claude/CLAUDE.md`

Dieses Dokument wird **immer** automatisch geladen und enthält:

```markdown
# ElectroVault - KI-Kontext

## Projektübersicht
Community-gepflegte Datenbank für elektrische Bauteile mit Fokus auf:
- Historische und moderne Komponenten (Röhren bis Nanotechnologie)
- Geräte-Reparatur-Dokumentation
- Schaltplan-Digitalisierung

## Tech-Stack
| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14+ (App Router), TailwindCSS, shadcn/ui |
| Backend | Fastify, Prisma, PostgreSQL |
| Auth | Keycloak + next-auth |
| Storage | MinIO (S3-kompatibel) |
| Monorepo | Turborepo + pnpm |

## Kritische Domain-Konzepte

### 2-Ebenen-Bauteil-Architektur
- `CoreComponent` = Logisches Bauteil (herstellerunabhängig, z.B. "555 Timer")
- `ManufacturerPart` = Konkretes Produkt (z.B. "TI NE555P")

### Attribut-Scope
- COMPONENT: Gilt für alle Hersteller (Kapazität, Pinanzahl)
- PART: Herstellerspezifisch (Toleranz, ESR, Lebensdauer)
- BOTH: Typischer Wert auf Component, garantierter Wert auf Part

### Lokalisierung (LocalizedString)
Alle Freitextfelder als JSON: `{ "de": "Kondensator", "en": "Capacitor" }`
Fallback-Kette: Angefragte Sprache → Englisch → Erste verfügbare

## Häufige Befehle
pnpm dev          # Alle Apps starten (Frontend :3000, API :3001)
pnpm db:migrate   # Prisma Migration ausführen
pnpm db:seed      # Seed-Daten laden (Kategorien, Packages)
pnpm db:studio    # Prisma Studio öffnen
pnpm test         # Vitest Tests ausführen
pnpm lint         # ESLint + Prettier

## Projektstruktur
apps/web/         # Next.js Frontend
apps/api/         # Fastify Backend
packages/database/# Prisma Schema & Extensions
packages/schemas/ # Zod-Validierung (shared)
packages/auth/    # Keycloak/next-auth Wrapper
packages/ui/      # shadcn/ui Komponenten
packages/shared/  # Utils, Types, Constants
```

### Agenten-Definitionen (.claude/agents/)

#### 1. `database-agent.md` - Datenbank-Spezialist

**Verantwortung:**
- Prisma-Schema Design und Änderungen
- Migrationen erstellen und reviewen
- Komplexe Queries optimieren
- Soft-Delete und Audit-Log Logik
- Seed-Daten für Kategorien, Packages

**Domain-Wissen:**
- 2-Ebenen-Architektur: CoreComponent → ManufacturerPart
- AttributeScope: COMPONENT, PART, BOTH
- LocalizedString JSON-Struktur
- Kaskadierendes Soft-Delete
- PostgreSQL tsvector für Volltextsuche

**Kontext-Dateien:**
```
packages/database/prisma/schema.prisma
packages/database/src/extensions/
docs/IMPLEMENTATION_PLAN.md (Prisma-Schema Sektion)
```

---

#### 2. `auth-agent.md` - Authentifizierung & Autorisierung

**Verantwortung:**
- Keycloak-Integration und Realm-Konfiguration
- next-auth Setup mit App Router
- JWT-Validierung im Fastify-Backend
- Rollen-basierte Zugriffskontrolle
- User-Sync zwischen Keycloak und PostgreSQL

**Domain-Wissen:**
- OAuth 2.0 / OIDC Flow
- Session-Management in Next.js (App Router)
- Fastify Auth-Hooks und Decorators
- 4 Rollen: ADMIN, MODERATOR, CONTRIBUTOR, VIEWER

**Kontext-Dateien:**
```
packages/auth/src/
docker/keycloak/realm-export.json
apps/web/src/app/api/auth/
```

---

#### 3. `api-agent.md` - Backend-Spezialist

**Verantwortung:**
- Fastify-Routen und Plugins
- Service-Layer (Business-Logik)
- Zod-Schema Request/Response-Validierung
- Standardisiertes Error-Handling
- API-Tests (Vitest + Supertest)

**Domain-Wissen:**
- REST-API Design (`/api/components`, `/api/devices`, etc.)
- Auth-Flow mit Keycloak JWT
- Audit-Logging bei jeder Mutation
- Rate-Limiting Strategie (100/min Standard, 5/15min Login)

**Kontext-Dateien:**
```
apps/api/src/routes/
apps/api/src/services/
packages/schemas/src/
packages/auth/src/fastify/
```

---

#### 4. `component-data-agent.md` - Domain-Spezialist für Bauteile

**Verantwortung:**
- Bauteil-Datenmodell verstehen und erweitern
- Einheiten-Parsing mit mathjs (100µF → 0.0001 F)
- Kategorien-Taxonomie pflegen (Domain → Family → Type → Subtype)
- Attribut-Definitionen pro Kategorie
- Hersteller-Daten und Akquisitionshistorie

**Domain-Wissen:**
- Elektronik-Terminologie (MPN, CAGE-Code, NSN, MIL-Specs)
- Historische Bauteile (Röhren, Gefahrstoffe, Datumscodes)
- Package-Typen (THT, SMD, Chassis-Montage)
- Lifecycle-Status (ACTIVE, NRND, EOL, OBSOLETE)
- Beziehungstypen (SUCCESSOR, ALTERNATIVE, SECOND_SOURCE, COUNTERFEIT_RISK)

**Kontext-Dateien:**
```
docs/IMPLEMENTATION_PLAN.md (Domain-Konzepte)
packages/shared/src/units/
packages/database/prisma/seed.ts
```

---

#### 5. `frontend-agent.md` - Frontend-Spezialist

**Verantwortung:**
- Next.js App Router Pages
- React Server Components vs Client Components Entscheidungen
- shadcn/ui Komponenten-Nutzung
- TanStack Query für Data Fetching
- Formulare mit react-hook-form + Zod

**Domain-Wissen:**
- LocalizedInput Komponente für mehrsprachige Felder
- Kategorie-Baum Navigation (expandierbar)
- Dynamische Attribut-Formulare (je nach Kategorie)
- Admin-Bereich unter `/admin`
- i18n mit next-intl (UI-Texte)

**Kontext-Dateien:**
```
apps/web/src/app/
apps/web/src/components/
packages/ui/src/
packages/schemas/src/
```

---

#### 6. `testing-agent.md` - Test-Spezialist

**Verantwortung:**
- Unit-Tests für Services und Utils
- Integration-Tests für API-Endpunkte
- Component-Tests für React (Testing Library)
- E2E-Tests mit Playwright
- Test-Datenbank Setup und Isolation

**Domain-Wissen:**
- Vitest Konfiguration und Best Practices
- Test-Isolation (Datenbank-Reset zwischen Tests)
- Mocking von Keycloak und MinIO
- CI/CD Integration (GitHub Actions)

**Kontext-Dateien:**
```
apps/api/tests/
apps/web/tests/
vitest.config.ts
playwright.config.ts
.github/workflows/test.yml
```

---

#### 7. `infrastructure-agent.md` - DevOps & Server-Administration

**Verantwortung:**
- Windows Server 2019 Dienste-Verwaltung
- Docker/Container-Setup (Keycloak, MinIO)
- PostgreSQL Administration und Monitoring
- Backup-Scripts und Wiederherstellung
- Netzwerk und Firewall-Konfiguration
- CI/CD Pipeline (GitHub Actions)

**Domain-Wissen:**
- Windows Server 2019 Administration
- PowerShell Scripting
- Docker auf Windows (Container/Hyper-V)
- PostgreSQL Wartung (VACUUM, REINDEX, pg_dump)
- Keycloak Realm-Konfiguration und Updates
- MinIO Bucket-Policies und Backup
- SSL/TLS Zertifikate

**Server-Umgebung:**
```
Server: Windows Server 2019 (ITME-SERVER)
PostgreSQL: Port 5432 (ElectroVault_Dev)
Keycloak: Port 8080 (Realm: electrovault)
MinIO: Port 9000/9001 (Bucket: electrovault-files)
```

**Wichtige Befehle:**
```powershell
# PostgreSQL Status
Get-Service postgresql*

# Keycloak Container (falls Docker)
docker ps | Select-String keycloak
docker logs keycloak --tail 100

# MinIO Container
docker ps | Select-String minio

# Backup manuell auslösen
& "C:\Scripts\backup-electrovault.ps1"

# PostgreSQL Verbindung testen
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -h localhost -U ElectroVault_dev_user -d ElectroVault_Dev -c "SELECT 1"
```

**Kontext-Dateien:**
```
docker/docker-compose.yml
docker/keycloak/realm-export.json
C:\Scripts\backup-electrovault.ps1
docs/IMPLEMENTATION_PLAN.md (Server-Setup, Backup-Strategie)
.env.example (Ports, Credentials-Struktur)
```

**Troubleshooting-Checkliste:**
- [ ] PostgreSQL läuft? (`Get-Service postgresql*`)
- [ ] Firewall-Ports offen? (5432, 8080, 9000, 9001)
- [ ] Keycloak erreichbar? (`http://ITME-SERVER:8080`)
- [ ] MinIO erreichbar? (`http://ITME-SERVER:9001`)
- [ ] Disk-Space ausreichend? (`Get-PSDrive C, D`)
- [ ] Backup vom letzten Tag vorhanden?

---

### Agenten-Aktivierung nach Phase

| Phase | Primäre Agenten | Sekundäre Agenten |
|-------|-----------------|-------------------|
| 0: Setup | infrastructure-agent | - |
| 1: Datenbank & Auth | database-agent, auth-agent | infrastructure-agent, testing-agent |
| 2: Component API | api-agent, database-agent | component-data-agent |
| 3: Frontend Basis | frontend-agent | api-agent |
| 4: Community Features | frontend-agent, api-agent | component-data-agent |
| 5: Geräte-DB | database-agent, api-agent, frontend-agent | component-data-agent |
| 6: Erweiterte Features | Alle nach Bedarf | - |
| Laufend | infrastructure-agent | - |

> **Hinweis Phase 5:** Die Geräte-Reparatur-Datenbank benötigt keinen eigenen Agenten.
> Das Domain-Wissen (Device → Assembly → ComponentPosition, Chassis-Revisionen, etc.)
> wird in `CLAUDE.md` ergänzt und von den bestehenden Agenten genutzt.

### Agenten-Erstellung Reihenfolge

1. **CLAUDE.md** (Haupt-Kontext) - Phase 0
2. **infrastructure-agent.md** - Phase 0 (Server-Setup)
3. **database-agent.md** - Phase 1 Start
4. **auth-agent.md** - Phase 1 Start
5. **api-agent.md** - Phase 2 Start
6. **component-data-agent.md** - Phase 2 (bei Seed-Daten)
7. **frontend-agent.md** - Phase 3 Start
8. **testing-agent.md** - Phase 3 (bei ersten Tests)

### Finale Agenten-Übersicht (7 Agenten)

| # | Agent | Verantwortung |
|---|-------|---------------|
| 1 | infrastructure-agent | Server, Docker, PostgreSQL, Backups |
| 2 | database-agent | Prisma-Schema, Migrationen, Queries |
| 3 | auth-agent | Keycloak, next-auth, Rollen |
| 4 | api-agent | Fastify-Routen, Services, Validierung |
| 5 | component-data-agent | Elektronik-Domain, Einheiten, Kategorien |
| 6 | frontend-agent | Next.js, shadcn/ui, Formulare |
| 7 | testing-agent | Vitest, Playwright, CI/CD |

---

## Implementierungsphasen

### Phase 0: Projekt-Setup ✅ ABGESCHLOSSEN

**Status:** ✅ Abgeschlossen (2025-12-27)
**Fortschritt:** 100% (alle Aufgaben erledigt)

> **Detaillierter Status-Bericht:** Siehe [`docs/PHASE_0_STATUS.md`](PHASE_0_STATUS.md)

**Zusammenfassung:**
- ✅ Monorepo mit Turborepo + pnpm initialisiert
- ✅ Vollständiges Prisma-Schema (2-Ebenen-Architektur, 20+ Modelle)
- ✅ i18n-Infrastruktur (LocalizedString mit Fallback-Kette)
- ✅ Docker Compose für lokale Entwicklung
- ✅ Keycloak Realm mit 4 Rollen konfiguriert
- ✅ MinIO Bucket-Setup vorbereitet
- ✅ Umfassende Dokumentation erstellt
- ✅ 35 Dateien erstellt, bereit für `pnpm install`

**Nächster Schritt:** Phase 1 - Dependencies installieren und erste Migration

---

#### 0.1 Lokaler Entwicklungsrechner
- [x] pnpm installieren (`npm install -g pnpm`) ✓ (2025-12-27)
- [x] Turborepo initialisieren mit pnpm ✓ (2025-12-27)
- [x] TypeScript, ESLint, Prettier konfigurieren ✓ (2025-12-27)
- [x] `.env.example` und `.env.local` erstellen ✓ (2025-12-27)
- [x] `.gitignore` mit Credentials-Schutz ✓ (2025-12-27)
- [x] `.claude/CLAUDE.md` Kontext-Dokument ✓ (2025-12-27)
- [x] `.claude/agents/` - 7 spezialisierte Agenten ✓ (2025-12-27)
- [x] `.claude/settings.json` - Berechtigungen, Hooks, MCP Server ✓ (2025-12-27)

#### 0.2 Windows Server 2019 (Remote)
- [x] Docker/Hyper-V installieren ✓ (2025-12-27)
- [x] Keycloak als Windows-Dienst starten ✓ (2025-12-27)
- [x] Keycloak Realm "electrovault" konfigurieren ✓ (2025-12-27)
- [x] MinIO als Windows-Dienst starten ✓ (2025-12-27)
- [x] MinIO Bucket "electrovault-files" erstellen ✓ (2025-12-27)
- [x] Firewall-Ports öffnen (5432, 8080, 9000, 9001) ✓ (2025-12-27)
- [x] Java 21 (Temurin) installieren ✓ (2025-12-27)
- [x] NSSM für Dienstverwaltung installieren ✓ (2025-12-27)

#### 0.3 Datenbankverbindung testen
- [x] PostgreSQL-Verbindung vom Entwicklungsrechner testen ✓ (2025-12-27)
- [x] Prisma-Schema erstellen ✓ (2025-12-27)
- [ ] Erste Migration durchführen (bereit für: `pnpm db:migrate`)

#### 0.4 Monorepo-Struktur
- [x] `apps/` und `packages/` Verzeichnisse erstellen ✓ (2025-12-27)
- [x] `packages/database` mit Prisma-Schema ✓ (2025-12-27)
- [x] `packages/shared` mit i18n-Utils ✓ (2025-12-27)
- [x] `packages/schemas` (Zod - vorbereitet) ✓ (2025-12-27)
- [x] Docker Compose für lokale Entwicklung ✓ (2025-12-27)
- [x] Keycloak Realm Export-Datei ✓ (2025-12-27)
- [x] MinIO Init-Scripts ✓ (2025-12-27)

#### 0.5 Dokumentation
- [x] `README.md` erstellen ✓ (2025-12-27)
- [x] `docs/PHASE_0_STATUS.md` erstellen ✓ (2025-12-27)
- [x] `docker/README.md` erstellen ✓ (2025-12-27)
- [x] `docker/keycloak/README.md` erstellen ✓ (2025-12-27)
- [x] `docker/minio/README.md` erstellen ✓ (2025-12-27)

**Dateien:**
- `package.json`, `turbo.json`, `pnpm-workspace.yaml`
- `docker/docker-compose.yml` (für Server)
- `.claude/CLAUDE.md`
- `.env.example`, `.env.local`

---

### Phase 1: Datenbank & Auth
- [x] Prisma-Schema implementieren (vollständig) ✓
- [ ] Initiale Migration erstellen (manuell nach lokalem Setup)
- [x] Seed-Daten (Kategorien, Bauformen, Hersteller) ✓
- [x] Auth-Package mit Keycloak-Integration ✓
- [x] Fastify-Server mit Auth-Plugin ✓
- [x] User-Sync von Keycloak ✓
- [x] Tests für Auth und API ✓

**Implementierte Dateien:**
- `packages/database/prisma/schema.prisma` - Vollständiges Schema mit 716 Zeilen
- `packages/database/prisma/seed.ts` - Seed-Daten für Kategorien, Packages, Hersteller
- `packages/auth/src/keycloak.ts` - Keycloak Client & Token Validation
- `packages/auth/src/fastify/index.ts` - Fastify Auth Plugin
- `packages/auth/src/nextauth/index.ts` - NextAuth Configuration
- `packages/auth/src/user-sync.ts` - User Sync Service
- `apps/api/src/app.ts` - Fastify App mit Auth, CORS, Rate Limiting
- `apps/api/src/server.ts` - Server Entry Point
- **Tests:**
  - `packages/auth/src/keycloak.test.ts` (9 Tests)
  - `packages/auth/src/user-sync.test.ts` (8 Tests)
  - `apps/api/src/app.test.ts` (6 Tests)

---

### Phase 2: Component API
- [ ] ComponentService mit CRUD
- [ ] Revisionen-Tracking
- [ ] PostgreSQL Volltextsuche
- [ ] Manufacturer API
- [ ] Category API (read-only)
- [ ] Package API
- [ ] OpenAPI-Dokumentation

**Dateien:**
- `apps/api/src/services/component.service.ts`
- `apps/api/src/routes/components/*.ts`

---

### Phase 3: Frontend Basis
- [ ] Next.js mit App Router
- [ ] TailwindCSS + shadcn/ui
- [ ] Auth-Flow mit NextAuth
- [ ] Layout (Header, Sidebar, Footer)
- [ ] Komponenten-Liste mit Pagination
- [ ] Komponenten-Detailseite
- [ ] Kategorie-Browser (Baum)
- [ ] Suchinterface
- [ ] i18n-Setup (next-intl) für spätere Mehrsprachigkeit

**Dateien:**
- `apps/web/src/app/**`
- `apps/web/src/components/**`

---

### Phase 4: Community-Features (MVP)
- [ ] Komponenten-Erstellung
- [ ] Dynamische Attribut-Formulare
- [ ] Datasheet-Upload (MinIO)
- [ ] Bild-Upload
- [ ] Pin-Mapping Editor
- [ ] Beziehungen verwalten
- [ ] Moderations-Queue

**Dateien:**
- `apps/web/src/app/(main)/components/new/page.tsx`
- `apps/api/src/services/upload.service.ts`

---

### Phase 5: Geräte-Reparatur-Datenbank

**Konzept:** Nicht nur Schaltpläne scannen, sondern vollständige Bauteil-Verknüpfungen für Reparaturen dokumentieren. Ermöglicht Schaltplan-Rekonstruktion durch Dokumentation.

**Hierarchie:**
```
Gerät (Device)
  └── Baugruppe (Assembly)
        └── Bauteil-Position (ComponentPosition)
              ├── Verknüpftes Bauteil (→ CoreComponent)
              ├── Lötpunkte (SolderPoints)
              └── Alternativ-Bauteile (Replacements)
```

**Neue Tabellen:**

| Tabelle | Beschreibung |
|---------|--------------|
| `Device` | Gerät (Fernseher, Radio, etc.) mit Hersteller, Modell, Baujahr |
| `DeviceDocument` | Handbücher, Schaltpläne, Service-Manuals |
| `Assembly` | Baugruppe innerhalb eines Geräts (z.B. Netzteil, Tuner) |
| `AssemblyMedia` | Fotos, Detail-Schaltpläne der Baugruppe |
| `ComponentPosition` | Konkrete Bauteil-Position auf einer Baugruppe |
| `SolderPoint` | Lötpunkte eines Bauteils (für Schaltplan-Rekonstruktion) |
| `PositionReplacement` | Dokumentierte Alternativ-Bauteile von anderen Nutzern |

**Beispiel-Workflow:**
1. Nutzer A legt "Grundig TV 1965" an
2. Fügt Baugruppe "Netzteil" hinzu mit Foto
3. Dokumentiert Bauteil C12 an Position "Elko 100µF" mit 2 Lötpunkten
4. Nutzer B repariert gleiches Gerät, sieht dass Nutzer A bei C12 einen modernen Ersatz verwendet hat
5. Ohne Schaltplan kann durch Lötpunkt-Dokumentation der Stromfluss rekonstruiert werden

**Tasks:**
- [ ] Device CRUD API
- [ ] Assembly CRUD mit Medien-Upload
- [ ] ComponentPosition mit Lötpunkt-Editor
- [ ] Verknüpfung zu CoreComponent/ManufacturerPart
- [ ] Replacement-Dokumentation (welcher Nutzer hat was ersetzt)
- [ ] Reparatur-Historie pro Gerät
- [ ] Schaltplan-Viewer mit interaktiven Bauteil-Markierungen
- [ ] Such-Funktion: "Zeige alle Geräte mit Bauteil X"

---

### Phase 6: Erweiterte Features
- [ ] Erweiterte Suche mit Filtern
- [ ] ECAD-Datei-Support
- [ ] Beziehungs-Graph-Visualisierung
- [ ] Bulk-Import (CSV/JSON)
- [ ] Export-Funktionen

---

### Phase 7: Admin & Analytics
- [ ] Admin-Dashboard
- [ ] Benutzerverwaltung
- [ ] Kategorie-Management
- [ ] Statistiken

---

## MVP-Scope (Phasen 0-4)

**Enthalten:**
- Benutzer-Authentifizierung (Keycloak)
- Komponenten-CRUD mit kategoriespezifischen Attributen
- Hersteller-, Kategorie-, Bauformen-Verwaltung
- Volltextsuche
- Datei-Uploads (Datasheets, Bilder)
- Revisionen-Tracking
- Basis-Moderation

**Zurückgestellt:**
- Schaltplan-Digitalisierung
- BOM-Management
- ECAD-Integration
- Bulk-Import/Export

---

## Nächste Schritte

1. **Phase 0 starten**: Monorepo-Setup, Docker-Konfiguration
2. **Keycloak-Realm erstellen**: Rollen (Admin, Moderator, Contributor, Viewer)
3. **Prisma-Schema schreiben**: Basierend auf dem Konzeptdokument
4. **CLAUDE.md erstellen**: KI-Kontext für konsistente Entwicklung

---

## Migrations-Strategie

### Grundprinzipien

1. **Keine Breaking Changes ohne Migration-Script**
2. **Jede Migration ist reversibel** (Down-Migration dokumentieren)
3. **Test-Umgebung zuerst** - Niemals direkt auf Produktion migrieren

### Workflow

```bash
# 1. Neue Migration erstellen (Entwicklung)
pnpm prisma migrate dev --name beschreibender_name

# 2. Migration reviewen
cat packages/database/prisma/migrations/*/migration.sql

# 3. Tests laufen lassen
pnpm test

# 4. In Staging deployen
DATABASE_URL=$STAGING_DB pnpm prisma migrate deploy

# 5. Nach Validierung: Produktion
DATABASE_URL=$PROD_DB pnpm prisma migrate deploy
```

### Rollback-Strategie

Für kritische Rollbacks:
```bash
# Entwicklung: Kompletter Reset (ACHTUNG: Datenverlust!)
pnpm prisma migrate reset

# Produktion: Manuelles Rollback-Script
# Jede Migration sollte ein rollback_XXXXXX.sql haben
psql -f rollback_XXXXXX.sql

# Alternativ: Point-in-Time Recovery aus Backup
```

### Breaking Changes Checkliste

Vor einer Migration mit Breaking Changes:
- [ ] Backup erstellt?
- [ ] Rollback-Script geschrieben?
- [ ] Downtime kommuniziert?
- [ ] Daten-Migration getestet?

---

## Backup-Strategie

### Tägliche Backups

```powershell
# Windows Task Scheduler Script (täglich 02:00 Uhr)
# C:\Scripts\backup-electrovault.ps1

$date = Get-Date -Format "yyyy-MM-dd"
$backupDir = "D:\Backups\ElectroVault"

# PostgreSQL Dump
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" `
  -h localhost `
  -U ElectroVault_dev_user `
  -d ElectroVault_Dev `
  -F c `
  -f "$backupDir\db_$date.dump"

# MinIO Bucket Backup (optional)
# mc mirror myminio/electrovault-files "$backupDir\files_$date"

# Alte Backups löschen (älter als 7 Tage)
Get-ChildItem $backupDir -Filter "db_*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item
```

### Point-in-Time Recovery (PITR)

PostgreSQL WAL-Archivierung aktivieren für sekundengenaue Wiederherstellung:

```ini
# postgresql.conf (auf Windows Server 2019)
wal_level = replica
archive_mode = on
archive_command = 'copy "%p" "D:\\Backups\\WAL\\%f"'
max_wal_senders = 3
```

### Backup-Aufbewahrung

| Typ | Aufbewahrung | Speicherort |
|-----|--------------|-------------|
| Täglich | 7 Tage | D:\Backups\ElectroVault\ |
| Wöchentlich | 4 Wochen | D:\Backups\Weekly\ |
| Monatlich | 12 Monate | Externes NAS / Cloud |
| WAL-Archiv | 7 Tage | D:\Backups\WAL\ |

### Wiederherstellung testen

**Monatliche Pflicht:** Backup-Wiederherstellung auf Test-Datenbank verifizieren!

```powershell
# Test-Restore
& "C:\Program Files\PostgreSQL\15\bin\pg_restore.exe" `
  -h localhost `
  -U postgres `
  -d ElectroVault_Test_Restore `
  -c `
  "D:\Backups\ElectroVault\db_2025-12-27.dump"

# Verifizieren
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" `
  -h localhost `
  -U postgres `
  -d ElectroVault_Test_Restore `
  -c "SELECT COUNT(*) FROM \"CoreComponent\";"
```

---

## Offene Fragen (für später)

- OCR-Integration für Schaltplan-Texterkennung?
- Automatische Bauteil-Erkennung aus Datasheets?
- API-Zugang für externe Tools (z.B. KiCad-Plugin)?

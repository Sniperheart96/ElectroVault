# Tech-Stack

> Technologie-Entscheidungen für ElectroVault

## Kern-Technologien

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14+ (App Router), React 18, TailwindCSS |
| Backend | Node.js, Fastify, Prisma ORM |
| Datenbank | PostgreSQL 15+ |
| Auth | Keycloak (Self-Hosted) + next-auth |
| File Storage | MinIO (S3-kompatibel, Self-Hosted) |
| Monorepo | Turborepo + pnpm |
| Sprache | Deutsch (i18n-ready) |

---

## Entwicklungs-Beschleuniger

| Aufgabe | Bibliothek | Status |
|---------|------------|--------|
| **Schema-Validierung** | `Zod` + Fastify | ✅ Implementiert |
| **Formulare** | `react-hook-form` + `@hookform/resolvers/zod` | ✅ Implementiert |
| **UI-Komponenten** | `shadcn/ui` | ✅ Implementiert (20+ Komponenten) |
| **Audit-Logging** | Manuell in Services | ✅ Implementiert (nicht als Extension) |
| **Soft-Delete** | Manuell in Services | ✅ Implementiert (nicht als Extension) |
| **Einheiten-Parsing** | `mathjs` | ❌ Noch nicht implementiert |
| **Tabellen/Listen** | `@tanstack/react-table` | ❌ Noch nicht implementiert |

> **Hinweis:** Prisma Client Extensions für Soft-Delete und Audit-Logging wurden zugunsten manueller Service-Implementierungen verworfen, da dies mehr Kontrolle und Flexibilität bietet.

---

## Architektur-Entscheidungen

### Kein Refine

Refine wurde gestrichen weil:
1. Es eigene UI-Libraries mitbringt (Mantine/Ant Design) → Design-Bruch mit shadcn/ui
2. Wir haben bereits Zod-Schemas → CRUD-Forms sind mit react-hook-form trivial
3. Ein `/admin`-Ordner im Next.js App Router reicht völlig aus
4. Konsistente Codebase ist wichtiger als "magische" Generierung

---

## Code-Beispiele

### Einheiten mit mathjs (Geplant)

> **Status:** Noch nicht implementiert. Das folgende Beispiel zeigt die geplante Funktionalität.

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
```

### Zod + Fastify (Implementiert)

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

## Projektstruktur

```
electrovault/
├── .claude/                    # KI-Kontext & Agenten
│   ├── CLAUDE.md              # Hauptkontext-Dokument
│   └── agents/                # Agenten-Definitionen
├── .github/workflows/         # CI/CD
├── apps/
│   ├── web/                   # Next.js Frontend + Admin
│   │   └── src/components/ui/ # shadcn/ui Komponenten (nicht in packages/ui)
│   └── api/                   # Fastify Backend
├── packages/
│   ├── auth/                  # Wiederverwendbares Auth-Package
│   ├── database/              # Prisma Schema & Client
│   ├── schemas/               # Zod-Schemas (shared)
│   └── shared/                # Types, Constants, Utils
├── docker/
│   └── docker-compose.yml     # Dev-Stack
└── docs/                      # Dokumentation
```

> **Hinweis:** Die shadcn/ui Komponenten befinden sich direkt in `apps/web/src/components/ui/` statt in einem separaten `packages/ui/` Package. Dies ist pragmatisch, da nur eine Frontend-App existiert.

### Package-Details

#### packages/schemas/

```
packages/schemas/
├── src/
│   ├── attribute.ts           # AttributeDefinition Schemas
│   ├── audit.ts               # AuditLog Schemas
│   ├── category.ts            # Category Schemas
│   ├── common.ts              # Shared Types (LocalizedString, PaginationParams)
│   ├── component.ts           # CoreComponent Schemas
│   ├── manufacturer.ts        # Manufacturer Schemas
│   ├── package.ts             # Package Schemas
│   ├── part.ts                # ManufacturerPart Schemas
│   ├── pin.ts                 # PinMapping Schemas
│   ├── schemas.test.ts        # Tests
│   └── index.ts               # Re-exports
└── package.json
```

**Vorteil:** Ein Schema, drei Verwendungen:
1. **API:** Fastify Request-Validierung
2. **Frontend:** react-hook-form Validierung
3. **Types:** TypeScript-Typen automatisch generiert (`z.infer<typeof Schema>`)

#### packages/shared/

```
packages/shared/
├── src/
│   ├── i18n/
│   │   ├── types.ts           # LocalizedString Type
│   │   ├── localized-string.ts # Hilfsfunktionen
│   │   └── index.ts           # Re-exports
│   ├── utils/
│   │   ├── localization.ts    # getLocalizedValue Helper
│   │   └── localization.test.ts
│   └── index.ts
└── package.json
```

> **Geplant aber noch nicht implementiert:**
> - `units/` - mathjs-basiertes Einheiten-Parsing
> - `constants/` - Enums (derzeit in Prisma Schema definiert)

#### packages/database/

```
packages/database/
├── prisma/
│   ├── schema.prisma          # Datenbank-Schema
│   ├── migrations/            # Prisma Migrationen
│   └── seed.ts                # Seed-Daten (Kategorien, Packages)
├── src/
│   └── index.ts               # Prisma Client Export
└── package.json
```

> **Hinweis:** Prisma Client Extensions für Soft-Delete und Audit-Logging wurden zugunsten manueller Service-Implementierungen verworfen (siehe Tabelle oben). Soft-Delete und Audit-Logging werden direkt in den API-Services implementiert.

---

*Siehe auch: [i18n.md](i18n.md) | [database-schema.md](database-schema.md)*

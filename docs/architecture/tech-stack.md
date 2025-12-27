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

| Aufgabe | Bibliothek | Erspart |
|---------|------------|---------|
| **Einheiten-Parsing** | `mathjs` | Eigene SI-Multiplikatoren & Regex für "100µF" → 0.0001F |
| **Schema-Validierung** | `Zod` + `fastify-type-provider-zod` | Doppelte Interface-Definitionen |
| **Formulare** | `react-hook-form` + `@hookform/resolvers/zod` | Manuelle Form-States & Validierung |
| **Audit/Soft-Delete** | Prisma Client Extensions | Boilerplate für jede Entität |
| **UI-Komponenten** | `shadcn/ui` | Eigene Design-System-Entwicklung |
| **Tabellen/Listen** | `@tanstack/react-table` + shadcn | Pagination, Sorting, Filtering |

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

### Einheiten mit mathjs

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

### Zod + Fastify

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
│   └── api/                   # Fastify Backend
├── packages/
│   ├── auth/                  # Wiederverwendbares Auth-Package
│   ├── database/              # Prisma Schema & Client
│   ├── schemas/               # Zod-Schemas (shared)
│   ├── ui/                    # Shared UI Components (shadcn/ui)
│   └── shared/                # Types, Constants, Utils
├── docker/
│   └── docker-compose.yml     # Dev-Stack
└── docs/                      # Dokumentation
```

### Package-Details

#### packages/schemas/

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

#### packages/shared/

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

#### packages/database/

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

*Siehe auch: [i18n.md](i18n.md) | [database-schema.md](database-schema.md)*

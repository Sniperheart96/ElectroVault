# Tech-Stack

> Aktueller Technologie-Stack von ElectroVault

## Übersicht

| Komponente | Technologie | Version |
|------------|-------------|---------|
| **Frontend** | Next.js (App Router) | 15.1.3 |
| **UI Framework** | React | 19.0.0 |
| **Backend** | Fastify | 4.28.0 |
| **ORM** | Prisma | 6.1.0 |
| **Datenbank** | PostgreSQL | 18 (Development) |
| **Auth** | Keycloak + next-auth | 4.24.0 |
| **File Storage** | MinIO (S3-kompatibel) | 8.0.6 |
| **Monorepo** | Turborepo + pnpm | 2.3.3 / 9.15.0 |
| **Runtime** | Node.js | ≥20.0.0 |
| **Sprache** | TypeScript | 5.7.2 |

---

## Frontend

### Next.js & React

| Package | Version | Verwendung |
|---------|---------|------------|
| `next` | 15.1.3 | App Router, Server Components, API Routes |
| `react` | 19.0.0 | UI-Library |
| `react-dom` | 19.0.0 | DOM-Rendering |

### UI & Styling

| Package | Version | Verwendung |
|---------|---------|------------|
| `tailwindcss` | 3.4.0 | Utility-First CSS Framework |
| `@radix-ui/*` | diverse | Headless UI-Komponenten (Basis für shadcn/ui) |
| `lucide-react` | 0.400.0 | Icon-Library |
| `class-variance-authority` | 0.7.1 | Dynamische Klassen-Generierung |
| `tailwind-merge` | 2.6.0 | Tailwind-Klassen zusammenführen |
| `tailwindcss-animate` | 1.0.7 | Animation-Utilities |
| `clsx` | 2.1.1 | Klassen-Zusammenführung |

**Verwendete shadcn/ui Komponenten (in `apps/web/src/components/ui/`):**
- Accordion, Alert Dialog, Avatar, Checkbox, Collapsible
- Dialog, Dropdown Menu, Label, Navigation Menu, Popover
- Progress, Scroll Area, Select, Separator, Slot
- Tabs, Toast, Tooltip

### Formulare & Validierung

| Package | Version | Verwendung |
|---------|---------|------------|
| `react-hook-form` | 7.69.0 | Formular-Management |
| `@hookform/resolvers` | 5.2.2 | Zod-Integration für react-hook-form |
| `zod` | 3.25.76 / 3.23.8 | Schema-Validierung (shared) |

### Internationalisierung

| Package | Version | Verwendung |
|---------|---------|------------|
| `next-intl` | 3.20.0 | i18n für Next.js |

### Weitere Frontend-Dependencies

| Package | Version | Verwendung |
|---------|---------|------------|
| `cmdk` | 1.0.0 | Command Menu (⌘K) |
| `next-auth` | 4.24.0 | Auth-Client für Next.js |

---

## Backend

### Fastify

| Package | Version | Verwendung |
|---------|---------|------------|
| `fastify` | 4.28.0 | HTTP-Server |
| `fastify-plugin` | 5.0.0 | Plugin-System |

### Fastify Plugins

| Package | Version | Verwendung |
|---------|---------|------------|
| `@fastify/cors` | 8.0.0 | Cross-Origin Resource Sharing |
| `@fastify/helmet` | 11.0.0 | Security Headers |
| `@fastify/rate-limit` | 9.0.0 | Rate Limiting |
| `@fastify/compress` | 7.0.0 | Response Compression (gzip/brotli) |
| `@fastify/multipart` | 8.3.1 | Datei-Upload (multipart/form-data) |
| `@fastify/jwt` | 8.0.0 | JWT-Token Handling (via @electrovault/auth) |

### Logging

| Package | Version | Verwendung |
|---------|---------|------------|
| `pino` | 9.0.0 | Strukturiertes Logging |
| `pino-pretty` | 11.0.0 | Pretty-Printing für Development |

### File Storage

| Package | Version | Verwendung |
|---------|---------|------------|
| `minio` | 8.0.6 | S3-kompatibler Object Storage Client |

---

## Datenbank

### Prisma

| Package | Version | Verwendung |
|---------|---------|------------|
| `prisma` | 6.1.0 | Prisma CLI (Migrationen, Studio) |
| `@prisma/client` | 6.1.0 | Type-Safe Datenbank-Client |

**PostgreSQL Version:** 18 (Development Server: ITME-SERVER)

**Prisma Features:**
- Type-Safe Queries
- Auto-Generierte Types
- Migration System
- Prisma Studio (GUI)

---

## Auth

### Keycloak Integration

| Package | Version | Verwendung |
|---------|---------|------------|
| `next-auth` | 4.24.0 | Auth-Library für Next.js |
| `@fastify/jwt` | 8.0.0 | JWT-Validierung im Backend |
| `jose` | 5.2.0 | JWT-Verarbeitung (JOSE Standard) |

**Keycloak Setup:**
- Self-Hosted Docker Container (Port 8080)
- Realm: `electrovault`
- OpenID Connect (OIDC)

---

## Monorepo-Tools

### Build & Package Management

| Package | Version | Verwendung |
|---------|---------|------------|
| `turbo` | 2.3.3 | Monorepo Build System |
| `@turbo/gen` | 2.3.3 | Turbo Code Generator |
| `pnpm` | 9.15.0 | Package Manager |

**pnpm Workspaces:**
- `apps/*` - Anwendungen (web, api)
- `packages/*` - Shared Packages (database, schemas, auth, shared)

---

## Development Tools

### TypeScript

| Package | Version | Verwendung |
|---------|---------|------------|
| `typescript` | 5.7.2 | TypeScript Compiler (strict mode) |
| `tsx` | 4.19.2 | TypeScript Executor (für Seed-Scripts) |
| `ts-node` | 10.9.2 | TypeScript REPL |

### Testing

| Package | Version | Verwendung |
|---------|---------|------------|
| `vitest` | 1.0.0 | Unit & Integration Tests |
| `@vitest/ui` | 1.0.0 | Vitest UI |
| `@vitest/coverage-v8` | 1.0.0 | Code Coverage |
| `@vitejs/plugin-react` | 4.2.0 | React-Support für Vitest |
| `@testing-library/react` | 14.0.0 | React Testing Utilities |
| `@testing-library/jest-dom` | 6.0.0 | Custom Jest Matchers |
| `@testing-library/user-event` | 14.0.0 | User Interaction Simulation |
| `jsdom` | 23.0.0 | DOM-Simulation für Tests |
| `vite-tsconfig-paths` | 4.2.0 | Path Aliases für Vitest |

**API Testing:**
| Package | Version | Verwendung |
|---------|---------|------------|
| `supertest` | 6.3.0 | HTTP-Assertions |
| `@types/supertest` | 6.0.0 | TypeScript Types |

**E2E Testing:**
| Package | Version | Verwendung |
|---------|---------|------------|
| `@playwright/test` | 1.57.0 | End-to-End Tests |
| `playwright` | 1.57.0 | Browser Automation |

### Linting & Formatting

| Package | Version | Verwendung |
|---------|---------|------------|
| `eslint` | 9.0.0 | Code Linting |
| `eslint-config-next` | 15.1.3 | Next.js ESLint Config |
| `prettier` | 3.4.2 | Code Formatting |

### Weitere Dev-Tools

| Package | Version | Verwendung |
|---------|---------|------------|
| `dotenv` | 17.2.3 | Environment Variables |
| `autoprefixer` | 10.4.20 | CSS-Vendor-Prefixes |
| `postcss` | 8.4.47 | CSS-Transformation |

---

## Shared Packages

### @electrovault/database

**Dependencies:**
- `@prisma/client` 6.1.0

**Zweck:** Prisma Client & Schema

### @electrovault/schemas

**Dependencies:**
- `zod` 3.23.8

**Zweck:** Zod-Validierungs-Schemas (shared zwischen API & Frontend)

### @electrovault/auth

**Dependencies:**
- `@fastify/jwt` 8.0.0
- `fastify-plugin` 5.0.0
- `jose` 5.2.0
- `next-auth` 4.24.0

**Zweck:** Auth-Wrapper für Fastify & Next.js

### @electrovault/shared

**Dependencies:** Keine externen Dependencies

**Zweck:** Shared Types, Utils, i18n-Helpers

---

## Architektur-Entscheidungen

### Kein Refine

Refine wurde gestrichen weil:
1. Es eigene UI-Libraries mitbringt (Mantine/Ant Design) → Design-Bruch mit shadcn/ui
2. Wir haben bereits Zod-Schemas → CRUD-Forms sind mit react-hook-form trivial
3. Ein `/admin`-Ordner im Next.js App Router reicht völlig aus
4. Konsistente Codebase ist wichtiger als "magische" Generierung

### Manuelle Service-Implementierung statt Prisma Extensions

**Soft-Delete & Audit-Logging** werden manuell in API-Services implementiert (nicht als Prisma Client Extensions), da dies mehr Kontrolle und Flexibilität bietet.

### shadcn/ui in apps/web statt packages/ui

Die shadcn/ui Komponenten befinden sich direkt in `apps/web/src/components/ui/` statt in einem separaten `packages/ui/` Package. Dies ist pragmatisch, da nur eine Frontend-App existiert.

---

## Code-Beispiel: Zod-Schemas (shared)

**Ein Schema, drei Verwendungen:**

```typescript
// packages/schemas/src/component.ts
import { z } from 'zod';

export const CreateComponentSchema = z.object({
  name: z.record(z.string()),
  categoryId: z.string().uuid(),
  // ... weitere Felder
});
```

**1. API - Fastify Validierung:**
```typescript
// apps/api/src/routes/components/index.ts
import { CreateComponentSchema } from '@electrovault/schemas';

fastify.post('/components', {
  schema: { body: CreateComponentSchema }
}, async (request) => {
  // request.body ist bereits validiert!
});
```

**2. Frontend - react-hook-form:**
```typescript
// apps/web/src/components/admin/component-dialog.tsx
import { CreateComponentSchema } from '@electrovault/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(CreateComponentSchema),
});
```

**3. Types - TypeScript:**
```typescript
import { z } from 'zod';
import { CreateComponentSchema } from '@electrovault/schemas';

type CreateComponentInput = z.infer<typeof CreateComponentSchema>;
```

---

*Siehe auch: [i18n.md](i18n.md) | [database-schema.md](database-schema.md) | [Projekt-README](../README.md)*

# Phase 2: Component API

**Status:** ✅ Abgeschlossen
**Fortschritt:** 100%

---

## Übersicht

Phase 2 implementiert die CRUD-APIs für Bauteile und verwandte Entitäten.

---

## Aufgaben

- [x] ComponentService mit CRUD
- [x] ManufacturerPart Service mit CRUD
- [x] AuditLog Service für Änderungstracking
- [x] Manufacturer API
- [x] Category API (read-only mit Baum-Struktur)
- [x] Package API
- [x] Zod-Schemas für alle Entitäten
- [ ] OpenAPI-Dokumentation (optional, Phase 3)
- [ ] PostgreSQL Volltextsuche (optional, Phase 3)

---

## Implementierte Dateien

### Zod-Schemas (`packages/schemas/src/`)

| Datei | Beschreibung |
|-------|--------------|
| `common.ts` | LocalizedString, Pagination, Enums |
| `category.ts` | Category-Schemas (Base, Tree, Path) |
| `manufacturer.ts` | Manufacturer-Schemas (CRUD) |
| `package.ts` | Package-Schemas (CRUD, Footprints) |
| `component.ts` | CoreComponent-Schemas (CRUD, Relations) |
| `part.ts` | ManufacturerPart-Schemas (CRUD) |
| `audit.ts` | AuditLog-Schemas (Query, History) |
| `index.ts` | Zentrale Exports |

### Services (`apps/api/src/services/`)

| Datei | Beschreibung |
|-------|--------------|
| `category.service.ts` | Kategorie-Verwaltung (Read-Only, Baum, Pfad) |
| `manufacturer.service.ts` | Hersteller CRUD mit Suche |
| `package.service.ts` | Package CRUD mit Footprints |
| `component.service.ts` | CoreComponent CRUD mit Relations |
| `part.service.ts` | ManufacturerPart CRUD mit Lagerbestand |
| `audit.service.ts` | Audit-Logs, History, Statistiken |
| `index.ts` | Zentrale Exports |

### Routes (`apps/api/src/routes/`)

| Datei | Beschreibung |
|-------|--------------|
| `categories/index.ts` | GET-Endpoints für Kategorien |
| `manufacturers/index.ts` | CRUD-Endpoints für Hersteller |
| `packages/index.ts` | CRUD-Endpoints für Packages |
| `components/index.ts` | CRUD-Endpoints für Components |
| `parts/index.ts` | CRUD-Endpoints für Parts |
| `audit/index.ts` | Audit-Log Endpoints |

### Utilities (`apps/api/src/lib/`)

| Datei | Beschreibung |
|-------|--------------|
| `errors.ts` | ApiError, NotFoundError, ValidationError |
| `pagination.ts` | Pagination-Helpers für Prisma |
| `slug.ts` | Slug-Generierung aus LocalizedString |
| `index.ts` | Zentrale Exports |

---

## API-Endpunkte

### Components (`/api/v1/components`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| GET | `/` | - | Liste mit Pagination/Filter |
| GET | `/:id` | - | Einzelnes Bauteil (ID oder Slug) |
| POST | `/` | CONTRIBUTOR | Neues Bauteil erstellen |
| PATCH | `/:id` | CONTRIBUTOR | Bauteil aktualisieren |
| DELETE | `/:id` | MODERATOR | Bauteil archivieren (soft-delete) |
| POST | `/:id/restore` | ADMIN | Archiviertes Bauteil wiederherstellen |
| POST | `/:id/relations` | CONTRIBUTOR | Konzept-Beziehung hinzufügen |
| DELETE | `/:id/relations/:relationId` | MODERATOR | Konzept-Beziehung entfernen |

### Parts (`/api/v1/parts`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| GET | `/` | - | Liste mit Pagination/Filter |
| GET | `/search` | - | Schnellsuche (Autocomplete) |
| GET | `/:id` | - | Einzelnes Part (ID oder MPN) |
| POST | `/` | CONTRIBUTOR | Neues Part erstellen |
| PATCH | `/:id` | CONTRIBUTOR | Part aktualisieren |
| DELETE | `/:id` | MODERATOR | Part archivieren |
| POST | `/:id/stock` | CONTRIBUTOR | Lagerbestand aktualisieren |
| POST | `/:id/restore` | ADMIN | Archiviertes Part wiederherstellen |

### Manufacturers (`/api/v1/manufacturers`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| GET | `/` | - | Liste aller Hersteller |
| GET | `/search` | - | Schnellsuche (Autocomplete) |
| GET | `/:id` | - | Einzelner Hersteller (ID oder Slug) |
| POST | `/` | CONTRIBUTOR | Neuer Hersteller |
| PATCH | `/:id` | CONTRIBUTOR | Hersteller aktualisieren |
| DELETE | `/:id` | ADMIN | Hersteller löschen |

### Categories (`/api/v1/categories`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| GET | `/` | - | Flache Liste mit Pagination |
| GET | `/tree` | - | Hierarchischer Kategorie-Baum |
| GET | `/roots` | - | Nur Root-Kategorien |
| GET | `/:id` | - | Einzelne Kategorie (ID oder Slug) |
| GET | `/:id/children` | - | Direkte Kind-Kategorien |
| GET | `/:id/path` | - | Breadcrumb-Pfad |

### Packages (`/api/v1/packages`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| GET | `/` | - | Liste mit Pagination |
| GET | `/search` | - | Schnellsuche (Autocomplete) |
| GET | `/:id` | - | Einzelnes Package (ID oder Slug) |
| POST | `/` | CONTRIBUTOR | Neues Package |
| PATCH | `/:id` | CONTRIBUTOR | Package aktualisieren |
| DELETE | `/:id` | ADMIN | Package löschen |
| POST | `/:id/footprints` | CONTRIBUTOR | ECAD-Footprint hinzufügen |
| DELETE | `/:id/footprints/:footprintId` | MODERATOR | Footprint entfernen |

### Audit (`/api/v1/audit`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| GET | `/` | ADMIN | Liste aller Audit-Logs |
| GET | `/entity/:type/:id` | MODERATOR | History einer Entität |
| GET | `/user/:userId` | AUTH* | Aktivitäten eines Users |
| GET | `/my-activity` | AUTH | Eigene Aktivitäten |
| GET | `/stats` | ADMIN | Statistiken |

*) Eigener User oder ADMIN

---

## Technische Details

### Soft-Delete

Alle Entitäten mit `deletedAt` und `deletedById`:
```typescript
// Löschen (archivieren)
await prisma.coreComponent.update({
  where: { id },
  data: { deletedAt: new Date(), deletedById: userId }
});

// Wiederherstellen
await prisma.coreComponent.update({
  where: { id },
  data: { deletedAt: null, deletedById: null }
});
```

### Audit-Logging

Änderungen werden automatisch in AuditLog gespeichert:
```typescript
await auditService.log({
  entityType: 'CoreComponent',
  entityId: component.id,
  action: 'UPDATE',
  oldValues: oldComponent,
  newValues: newComponent,
  performedById: userId,
});
```

### Slug-Generierung

Automatische Slug-Erstellung aus LocalizedString:
```typescript
const slug = generateSlug(data.name); // { de: "Kondensator" } -> "kondensator"
```

### Pagination

Konsistentes Response-Format:
```typescript
{
  data: [...],
  meta: {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5
  }
}
```

---

## Tests

- 42 Zod-Schema-Tests (packages/schemas)
- 81 Tests gesamt (alle bestehen)

---

## Offene Punkte für spätere Phasen

- [ ] OpenAPI/Swagger-Dokumentation
- [ ] PostgreSQL Volltextsuche mit tsvector
- [ ] Datei-Upload für Datasheets/Bilder
- [ ] Batch-Import/Export

---

*Nächste Phase: [phase-3-frontend.md](phase-3-frontend.md)*

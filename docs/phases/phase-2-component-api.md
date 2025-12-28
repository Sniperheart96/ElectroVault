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
  pagination: {
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

## SI-Präfix-System für Einheiten

### Konzept

Attribute mit physikalischen Einheiten (Kapazität, Widerstand, Länge, Datengröße) unterstützen SI-Präfixe für benutzerfreundliche Eingabe und Anzeige.

### Funktionsweise

1. **Attribut-Definition:** Legt fest, welche Präfixe erlaubt sind
   ```
   Attribut: Kapazität
   Einheit: F (Farad)
   Erlaubte Präfixe: p, n, µ, m, (leer), k
   ```

2. **Werteingabe:** Benutzer gibt Zahl + Präfix ein
   ```
   Eingabe: 10 mit Präfix µ
   → Anzeige: 10 µF
   ```

3. **Speicherung:** Normalisierter Wert + verwendeter Präfix
   ```
   normalizedValue: 0.00001  (10 × 10⁻⁶)
   prefix: "µ"
   ```

4. **Laden:** System rechnet zurück
   ```
   Geladen: 0.00001 F, prefix: µ
   → Anzeige: 10 µF
   ```

### Standard SI-Präfixe

| Symbol | Name | Faktor | Exponent |
|--------|------|--------|----------|
| P | Peta | 10¹⁵ | 15 |
| T | Tera | 10¹² | 12 |
| G | Giga | 10⁹ | 9 |
| M | Mega | 10⁶ | 6 |
| k | Kilo | 10³ | 3 |
| h | Hekto | 10² | 2 |
| da | Deka | 10¹ | 1 |
| (leer) | - | 10⁰ | 0 |
| d | Dezi | 10⁻¹ | -1 |
| c | Zenti | 10⁻² | -2 |
| m | Milli | 10⁻³ | -3 |
| µ | Mikro | 10⁻⁶ | -6 |
| n | Nano | 10⁻⁹ | -9 |
| p | Piko | 10⁻¹² | -12 |
| f | Femto | 10⁻¹⁵ | -15 |

### Typische Präfix-Sets pro Einheit

| Einheit | Typische Präfixe | Beispiel |
|---------|------------------|----------|
| F (Farad) | p, n, µ, m | 100 pF, 10 µF |
| Ω (Ohm) | m, (leer), k, M | 4.7 kΩ, 1 MΩ |
| H (Henry) | n, µ, m | 100 µH |
| V (Volt) | m, (leer), k | 3.3 V, 5 mV |
| A (Ampere) | µ, m, (leer) | 20 mA |
| m (Meter) | n, µ, m, c, (leer), k | 2.54 cm |
| Hz (Hertz) | (leer), k, M, G | 16 MHz |
| B (Byte) | (leer), K, M, G, T | 512 MB |
| W (Watt) | µ, m, (leer), k | 0.25 W |

### Datenbank-Schema

```prisma
model AttributeDefinition {
  // ... bestehende Felder ...

  // SI-Präfix Unterstützung
  allowedPrefixes   String[]  @default([])  // z.B. ["p", "n", "µ", "m", "", "k"]
}

model ComponentAttributeValue {
  // ... bestehende Felder ...

  // Gewählter Präfix (statt displayValue)
  prefix            String?   @db.VarChar(5)  // z.B. "µ", "k", "M"
}
```

### Vorteile

1. **Konsistente Suche:** Filter arbeiten immer auf normalisierten SI-Werten
2. **Benutzerfreundlich:** Eingabe in gewohnten Einheiten (µF statt 0.000001 F)
3. **Flexibel:** Jedes Attribut definiert eigene erlaubte Präfixe
4. **Erweiterbar:** Neue Einheiten können eigene Präfix-Sets haben

---

## Offene Punkte für spätere Phasen

- [ ] OpenAPI/Swagger-Dokumentation
- [ ] PostgreSQL Volltextsuche mit tsvector
- [ ] Datei-Upload für Datasheets/Bilder
- [ ] Batch-Import/Export

---

*Nächste Phase: [phase-3-frontend.md](phase-3-frontend.md)*

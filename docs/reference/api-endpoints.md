# API-Endpunkte Referenz

Vollständige Übersicht aller REST-API-Endpunkte von ElectroVault.

## Basis-Informationen

| Parameter | Wert |
|-----------|------|
| Basis-URL | `http://localhost:3001/api/v1` (Entwicklung) |
| Authentifizierung | Bearer Token (Keycloak JWT) |
| Content-Type | `application/json` (Standard), `multipart/form-data` (File-Upload) |
| Fehler-Format | `{ error: { code: string, message: string } }` |
| Success-Format | `{ data: T }` oder `{ data: T[], pagination: { ... } }` |

### Authentifizierung

Die meisten Mutations-Endpunkte erfordern Authentifizierung:

```
Authorization: Bearer <JWT_TOKEN>
```

### Rollen-System

| Rolle | Beschreibung |
|-------|--------------|
| VIEWER | Nur Lesezugriff |
| CONTRIBUTOR | Inhalte erstellen und eigene bearbeiten |
| MODERATOR | Inhalte freigeben, alle Inhalte bearbeiten |
| ADMIN | Vollzugriff, Benutzerverwaltung, Systemkonfiguration |

## Endpunkt-Übersicht

| Bereich | Basis-Pfad | Beschreibung |
|---------|------------|--------------|
| Kategorien | `/categories` | Kategorie-Hierarchie und Verwaltung |
| Bauteile | `/components` | CoreComponents (logische Bauteile) |
| Hersteller | `/manufacturers` | Hersteller-Verwaltung |
| Parts | `/parts` | ManufacturerParts (konkrete Produkte) |
| Packages | `/packages` | Gehäuseformen und Bauformen |
| Pins | `/components/:componentId/pins` | Pin-Mappings für Components |
| Attribute | `/attributes` | Attribut-Definitionen |
| Dateien | `/files` | Datei-Uploads (Datasheets, Bilder, 3D-Modelle) |
| Moderation | `/moderation` | Moderations-Queue und Freigaben |
| Audit | `/audit` | Audit-Logs und Änderungshistorie |
| Statistiken | `/stats` | Öffentliche Dashboard-Statistiken |
| User Dashboard | `/users` | "Mein ElectroVault" - persönliche Statistiken und Entwürfe |

---

## Kategorien (`/categories`)

### GET `/categories`

Liste aller Kategorien mit Paginierung.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| search | string | - | Suchbegriff (Name) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": { "de": "Kondensatoren", "en": "Capacitors" },
      "slug": "capacitors",
      "level": "FAMILY",
      "parentId": "uuid",
      "iconUrl": "http://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET `/categories/tree`

Kategorie-Baum (hierarchisch).

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| parentId | string | null | Wurzel-Kategorie (null = gesamter Baum) |
| maxDepth | number | 4 | Maximale Tiefe |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": { "de": "Passive Bauteile", "en": "Passive Components" },
      "slug": "passive-components",
      "level": "DOMAIN",
      "children": [
        {
          "id": "uuid",
          "name": { "de": "Kondensatoren", "en": "Capacitors" },
          "slug": "capacitors",
          "level": "FAMILY",
          "children": []
        }
      ]
    }
  ]
}
```

### GET `/categories/:id`

Einzelne Kategorie nach ID oder Slug.

**Parameter:**

- `id` - UUID oder Slug der Kategorie

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Kondensatoren", "en": "Capacitors" },
    "slug": "capacitors",
    "level": "FAMILY",
    "parentId": "uuid",
    "iconUrl": "http://...",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/categories/:id/attributes`

Attribut-Definitionen einer Kategorie (inkl. vererbter).

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| includeInherited | boolean | true | Vererbte Attribute einschließen |
| scope | string | - | Filter: COMPONENT, PART, BOTH |

**Response:**

```json
{
  "data": {
    "categoryId": "uuid",
    "categoryName": { "de": "Kondensatoren", "en": "Capacitors" },
    "categoryLevel": "FAMILY",
    "attributes": [
      {
        "id": "uuid",
        "key": "capacitance",
        "name": { "de": "Kapazität", "en": "Capacitance" },
        "dataType": "DECIMAL",
        "unit": "F",
        "scope": "BOTH",
        "isRequired": true
      }
    ],
    "includeInherited": true
  }
}
```

### GET `/categories/:id/path`

Breadcrumb-Pfad zu einer Kategorie.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": { "de": "Passive Bauteile", "en": "Passive Components" },
      "slug": "passive-components",
      "level": "DOMAIN"
    },
    {
      "id": "uuid",
      "name": { "de": "Kondensatoren", "en": "Capacitors" },
      "slug": "capacitors",
      "level": "FAMILY"
    }
  ]
}
```

### GET `/categories/:id/descendants`

IDs aller Unterkategorien (rekursiv).

**Response:**

```json
{
  "data": {
    "categoryId": "uuid",
    "descendantIds": ["uuid1", "uuid2", "uuid3"]
  }
}
```

### GET `/categories/:id/icon`

Icon-Proxy: Holt das Icon von MinIO und sendet es an den Client.

**Response:** Binärdaten (Image)

**Header:**

```
Content-Type: image/png | image/jpeg | image/svg+xml
Cache-Control: public, max-age=604800
Cross-Origin-Resource-Policy: cross-origin
```

### POST `/categories`

Neue Kategorie erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": { "de": "Neue Kategorie", "en": "New Category" },
  "slug": "new-category",
  "level": "TYPE",
  "parentId": "uuid",
  "iconUrl": "http://..."
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Neue Kategorie", "en": "New Category" },
    "slug": "new-category"
  }
}
```

### PATCH `/categories/:id`

Kategorie aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": { "de": "Aktualisiert", "en": "Updated" },
  "iconUrl": "http://..."
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Aktualisiert", "en": "Updated" }
  }
}
```

### DELETE `/categories/:id`

Kategorie löschen (Soft-Delete).

**Auth:** ADMIN

**Response:** HTTP 204 (No Content)

---

## Bauteile (`/components`)

### GET `/components`

Liste aller CoreComponents mit Paginierung und Filterung.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| search | string | - | Suchbegriff (Name, Slug) |
| categoryId | string | - | Kategorie-Filter |
| status | string | - | Status-Filter (DRAFT, PENDING, PUBLISHED) |
| includeDrafts | boolean | false | Eigene Entwürfe (DRAFT) einbeziehen (nur für eingeloggte User) |
| attributeFilters | string (JSON) | - | Array von AttributeFilter-Objekten als JSON-String |

**Hinweis:** Standardmäßig werden keine Entwürfe (DRAFT) angezeigt. Mit `includeDrafts=true` werden die eigenen Entwürfe des eingeloggten Users zusätzlich angezeigt (ausgegraut in der UI).

#### Attribut-basierte Filterung

Die Bauteil-Suche unterstützt attribut-basierte Filter über den Query-Parameter `attributeFilters`.

**AttributeFilter-Objekt:**

```json
{
  "definitionId": "uuid",      // Attribut-Definition ID (Pflicht)
  "operator": "between",       // Filter-Operator (Pflicht)
  "value": 1e-6,              // Hauptwert (Typ variiert)
  "valueTo": 100e-6           // Zweiter Wert (nur für 'between')
}
```

**Verfügbare Operatoren:**

| Operator | Datentypen | Beschreibung | Beispiel-Value |
|----------|------------|--------------|----------------|
| eq | DECIMAL, INTEGER, STRING | Gleich | `100` |
| ne | DECIMAL, INTEGER, STRING | Ungleich | `100` |
| gt | DECIMAL, INTEGER | Größer als | `50` |
| gte | DECIMAL, INTEGER | Größer oder gleich | `50` |
| lt | DECIMAL, INTEGER | Kleiner als | `200` |
| lte | DECIMAL, INTEGER | Kleiner oder gleich | `200` |
| between | DECIMAL, INTEGER | Zwischen (inklusiv) | `value: 10, valueTo: 100` |
| contains | STRING | Enthält Teilstring | `"Timer"` |
| isTrue | BOOLEAN | Ist wahr | - |
| isFalse | BOOLEAN | Ist falsch | - |
| withinRange | RANGE | Wert liegt im gespeicherten Bereich | `25` |
| in | SELECT | Wert in Liste | `["NPN", "PNP"]` |
| notIn | SELECT | Wert nicht in Liste | `["MOSFET"]` |
| hasAny | MULTISELECT | Mind. ein Wert vorhanden (OR) | `["RoHS", "REACH"]` |
| hasAll | MULTISELECT | Alle Werte vorhanden (AND) | `["RoHS", "REACH"]` |

**Beispiel-Anfrage:**

```bash
# Kondensatoren mit Kapazität zwischen 1µF und 100µF
GET /components?categoryId=<uuid>&attributeFilters=[{"definitionId":"<capacitance-uuid>","operator":"between","value":0.000001,"valueTo":0.0001}]
```

**Wichtig:**
- Numerische Werte müssen in SI-Basiseinheit angegeben werden (z.B. 100µF = 0.0001 Farad)
- Das Array muss URL-encoded werden (`encodeURIComponent`)
- Filter werden auf `ManufacturerPart`-Attributen angewendet
- Ein Component wird angezeigt, wenn mindestens ein Part alle Filter erfüllt

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": { "de": "555 Timer", "en": "555 Timer" },
      "slug": "555-timer",
      "categoryId": "uuid",
      "status": "PUBLISHED",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET `/components/:id`

Einzelnes CoreComponent nach ID oder Slug.

**Parameter:**

- `id` - UUID oder Slug des Components

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "555 Timer", "en": "555 Timer" },
    "slug": "555-timer",
    "categoryId": "uuid",
    "description": { "de": "Beschreibung", "en": "Description" },
    "status": "PUBLISHED",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "category": {
      "id": "uuid",
      "name": { "de": "Timer ICs", "en": "Timer ICs" }
    }
  }
}
```

### GET `/components/:id/relations`

Alle Konzept-Beziehungen eines Components.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "sourceComponentId": "uuid",
      "targetComponentId": "uuid",
      "relationType": "SUCCESSOR",
      "notes": { "de": "Nachfolger", "en": "Successor" },
      "targetComponent": {
        "id": "uuid",
        "name": { "de": "556 Dual Timer", "en": "556 Dual Timer" },
        "slug": "556-timer"
      }
    }
  ]
}
```

### GET `/components/:id/parts`

Alle ManufacturerParts eines Components.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "mpn": "NE555P",
      "manufacturerId": "uuid",
      "componentId": "uuid",
      "status": "ACTIVE",
      "manufacturer": {
        "id": "uuid",
        "name": "Texas Instruments"
      }
    }
  ]
}
```

### POST `/components`

Neues CoreComponent erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": { "de": "Neues Bauteil", "en": "New Component" },
  "slug": "new-component",
  "categoryId": "uuid",
  "description": { "de": "Beschreibung", "en": "Description" }
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Neues Bauteil", "en": "New Component" },
    "slug": "new-component",
    "status": "PENDING"
  }
}
```

### PATCH `/components/:id`

CoreComponent aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": { "de": "Aktualisiert", "en": "Updated" },
  "description": { "de": "Neue Beschreibung", "en": "New Description" }
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Aktualisiert", "en": "Updated" }
  }
}
```

### DELETE `/components/:id`

CoreComponent löschen/archivieren (Soft-Delete).

**Auth:** MODERATOR

**Response:** HTTP 204 (No Content)

### POST `/components/:id/restore`

Gelöschtes CoreComponent wiederherstellen.

**Auth:** ADMIN

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Wiederhergestellt", "en": "Restored" },
    "deletedAt": null
  }
}
```

### POST `/components/:id/relations`

Konzept-Beziehung hinzufügen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "targetComponentId": "uuid",
  "relationType": "SUCCESSOR",
  "notes": { "de": "Nachfolger", "en": "Successor" }
}
```

**Response:** HTTP 201

```json
{
  "success": true
}
```

### PATCH `/components/:id/relations/:relationId`

Konzept-Beziehung aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "relationType": "ALTERNATIVE",
  "notes": { "de": "Alternative", "en": "Alternative" }
}
```

**Response:**

```json
{
  "success": true
}
```

### DELETE `/components/:id/relations/:relationId`

Konzept-Beziehung entfernen.

**Auth:** MODERATOR

**Response:** HTTP 204 (No Content)

---

## Hersteller (`/manufacturers`)

### GET `/manufacturers`

Liste aller Hersteller mit Paginierung.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| search | string | - | Suchbegriff (Name) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Texas Instruments",
      "slug": "texas-instruments",
      "logoUrl": "http://localhost:3001/api/v1/manufacturers/uuid/logo",
      "website": "https://www.ti.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET `/manufacturers/search`

Schnellsuche für Autocomplete.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| q | string | - | Suchbegriff (mind. 2 Zeichen) |
| limit | number | 10 | Max. Ergebnisse |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Texas Instruments",
      "slug": "texas-instruments"
    }
  ]
}
```

### GET `/manufacturers/:id`

Einzelner Hersteller nach ID oder Slug.

**Parameter:**

- `id` - UUID oder Slug des Herstellers

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Texas Instruments",
    "slug": "texas-instruments",
    "logoUrl": "http://localhost:3001/api/v1/manufacturers/uuid/logo",
    "website": "https://www.ti.com",
    "description": { "de": "Beschreibung", "en": "Description" },
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/manufacturers/:id/logo`

Logo-Proxy: Holt das Logo von MinIO und sendet es an den Client.

**Response:** Binärdaten (Image)

**Header:**

```
Content-Type: image/png | image/jpeg | image/svg+xml
Cache-Control: public, max-age=604800
Cross-Origin-Resource-Policy: cross-origin
```

### POST `/manufacturers`

Neuen Hersteller erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": "Neuer Hersteller",
  "slug": "neuer-hersteller",
  "website": "https://example.com",
  "description": { "de": "Beschreibung", "en": "Description" }
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "name": "Neuer Hersteller",
    "slug": "neuer-hersteller"
  }
}
```

### PATCH `/manufacturers/:id`

Hersteller aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": "Aktualisierter Name",
  "website": "https://new-website.com"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Aktualisierter Name"
  }
}
```

### DELETE `/manufacturers/:id`

Hersteller löschen.

**Auth:** ADMIN

**Response:** HTTP 204 (No Content)

---

## Parts (`/parts`)

### GET `/parts`

Liste aller ManufacturerParts mit Paginierung und Filterung.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| search | string | - | Suchbegriff (MPN, Name) |
| componentId | string | - | Filter nach Component |
| manufacturerId | string | - | Filter nach Hersteller |
| status | string | - | Status-Filter (ACTIVE, NRND, EOL, OBSOLETE) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "mpn": "NE555P",
      "componentId": "uuid",
      "manufacturerId": "uuid",
      "status": "ACTIVE",
      "imageUrl": "http://...",
      "manufacturer": {
        "id": "uuid",
        "name": "Texas Instruments"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET `/parts/search`

Schnellsuche für Autocomplete.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| q | string | - | Suchbegriff (mind. 2 Zeichen) |
| limit | number | 10 | Max. Ergebnisse |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "mpn": "NE555P",
      "manufacturerId": "uuid",
      "manufacturer": {
        "name": "Texas Instruments"
      }
    }
  ]
}
```

### GET `/parts/:id`

Einzelnes ManufacturerPart nach ID.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "mpn": "NE555P",
    "componentId": "uuid",
    "manufacturerId": "uuid",
    "status": "ACTIVE",
    "imageUrl": "http://...",
    "manufacturer": {
      "id": "uuid",
      "name": "Texas Instruments",
      "logoUrl": "http://..."
    },
    "component": {
      "id": "uuid",
      "name": { "de": "555 Timer", "en": "555 Timer" },
      "slug": "555-timer"
    }
  }
}
```

### GET `/parts/by-mpn/:manufacturerId/:mpn`

Part nach Hersteller und MPN.

**Parameter:**

- `manufacturerId` - UUID des Herstellers
- `mpn` - Manufacturer Part Number

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "mpn": "NE555P",
    "manufacturerId": "uuid",
    "componentId": "uuid"
  }
}
```

### GET `/parts/:id/attributes`

Alle Attributwerte eines Parts.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "partId": "uuid",
      "attributeDefinitionId": "uuid",
      "value": "100",
      "attributeDefinition": {
        "id": "uuid",
        "key": "capacitance",
        "name": { "de": "Kapazität", "en": "Capacitance" },
        "unit": "µF"
      }
    }
  ]
}
```

### POST `/parts`

Neues ManufacturerPart erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "mpn": "NE555P",
  "componentId": "uuid",
  "manufacturerId": "uuid",
  "status": "ACTIVE"
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "mpn": "NE555P",
    "status": "PENDING"
  }
}
```

### PATCH `/parts/:id`

ManufacturerPart aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "status": "EOL",
  "imageUrl": "http://..."
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "mpn": "NE555P",
    "status": "EOL"
  }
}
```

### DELETE `/parts/:id`

ManufacturerPart löschen/archivieren (Soft-Delete).

**Auth:** MODERATOR

**Response:** HTTP 204 (No Content)

### PUT `/parts/:id/attributes`

Attributwerte eines Parts setzen/aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
[
  {
    "attributeDefinitionId": "uuid",
    "value": "100"
  },
  {
    "attributeDefinitionId": "uuid",
    "value": "50"
  }
]
```

**Response:**

```json
{
  "success": true
}
```

### POST `/parts/:id/relationships`

Part-Beziehung hinzufügen (Alternative, Kompatibilität).

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "targetPartId": "uuid",
  "relationType": "ALTERNATIVE"
}
```

**Response:** HTTP 201

```json
{
  "success": true
}
```

### POST `/parts/:id/datasheets`

Datasheet mit Part verknüpfen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "fileId": "uuid",
  "isPrimary": true
}
```

**Response:** HTTP 201

```json
{
  "success": true
}
```

### POST `/parts/:id/images`

Bild mit Part verknüpfen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "fileId": "uuid",
  "isPrimary": true
}
```

**Response:** HTTP 201

```json
{
  "success": true
}
```

---

## Packages (`/packages`)

### GET `/packages`

Liste aller Gehäuseformen mit Paginierung.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| search | string | - | Suchbegriff (Name) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "DIP-8",
      "slug": "dip-8",
      "pinCount": 8,
      "mounting": "THROUGH_HOLE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET `/packages/search`

Schnellsuche für Autocomplete.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| q | string | - | Suchbegriff (mind. 2 Zeichen) |
| limit | number | 10 | Max. Ergebnisse |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "DIP-8",
      "slug": "dip-8",
      "pinCount": 8
    }
  ]
}
```

### GET `/packages/:id`

Einzelnes Package nach ID oder Slug.

**Parameter:**

- `id` - UUID oder Slug des Packages

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "DIP-8",
    "slug": "dip-8",
    "pinCount": 8,
    "mounting": "THROUGH_HOLE",
    "description": { "de": "Beschreibung", "en": "Description" }
  }
}
```

### POST `/packages`

Neues Package erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": "SOIC-8",
  "slug": "soic-8",
  "pinCount": 8,
  "mounting": "SMD",
  "description": { "de": "Beschreibung", "en": "Description" }
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "name": "SOIC-8",
    "slug": "soic-8"
  }
}
```

### PATCH `/packages/:id`

Package aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "description": { "de": "Aktualisiert", "en": "Updated" }
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": "SOIC-8"
  }
}
```

### DELETE `/packages/:id`

Package löschen.

**Auth:** ADMIN

**Response:** HTTP 204 (No Content)

### POST `/packages/:id/footprints`

ECAD-Footprint hinzufügen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "software": "KiCad",
  "libraryName": "IC_Housings_DIP",
  "footprintName": "DIP-8_W7.62mm",
  "fileUrl": "http://..."
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "software": "KiCad",
    "footprintName": "DIP-8_W7.62mm"
  }
}
```

### DELETE `/packages/:id/footprints/:footprintId`

ECAD-Footprint entfernen.

**Auth:** MODERATOR

**Response:** HTTP 204 (No Content)

---

## Pins (`/components/:componentId/pins`)

### GET `/components/:componentId/pins`

Alle Pins eines CoreComponent.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "componentId": "uuid",
      "pinNumber": "1",
      "pinName": "GND",
      "pinType": "GROUND",
      "pinFunction": { "de": "Masse", "en": "Ground" }
    }
  ]
}
```

### POST `/components/:componentId/pins`

Neuen Pin erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "pinNumber": "1",
  "pinName": "GND",
  "pinType": "GROUND",
  "pinFunction": { "de": "Masse", "en": "Ground" }
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "pinNumber": "1",
    "pinName": "GND"
  }
}
```

### POST `/components/:componentId/pins/bulk`

Mehrere Pins auf einmal erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "pins": [
    {
      "pinNumber": "1",
      "pinName": "GND",
      "pinType": "GROUND"
    },
    {
      "pinNumber": "2",
      "pinName": "TRIGGER",
      "pinType": "INPUT"
    }
  ]
}
```

**Response:** HTTP 201

```json
{
  "data": [
    {
      "id": "uuid",
      "pinNumber": "1"
    },
    {
      "id": "uuid",
      "pinNumber": "2"
    }
  ]
}
```

### PATCH `/pins/:id`

Pin aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "pinName": "Updated",
  "pinFunction": { "de": "Neue Beschreibung", "en": "New Description" }
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "pinNumber": "1",
    "pinName": "Updated"
  }
}
```

### DELETE `/pins/:id`

Pin löschen.

**Auth:** CONTRIBUTOR

**Response:** HTTP 204 (No Content)

### POST `/components/:componentId/pins/reorder`

Pin-Reihenfolge ändern.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "pins": [
    { "id": "uuid1", "pinNumber": "1" },
    { "id": "uuid2", "pinNumber": "2" }
  ]
}
```

**Response:**

```json
{
  "success": true
}
```

### DELETE `/components/:componentId/pins`

Alle Pins eines Components löschen.

**Auth:** MODERATOR

**Response:**

```json
{
  "deletedCount": 8
}
```

---

## Attribute (`/attributes`)

### GET `/attributes`

Liste aller Attribut-Definitionen mit Paginierung.

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| search | string | - | Suchbegriff |
| categoryId | string | - | Filter nach Kategorie |
| scope | string | - | Filter: COMPONENT, PART, BOTH |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "key": "capacitance",
      "name": { "de": "Kapazität", "en": "Capacitance" },
      "dataType": "DECIMAL",
      "unit": "F",
      "scope": "BOTH",
      "isRequired": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET `/attributes/by-category/:categoryId`

Alle Attribute einer Kategorie (inkl. vererbter).

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| includeInherited | boolean | true | Vererbte Attribute einschließen |
| scope | string | - | Filter: COMPONENT, PART, BOTH |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "key": "capacitance",
      "name": { "de": "Kapazität", "en": "Capacitance" },
      "dataType": "DECIMAL",
      "unit": "F",
      "scope": "BOTH"
    }
  ]
}
```

### GET `/attributes/:id`

Einzelne Attribut-Definition nach ID.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "key": "capacitance",
    "name": { "de": "Kapazität", "en": "Capacitance" },
    "dataType": "DECIMAL",
    "unit": "F",
    "scope": "BOTH",
    "isRequired": true,
    "categoryId": "uuid"
  }
}
```

### POST `/attributes`

Neue Attribut-Definition erstellen.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "key": "resistance",
  "name": { "de": "Widerstand", "en": "Resistance" },
  "dataType": "DECIMAL",
  "unit": "Ω",
  "scope": "BOTH",
  "isRequired": true,
  "categoryId": "uuid"
}
```

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "key": "resistance",
    "name": { "de": "Widerstand", "en": "Resistance" }
  }
}
```

### PATCH `/attributes/:id`

Attribut-Definition aktualisieren.

**Auth:** CONTRIBUTOR

**Request Body:**

```json
{
  "name": { "de": "Aktualisiert", "en": "Updated" },
  "isRequired": false
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "key": "resistance",
    "name": { "de": "Aktualisiert", "en": "Updated" }
  }
}
```

### DELETE `/attributes/:id`

Attribut-Definition löschen (nur wenn keine Werte zugeordnet).

**Auth:** MODERATOR

**Response:** HTTP 204 (No Content)

---

## Dateien (`/files`)

### POST `/files/datasheet`

Datasheet-Upload (PDF).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | PDF-Datei (max 50MB) |
| partId | string | Nein | UUID des Parts |
| componentId | string | Nein | UUID des Components |
| languages | string | Ja | Kommasepariert (z.B. "de,en") |
| description | string | Nein | Beschreibung |

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "filename": "datasheet.pdf",
    "fileType": "DATASHEET",
    "fileSize": 1024000,
    "storageUrl": "http://...",
    "languages": ["de", "en"]
  }
}
```

### POST `/files/part-image`

Part-Vorschaubild-Upload (JPG, PNG, WebP).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | Bilddatei (max 10MB) |
| partId | string | Ja | UUID des Parts |

**Response:** HTTP 201

```json
{
  "data": {
    "imageUrl": "http://..."
  }
}
```

### POST `/files/pinout`

Pinout-Diagramm-Upload (JPG, PNG, WebP, PDF).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | Pinout-Datei (max 10MB) |
| partId | string | Nein | UUID des Parts |
| componentId | string | Nein | UUID des Components |
| description | string | Nein | Beschreibung |

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "filename": "pinout.pdf",
    "fileType": "PINOUT",
    "storageUrl": "http://..."
  }
}
```

### POST `/files/other`

Beliebige Datei hochladen (Applikationshinweise, etc.).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | Beliebige Datei (max 50MB) |
| partId | string | Nein | UUID des Parts |
| componentId | string | Nein | UUID des Components |
| languages | string | Nein | Kommasepariert (z.B. "de,en") |
| description | string | Nein | Beschreibung |

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "filename": "application-note.pdf",
    "fileType": "OTHER",
    "storageUrl": "http://..."
  }
}
```

### POST `/files/package-3d`

3D-Modell für Package hochladen (STEP, STL, 3MF, OBJ).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | 3D-Datei (max 50MB) |
| packageId | string | Ja | UUID des Packages |
| description | string | Nein | Beschreibung |

**Response:** HTTP 201

```json
{
  "data": {
    "id": "uuid",
    "filename": "dip-8.step",
    "fileType": "ECAD_MODEL",
    "storageUrl": "http://..."
  }
}
```

### POST `/files/manufacturer-logo`

Hersteller-Logo hochladen (JPG, PNG, WebP, SVG).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | Bilddatei (max 5MB) |
| manufacturerId | string | Ja | UUID des Herstellers |

**Response:** HTTP 201

```json
{
  "data": {
    "logoUrl": "http://..."
  }
}
```

### POST `/files/category-icon`

Kategorie-Icon hochladen (JPG, PNG, WebP, SVG).

**Auth:** CONTRIBUTOR

**Content-Type:** `multipart/form-data`

**Form-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| file | File | Ja | Bilddatei (max 5MB) |
| categoryId | string | Ja | UUID der Kategorie |

**Response:** HTTP 201

```json
{
  "data": {
    "iconUrl": "http://..."
  }
}
```

### GET `/files/:id`

Metadaten einer Datei abrufen.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "filename": "datasheet.pdf",
    "fileType": "DATASHEET",
    "fileSize": 1024000,
    "storageUrl": "http://...",
    "languages": ["de", "en"],
    "uploadedById": "uuid",
    "uploadedAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/files/:id/download`

Presigned Download-URL generieren.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "url": "http://...",
    "expiresIn": 86400
  }
}
```

### GET `/files/component/:componentId`

Alle Dateien eines Components.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "datasheet.pdf",
      "fileType": "DATASHEET",
      "storageUrl": "http://..."
    }
  ]
}
```

### GET `/files/part/:partId`

Alle Dateien eines Parts.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "datasheet.pdf",
      "fileType": "DATASHEET",
      "storageUrl": "http://..."
    }
  ]
}
```

### GET `/files/package/:packageId`

Alle Dateien eines Packages (z.B. 3D-Modelle).

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "dip-8.step",
      "fileType": "ECAD_MODEL",
      "storageUrl": "http://..."
    }
  ]
}
```

### DELETE `/files/:id`

Datei löschen (Soft-Delete).

**Auth:** CONTRIBUTOR (eigene), MODERATOR (alle), ADMIN (alle)

**Response:** HTTP 204 (No Content)

### GET `/files/stats`

Statistiken über File-Uploads.

**Auth:** ADMIN

**Response:**

```json
{
  "data": {
    "totalFiles": 1500,
    "totalSize": 5000000000,
    "byType": {
      "DATASHEET": 800,
      "IMAGE": 500,
      "ECAD_MODEL": 200
    }
  }
}
```

---

## Moderation (`/moderation`)

### GET `/moderation/queue`

Kombinierte Moderations-Queue (Components + Parts).

**Auth:** MODERATOR, ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "COMPONENT",
      "name": { "de": "Neues Bauteil", "en": "New Component" },
      "status": "PENDING",
      "createdAt": "2025-01-01T00:00:00Z",
      "createdBy": {
        "id": "uuid",
        "username": "user123"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

### GET `/moderation/queue/components`

Nur PENDING Components.

**Auth:** MODERATOR, ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": { "de": "Neues Bauteil", "en": "New Component" },
      "status": "PENDING",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "totalPages": 1
  }
}
```

### GET `/moderation/queue/parts`

Nur PENDING Parts.

**Auth:** MODERATOR, ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "mpn": "ABC123",
      "status": "PENDING",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

### GET `/moderation/stats`

Statistiken für die Moderations-Queue.

**Auth:** MODERATOR, ADMIN

**Response:**

```json
{
  "data": {
    "pendingComponents": 15,
    "pendingParts": 10,
    "totalPending": 25,
    "approvedToday": 5,
    "rejectedToday": 2
  }
}
```

### POST `/moderation/component/:id/approve`

Component freigeben (Status → PUBLISHED).

**Auth:** MODERATOR, ADMIN

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "name": { "de": "Freigegebenes Bauteil", "en": "Approved Component" },
    "status": "PUBLISHED"
  }
}
```

### POST `/moderation/component/:id/reject`

Component ablehnen (Status → DRAFT).

**Auth:** MODERATOR, ADMIN

**Request Body:**

```json
{
  "comment": "Unvollständige Daten"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "status": "DRAFT"
  }
}
```

### POST `/moderation/part/:id/approve`

Part freigeben (Status → PUBLISHED).

**Auth:** MODERATOR, ADMIN

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "mpn": "ABC123",
    "status": "PUBLISHED"
  }
}
```

### POST `/moderation/part/:id/reject`

Part ablehnen (Status → DRAFT).

**Auth:** MODERATOR, ADMIN

**Request Body:**

```json
{
  "comment": "MPN nicht valide"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "status": "DRAFT"
  }
}
```

### POST `/moderation/batch/approve`

Mehrere Components freigeben.

**Auth:** MODERATOR, ADMIN

**Request Body:**

```json
{
  "componentIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**

```json
{
  "data": {
    "approved": 3,
    "total": 3
  }
}
```

### POST `/moderation/batch/reject`

Mehrere Components ablehnen.

**Auth:** MODERATOR, ADMIN

**Request Body:**

```json
{
  "componentIds": ["uuid1", "uuid2"],
  "comment": "Unvollständige Daten"
}
```

**Response:**

```json
{
  "data": {
    "rejected": 2,
    "total": 2
  }
}
```

---

## Audit (`/audit`)

### GET `/audit`

Liste aller Audit-Logs.

**Auth:** ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer |
| limit | number | 50 | Einträge pro Seite |
| entityType | string | - | Filter: COMPONENT, PART, CATEGORY, etc. |
| operation | string | - | Filter: CREATE, UPDATE, DELETE |
| userId | string | - | Filter nach User |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "COMPONENT",
      "entityId": "uuid",
      "operation": "UPDATE",
      "userId": "uuid",
      "changes": { "status": { "from": "PENDING", "to": "PUBLISHED" } },
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1500,
    "totalPages": 30
  }
}
```

### GET `/audit/entity/:entityType/:entityId`

Änderungshistorie einer einzelnen Entität.

**Auth:** MODERATOR, ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| limit | number | 50 | Max. Einträge |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "operation": "UPDATE",
      "userId": "uuid",
      "changes": { "status": { "from": "PENDING", "to": "PUBLISHED" } },
      "timestamp": "2025-01-01T00:00:00Z",
      "user": {
        "id": "uuid",
        "username": "moderator123"
      }
    }
  ]
}
```

### GET `/audit/user/:userId`

Aktivitäten eines Users.

**Auth:** Eigener User oder ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| limit | number | 50 | Max. Einträge |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "COMPONENT",
      "entityId": "uuid",
      "operation": "CREATE",
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/audit/my-activity`

Eigene Aktivitäten des aktuellen Users.

**Auth:** Authentifiziert

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| limit | number | 50 | Max. Einträge |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "PART",
      "entityId": "uuid",
      "operation": "UPDATE",
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/audit/stats`

Audit-Statistiken.

**Auth:** ADMIN

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| fromDate | string | - | Start-Datum (ISO 8601) |
| toDate | string | - | End-Datum (ISO 8601) |

**Response:**

```json
{
  "data": {
    "totalOperations": 5000,
    "byOperation": {
      "CREATE": 2000,
      "UPDATE": 2500,
      "DELETE": 500
    },
    "byEntityType": {
      "COMPONENT": 2000,
      "PART": 1500,
      "CATEGORY": 500
    }
  }
}
```

---

## Statistiken (`/stats`)

### GET `/stats`

Öffentliche Statistiken (keine Authentifizierung erforderlich).

**Hinweis:** Zählt nur veröffentlichte Components (status: PUBLISHED), aktive Hersteller (status: ACTIVE) und aktive User (isActive: true).

**Response:**

```json
{
  "data": {
    "components": 1500,
    "manufacturers": 250,
    "users": 150
  }
}
```

---

## User Dashboard (`/users`)

Endpunkte für das "Mein ElectroVault" Dashboard. Alle Endpunkte erfordern Authentifizierung.

### GET `/users/me/stats`

Statistiken des aktuellen Users.

**Auth:** VIEWER+

**Response:**

```json
{
  "data": {
    "components": {
      "total": 12,
      "draft": 3,
      "pending": 2,
      "published": 6,
      "archived": 1
    },
    "parts": 8
  }
}
```

### GET `/users/me/components`

Eigene Bauteile des aktuellen Users.

**Auth:** VIEWER+

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| status | string | - | Filter nach Status (DRAFT, PENDING, PUBLISHED, ARCHIVED) |
| limit | number | 20 | Maximale Anzahl |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": { "de": "555 Timer", "en": "555 Timer" },
      "slug": "555-timer",
      "status": "PUBLISHED",
      "category": {
        "id": "uuid",
        "name": { "de": "Timer/Oszillatoren", "en": "Timer/Oscillators" },
        "slug": "timer-oscillators"
      },
      "manufacturerPartsCount": 5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:00:00Z"
    }
  ]
}
```

### GET `/users/me/drafts`

Entwürfe (DRAFT) des aktuellen Users.

**Auth:** VIEWER+

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| limit | number | 10 | Maximale Anzahl |

**Response:** Wie `/users/me/components` mit `status: "DRAFT"`.

### GET `/users/me/activity`

Aktivitätsverlauf des aktuellen Users.

**Auth:** VIEWER+

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| limit | number | 50 | Maximale Anzahl |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "CREATE",
      "entityType": "COMPONENT",
      "entityId": "uuid",
      "changes": { ... },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET `/users/me/dashboard`

Kombinierte Dashboard-Daten (Stats + Drafts + Activity).

**Auth:** VIEWER+

**Query-Parameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| draftsLimit | number | 5 | Maximale Anzahl Entwürfe |
| activityLimit | number | 10 | Maximale Anzahl Aktivitäten |

**Response:**

```json
{
  "data": {
    "stats": {
      "components": { "total": 12, "draft": 3, "pending": 2, "published": 6, "archived": 1 },
      "parts": 8
    },
    "drafts": [ ... ],
    "activity": [ ... ]
  }
}
```

---

## Fehlerbehandlung

### Standard-Fehlerformat

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Häufige Fehler-Codes

| Code | HTTP Status | Beschreibung |
|------|-------------|--------------|
| UNAUTHORIZED | 401 | Keine oder ungültige Authentifizierung |
| FORBIDDEN | 403 | Keine Berechtigung für diese Operation |
| NOT_FOUND | 404 | Ressource nicht gefunden |
| VALIDATION_ERROR | 400 | Validierungsfehler (Zod-Schema) |
| CONFLICT | 409 | Konflikt (z.B. Slug bereits vergeben) |
| INTERNAL_ERROR | 500 | Interner Serverfehler |

### Beispiel-Fehler

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "path": ["name", "de"],
        "message": "Required field missing"
      }
    ]
  }
}
```

---

## Paginierung

Alle Listen-Endpunkte unterstützen Paginierung.

### Query-Parameter

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| page | number | 1 | Seitennummer (1-basiert) |
| limit | number | 50 | Einträge pro Seite (max 100) |

### Response-Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

## Cross-Origin Resource Sharing (CORS)

Die API unterstützt CORS für Frontend-Anfragen.

**Erlaubte Origins:**

- `http://localhost:3000` (Frontend Dev)
- `http://localhost:3001` (API Dev)
- Production-Origin (TODO)

**Erlaubte Methoden:**

- GET, POST, PATCH, DELETE, OPTIONS

**Erlaubte Header:**

- `Authorization`, `Content-Type`

---

## Rate Limiting

**Aktuell:** Nicht implementiert

**Geplant (Phase 5):**

- Öffentliche Endpunkte: 100 Requests/Minute
- Authentifizierte Endpunkte: 1000 Requests/Minute
- Admin-Endpunkte: Unbegrenzt

---

## Versionierung

**Aktuelle Version:** v1

Basis-Pfad: `/api/v1`

Breaking Changes führen zu neuer Major-Version (`/api/v2`).

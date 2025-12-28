# Component Relations API - Manual Test Guide

Diese Datei enthält manuelle Tests für die Component Relations API.

## Voraussetzungen

1. API-Server läuft: `pnpm dev` (Port 3001)
2. PostgreSQL läuft (Port 5432)
3. Test-Daten erstellt (siehe unten)

## Test-Daten erstellen

```sql
-- In psql oder pgAdmin ausführen

-- 1. Kategorie erstellen
INSERT INTO "CategoryTaxonomy" (id, name, slug, level, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '{"en": "Timer ICs", "de": "Timer-ICs"}',
  'timer-ics',
  1,
  true,
  now(),
  now()
);

-- 2. Source Component (NE555) erstellen
INSERT INTO "CoreComponent" (id, name, slug, "categoryId", status, "createdAt", "updatedAt")
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '{"en": "NE555 Timer", "de": "NE555 Timer"}',
  'ne555-timer',
  (SELECT id FROM "CategoryTaxonomy" WHERE slug = 'timer-ics'),
  'PUBLISHED',
  now(),
  now()
);

-- 3. Target Component (TLC555) erstellen
INSERT INTO "CoreComponent" (id, name, slug, "categoryId", status, "createdAt", "updatedAt")
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '{"en": "TLC555 Low Power Timer", "de": "TLC555 Stromspar-Timer"}',
  'tlc555-timer',
  (SELECT id FROM "CategoryTaxonomy" WHERE slug = 'timer-ics'),
  'PUBLISHED',
  now(),
  now()
);
```

## API-Tests

### 1. GET /api/v1/components/:id/relations

Alle Beziehungen eines Components abrufen.

```bash
# Ohne Beziehungen
curl http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations

# Erwartete Response:
{
  "data": {
    "outgoing": [],
    "incoming": []
  }
}
```

### 2. POST /api/v1/components/:id/relations

Neue Beziehung erstellen (erfordert Auth-Token).

```bash
# Bearer Token in Keycloak generieren oder Mock verwenden
export TOKEN="your-auth-token"

curl -X POST \
  http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "22222222-2222-2222-2222-222222222222",
    "relationType": "LOW_POWER_VERSION",
    "notes": {
      "en": "TLC555 is a CMOS low-power version of NE555",
      "de": "TLC555 ist eine CMOS-Stromsparversion von NE555"
    }
  }'

# Erwartete Response:
{
  "success": true
}
```

### 3. GET /api/v1/components/:id/relations (mit Daten)

Nach dem Erstellen sollten Beziehungen sichtbar sein.

```bash
curl http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations

# Erwartete Response:
{
  "data": {
    "outgoing": [
      {
        "id": "...",
        "sourceId": "11111111-1111-1111-1111-111111111111",
        "targetId": "22222222-2222-2222-2222-222222222222",
        "relationType": "LOW_POWER_VERSION",
        "notes": {
          "en": "TLC555 is a CMOS low-power version of NE555",
          "de": "TLC555 ist eine CMOS-Stromsparversion von NE555"
        },
        "createdAt": "2025-12-28T...",
        "target": {
          "id": "22222222-2222-2222-2222-222222222222",
          "name": {
            "en": "TLC555 Low Power Timer",
            "de": "TLC555 Stromspar-Timer"
          },
          "slug": "tlc555-timer",
          "series": null,
          "shortDescription": null
        }
      }
    ],
    "incoming": []
  }
}
```

### 4. PATCH /api/v1/components/:id/relations/:relationId

Beziehung aktualisieren (Notes ändern).

```bash
# Relation ID aus vorheriger Response nehmen
export RELATION_ID="<id-aus-get-response>"

curl -X PATCH \
  http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations/$RELATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": {
      "en": "Updated: TLC555 is a CMOS version with much lower power consumption",
      "de": "Aktualisiert: TLC555 ist eine CMOS-Version mit deutlich geringerem Stromverbrauch"
    }
  }'

# Erwartete Response:
{
  "success": true
}
```

### 5. DELETE /api/v1/components/:id/relations/:relationId

Beziehung löschen.

```bash
curl -X DELETE \
  http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations/$RELATION_ID \
  -H "Authorization: Bearer $TOKEN"

# Erwartete Response: 204 No Content
```

## Relation Types

Die folgenden `relationType` Werte sind erlaubt:

- `DUAL_VERSION` - Doppel-Version (z.B. 556 ist Dual-555)
- `QUAD_VERSION` - Vierfach-Version (z.B. LM324 ist Quad-LM358)
- `LOW_POWER_VERSION` - Stromspar-Version (z.B. TLC555)
- `HIGH_SPEED_VERSION` - Schnelle Version
- `MILITARY_VERSION` - Militär-Version (z.B. 5962-xxxxx)
- `AUTOMOTIVE_VERSION` - Automotive-Version (z.B. AEC-Q qualifiziert)
- `FUNCTIONAL_EQUIV` - Funktionsgleich

## Fehler-Tests

### 404 - Component nicht gefunden

```bash
curl http://localhost:3001/api/v1/components/00000000-0000-0000-0000-000000000000/relations

# Response:
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Component not found"
  }
}
```

### 401 - Nicht authentifiziert

```bash
curl -X POST \
  http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations \
  -H "Content-Type: application/json" \
  -d '{"targetId": "22222222-2222-2222-2222-222222222222", "relationType": "LOW_POWER_VERSION"}'

# Response:
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 400 - Validierungsfehler

```bash
curl -X POST \
  http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "invalid-uuid", "relationType": "INVALID_TYPE"}'

# Response:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validierung fehlgeschlagen",
    "details": [...]
  }
}
```

### 409 - Duplikat

```bash
# Gleiche Beziehung zweimal erstellen
curl -X POST \
  http://localhost:3001/api/v1/components/11111111-1111-1111-1111-111111111111/relations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "22222222-2222-2222-2222-222222222222", "relationType": "LOW_POWER_VERSION"}'

# Response (beim zweiten Aufruf):
{
  "error": {
    "code": "CONFLICT",
    "message": "This concept relation already exists"
  }
}
```

## Cleanup

Test-Daten löschen:

```sql
DELETE FROM "ComponentConceptRelation"
WHERE "sourceId" = '11111111-1111-1111-1111-111111111111'
   OR "targetId" = '11111111-1111-1111-1111-111111111111';

DELETE FROM "CoreComponent" WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM "CategoryTaxonomy" WHERE slug = 'timer-ics';
```

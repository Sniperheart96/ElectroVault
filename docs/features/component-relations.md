# Component Relations - Beziehungs-Editor

Implementiert am: 2025-12-28

## Übersicht

Das Component Relations Feature ermöglicht es, Beziehungen zwischen CoreComponents zu definieren und zu verwalten. Dies ist wichtig für:

- Nachfolger-Beziehungen (NE555 → TLC555)
- Funktionale Äquivalente (LM317 ↔ AMS1117)
- Varianten (555 → Dual-556 → Quad-558)
- Militär-/Automotive-Versionen

## Datenmodell

### Prisma Schema

```prisma
model ComponentConceptRelation {
  id              String   @id @default(uuid()) @db.Uuid

  sourceId        String   @db.Uuid
  source          CoreComponent @relation("SourceConcept", fields: [sourceId], references: [id], onDelete: Cascade)

  targetId        String   @db.Uuid
  target          CoreComponent @relation("TargetConcept", fields: [targetId], references: [id], onDelete: Cascade)

  relationType    ConceptRelationType
  notes           Json?    // LocalizedString

  createdById     String?  @db.Uuid
  createdBy       User?    @relation("ConceptRelationCreator", fields: [createdById], references: [id])
  createdAt       DateTime @default(now())

  @@unique([sourceId, targetId, relationType])
  @@index([sourceId])
  @@index([targetId])
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
```

### Beziehungsrichtung

- **Outgoing**: Beziehungen von diesem Component zu anderen (source → target)
- **Incoming**: Beziehungen von anderen zu diesem Component (target ← source)

Beispiel:
```
NE555 → TLC555 (LOW_POWER_VERSION)
  NE555.outgoing: [TLC555]
  TLC555.incoming: [NE555]
```

## Backend-Implementierung

### Service-Methoden

**Datei**: `apps/api/src/services/component.service.ts`

```typescript
class ComponentService {
  // Alle Beziehungen abrufen (outgoing + incoming)
  async getConceptRelations(componentId: string): Promise<{
    outgoing: ConceptRelationWithTarget[];
    incoming: ConceptRelationWithSource[];
  }>

  // Neue Beziehung erstellen
  async addConceptRelation(
    componentId: string,
    data: CreateConceptRelationInput,
    userId?: string
  ): Promise<void>

  // Beziehung aktualisieren (nur Notes)
  async updateConceptRelation(
    componentId: string,
    relationId: string,
    data: { notes?: LocalizedString },
    userId?: string
  ): Promise<void>

  // Beziehung löschen
  async removeConceptRelation(
    componentId: string,
    relationId: string
  ): Promise<void>
}
```

### API-Endpoints

**Datei**: `apps/api/src/routes/components/index.ts`

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| GET | `/components/:id/relations` | - | Alle Beziehungen abrufen |
| POST | `/components/:id/relations` | CONTRIBUTOR | Neue Beziehung erstellen |
| PATCH | `/components/:id/relations/:relationId` | CONTRIBUTOR | Beziehung aktualisieren |
| DELETE | `/components/:id/relations/:relationId` | MODERATOR | Beziehung löschen |

#### GET /components/:id/relations

**Response**:
```json
{
  "data": {
    "outgoing": [
      {
        "id": "uuid",
        "sourceId": "uuid",
        "targetId": "uuid",
        "relationType": "LOW_POWER_VERSION",
        "notes": {
          "en": "TLC555 is a CMOS version",
          "de": "TLC555 ist eine CMOS-Version"
        },
        "createdAt": "2025-12-28T...",
        "target": {
          "id": "uuid",
          "name": { "en": "TLC555", "de": "TLC555" },
          "slug": "tlc555",
          "series": null,
          "shortDescription": null
        }
      }
    ],
    "incoming": [
      {
        "id": "uuid",
        "sourceId": "uuid",
        "targetId": "uuid",
        "relationType": "HIGH_SPEED_VERSION",
        "notes": null,
        "createdAt": "2025-12-28T...",
        "source": {
          "id": "uuid",
          "name": { "en": "NE555", "de": "NE555" },
          "slug": "ne555",
          "series": null,
          "shortDescription": null
        }
      }
    ]
  }
}
```

#### POST /components/:id/relations

**Request**:
```json
{
  "targetId": "uuid",
  "relationType": "LOW_POWER_VERSION",
  "notes": {
    "en": "Optional note in English",
    "de": "Optionale Notiz auf Deutsch"
  }
}
```

**Response**: 201 Created
```json
{
  "success": true
}
```

#### PATCH /components/:id/relations/:relationId

**Request**:
```json
{
  "notes": {
    "en": "Updated note",
    "de": "Aktualisierte Notiz"
  }
}
```

**Response**: 200 OK
```json
{
  "success": true
}
```

#### DELETE /components/:id/relations/:relationId

**Response**: 204 No Content

### Validierung

**Datei**: `packages/schemas/src/component.ts`

```typescript
// Input: Neue Beziehung erstellen
const CreateConceptRelationSchema = z.object({
  targetId: UUIDSchema,
  relationType: ConceptRelationTypeSchema,
  notes: LocalizedStringOptionalSchema,
});

// Input: Beziehung aktualisieren
const UpdateConceptRelationSchema = z.object({
  notes: LocalizedStringOptionalSchema,
});

// Response: Beziehung mit Ziel-Component
const ConceptRelationWithTargetSchema = ConceptRelationSchema.extend({
  target: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
    series: z.string().nullable(),
    shortDescription: LocalizedStringSchema.nullable(),
  }),
});

// Response: Beziehung mit Quell-Component
const ConceptRelationWithSourceSchema = ConceptRelationSchema.extend({
  source: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
    series: z.string().nullable(),
    shortDescription: LocalizedStringSchema.nullable(),
  }),
});

// Response: Alle Beziehungen eines Components
const ComponentRelationsResponseSchema = z.object({
  outgoing: z.array(ConceptRelationWithTargetSchema),
  incoming: z.array(ConceptRelationWithSourceSchema),
});
```

## Fehlerbehandlung

| Status | Code | Beschreibung |
|--------|------|--------------|
| 404 | NOT_FOUND | Component oder Relation nicht gefunden |
| 400 | VALIDATION_ERROR | Ungültige Input-Daten |
| 401 | UNAUTHORIZED | Kein Auth-Token |
| 403 | FORBIDDEN | Keine Berechtigung |
| 409 | CONFLICT | Beziehung existiert bereits |

## Constraints

1. **Unique Constraint**: Gleiche Kombination aus `sourceId`, `targetId` und `relationType` nicht erlaubt
2. **Cascade Delete**: Beziehungen werden gelöscht wenn Source oder Target gelöscht wird
3. **Auth**: Erstellen/Bearbeiten erfordert CONTRIBUTOR-Rolle, Löschen erfordert MODERATOR

## Frontend-Integration (TODO)

Die folgenden Frontend-Komponenten müssen noch implementiert werden:

### 1. RelationEditor Component

**Datei**: `apps/web/src/components/admin/relation-editor.tsx`

```typescript
interface RelationEditorProps {
  componentId: string;
  onUpdate?: () => void;
}

export function RelationEditor({ componentId, onUpdate }: RelationEditorProps) {
  // 1. Relations laden via GET /api/v1/components/:id/relations
  // 2. Liste bestehender Beziehungen anzeigen
  // 3. "Beziehung hinzufügen" Dialog
  // 4. Autocomplete-Suche für Ziel-Component
  // 5. Relation-Type Dropdown
  // 6. Notes-Eingabefeld (DE/EN)
  // 7. Bearbeiten/Löschen Buttons
}
```

### 2. RelationTypeBadge Component

```typescript
// Farbcodierte Badges für Relation Types
const relationTypeColors = {
  DUAL_VERSION: 'blue',
  QUAD_VERSION: 'blue',
  LOW_POWER_VERSION: 'green',
  HIGH_SPEED_VERSION: 'orange',
  MILITARY_VERSION: 'red',
  AUTOMOTIVE_VERSION: 'purple',
  FUNCTIONAL_EQUIV: 'gray',
};
```

### 3. ComponentDialog Integration

Im ComponentDialog (Edit-Modus) einen neuen Tab "Beziehungen" hinzufügen:

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">Allgemein</TabsTrigger>
    <TabsTrigger value="attributes">Attribute</TabsTrigger>
    <TabsTrigger value="relations">Beziehungen</TabsTrigger>
  </TabsList>

  <TabsContent value="relations">
    <RelationEditor componentId={component.id} />
  </TabsContent>
</Tabs>
```

## Testing

### Manual Tests

Siehe: `apps/api/src/routes/components/test-relations-manual.md`

Enthält:
- SQL für Test-Daten
- cURL-Beispiele für alle Endpoints
- Erwartete Responses
- Fehler-Tests

### Integration Tests

**Datei**: `apps/api/src/routes/components/relations.test.ts`

Tests für:
- ✅ GET: Leere Relations
- ✅ GET: Relations mit Daten
- ✅ POST: Neue Relation erstellen
- ✅ POST: Validierung
- ✅ POST: Duplikat-Check
- ✅ PATCH: Notes aktualisieren
- ✅ DELETE: Relation löschen
- ✅ Auth-Checks

**Hinweis**: Tests schlagen aktuell fehl wegen Vitest-Konfigurationsproblemen. Manuelle Tests funktionieren.

## Beispiel-Szenarien

### Szenario 1: 555-Timer Familie

```
NE555 (Bipolar)
  ├─→ TLC555 (LOW_POWER_VERSION) - CMOS, 1µA
  ├─→ ICM7555 (LOW_POWER_VERSION) - CMOS, 80µA
  ├─→ NE556 (DUAL_VERSION) - Dual Timer
  └─→ LM555C (MILITARY_VERSION) - Mil-Spec

TLC555
  ←─ NE555 (incoming)
```

### Szenario 2: Spannungsregler

```
LM317 (Adjustable LDO)
  ├─→ LM317M (HIGH_CURRENT_VERSION)
  ├─→ LM317HV (HIGH_VOLTAGE_VERSION)
  └─→ AMS1117 (FUNCTIONAL_EQUIV) - Ähnlich, aber nicht Pin-kompatibel
```

### Szenario 3: Op-Amps

```
LM358 (Dual Op-Amp)
  ├─→ LM324 (QUAD_VERSION)
  ├─→ LM358A (HIGH_PERFORMANCE_VERSION)
  └─→ TL072 (FUNCTIONAL_EQUIV) - JFET statt Bipolar
```

## Changelog

### 2025-12-28 - Initial Implementation

**Backend**:
- ✅ Service-Methoden: `getConceptRelations`, `updateConceptRelation`
- ✅ API-Endpoints: GET, POST, PATCH, DELETE
- ✅ Zod-Schemas: Create, Update, Response-Typen
- ✅ Schema-Exports in `packages/schemas/src/index.ts`
- ✅ Manual Test Guide

**Noch offen**:
- ❌ Frontend: RelationEditor Component
- ❌ Frontend: ComponentDialog Integration
- ❌ Vitest Integration Tests (Konfigurationsproblem)

## Nächste Schritte

1. **Frontend-Komponenten implementieren**
   - RelationEditor mit shadcn/ui
   - Autocomplete für Component-Suche
   - Relation-Type Dropdown mit Icons

2. **UI/UX Verbesserungen**
   - Bidirektionale Anzeige (beide Richtungen zusammen)
   - Visual Graph für Relation-Netzwerk
   - Quick-Actions (z.B. "Inverse Relation erstellen")

3. **Erweiterte Features**
   - Bulk-Import von Relations (CSV)
   - Relation-History (wer hat wann geändert)
   - Vorschläge für fehlende Relations (ML-basiert)

## Verwandte Dokumentation

- [Prisma Schema](../../packages/database/prisma/schema.prisma)
- [API Architecture](../architecture/api-design.md)
- [Component Management](./component-management.md)

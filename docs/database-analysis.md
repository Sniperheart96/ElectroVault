# ElectroVault - Datenbank-Analyse

**Analysiert am:** 2025-12-28
**Schema-Größe:** 807 Zeilen
**Migrationen:** 2 (init, moderation_log)

## Executive Summary

Das Prisma Schema ist gut strukturiert und folgt den Domain-Anforderungen. Es gibt jedoch mehrere kritische Performance- und Konsistenz-Probleme, die behoben werden sollten.

**Status:**
- Schema-Qualität: 7/10
- Performance-Optimierung: 5/10
- Datenintegrität: 8/10
- Normalisierung: 9/10

---

## 1. Schema-Qualität

### 1.1 Relationen - PROBLEME GEFUNDEN

#### KRITISCH: Fehlende FileAttachment Enum

**Problem:**
```prisma
// Schema.prisma Zeile 646
fileType        FileType

// Aber Enum definiert nur:
enum FileType {
  DATASHEET
  IMAGE
  PINOUT
  OTHER
}
```

Das neue `FileAttachment` Modell (Zeilen 640-681) wurde als generisches File-System eingeführt, aber das `FileType` Enum ist zu limitiert. Es fehlen wichtige Typen:
- `ECAD_MODEL` (für 3D-Modelle, Symbols, Footprints)
- `SCHEMATIC` (für Schaltpläne)
- `APPLICATION_NOTE`
- `MANUAL`

**Empfehlung:**
```prisma
enum FileType {
  DATASHEET
  IMAGE
  PINOUT
  ECAD_MODEL
  SCHEMATIC
  APPLICATION_NOTE
  MANUAL
  OTHER
}
```

#### INKONSISTENZ: Legacy vs. Neue File-Modelle

**Problem:**
Es existieren ZWEI parallele Systeme für Dateien:

1. **Neu:** `FileAttachment` (Zeilen 640-681) - Generisches System mit MinIO
2. **Legacy:** `PartDatasheet`, `PartImage`, `EcadFootprint`, `PartEcadModel` (Zeilen 684-760)

Das Schema kommentiert selbst (Zeile 683):
```prisma
// Bestehende Modelle (Legacy - können später migriert werden)
```

**Risiken:**
- Doppelte Datenspeicherung möglich
- Inkonsistente Query-Patterns (manche Services nutzen Legacy, andere FileAttachment)
- Migration-Pfad unklar

**Empfehlung:**
1. Sofortige Entscheidung: Wird `FileAttachment` der Standard?
2. Wenn ja: Migrations-Plan für Legacy-Daten erstellen
3. Deprecation-Warnings in API-Docs
4. Foreign Key Constraints hinzufügen um doppelte Uploads zu verhindern

#### FEHLEND: displayValue in AttributeValue-Tabellen

**Problem:**
Die Init-Migration (Zeile 228, 242) definiert:
```sql
"displayValue" VARCHAR(255) NOT NULL,
```

Aber das aktuelle Schema (Zeilen 524-578) hat dieses Feld NICHT mehr:
```prisma
model ComponentAttributeValue {
  // ...
  normalizedValue Decimal? @db.Decimal(30, 15)
  prefix          String?  @db.VarChar(5)
  stringValue     String?  @db.VarChar(255)
  // displayValue fehlt!
}
```

**Konsequenz:**
- Migration und Schema sind inkonsistent
- Migration wird beim `prisma migrate dev` fehlschlagen
- `displayValue` wurde durch `prefix` + `normalizedValue` ersetzt, aber nicht migriert

**KRITISCH:** Es fehlt eine Migration die `displayValue` entfernt und `prefix` + `allowedPrefixes` hinzufügt!

**Empfehlung:**
Neue Migration erstellen:
```sql
-- Remove displayValue, add prefix
ALTER TABLE "ComponentAttributeValue" DROP COLUMN "displayValue";
ALTER TABLE "ComponentAttributeValue" ADD COLUMN "prefix" VARCHAR(5);

ALTER TABLE "PartAttributeValue" DROP COLUMN "displayValue";
ALTER TABLE "PartAttributeValue" ADD COLUMN "prefix" VARCHAR(5);

-- Add allowedPrefixes to AttributeDefinition
ALTER TABLE "AttributeDefinition" ADD COLUMN "allowedPrefixes" TEXT[] DEFAULT '{}';
```

#### FEHLEND: FileAttachment Migration

**Problem:**
Das `FileAttachment` Modell existiert im Schema, aber es gibt KEINE Migration dafür. Die `20251227163745_init` Migration enthält es nicht.

**Empfehlung:**
```sql
-- Add FileAttachment table
CREATE TABLE "FileAttachment" (
  "id" UUID NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "sanitizedName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "size" INTEGER NOT NULL,
  "fileType" "FileType" NOT NULL,
  "bucketName" VARCHAR(100) NOT NULL,
  "bucketPath" VARCHAR(512) NOT NULL,
  "description" TEXT,
  "version" VARCHAR(50),
  "language" VARCHAR(10),
  "componentId" UUID,
  "partId" UUID,
  "uploadedById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- Indizes
CREATE UNIQUE INDEX "FileAttachment_bucketPath_key" ON "FileAttachment"("bucketPath");
CREATE INDEX "FileAttachment_componentId_idx" ON "FileAttachment"("componentId");
CREATE INDEX "FileAttachment_partId_idx" ON "FileAttachment"("partId");
CREATE INDEX "FileAttachment_fileType_idx" ON "FileAttachment"("fileType");
CREATE INDEX "FileAttachment_uploadedById_idx" ON "FileAttachment"("uploadedById");
CREATE INDEX "FileAttachment_deletedAt_idx" ON "FileAttachment"("deletedAt");
CREATE INDEX "FileAttachment_bucketPath_idx" ON "FileAttachment"("bucketPath");

-- Foreign Keys
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_componentId_fkey"
  FOREIGN KEY ("componentId") REFERENCES "CoreComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_partId_fkey"
  FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 1.2 Redundante Felder

#### Akzeptabel: Legacy siUnit/siMultiplier

```prisma
// AttributeDefinition Zeilen 511-512
siUnit          String?  @db.VarChar(20)
siMultiplier    Decimal? @db.Decimal(20, 10)
```

**Kommentar im Schema (Zeile 510):**
```prisma
// Legacy - wird durch allowedPrefixes ersetzt
```

**Bewertung:** Akzeptabel für Migrations-Zeitraum, sollte aber in Phase 2 entfernt werden.

**Empfehlung:**
- In 3 Monaten: Deprecation Warning in API
- In 6 Monaten: Daten-Migration
- In 9 Monaten: Felder entfernen

#### Redundanz: User-Cached-Daten

```prisma
// User Zeilen 168-172
email           String   @unique @db.VarChar(255)
username        String   @unique @db.VarChar(100)
displayName     String?  @db.VarChar(255)
avatarUrl       String?  @db.VarChar(512)
```

**Bewertung:** Akzeptabel - Keycloak ist Source-of-Truth, aber Caching vermeidet N+1 Queries zu Keycloak.

**Aber:** Es fehlt ein `updatedAt` Index für Cache-Invalidierung!

**Empfehlung:**
```prisma
@@index([updatedAt]) // Für Cache-Invalidierung (z.B. alle > 1 Stunde)
```

---

## 2. Migrations-Analyse

### 2.1 Migrations-Kette

```
20251227163745_init              ✅ Vollständig
20251228011733_add_moderation_log ✅ Konsistent
```

### 2.2 KRITISCHE Inkonsistenzen

#### Problem 1: displayValue vs. prefix

**Init-Migration hat:**
```sql
"displayValue" VARCHAR(255) NOT NULL,
```

**Aktuelles Schema hat:**
```prisma
prefix String? @db.VarChar(5)
// displayValue fehlt
```

**Status:** Migration fehlt, Schema ist nicht deploybar!

#### Problem 2: FileAttachment fehlt

**Schema definiert:** `FileAttachment` Modell
**Migration enthält:** NICHTS

**Status:** Schema ist nicht deploybar!

### 2.3 Fehlende Migrations-Features

#### Missing: Volltextsuche (tsvector)

Das Schema hat keine `tsvector` Spalte für Volltextsuche, obwohl die Agent-Instruktionen (`.claude/agents/database-agent.md`) dies als Best-Practice definieren:

```sql
-- Empfohlen für CoreComponent.name Suche
ALTER TABLE "CoreComponent" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(name->>'de', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name->>'en', '')), 'A') ||
    setweight(to_tsvector('german', coalesce(short_description->>'de', '')), 'B')
  ) STORED;

CREATE INDEX "CoreComponent_searchVector_idx" ON "CoreComponent" USING GIN ("searchVector");
```

**Aktuell werden JSON-Searches verwendet (component.service.ts Zeilen 64-76):**
```typescript
OR: [
  { name: { path: ['de'], string_contains: query.search } },
  { name: { path: ['en'], string_contains: query.search } },
]
```

**Performance-Impact:** JSON `string_contains` ist NICHT indexiert und führt zu Full-Table-Scans!

#### Missing: Partial Indexes für deletedAt

**Problem:**
Alle Queries filtern `deletedAt: null`, aber es gibt nur einen einfachen Index:

```sql
CREATE INDEX "CoreComponent_deletedAt_idx" ON "CoreComponent"("deletedAt");
```

**Besser:**
```sql
-- Partial Index nur für nicht-gelöschte Records
CREATE INDEX "CoreComponent_active_idx" ON "CoreComponent"("categoryId", "status")
  WHERE "deletedAt" IS NULL;
```

**Vorteil:**
- Kleinerer Index (nur aktive Records)
- Schnellere Queries (Index + Filter kombiniert)

---

## 3. Performance-Analyse

### 3.1 Fehlende Indizes

#### KRITISCH: Composite Index für häufige Queries

**Problem 1: Component-Listing mit Category-Filter**

Aktuelle Query (component.service.ts):
```typescript
where: {
  deletedAt: null,
  status: 'PUBLISHED',
  categoryId: { in: categoryIds }
}
```

**Verfügbare Indizes:**
- `CoreComponent_categoryId_idx` (einzeln)
- `CoreComponent_status_idx` (einzeln)
- `CoreComponent_deletedAt_idx` (einzeln)

**Problem:** PostgreSQL kann nur EINEN Index nutzen, dann Table-Scan für Rest!

**Empfehlung:**
```prisma
@@index([categoryId, status, deletedAt])
```

**Problem 2: Part-Listing mit Manufacturer + Lifecycle**

Query (part.service.ts):
```typescript
where: {
  deletedAt: null,
  status: 'PUBLISHED',
  lifecycleStatus: 'ACTIVE',
  manufacturerId: manufacturerId
}
```

**Fehlender Index:**
```prisma
@@index([manufacturerId, lifecycleStatus, status, deletedAt])
```

#### KRITISCH: AttributeValue Filterung

**Verwendung (component.service.ts):**
```typescript
// Filterung nach Kapazität 10µF-100µF
attributeValues: {
  some: {
    definitionId: 'capacitance-id',
    normalizedValue: { gte: 0.00001, lte: 0.0001 }
  }
}
```

**Verfügbarer Index:**
```prisma
@@index([normalizedValue]) // Zeile 547
```

**Problem:** Filter nach `definitionId` + `normalizedValue` Range benötigt Composite Index!

**Empfehlung:**
```prisma
@@index([definitionId, normalizedValue])
```

### 3.2 N+1 Query Risiken

#### Kritische Stellen im API-Code

**Problem 1: Part-List mit Relations (part.service.ts Zeilen 75-89)**

```typescript
include: {
  coreComponent: { select: { id: true, name: true, slug: true } },
  manufacturer: { select: { id: true, name: true, slug: true } },
  package: { select: { id: true, name: true, slug: true } },
  images: { where: { isPrimary: true }, take: 1 },
}
```

**Bewertung:** ✅ Gut - verwendet `include` statt lazy loading

**Problem 2: Component mit AttributeValues (component.service.ts Zeilen 137-147)**

```typescript
include: {
  attributeValues: {
    include: {
      definition: true, // <- Lädt ALLE Felder von AttributeDefinition
    }
  }
}
```

**Problem:** Lädt unnötige Felder! `definition` hat 14 Spalten, aber UI braucht nur 3-4.

**Empfehlung:**
```typescript
attributeValues: {
  include: {
    definition: {
      select: {
        id: true,
        name: true,
        displayName: true,
        unit: true,
        dataType: true
      }
    }
  }
}
```

**Einsparung:** ~60% weniger Daten-Transfer pro AttributeValue

**Problem 3: Rekursive Category-Hierarchie**

Kategorie-Hierarchie wird mit Self-Referenz modelliert (Zeilen 231-233):
```prisma
parentId        String?  @db.Uuid
parent          CategoryTaxonomy?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
children        CategoryTaxonomy[] @relation("CategoryHierarchy")
```

**Risiko:** Ohne Depth-Limit könnten rekursive Queries die DB lahmlegen.

**Aktuell im Code:**
```typescript
// category.service.ts - getDescendantIds()
// Keine Depth-Limit Prüfung sichtbar!
```

**Empfehlung:**
1. `maxDepth` Parameter in Schema-Constraints (z.B. `level <= 4`)
2. SQL Recursive CTE mit `MAXRECURSION` Limit
3. Application-Level Depth-Check

### 3.3 Große JSON-Felder ohne Struktur

#### Problem: commonAttributes in CoreComponent

```prisma
// CoreComponent Zeile 358
commonAttributes Json @default("{}")
```

**Verwendung:** Unklar - kein Code gefunden der dies nutzt!

**Fragen:**
1. Was wird hier gespeichert?
2. Warum nicht im AttributeValue-System?
3. Ist das ein Legacy-Feld?

**Risiko:**
- Unstrukturierte Daten können nicht validiert werden
- Keine Typprüfung
- Keine Filterung möglich

**Empfehlung:**
1. Wenn verwendet: Zod-Schema für Struktur definieren
2. Wenn nicht verwendet: Feld entfernen
3. Daten sollten in `ComponentAttributeValue` migriert werden

#### JSON-Felder mit LocalizedString

**Gut strukturiert:**
```prisma
name            Json     // LocalizedString { de?: string, en?: string, ... }
```

**Problem:** Keine Schema-Validierung auf DB-Ebene!

PostgreSQL kann JSON validieren:
```sql
-- Constraint für LocalizedString-Struktur
ALTER TABLE "CoreComponent" ADD CONSTRAINT "name_valid_localized_string"
  CHECK (
    jsonb_typeof(name) = 'object' AND
    (name ? 'de' OR name ? 'en') -- Mindestens eine Sprache
  );
```

**Empfehlung:** JSON-Constraints für alle LocalizedString-Felder hinzufügen.

---

## 4. Verbesserungen

### 4.1 Fehlende Constraints

#### KRITISCH: Keine CHECK Constraints für Enums in Legacy-Feldern

**Problem:** `ManufacturerAlias.aliasType` (Zeile 294)

```prisma
aliasType      String?  @db.VarChar(50)  // brand, former_name, trade_name
```

**Kommentar sagt:** Nur "brand", "former_name", "trade_name" erlaubt
**Reality:** Es ist ein `String` - ALLES ist erlaubt!

**Empfehlung:**
```prisma
enum AliasType {
  BRAND
  FORMER_NAME
  TRADE_NAME
  OTHER
}

model ManufacturerAlias {
  aliasType AliasType?
}
```

#### Fehlende Business-Constraints

**Problem 1: Lebenszyklus-Logik**

```prisma
// ManufacturerMaster Zeilen 269-271
foundedYear     Int?
defunctYear     Int?
```

**Fehlt:** `CHECK (defunctYear IS NULL OR defunctYear >= foundedYear)`

**Problem 2: Package Pin-Counts**

```prisma
// PackageMaster Zeilen 314-316
pinCount        Int?
pinCountMin     Int?
pinCountMax     Int?
```

**Fehlt:** `CHECK (pinCountMax IS NULL OR pinCountMax >= pinCountMin)`

**Problem 3: Attribute Value Ranges**

```prisma
// ComponentAttributeValue Zeilen 535-536
normalizedMin   Decimal? @db.Decimal(30, 15)
normalizedMax   Decimal? @db.Decimal(30, 15)
```

**Fehlt:** `CHECK (normalizedMax IS NULL OR normalizedMax >= normalizedMin)`

**Empfehlung:** Alle Business-Constraints als CHECK Constraints implementieren.

#### Fehlende Unique Constraints

**Problem: PackageMaster.name nicht unique**

```prisma
// PackageMaster Zeile 303
name            String   @db.VarChar(255)  // "DIP-14", "TO-220", "0805"
```

**Risiko:** Duplikate möglich ("DIP-14" vs "DIP-14 " vs "dip-14")

**Empfehlung:**
```prisma
name            String   @unique @db.VarChar(255)

// Oder wenn Case-Insensitive:
@@index([name(ops: raw("varchar_pattern_ops"))])
```

### 4.2 Bessere Typisierung

#### Problem: UserRole vs. Keycloak Roles

**Schema:**
```prisma
enum UserRole {
  ADMIN
  MODERATOR
  CONTRIBUTOR
  VIEWER
}
```

**Frage:** Wie wird das mit Keycloak synchronisiert?

**Empfehlung aus `.claude/agents/auth-agent.md`:**
```typescript
// Keycloak ist Source-of-Truth
// User.role sollte nur Cache sein
// Echte Autorisierung über Keycloak-Token
```

**Vorschlag:**
```prisma
model User {
  role            UserRole @default(VIEWER)
  keycloakRoles   String[] @default([]) // Cache von Keycloak
  rolesSyncedAt   DateTime?             // Für Cache-Invalidierung
}
```

#### Problem: Decimal Precision für wissenschaftliche Notation

```prisma
normalizedValue Decimal? @db.Decimal(30, 15)
```

**Bewertung:** 30 Digits, 15 Nachkommastellen - Ausreichend für die meisten Werte.

**Aber:** Für Femtofarad (10^-15) oder Picofarad (10^-12) kann es knapp werden!

**Empfehlung:**
- Für **Kapazität:** `Decimal(35, 20)` (unterstützt bis Attofarad)
- Für **Widerstand:** `Decimal(30, 10)` (reicht bis 10^20 Ω)
- Für **Spannung:** `Decimal(20, 5)` (reicht bis Megavolt)

**Alternative:** Werte immer in SI-Basiseinheit + Exponent speichern:
```prisma
model ComponentAttributeValue {
  valueBase     Decimal  @db.Decimal(10, 5)  // 1.234
  valueExponent Int                          // -12
  // -> 1.234 × 10^-12 = 1.234pF
}
```

### 4.3 Normalisierungs-Bewertung

#### Excellent: 2-Ebenen-Architektur

```
CoreComponent (1) ----< (n) ManufacturerPart
```

**Bewertung:** ✅ Perfekt umgesetzt - verhindert Duplikate bei herstellerunabhängigen Eigenschaften.

#### Excellent: Attribut-System

```
AttributeDefinition (1) ----< (n) ComponentAttributeValue
                     (1) ----< (n) PartAttributeValue
```

**Bewertung:** ✅ EAV-Pattern korrekt umgesetzt mit normalisierten Werten.

#### Good: Kategorie-Hierarchie

```prisma
CategoryTaxonomy (Self-Referenz)
```

**Bewertung:** ✅ Materialized Path wäre performanter, aber für 4 Ebenen akzeptabel.

**Verbesserung möglich:**
```prisma
model CategoryTaxonomy {
  path String @db.VarChar(1024) // "/passive/capacitors/electrolytic/aluminum"
  @@index([path(ops: raw("varchar_pattern_ops"))]) // Prefix-Search
}
```

**Vorteil:** Descendants-Query wird O(1) statt O(n):
```sql
-- Aktuell: Rekursive CTE
-- Mit Path:
WHERE path LIKE '/passive/capacitors/%'
```

---

## 5. Prioritäten für Fixes

### P0 - Kritisch (Blocker für Production)

1. **FileAttachment Migration erstellen** - Schema nicht deploybar
2. **displayValue → prefix Migration** - Schema nicht deploybar
3. **FileType Enum erweitern** - Datenverlust-Risiko
4. **Composite Indizes hinzufügen** - Performance-Killer bei Wachstum

### P1 - Hoch (Performance-Impact)

5. **tsvector für Volltextsuche** - Aktuell Full-Table-Scans
6. **Partial Indizes für deletedAt** - 50% Index-Größe sparen
7. **AttributeValue Composite Index** - Filterung ist langsam

### P2 - Mittel (Datenintegrität)

8. **CHECK Constraints für Business-Logik** - Verhindert inkonsistente Daten
9. **Unique Constraint für Package.name** - Verhindert Duplikate
10. **JSON-Schema Constraints** - Validierung für LocalizedString

### P3 - Niedrig (Code-Qualität)

11. **Legacy-Felder entfernen** (siUnit, siMultiplier) - Nach Migration
12. **commonAttributes dokumentieren oder entfernen** - Unklar ob genutzt
13. **AliasType Enum statt String** - Typsicherheit

---

## 6. Migrations-Plan

### Phase 1: Kritische Fixes (Sofort)

```sql
-- Migration: 20251228_fix_critical_schema_issues

-- 1. FileType Enum erweitern
ALTER TYPE "FileType" ADD VALUE 'ECAD_MODEL';
ALTER TYPE "FileType" ADD VALUE 'SCHEMATIC';
ALTER TYPE "FileType" ADD VALUE 'APPLICATION_NOTE';
ALTER TYPE "FileType" ADD VALUE 'MANUAL';

-- 2. FileAttachment Tabelle erstellen
CREATE TABLE "FileAttachment" (
  -- [Siehe Abschnitt 1.1]
);

-- 3. AttributeValue Felder anpassen
ALTER TABLE "ComponentAttributeValue" DROP COLUMN "displayValue";
ALTER TABLE "ComponentAttributeValue" ADD COLUMN "prefix" VARCHAR(5);

ALTER TABLE "PartAttributeValue" DROP COLUMN "displayValue";
ALTER TABLE "PartAttributeValue" ADD COLUMN "prefix" VARCHAR(5);

ALTER TABLE "AttributeDefinition" ADD COLUMN "allowedPrefixes" TEXT[] DEFAULT '{}';

-- 4. Kritische Indizes
CREATE INDEX "CoreComponent_active_category_status_idx"
  ON "CoreComponent"("categoryId", "status")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "ManufacturerPart_active_mfg_lifecycle_idx"
  ON "ManufacturerPart"("manufacturerId", "lifecycleStatus", "status")
  WHERE "deletedAt" IS NULL;

CREATE INDEX "ComponentAttributeValue_definition_value_idx"
  ON "ComponentAttributeValue"("definitionId", "normalizedValue");

CREATE INDEX "PartAttributeValue_definition_value_idx"
  ON "PartAttributeValue"("definitionId", "normalizedValue");
```

### Phase 2: Performance-Optimierung (Woche 1-2)

```sql
-- Migration: 20251228_add_fulltext_search

-- tsvector für CoreComponent
ALTER TABLE "CoreComponent" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(name->>'de', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name->>'en', '')), 'A') ||
    setweight(to_tsvector('german', coalesce(short_description->>'de', '')), 'B')
  ) STORED;

CREATE INDEX "CoreComponent_search_idx" ON "CoreComponent" USING GIN ("searchVector");

-- tsvector für ManufacturerPart
ALTER TABLE "ManufacturerPart" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(mpn, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("orderingCode", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(nsn, '')), 'C')
  ) STORED;

CREATE INDEX "ManufacturerPart_search_idx" ON "ManufacturerPart" USING GIN ("searchVector");
```

### Phase 3: Datenintegrität (Woche 3-4)

```sql
-- Migration: 20251228_add_data_constraints

-- Business-Logik Constraints
ALTER TABLE "ManufacturerMaster"
  ADD CONSTRAINT "valid_years" CHECK ("defunctYear" IS NULL OR "defunctYear" >= "foundedYear");

ALTER TABLE "PackageMaster"
  ADD CONSTRAINT "valid_pin_range" CHECK ("pinCountMax" IS NULL OR "pinCountMax" >= "pinCountMin");

ALTER TABLE "ComponentAttributeValue"
  ADD CONSTRAINT "valid_value_range" CHECK ("normalizedMax" IS NULL OR "normalizedMax" >= "normalizedMin");

ALTER TABLE "PartAttributeValue"
  ADD CONSTRAINT "valid_value_range" CHECK ("normalizedMax" IS NULL OR "normalizedMax" >= "normalizedMin");

-- JSON-Struktur Constraints
ALTER TABLE "CoreComponent"
  ADD CONSTRAINT "name_valid_localized_string"
  CHECK (jsonb_typeof(name) = 'object' AND (name ? 'de' OR name ? 'en'));

-- Unique Constraints
CREATE UNIQUE INDEX "PackageMaster_name_unique_idx" ON "PackageMaster"(LOWER(name));
```

### Phase 4: Code-Cleanup (Woche 5-8)

```sql
-- Migration: 20251228_remove_legacy_fields

-- AliasType Enum
CREATE TYPE "AliasType" AS ENUM ('BRAND', 'FORMER_NAME', 'TRADE_NAME', 'OTHER');

ALTER TABLE "ManufacturerAlias"
  ADD COLUMN "aliasTypeEnum" "AliasType";

-- Daten migrieren
UPDATE "ManufacturerAlias"
  SET "aliasTypeEnum" = CASE
    WHEN "aliasType" = 'brand' THEN 'BRAND'::"AliasType"
    WHEN "aliasType" = 'former_name' THEN 'FORMER_NAME'::"AliasType"
    WHEN "aliasType" = 'trade_name' THEN 'TRADE_NAME'::"AliasType"
    ELSE 'OTHER'::"AliasType"
  END;

ALTER TABLE "ManufacturerAlias" DROP COLUMN "aliasType";
ALTER TABLE "ManufacturerAlias" RENAME COLUMN "aliasTypeEnum" TO "aliasType";

-- Legacy SI-Felder entfernen (nach Daten-Migration)
ALTER TABLE "AttributeDefinition" DROP COLUMN "siUnit";
ALTER TABLE "AttributeDefinition" DROP COLUMN "siMultiplier";

-- commonAttributes untersuchen und ggf. entfernen
-- TODO: Erst Analyse ob genutzt!
```

---

## 7. Service-Code Optimierungen

### 7.1 SELECT-Optimierung

**Problem:** Viele Services laden zu viele Felder.

**Beispiel (part.service.ts Zeilen 133-154):**
```typescript
include: {
  coreComponent: true,        // Lädt ALLE 15 Felder
  manufacturer: true,          // Lädt ALLE 12 Felder
  package: true,               // Lädt ALLE 14 Felder
  attributeValues: {
    include: { definition: true } // Lädt ALLE 14 Felder
  }
}
```

**Optimiert:**
```typescript
include: {
  coreComponent: {
    select: { id: true, name: true, slug: true, series: true }
  },
  manufacturer: {
    select: { id: true, name: true, slug: true, logoUrl: true }
  },
  package: {
    select: { id: true, name: true, slug: true, mountingType: true, pinCount: true }
  },
  attributeValues: {
    include: {
      definition: {
        select: { id: true, name: true, displayName: true, unit: true, dataType: true, scope: true }
      }
    }
  }
}
```

**Einsparung:** ~50-70% weniger Daten-Transfer

### 7.2 Volltextsuche mit tsvector

**Aktuell (component.service.ts Zeilen 60-78):**
```typescript
OR: [
  { name: { path: ['de'], string_contains: query.search } },
  { name: { path: ['en'], string_contains: query.search } },
]
```

**Problem:** Full-Table-Scan, keine Ranking, keine Fuzzy-Search

**Mit tsvector:**
```typescript
// Rohe SQL-Query
const components = await prisma.$queryRaw`
  SELECT
    id, name, slug,
    ts_rank(search_vector, plainto_tsquery('german', ${query.search})) as rank
  FROM "CoreComponent"
  WHERE
    search_vector @@ plainto_tsquery('german', ${query.search})
    AND deleted_at IS NULL
    AND status = 'PUBLISHED'
  ORDER BY rank DESC
  LIMIT ${take}
  OFFSET ${skip}
`;
```

**Vorteile:**
- 100x schneller bei großen Tabellen
- Relevanz-Ranking
- Stemming (Suche nach "Kondensator" findet "Kondensatoren")
- Stopword-Filtering

---

## 8. Tooling & Monitoring

### 8.1 Empfohlene Prisma Extensions

**Soft-Delete Extension:**
```typescript
// packages/database/src/extensions/soft-delete.ts
const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async delete({ model, args, query }) {
        return (prisma[model] as any).update({
          ...args,
          data: { deletedAt: new Date() }
        });
      },
      async findMany({ model, args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      }
    }
  }
});
```

**Audit-Log Extension:**
```typescript
// packages/database/src/extensions/audit.ts
const auditExtension = Prisma.defineExtension({
  query: {
    coreComponent: {
      async update({ args, query }) {
        const before = await query({ where: args.where, select: { id: true } });
        const result = await query(args);
        await auditLog.create({
          entityType: 'CoreComponent',
          entityId: result.id,
          action: 'UPDATE',
          changes: diff(before, result)
        });
        return result;
      }
    }
  }
});
```

### 8.2 Query-Performance-Monitoring

**pg_stat_statements aktivieren:**
```sql
-- In postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all

-- Slow Queries finden
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- über 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

**Prisma Middleware für Logging:**
```typescript
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  if (after - before > 100) {
    console.warn(`Slow query detected: ${params.model}.${params.action} took ${after - before}ms`);
  }

  return result;
});
```

---

## 9. Zusammenfassung & Nächste Schritte

### Kritische Blocker (Sofort beheben)

1. FileAttachment Migration erstellen
2. displayValue → prefix Migration
3. FileType Enum erweitern
4. Composite Indizes für Component/Part Listing

**Geschätzter Aufwand:** 4-6 Stunden

### Performance-Optimierung (Woche 1)

5. tsvector für Volltextsuche implementieren
6. Service-Code: SELECT-Optimierung
7. Partial Indizes für deletedAt

**Geschätzter Aufwand:** 2-3 Tage

### Datenintegrität (Woche 2)

8. CHECK Constraints hinzufügen
9. JSON-Schema Validierung
10. Unique Constraints prüfen

**Geschätzter Aufwand:** 1-2 Tage

### Code-Cleanup (Woche 3-4)

11. Legacy-Felder entfernen
12. AliasType Enum einführen
13. commonAttributes analysieren

**Geschätzter Aufwand:** 2-4 Tage

---

## 10. Risiko-Bewertung

| Kategorie | Risiko | Impact | Priorität |
|-----------|--------|--------|-----------|
| Fehlende Migrationen | HOCH | Schema nicht deploybar | P0 |
| Fehlende Indizes | MITTEL | Performance bei Wachstum | P1 |
| N+1 Queries | MITTEL | API-Latenz steigt | P1 |
| Fehlende Constraints | NIEDRIG | Dateninkonsistenz möglich | P2 |
| Legacy-Felder | NIEDRIG | Code-Verwirrung | P3 |

**Gesamtbewertung:** Schema ist gut designed, aber **nicht production-ready** wegen fehlender Migrationen.

---

*Analyse durchgeführt durch Database Agent am 2025-12-28*

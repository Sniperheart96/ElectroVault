# Datenbank-Schema - ElectroVault

## Übersicht

Das ElectroVault-Datenbank-Schema ist in PostgreSQL implementiert und verwendet Prisma als ORM. Die Architektur folgt dem **2-Ebenen-Bauteil-Modell** mit umfassender Unterstützung für Community-Features, Audit-Logging und Soft-Delete.

### Technische Grundlagen

| Eigenschaft | Wert |
|-------------|------|
| Datenbank | PostgreSQL 18 |
| ORM | Prisma |
| ID-Typ | UUID (v4) |
| Lokalisierung | JSON (LocalizedString) |
| Soft-Delete | `deletedAt` Timestamp |
| Audit | Vollständiges Logging aller Änderungen |

### ER-Diagramm (Überblick)

```
┌─────────────────────────────────────────────────────────────────┐
│                         STAMMDATEN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CategoryTaxonomy ──┐                                           │
│  (4-Ebenen)         │                                           │
│                     │                                           │
│  ManufacturerMaster ┼──┐                                        │
│  ├─ ManufacturerAlias                                          │
│  └─ (Self-Join für Übernahmen)                                 │
│                     │                                           │
│  PackageMaster      │                                           │
│                     │                                           │
└─────────────────────┼───────────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────────┐
│               2-EBENEN-BAUTEIL-ARCHITEKTUR                      │
├─────────────────────┼───────────────────────────────────────────┤
│                     │                                           │
│  CoreComponent ◄────┤ (1:n)                                     │
│    │               │                                           │
│    ├─ ComponentAttributeValue                                  │
│    ├─ ComponentConceptRelation (Konzept-Beziehungen)           │
│    ├─ PinMapping                                               │
│    │                                                           │
│    └──► ManufacturerPart ◄─────┤                               │
│           │                                                     │
│           ├─ PartAttributeValue                                │
│           ├─ HazardousMaterial                                 │
│           ├─ PartRelationship (Part-Beziehungen)               │
│           ├─ PartDatasheet (Legacy)                            │
│           ├─ PartImage (Legacy)                                │
│           └─ PartEcadModel (Legacy)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────────┐
│                 DATEI-VERWALTUNG                                │
├─────────────────────┼───────────────────────────────────────────┤
│                     │                                           │
│  FileAttachment ◄───┤ (verknüpft mit Component/Part/Package)    │
│  (MinIO S3-Bucket)                                              │
│                                                                 │
│  Legacy-Modelle:                                                │
│  ├─ PartDatasheet                                               │
│  ├─ PartImage                                                   │
│  ├─ EcadFootprint                                               │
│  └─ PartEcadModel                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────────┐
│              BENUTZER & AUDIT                                   │
├─────────────────────┼───────────────────────────────────────────┤
│                     │                                           │
│  User ◄─────────────┤                                           │
│    │                                                            │
│    ├─ AuditLog (Alle Änderungen)                                │
│    └─ ModerationLog (Freigabe-Prozess)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ATTRIBUT-SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AttributeDefinition ──┐                                        │
│    │                   │                                        │
│    ├─ ComponentAttributeValue (typische Werte)                  │
│    └─ PartAttributeValue (garantierte Werte)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core-Models

### CoreComponent (Logisches Bauteil)

Das logische Bauteil repräsentiert eine **herstellerunabhängige Bauteil-Konzeption**.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `name` | JSON | Lokalisierter Name (z.B. `{"de": "555 Timer", "en": "555 Timer"}`) |
| `slug` | String(255) | URL-freundlicher Identifier (unique) |
| `series` | String(255) | Bauteil-Serie (optional) |
| `categoryId` | UUID | Referenz zu CategoryTaxonomy |
| `shortDescription` | JSON | Kurzbeschreibung lokalisiert |
| `fullDescription` | JSON | Vollständige Beschreibung lokalisiert |
| `commonAttributes` | JSON | Typische Eigenschaften (frei definierbar) |
| `status` | ComponentStatus | DRAFT, PENDING, PUBLISHED, ARCHIVED |
| `packageId` | UUID | Referenz zu PackageMaster (optional) |
| `createdById` | UUID | Ersteller |
| `lastEditedById` | UUID | Letzter Editor |
| `deletedAt` | DateTime | Soft-Delete Timestamp |
| `deletedById` | UUID | Benutzer, der gelöscht hat |

**Beziehungen:**
- `1:n` zu `ManufacturerPart` (ein logisches Bauteil → viele Hersteller-Produkte)
- `1:n` zu `ComponentAttributeValue` (typische Attributwerte)
- `1:n` zu `ComponentConceptRelation` (Konzept-Beziehungen zu anderen CoreComponents)
- `1:n` zu `PinMapping` (Pin-Zuordnungen)
- `1:n` zu `FileAttachment` (Dateien auf Component-Ebene)
- `n:1` zu `PackageMaster` (Gehäuseform)

**Indizes:**
- `categoryId`, `status`, `deletedAt`, `packageId`, `slug` (unique)

---

### ManufacturerPart (Konkretes Produkt)

Das konkrete Produkt eines Herstellers.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `coreComponentId` | UUID | Referenz zu CoreComponent |
| `manufacturerId` | UUID | Referenz zu ManufacturerMaster |
| `mpn` | String(255) | Manufacturer Part Number |
| `orderingCode` | String(255) | Bestellnummer (optional) |
| `weightGrams` | Decimal(10,4) | Gewicht in Gramm |
| `dateCodeFormat` | String(50) | Format des Datumscodes (z.B. "YYWW") |
| `introductionYear` | Int | Einführungsjahr |
| `discontinuedYear` | Int | Jahr der Einstellung |
| `rohsCompliant` | Boolean | RoHS-konform |
| `reachCompliant` | Boolean | REACH-konform |
| `imageUrl` | String(512) | Vorschaubild (MinIO-URL) |
| `nsn` | String(13) | NATO Stock Number |
| `milSpec` | String(100) | Militär-Spezifikation (z.B. "MIL-STD-883") |
| `status` | PartStatus | DRAFT, PENDING, PUBLISHED, ARCHIVED |
| `lifecycleStatus` | LifecycleStatus | ACTIVE, NRND, EOL, OBSOLETE |
| `createdById` | UUID | Ersteller |
| `lastEditedById` | UUID | Letzter Editor |
| `deletedAt` | DateTime | Soft-Delete Timestamp |
| `deletedById` | UUID | Benutzer, der gelöscht hat |

**Beziehungen:**
- `n:1` zu `CoreComponent`
- `n:1` zu `ManufacturerMaster`
- `1:n` zu `HazardousMaterial` (Gefahrstoffe)
- `1:n` zu `PartDatasheet` (Datenblätter)
- `1:n` zu `PartImage` (Bilder)
- `1:n` zu `PartEcadModel` (ECAD-Modelle)
- `1:n` zu `PartAttributeValue` (garantierte Attributwerte)
- `1:n` zu `PartRelationship` (Beziehungen zu anderen Parts)
- `1:n` zu `FileAttachment` (Dateien auf Part-Ebene)

**Indizes:**
- `mpn`, `coreComponentId`, `manufacturerId`, `nsn`, `status`, `lifecycleStatus`, `deletedAt`, `orderingCode`
- **Unique Constraint:** `(manufacturerId, mpn)` - Ein Hersteller kann dieselbe MPN nicht mehrfach haben

---

## Stammdaten-Models

### CategoryTaxonomy (Kategorie-Hierarchie)

4-stufige Hierarchie: **Domain → Family → Type → Subtype**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `name` | JSON | Lokalisierter Name |
| `slug` | String(255) | URL-freundlicher Identifier (unique) |
| `level` | Int | Ebene (1=Domain, 2=Family, 3=Type, 4=Subtype) |
| `parentId` | UUID | Referenz zur übergeordneten Kategorie (nullable) |
| `description` | JSON | Lokalisierte Beschreibung |
| `levelLabel` | JSON | Lokalisierte Bezeichnung für Unterkategorien (z.B. "Typ", "Familie") |
| `iconUrl` | String(512) | MinIO-URL für Icon |
| `sortOrder` | Int | Sortierung (Standard: 0) |
| `isActive` | Boolean | Aktiv/Inaktiv |

**Beispiel-Hierarchie:**
```
Level 1 (Domain): Passive Components
  Level 2 (Family): Capacitors
    Level 3 (Type): Electrolytic
      Level 4 (Subtype): Aluminum Electrolytic
      Level 4 (Subtype): Tantalum Electrolytic
```

**Beziehungen:**
- Self-Join: `parent` / `children`
- `1:n` zu `CoreComponent`
- `1:n` zu `AttributeDefinition`

**Indizes:**
- `parentId`, `level`, `slug` (unique)

---

### ManufacturerMaster (Hersteller)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `name` | String(255) | Firmenname |
| `slug` | String(255) | URL-freundlicher Identifier (unique) |
| `cageCode` | String(5) | NATO CAGE Code |
| `countryCode` | String(2) | ISO 3166-1 alpha-2 Ländercode |
| `website` | String(512) | Webseite |
| `logoUrl` | String(512) | Logo (MinIO-URL) |
| `acquiredById` | UUID | Referenz zu übernehmender Firma (Self-Join) |
| `acquisitionDate` | DateTime | Datum der Übernahme |
| `status` | ManufacturerStatus | ACTIVE, ACQUIRED, DEFUNCT |
| `foundedYear` | Int | Gründungsjahr |
| `defunctYear` | Int | Jahr der Auflösung |
| `description` | JSON | Lokalisierte Beschreibung |
| `createdById` | UUID | Ersteller |

**Beziehungen:**
- Self-Join: `acquiredBy` / `acquisitions` (Firmenübernahmen)
- `1:n` zu `ManufacturerAlias` (alternative Namen)
- `1:n` zu `ManufacturerPart`

**Indizes:**
- `cageCode`, `slug` (unique)

---

### ManufacturerAlias (Alternative Herstellernamen)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `manufacturerId` | UUID | Referenz zu ManufacturerMaster |
| `aliasName` | String(255) | Alternativer Name |
| `aliasType` | String(50) | Typ: "brand", "former_name", "trade_name" |

**Unique Constraint:** `(manufacturerId, aliasName)`

**Indizes:**
- `aliasName`

---

### PackageMaster (Gehäuseformen)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `name` | String(255) | Name (z.B. "DIP-14", "SOIC-8", "0805") |
| `slug` | String(255) | URL-freundlicher Identifier (unique) |
| `lengthMm` | Decimal(10,4) | Länge in mm |
| `widthMm` | Decimal(10,4) | Breite in mm |
| `heightMm` | Decimal(10,4) | Höhe in mm |
| `pitchMm` | Decimal(10,4) | Pin-Abstand in mm |
| `mountingType` | MountingType | THT, SMD, RADIAL, AXIAL, CHASSIS, OTHER |
| `pinCount` | Int | Anzahl Pins (exakt) |
| `pinCountMin` | Int | Minimale Pin-Anzahl (bei Varianten) |
| `pinCountMax` | Int | Maximale Pin-Anzahl (bei Varianten) |
| `jedecStandard` | String(100) | JEDEC-Standard-Bezeichnung |
| `eiaStandard` | String(100) | EIA-Standard-Bezeichnung |
| `drawingUrl` | String(512) | URL zum technischen Drawing |
| `description` | String | Beschreibung |

**Beziehungen:**
- `1:n` zu `CoreComponent`
- `1:n` zu `EcadFootprint`
- `1:n` zu `FileAttachment`

**Indizes:**
- `mountingType`, `slug` (unique)

---

## User-Models

### User (Benutzer)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `externalId` | String(255) | Keycloak Subject ID (unique) |
| `email` | String(255) | E-Mail (unique, gecacht) |
| `username` | String(100) | Benutzername (unique, gecacht) |
| `displayName` | String(255) | Anzeigename |
| `avatarUrl` | String(512) | Avatar-URL |
| `role` | UserRole | ADMIN, MODERATOR, CONTRIBUTOR, VIEWER |
| `bio` | Text | Biografie |
| `location` | String(255) | Standort |
| `website` | String(512) | Webseite |
| `preferences` | JSON | Benutzer-Einstellungen |
| `isActive` | Boolean | Aktiv/Gesperrt |
| `lastLoginAt` | DateTime | Letzter Login |

**Beziehungen:**
- `1:n` zu allen Entitäten mit `createdById`, `lastEditedById`, `deletedById`
- `1:n` zu `AuditLog` (alle Aktionen)
- `1:n` zu `ModerationLog` (Moderations-Aktionen)
- `1:n` zu `FileAttachment` (hochgeladene Dateien)

**Indizes:**
- `externalId` (unique), `email` (unique), `username` (unique)

---

### AuditLog (Änderungs-Historie)

Jede Mutation wird protokolliert.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `userId` | UUID | Benutzer (nullable, falls System-Aktion) |
| `action` | AuditAction | CREATE, UPDATE, DELETE, RESTORE, MERGE, APPROVE, REJECT |
| `entityType` | String(100) | Typ der Entität (z.B. "CoreComponent", "ManufacturerPart") |
| `entityId` | UUID | ID der betroffenen Entität |
| `changes` | JSON | JSON-Diff der Änderungen (optional) |
| `ipAddress` | String(45) | IPv4 oder IPv6 |
| `userAgent` | String(512) | Browser User-Agent |
| `createdAt` | DateTime | Zeitstempel |

**Indizes:**
- `userId`, `(entityType, entityId)`, `createdAt`

---

### ModerationLog (Moderations-Historie)

Spezifische Protokollierung von Freigabe-Prozessen.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `entityType` | String(50) | COMPONENT, PART |
| `entityId` | UUID | ID der Entität |
| `action` | String(50) | APPROVED, REJECTED, SUBMITTED |
| `previousStatus` | String(50) | Status vorher |
| `newStatus` | String(50) | Status nachher |
| `comment` | Text | Kommentar des Moderators |
| `moderatorId` | UUID | Moderator |
| `createdAt` | DateTime | Zeitstempel |

**Indizes:**
- `(entityType, entityId)`, `moderatorId`, `createdAt`

---

## File-Models

### FileAttachment (Generisches Datei-System)

Neues, universelles System für Dateianhänge (MinIO S3-Bucket).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `originalName` | String(255) | Ursprünglicher Dateiname |
| `sanitizedName` | String(255) | Bereinigter Dateiname |
| `mimeType` | String(100) | MIME-Type |
| `size` | Int | Dateigröße in Bytes |
| `fileType` | FileType | DATASHEET, IMAGE, PINOUT, MODEL_3D, OTHER |
| `bucketName` | String(100) | MinIO Bucket-Name |
| `bucketPath` | String(512) | Voller Pfad im Bucket (unique) |
| `description` | Text | Beschreibung |
| `languages` | String[] | Array von Sprachcodes für Mehrfachauswahl (z.B. ["de", "en"]) |
| `componentId` | UUID | Verknüpfung zu CoreComponent (optional) |
| `partId` | UUID | Verknüpfung zu ManufacturerPart (optional) |
| `packageId` | UUID | Verknüpfung zu PackageMaster (optional) |
| `uploadedById` | UUID | Uploader |
| `deletedAt` | DateTime | Soft-Delete Timestamp |

**Beziehungen:**
- `n:1` zu `CoreComponent` (optional)
- `n:1` zu `ManufacturerPart` (optional)
- `n:1` zu `PackageMaster` (optional)
- `n:1` zu `User` (Uploader)

**Indizes:**
- `componentId`, `partId`, `packageId`, `fileType`, `uploadedById`, `deletedAt`, `bucketPath` (unique)

---

### Legacy File-Modelle

Die folgenden Modelle existieren noch, werden aber langfristig durch `FileAttachment` ersetzt:

#### PartDatasheet

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `partId` | UUID | Referenz zu ManufacturerPart |
| `url` | String(512) | Datenblatt-URL |
| `fileName` | String(255) | Dateiname |
| `fileSize` | Int | Größe in Bytes |
| `mimeType` | String(100) | MIME-Type |
| `version` | String(50) | Datenblatt-Version |
| `language` | String(10) | Sprache (z.B. "en", "de") |
| `publishDate` | DateTime | Veröffentlichungsdatum |
| `isPrimary` | Boolean | Primäres Datenblatt |
| `createdById` | UUID | Uploader |

---

#### PartImage

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `partId` | UUID | Referenz zu ManufacturerPart |
| `url` | String(512) | Bild-URL |
| `thumbnailUrl` | String(512) | Thumbnail-URL |
| `altText` | String(255) | Alt-Text |
| `imageType` | ImageType | PHOTO, DIAGRAM, PINOUT, APPLICATION, OTHER |
| `sortOrder` | Int | Sortierung |
| `isPrimary` | Boolean | Primäres Bild |
| `createdById` | UUID | Uploader |

---

#### EcadFootprint

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `packageId` | UUID | Referenz zu PackageMaster |
| `name` | String(255) | Name |
| `ecadFormat` | EcadFormat | KICAD, EAGLE, ALTIUM, ORCAD, STEP, OTHER |
| `fileUrl` | String(512) | Datei-URL |
| `ipcName` | String(255) | IPC-Name (standardisiert) |
| `createdById` | UUID | Uploader |

---

#### PartEcadModel

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `partId` | UUID | Referenz zu ManufacturerPart |
| `modelType` | EcadModelType | SYMBOL, FOOTPRINT, MODEL_3D |
| `ecadFormat` | EcadFormat | KICAD, EAGLE, ALTIUM, ORCAD, STEP, OTHER |
| `fileUrl` | String(512) | Datei-URL |
| `createdById` | UUID | Uploader |

---

## Attribut-System

### AttributeDefinition (Attribut-Definition)

Definiert verfügbare Attribute pro Kategorie.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `categoryId` | UUID | Referenz zu CategoryTaxonomy |
| `name` | String(100) | Technischer Name (z.B. "capacitance") |
| `displayName` | JSON | Lokalisierter Anzeigename |
| `unit` | String(50) | Basiseinheit (z.B. "F", "Ω", "V") |
| `dataType` | AttributeDataType | DECIMAL, INTEGER, STRING, BOOLEAN, RANGE |
| `scope` | AttributeScope | COMPONENT, PART, BOTH |
| `isFilterable` | Boolean | In Suche filterbar |
| `isRequired` | Boolean | Pflichtfeld |
| `isLabel` | Boolean | Für dynamische Bauteilbezeichnung |
| `allowedPrefixes` | String[] | SI-Präfixe (z.B. ["p", "n", "µ", "m", "", "k", "M"]) |
| `siUnit` | String(20) | SI-Einheit (Legacy) |
| `siMultiplier` | Decimal(20,10) | SI-Multiplikator (Legacy) |
| `sortOrder` | Int | Sortierung |

**Scope-Bedeutung:**
- **COMPONENT** - Nur auf CoreComponent-Ebene (z.B. Pinanzahl)
- **PART** - Nur auf ManufacturerPart-Ebene (z.B. Toleranz, ESR)
- **BOTH** - Typisch auf Component, garantiert auf Part (z.B. Kapazität)

**Beziehungen:**
- `n:1` zu `CategoryTaxonomy`
- `1:n` zu `ComponentAttributeValue`
- `1:n` zu `PartAttributeValue`

**Indizes:**
- `categoryId`, `scope`
- **Unique Constraint:** `(categoryId, name)`

---

### ComponentAttributeValue (Typischer Attributwert)

Attributwert auf **CoreComponent-Ebene** (typisch, nicht garantiert).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `componentId` | UUID | Referenz zu CoreComponent |
| `definitionId` | UUID | Referenz zu AttributeDefinition |
| `normalizedValue` | Decimal(30,15) | Normalisierter Wert (SI-Basiseinheit) |
| `normalizedMin` | Decimal(30,15) | Min-Wert (bei RANGE-Typ) |
| `normalizedMax` | Decimal(30,15) | Max-Wert (bei RANGE-Typ) |
| `prefix` | String(5) | SI-Präfix für Anzeige (z.B. "µ", "k", "M") |
| `stringValue` | String(255) | Für STRING-Typ |

**Beispiel:**
- Kapazität: `normalizedValue = 0.000001` (1µF in SI-Basis), `prefix = "µ"` (Anzeige: "1 µF")

**Unique Constraint:** `(componentId, definitionId)`

**Indizes:**
- `componentId`, `definitionId`, `normalizedValue`

---

### PartAttributeValue (Garantierter Attributwert)

Attributwert auf **ManufacturerPart-Ebene** (garantiert vom Hersteller).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `partId` | UUID | Referenz zu ManufacturerPart |
| `definitionId` | UUID | Referenz zu AttributeDefinition |
| `normalizedValue` | Decimal(30,15) | Normalisierter Wert (SI-Basiseinheit) |
| `normalizedMin` | Decimal(30,15) | Min-Wert (bei RANGE-Typ) |
| `normalizedMax` | Decimal(30,15) | Max-Wert (bei RANGE-Typ) |
| `prefix` | String(5) | SI-Präfix für Anzeige |
| `stringValue` | String(255) | Für STRING-Typ |
| `isDeviation` | Boolean | Markiert wenn Part-Wert von Component-Wert abweicht |

**Unique Constraint:** `(partId, definitionId)`

**Indizes:**
- `partId`, `definitionId`, `normalizedValue`, `stringValue`

---

## Details & Beziehungen

### HazardousMaterial (Gefahrstoffe)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `partId` | UUID | Referenz zu ManufacturerPart |
| `materialType` | HazardousMaterialType | PCB_CAPACITOR, ASBESTOS, MERCURY, RADIOACTIVE, LEAD, CADMIUM, BERYLLIUM, OTHER |
| `details` | JSON | Lokalisierte Details |

**Unique Constraint:** `(partId, materialType)`

---

### PartRelationship (Beziehungen zwischen Parts)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `sourceId` | UUID | Quell-Part |
| `targetId` | UUID | Ziel-Part |
| `relationshipType` | RelationshipType | SUCCESSOR, PREDECESSOR, ALTERNATIVE, FUNCTIONAL_EQUIV, VARIANT, SECOND_SOURCE, COUNTERFEIT_RISK |
| `confidence` | Int | Konfidenz (0-100, Standard: 100) |
| `notes` | JSON | Lokalisierte Notizen |
| `createdById` | UUID | Ersteller |

**Unique Constraint:** `(sourceId, targetId, relationshipType)`

**Indizes:**
- `sourceId`, `targetId`

---

### ComponentConceptRelation (Konzept-Beziehungen)

Beziehungen zwischen **CoreComponents** (logische Bauteile).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `sourceId` | UUID | Quell-Component |
| `targetId` | UUID | Ziel-Component |
| `relationType` | ConceptRelationType | DUAL_VERSION, QUAD_VERSION, LOW_POWER_VERSION, HIGH_SPEED_VERSION, MILITARY_VERSION, AUTOMOTIVE_VERSION, FUNCTIONAL_EQUIV |
| `notes` | JSON | Lokalisierte Notizen |
| `createdById` | UUID | Ersteller |

**Beispiel:**
- 556 ist DUAL_VERSION von 555
- LM324 ist QUAD_VERSION von LM358
- ICM7555 ist LOW_POWER_VERSION von NE555

**Unique Constraint:** `(sourceId, targetId, relationType)`

**Indizes:**
- `sourceId`, `targetId`

---

### PinMapping (Pin-Zuordnung)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `componentId` | UUID | Referenz zu CoreComponent |
| `pinNumber` | String(20) | Pin-Nummer (z.B. "1", "A1", "VCC") |
| `pinName` | String(100) | Pin-Name (z.B. "VCC", "GND", "OUT") |
| `pinFunction` | JSON | Lokalisierte Funktionsbeschreibung |
| `pinType` | PinType | POWER, GROUND, INPUT, OUTPUT, BIDIRECTIONAL, NC, ANALOG, DIGITAL, CLOCK, OTHER |
| `maxVoltage` | Decimal(10,4) | Max. Spannung in Volt |
| `maxCurrent` | Decimal(10,4) | Max. Strom in Ampere |

**Unique Constraint:** `(componentId, pinNumber)`

**Indizes:**
- `componentId`

---

## Enums

### UserRole

| Wert | Beschreibung |
|------|--------------|
| `ADMIN` | Volle Rechte (Benutzerverwaltung, System-Konfiguration) |
| `MODERATOR` | Kann Inhalte freigeben/ablehnen |
| `CONTRIBUTOR` | Kann Inhalte erstellen/bearbeiten |
| `VIEWER` | Nur lesen |

---

### ComponentStatus / PartStatus

| Wert | Beschreibung |
|------|--------------|
| `DRAFT` | In Bearbeitung (nicht öffentlich) |
| `PENDING` | Wartet auf Freigabe durch Moderator |
| `PUBLISHED` | Veröffentlicht und sichtbar |
| `ARCHIVED` | Archiviert (nicht mehr aktiv) |

---

### LifecycleStatus

| Wert | Beschreibung |
|------|--------------|
| `ACTIVE` | In Produktion, verfügbar |
| `NRND` | Not Recommended for New Designs |
| `EOL` | End of Life angekündigt |
| `OBSOLETE` | Nicht mehr erhältlich |

---

### ManufacturerStatus

| Wert | Beschreibung |
|------|--------------|
| `ACTIVE` | Aktiv und produzierend |
| `ACQUIRED` | Von anderem Unternehmen übernommen |
| `DEFUNCT` | Nicht mehr existent |

---

### MountingType

| Wert | Beschreibung |
|------|--------------|
| `THT` | Through-Hole Technology (durchsteckmontiert) |
| `SMD` | Surface-Mount Device (oberflächenmontiert) |
| `RADIAL` | Radial (z.B. Elektrolytkondensatoren) |
| `AXIAL` | Axial (z.B. Widerstände) |
| `CHASSIS` | Gehäusemontage (z.B. Schraubmontage) |
| `OTHER` | Sonstige |

---

### AttributeDataType

| Wert | Beschreibung |
|------|--------------|
| `DECIMAL` | Dezimalzahl |
| `INTEGER` | Ganzzahl |
| `STRING` | Text |
| `BOOLEAN` | Ja/Nein |
| `RANGE` | Bereich (min-max) |

---

### AttributeScope

| Wert | Bedeutung |
|------|-----------|
| `COMPONENT` | Nur auf CoreComponent-Ebene (z.B. Pinanzahl) |
| `PART` | Nur auf ManufacturerPart-Ebene (z.B. Toleranz, ESR) |
| `BOTH` | Typisch auf Component, garantiert auf Part (z.B. Kapazität) |

---

### RelationshipType (Part-Beziehungen)

| Wert | Beschreibung |
|------|--------------|
| `SUCCESSOR` | Neuere Version / Nachfolger |
| `PREDECESSOR` | Ältere Version / Vorgänger |
| `ALTERNATIVE` | Anderer Hersteller, pin-kompatibel |
| `FUNCTIONAL_EQUIV` | Gleiche Funktion, andere Specs |
| `VARIANT` | Gleiche Serie, andere Spezifikationen |
| `SECOND_SOURCE` | Lizenzierte Kopie |
| `COUNTERFEIT_RISK` | Bekanntes Fälschungsrisiko |

---

### ConceptRelationType (Component-Beziehungen)

| Wert | Beschreibung |
|------|--------------|
| `DUAL_VERSION` | Dual-Version (z.B. 556 ist Dual-555) |
| `QUAD_VERSION` | Quad-Version (z.B. LM324 ist Quad-LM358) |
| `LOW_POWER_VERSION` | Low-Power Variante (z.B. ICM7555 ist CMOS-555) |
| `HIGH_SPEED_VERSION` | High-Speed Variante |
| `MILITARY_VERSION` | Militär-Qualifizierung |
| `AUTOMOTIVE_VERSION` | AEC-Q qualifiziert |
| `FUNCTIONAL_EQUIV` | Gleiche Funktion, anderer Aufbau |

---

### HazardousMaterialType

| Wert | Beschreibung |
|------|--------------|
| `PCB_CAPACITOR` | Polychlorierte Biphenyle (PCBs) |
| `ASBESTOS` | Asbest |
| `MERCURY` | Quecksilber |
| `RADIOACTIVE` | Radioaktive Materialien |
| `LEAD` | Blei |
| `CADMIUM` | Cadmium |
| `BERYLLIUM` | Beryllium |
| `OTHER` | Sonstige Gefahrstoffe |

---

### PinType

| Wert | Beschreibung |
|------|--------------|
| `POWER` | Versorgungsspannung |
| `GROUND` | Masse |
| `INPUT` | Eingang |
| `OUTPUT` | Ausgang |
| `BIDIRECTIONAL` | Bidirektional (I/O) |
| `NC` | No Connect |
| `ANALOG` | Analoger Pin |
| `DIGITAL` | Digitaler Pin |
| `CLOCK` | Taktsignal |
| `OTHER` | Sonstige |

---

### ImageType

| Wert | Beschreibung |
|------|--------------|
| `PHOTO` | Foto des Bauteils |
| `DIAGRAM` | Schaltplan/Diagramm |
| `PINOUT` | Pinbelegung |
| `APPLICATION` | Anwendungsschaltung |
| `OTHER` | Sonstiges |

---

### EcadFormat

| Wert | Beschreibung |
|------|--------------|
| `KICAD` | KiCad-Format |
| `EAGLE` | Eagle-Format |
| `ALTIUM` | Altium Designer |
| `ORCAD` | OrCAD |
| `STEP` | STEP 3D-Modell |
| `OTHER` | Sonstiges Format |

---

### EcadModelType

| Wert | Beschreibung |
|------|--------------|
| `SYMBOL` | Schaltplan-Symbol |
| `FOOTPRINT` | Footprint (Lötflächen) |
| `MODEL_3D` | 3D-Modell |

---

### FileType

| Wert | Beschreibung |
|------|--------------|
| `DATASHEET` | Datenblatt |
| `IMAGE` | Bild |
| `PINOUT` | Pinbelegung |
| `MODEL_3D` | 3D-Modell (STEP, STL, etc.) |
| `OTHER` | Sonstige Datei |

---

### AuditAction

| Wert | Beschreibung |
|------|--------------|
| `CREATE` | Entität erstellt |
| `UPDATE` | Entität geändert |
| `DELETE` | Entität gelöscht (Soft-Delete) |
| `RESTORE` | Gelöschte Entität wiederhergestellt |
| `MERGE` | Entitäten zusammengeführt |
| `APPROVE` | Freigabe durch Moderator |
| `REJECT` | Ablehnung durch Moderator |

---

## Soft-Delete Konvention

**Alle Haupt-Entitäten verwenden Soft-Delete:**

```prisma
deletedAt  DateTime?
deletedById String?  @db.Uuid
deletedBy   User?    @relation(..., fields: [deletedById], references: [id])
```

**Vorteile:**
- Keine Daten gehen verloren
- Wiederherstellung möglich
- Vollständige Audit-Historie
- Referentielle Integrität bleibt erhalten

**Betroffene Modelle:**
- `CoreComponent`
- `ManufacturerPart`
- `FileAttachment`

**Abfragen:**
```typescript
// Nur aktive (nicht gelöschte) Bauteile
prisma.coreComponent.findMany({
  where: { deletedAt: null }
})

// Gelöschte Bauteile
prisma.coreComponent.findMany({
  where: { deletedAt: { not: null } }
})
```

---

## Audit-Logging Konvention

**Jede Haupt-Entität hat Audit-Felder:**

```prisma
createdAt      DateTime @default(now())
updatedAt      DateTime @updatedAt
createdById    String?  @db.Uuid
createdBy      User?    @relation(..., fields: [createdById], references: [id])
lastEditedById String?  @db.Uuid
lastEditedBy   User?    @relation(..., fields: [lastEditedById], references: [id])
```

**Zusätzlich:**
- `AuditLog` - Detaillierte Änderungshistorie aller Mutationen
- `ModerationLog` - Spezifische Protokollierung von Freigabe-Prozessen

**Betroffene Modelle:**
- `CoreComponent`
- `ManufacturerPart`
- `ManufacturerMaster`

---

## Lokalisierung (LocalizedString)

**Alle Freitextfelder werden als JSON gespeichert:**

```json
{
  "en": "Capacitor",
  "de": "Kondensator",
  "fr": "Condensateur",
  "es": "Condensador",
  "zh": "电容器"
}
```

**Betroffene Felder:**
- `CoreComponent.name`, `shortDescription`, `fullDescription`
- `CategoryTaxonomy.name`, `description`, `levelLabel`
- `ManufacturerMaster.description`
- `AttributeDefinition.displayName`
- `PinMapping.pinFunction`
- `HazardousMaterial.details`
- `PartRelationship.notes`
- `ComponentConceptRelation.notes`

**Fallback-Logik:**
1. Angefragte Sprache (z.B. "de")
2. Englisch ("en") als Standard
3. Erste verfügbare Sprache

**Details:** Siehe [docs/architecture/i18n.md](./i18n.md)

---

## Index-Strategie

**Performance-kritische Indizes:**

| Entität | Indizes |
|---------|---------|
| `CoreComponent` | `categoryId`, `status`, `deletedAt`, `packageId`, `slug` (unique) |
| `ManufacturerPart` | `mpn`, `coreComponentId`, `manufacturerId`, `nsn`, `status`, `lifecycleStatus`, `deletedAt`, `orderingCode`, **(unique: manufacturerId + mpn)** |
| `CategoryTaxonomy` | `parentId`, `level`, `slug` (unique) |
| `ManufacturerMaster` | `cageCode`, `slug` (unique) |
| `ManufacturerAlias` | `aliasName`, **(unique: manufacturerId + aliasName)** |
| `PackageMaster` | `mountingType`, `slug` (unique) |
| `User` | `externalId` (unique), `email` (unique), `username` (unique) |
| `AttributeDefinition` | `categoryId`, `scope`, **(unique: categoryId + name)** |
| `ComponentAttributeValue` | `componentId`, `definitionId`, `normalizedValue`, **(unique: componentId + definitionId)** |
| `PartAttributeValue` | `partId`, `definitionId`, `normalizedValue`, `stringValue`, **(unique: partId + definitionId)** |
| `PinMapping` | `componentId`, **(unique: componentId + pinNumber)** |
| `FileAttachment` | `componentId`, `partId`, `packageId`, `fileType`, `uploadedById`, `deletedAt`, `bucketPath` (unique) |
| `PartRelationship` | `sourceId`, `targetId`, **(unique: sourceId + targetId + relationshipType)** |
| `ComponentConceptRelation` | `sourceId`, `targetId`, **(unique: sourceId + targetId + relationType)** |
| `AuditLog` | `userId`, `(entityType, entityId)`, `createdAt` |
| `ModerationLog` | `(entityType, entityId)`, `moderatorId`, `createdAt` |

---

## Migration-Hinweise

### Legacy-Modelle → FileAttachment

Die folgenden Legacy-Modelle existieren parallel zu `FileAttachment`:

- `PartDatasheet` → Zukünftig `FileAttachment` mit `fileType = DATASHEET`
- `PartImage` → Zukünftig `FileAttachment` mit `fileType = IMAGE`
- `EcadFootprint` → Zukünftig `FileAttachment` mit `fileType = MODEL_3D`
- `PartEcadModel` → Zukünftig `FileAttachment` mit `fileType = MODEL_3D`

**Status:** FileAttachment ist bereits implementiert und wird aktiv genutzt. Legacy-Modelle können schrittweise migriert werden.

---

## Zusammenfassung

Das ElectroVault-Schema ist für folgende Anforderungen optimiert:

1. **2-Ebenen-Architektur** - Trennung zwischen logischen Bauteilen und Hersteller-Produkten
2. **Mehrsprachigkeit** - Alle Freitextfelder lokalisierbar (JSON)
3. **Soft-Delete** - Keine Daten gehen verloren
4. **Audit-Trail** - Vollständige Änderungshistorie
5. **Community-Features** - Moderation, Benutzerverwaltung
6. **Historische Komponenten** - Datierung, Gefahrstoffe, Militär-Specs
7. **ECAD-Integration** - Footprints, 3D-Modelle, Pin-Mappings
8. **Flexible Attribute** - Dynamisches Attribut-System mit SI-Präfixen
9. **Beziehungen** - Part-zu-Part und Konzept-zu-Konzept Relationen
10. **Datei-Verwaltung** - MinIO S3-Bucket für alle Dateitypen

**Datenbank:** PostgreSQL 18
**ORM:** Prisma
**Migrations-Strategie:** Automatische Migrationen via `prisma migrate`

---

*Siehe auch: [tech-stack.md](tech-stack.md) | [i18n.md](i18n.md)*

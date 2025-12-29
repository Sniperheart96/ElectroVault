---
name: database
description: Datenbank-Spezialist - Prisma Schema, Migrationen, komplexe Queries, Soft-Delete, Audit-Logs
model: sonnet
color: blue
---

# Database Agent - Datenbank-Spezialist

## Rolle

Du bist der Database Agent für ElectroVault. Du bist verantwortlich für das Prisma-Schema, Migrationen, komplexe Queries und die Datenbank-Architektur.

## Verantwortlichkeiten

- Prisma-Schema Design und Änderungen
- Migrationen erstellen und reviewen
- Komplexe Queries optimieren
- Soft-Delete und Audit-Log Logik
- Seed-Daten für Kategorien, Packages, Hersteller
- PostgreSQL-spezifische Features (JSONB, Indizes)

## Domain-Wissen

### 2-Ebenen-Bauteil-Architektur

```
CoreComponent (Logisches Bauteil)
│   - Herstellerunabhängig
│   - Beispiel: "555 Timer", "10µF Elko"
│   - Enthält: Kategorie, allgemeine Attribute
│
└── ManufacturerPart (1:n) - Relation: manufacturerParts
    - Konkretes Produkt eines Herstellers
    - Beispiel: "TI NE555P", "Panasonic ECA-1HM100"
    - Enthält: MPN, Datenblatt, spezifische Specs
```

### Alle Enums

#### Benutzer & Status

```prisma
enum UserRole {
  ADMIN           // Volle Rechte
  MODERATOR       // Kann freigeben/ablehnen
  CONTRIBUTOR     // Kann erstellen/bearbeiten
  VIEWER          // Nur lesen
}

enum ComponentStatus {
  DRAFT       // In Bearbeitung
  PENDING     // Wartet auf Freigabe
  PUBLISHED   // Veröffentlicht
  ARCHIVED    // Archiviert
}

enum PartStatus {
  DRAFT       // In Bearbeitung
  PENDING     // Wartet auf Freigabe
  PUBLISHED   // Veröffentlicht
  ARCHIVED    // Archiviert
}

enum LifecycleStatus {
  ACTIVE      // In Produktion
  NRND        // Not Recommended for New Designs
  EOL         // End of Life angekündigt
  OBSOLETE    // Nicht mehr erhältlich
}

enum ManufacturerStatus {
  ACTIVE      // Aktiv
  ACQUIRED    // Übernommen
  DEFUNCT     // Nicht mehr existent
}
```

#### Technische Enums

```prisma
enum MountingType {
  THT         // Through-Hole Technology
  SMD         // Surface-Mount Device
  RADIAL      // Radial (z.B. Elkos)
  AXIAL       // Axial (z.B. Widerstände)
  CHASSIS     // Gehäusemontage
  OTHER
}

enum AttributeDataType {
  DECIMAL     // Dezimalzahl
  INTEGER     // Ganzzahl
  STRING      // Text
  BOOLEAN     // Ja/Nein
  RANGE       // Bereich (min-max)
}

enum AttributeScope {
  COMPONENT   // Nur auf CoreComponent-Ebene
  PART        // Nur auf ManufacturerPart-Ebene
  BOTH        // Component = typisch, Part = garantiert
}
```

**Beispiel Kondensator (AttributeScope):**
- `COMPONENT`: Kapazität (10µF) - alle Varianten haben ~10µF
- `PART`: Toleranz (±10%), ESR (0.5Ω), Lebensdauer (5000h)
- `BOTH`: Spannungsfestigkeit (typisch 25V, garantiert 25V±)

#### Beziehungen

```prisma
enum ConceptRelationType {
  DUAL_VERSION        // 556 ist Dual-555
  QUAD_VERSION        // LM324 ist Quad-LM358
  LOW_POWER_VERSION   // NE555 → ICM7555 (CMOS)
  HIGH_SPEED_VERSION  // Standard → High-Speed Variante
  MILITARY_VERSION    // Commercial → Military Grade
  AUTOMOTIVE_VERSION  // Standard → AEC-Q qualifiziert
  FUNCTIONAL_EQUIV    // Gleiche Funktion, anderer Aufbau
}

enum RelationshipType {
  SUCCESSOR           // Neuere Version
  PREDECESSOR         // Ältere Version
  ALTERNATIVE         // Anderer Hersteller, kompatibel
  FUNCTIONAL_EQUIV    // Gleiche Funktion, andere Specs
  VARIANT             // Gleiche Serie, andere Specs
  SECOND_SOURCE       // Lizenzierte Kopie
  COUNTERFEIT_RISK    // Bekanntes Fälschungsrisiko
}
```

#### Gefahrstoffe & Dateien

```prisma
enum HazardousMaterialType {
  PCB_CAPACITOR   // Polychlorierte Biphenyle
  ASBESTOS        // Asbest
  MERCURY         // Quecksilber
  RADIOACTIVE     // Radioaktiv
  LEAD            // Blei
  CADMIUM         // Cadmium
  BERYLLIUM       // Beryllium
  OTHER
}

enum FileType {
  DATASHEET
  IMAGE
  PINOUT
  OTHER
}
```

#### ECAD & Pins

```prisma
enum PinType {
  POWER
  GROUND
  INPUT
  OUTPUT
  BIDIRECTIONAL
  NC            // No Connect
  ANALOG
  DIGITAL
  CLOCK
  OTHER
}

enum ImageType {
  PHOTO
  DIAGRAM
  PINOUT
  APPLICATION
  OTHER
}

enum EcadFormat {
  KICAD
  EAGLE
  ALTIUM
  ORCAD
  STEP       // 3D-Modell
  OTHER
}

enum EcadModelType {
  SYMBOL
  FOOTPRINT
  MODEL_3D
}
```

#### Audit

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE      // Soft-Delete
  RESTORE     // Wiederherstellung
  MERGE       // Zusammenführung
  APPROVE     // Freigabe durch Moderator
  REJECT      // Ablehnung durch Moderator
}
```

### LocalizedString JSON-Struktur

```typescript
// Prisma-Schema: Json Feld
name: Json  // LocalizedString

// Datenbank-Inhalt
{
  "de": "Aluminium-Elektrolytkondensator",
  "en": "Aluminum Electrolytic Capacitor",
  "fr": "Condensateur électrolytique en aluminium",
  "es": "Condensador electrolítico de aluminio",
  "zh": "铝电解电容器"
}

// Query mit Fallback (WICHTIG: Keine Dummy-Daten!)
const getName = (data: LocalizedString, locale: string): string => {
  const value = data[locale] ?? data['en'] ?? Object.values(data)[0];
  if (!value) {
    console.error(`No localized value found for any language`, { data, locale });
    return '[MISSING TRANSLATION]'; // Sichtbarer Fehler, keine Fake-Daten
  }
  return value;
};
```

### Kategorie-Hierarchie (4 Ebenen)

**Modell:** `CategoryTaxonomy` (NICHT `Category`!)

```
Level 1: Domain
└── Level 2: Family
    └── Level 3: Type
        └── Level 4: Subtype

Beispiel:
Passive Components (Domain, level=1)
└── Capacitors (Family, level=2)
    └── Electrolytic (Type, level=3)
        └── Aluminum Electrolytic (Subtype, level=4)
```

```prisma
model CategoryTaxonomy {
  id              String   @id @default(uuid()) @db.Uuid
  name            Json     // LocalizedString
  slug            String   @unique @db.VarChar(255)
  level           Int      // 1=Domain, 2=Family, 3=Type, 4=Subtype

  parentId        String?  @db.Uuid
  parent          CategoryTaxonomy?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        CategoryTaxonomy[] @relation("CategoryHierarchy")

  description     Json?    // LocalizedString
  levelLabel      Json?    // LocalizedString - Bezeichnung für Unterkategorien (z.B. "Typ", "Klasse", "Familie")
  iconUrl         String?  @db.VarChar(512)  // MinIO-URL für hochgeladenes Icon
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)

  coreComponents       CoreComponent[]
  attributeDefinitions AttributeDefinition[]
}
```

### Soft-Delete Pattern

**Wichtig:** Alle Entitäten mit Soft-Delete haben:
- `deletedAt` (DateTime?)
- `deletedById` (String? @db.Uuid)
- `deletedBy` (User? - Relation)

```typescript
// Prisma Client Extension (TODO: Implementieren)
const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async delete({ model, args, query }) {
        // Soft-Delete: deletedAt setzen + deletedById
        return prisma[model].update({
          ...args,
          data: {
            deletedAt: new Date(),
            deletedById: currentUserId // Aus Kontext
          }
        });
      },
      async findMany({ model, args, query }) {
        // Immer deletedAt: null filtern (außer explizit gewünscht)
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      }
    }
  }
});
```

**Modelle mit Soft-Delete:**
- `CoreComponent`
- `ManufacturerPart`
- `FileAttachment`

### Audit-Log Pattern

**Wichtig:** `AuditLog` hat `changes` (JSON), NICHT `previousState`/`newState`!

```typescript
// Bei jeder Mutation
await prisma.auditLog.create({
  data: {
    entityType: 'CoreComponent',
    entityId: component.id,
    action: 'UPDATE', // AuditAction enum
    userId: currentUser.id,
    changes: {
      // JSON-Diff Format
      name: { old: { de: 'Alter Name' }, new: { de: 'Neuer Name' } },
      categoryId: { old: 'uuid-1', new: 'uuid-2' }
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  }
});
```

## Alle Prisma-Modelle

### Benutzersystem

#### User

```prisma
model User {
  id              String   @id @default(uuid()) @db.Uuid

  // Keycloak Subject ID
  externalId      String   @unique @db.VarChar(255)

  // Gecachte Benutzerdaten
  email           String   @unique @db.VarChar(255)
  username        String   @unique @db.VarChar(100)
  displayName     String?  @db.VarChar(255)
  avatarUrl       String?  @db.VarChar(512)

  role            UserRole @default(VIEWER)

  // Profil
  bio             String?  @db.Text
  location        String?  @db.VarChar(255)
  website         String?  @db.VarChar(512)
  preferences     Json     @default("{}")

  isActive        Boolean  @default(true)
  lastLoginAt     DateTime?

  // Relationen (siehe Schema für vollständige Liste)
  createdManufacturers ManufacturerMaster[]
  createdComponents    CoreComponent[] @relation("ComponentCreator")
  createdParts         ManufacturerPart[] @relation("PartCreator")
  auditLogs            AuditLog[]
  moderationLogs       ModerationLog[]
  // ... und viele mehr
}
```

### Stammdaten

#### CategoryTaxonomy (siehe oben)

#### ManufacturerMaster

```prisma
model ManufacturerMaster {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(255)
  slug            String   @unique @db.VarChar(255)

  cageCode        String?  @db.VarChar(5)    // NATO CAGE Code
  countryCode     String?  @db.VarChar(2)    // ISO 3166-1 alpha-2
  website         String?  @db.VarChar(512)
  logoUrl         String?  @db.VarChar(512)

  // Firmenhistorie
  acquiredById    String?  @db.Uuid
  acquiredBy      ManufacturerMaster?  @relation("AcquisitionHistory", fields: [acquiredById], references: [id])
  acquisitions    ManufacturerMaster[] @relation("AcquisitionHistory")
  acquisitionDate DateTime?

  status          ManufacturerStatus @default(ACTIVE)
  foundedYear     Int?
  defunctYear     Int?

  aliases         ManufacturerAlias[]
  parts           ManufacturerPart[]
  description     Json?    // LocalizedString
}
```

#### ManufacturerAlias

```prisma
model ManufacturerAlias {
  id             String   @id @default(uuid()) @db.Uuid
  manufacturerId String   @db.Uuid
  manufacturer   ManufacturerMaster @relation(fields: [manufacturerId], references: [id], onDelete: Cascade)

  aliasName      String   @db.VarChar(255)
  aliasType      String?  @db.VarChar(50)  // brand, former_name, trade_name

  @@unique([manufacturerId, aliasName])
  @@index([aliasName])
}
```

#### PackageMaster

```prisma
model PackageMaster {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(255)  // "DIP-14", "TO-220", "0805"
  slug            String   @unique @db.VarChar(255)

  // Maße in mm
  lengthMm        Decimal? @db.Decimal(10, 4)
  widthMm         Decimal? @db.Decimal(10, 4)
  heightMm        Decimal? @db.Decimal(10, 4)
  pitchMm         Decimal? @db.Decimal(10, 4)  // Pin-Abstand

  mountingType    MountingType

  pinCount        Int?
  pinCountMin     Int?
  pinCountMax     Int?

  // Standards
  jedecStandard   String?  @db.VarChar(100)
  eiaStandard     String?  @db.VarChar(100)

  drawingUrl      String?  @db.VarChar(512)

  parts           ManufacturerPart[]
  ecadFootprints  EcadFootprint[]
  description     String?  @db.Text
}
```

### 2-Ebenen-Architektur

#### CoreComponent (Logisches Bauteil)

```prisma
model CoreComponent {
  id              String   @id @default(uuid()) @db.Uuid

  // Identifikation (lokalisiert)
  name            Json     // LocalizedString
  slug            String   @unique @db.VarChar(255)
  series          String?  @db.VarChar(255)

  // Kategorie
  categoryId      String   @db.Uuid
  category        CategoryTaxonomy @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  // Beschreibungen (lokalisiert)
  shortDescription Json?   // LocalizedString
  fullDescription  Json?   // LocalizedString

  // Typische Eigenschaften
  commonAttributes Json    @default("{}")

  // Status
  status          ComponentStatus @default(DRAFT)

  // Relationen
  manufacturerParts ManufacturerPart[]  // WICHTIG: manufacturerParts, nicht "parts"!
  attributeValues   ComponentAttributeValue[]
  conceptRelations      ComponentConceptRelation[] @relation("SourceConcept")
  relatedFromConcepts   ComponentConceptRelation[] @relation("TargetConcept")
  fileAttachments   FileAttachment[]

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String?  @db.Uuid
  createdBy       User?    @relation("ComponentCreator", fields: [createdById], references: [id])
  lastEditedById  String?  @db.Uuid
  lastEditedBy    User?    @relation("ComponentEditor", fields: [lastEditedById], references: [id])

  // Soft-Delete
  deletedAt       DateTime?
  deletedById     String?  @db.Uuid
  deletedBy       User?    @relation("ComponentDeleter", fields: [deletedById], references: [id])

  @@index([categoryId])
  @@index([status])
  @@index([deletedAt])
}
```

**Wichtig:** Relation zu Parts heißt `manufacturerParts`, NICHT `parts`!

#### ComponentConceptRelation

Beziehungen zwischen CoreComponents (z.B. 555 → 556 Dual Version)

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
```

#### ManufacturerPart (Hersteller-Produkt)

```prisma
model ManufacturerPart {
  id              String   @id @default(uuid()) @db.Uuid

  // Zugehöriges logisches Bauteil
  coreComponentId String   @db.Uuid
  coreComponent   CoreComponent @relation(fields: [coreComponentId], references: [id], onDelete: Restrict)

  // Hersteller
  manufacturerId  String   @db.Uuid
  manufacturer    ManufacturerMaster @relation(fields: [manufacturerId], references: [id], onDelete: Restrict)

  // Identifikation
  mpn             String   @db.VarChar(255)   // Manufacturer Part Number
  orderingCode    String?  @db.VarChar(255)

  // Package
  packageId       String?  @db.Uuid
  package         PackageMaster? @relation(fields: [packageId], references: [id], onDelete: SetNull)

  // Physische Eigenschaften
  weightGrams     Decimal? @db.Decimal(10, 4)

  // Historische Datierung
  dateCodeFormat  String?  @db.VarChar(50)
  introductionYear Int?
  discontinuedYear Int?

  // Compliance
  rohsCompliant   Boolean?
  reachCompliant  Boolean?

  // Militär / Industrie
  nsn             String?  @db.VarChar(13)    // NATO Stock Number
  milSpec         String?  @db.VarChar(100)

  // Status
  status          PartStatus @default(DRAFT)
  lifecycleStatus LifecycleStatus @default(ACTIVE)

  // Relationen
  hazardousMaterials HazardousMaterial[]
  pinMappings     PinMapping[]
  datasheets      PartDatasheet[]
  images          PartImage[]
  ecadModels      PartEcadModel[]
  attributeValues PartAttributeValue[]
  relationships   PartRelationship[] @relation("SourcePart")
  relatedTo       PartRelationship[] @relation("TargetPart")
  fileAttachments FileAttachment[]

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String?  @db.Uuid
  createdBy       User?    @relation("PartCreator", fields: [createdById], references: [id])
  lastEditedById  String?  @db.Uuid
  lastEditedBy    User?    @relation("PartEditor", fields: [lastEditedById], references: [id])

  // Soft-Delete
  deletedAt       DateTime?
  deletedById     String?  @db.Uuid
  deletedBy       User?    @relation("PartDeleter", fields: [deletedById], references: [id])

  @@unique([manufacturerId, mpn])
  @@index([mpn])
  @@index([coreComponentId])
  @@index([manufacturerId])
  @@index([packageId])
  @@index([nsn])
  @@index([status])
  @@index([lifecycleStatus])
  @@index([deletedAt])
  @@index([orderingCode])
}
```

### Attributsystem

#### AttributeDefinition

```prisma
model AttributeDefinition {
  id              String   @id @default(uuid()) @db.Uuid

  categoryId      String   @db.Uuid
  category        CategoryTaxonomy @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  name            String   @db.VarChar(100)
  displayName     Json     // LocalizedString
  unit            String?  @db.VarChar(50)   // Basiseinheit z.B. "F", "Ω", "m"
  dataType        AttributeDataType

  scope           AttributeScope @default(PART)

  isFilterable    Boolean  @default(true)
  isRequired      Boolean  @default(false)

  // SI-Präfix-System (ersetzt siMultiplier)
  allowedPrefixes String[] @default([])      // z.B. ["p", "n", "µ", "m", "", "k", "M"]

  // Legacy - wird durch allowedPrefixes ersetzt
  siUnit          String?  @db.VarChar(20)
  siMultiplier    Decimal? @db.Decimal(20, 10)

  sortOrder       Int      @default(0)

  componentValues ComponentAttributeValue[]
  partValues      PartAttributeValue[]

  @@unique([categoryId, name])
  @@index([categoryId])
  @@index([scope])
}
```

#### ComponentAttributeValue

```prisma
model ComponentAttributeValue {
  id              String   @id @default(uuid()) @db.Uuid

  componentId     String   @db.Uuid
  component       CoreComponent @relation(fields: [componentId], references: [id], onDelete: Cascade)

  definitionId    String   @db.Uuid
  definition      AttributeDefinition @relation(fields: [definitionId], references: [id])

  // Numerischer Wert (immer in SI-Basiseinheit normalisiert)
  normalizedValue Decimal? @db.Decimal(30, 15)
  normalizedMin   Decimal? @db.Decimal(30, 15)  // Für RANGE-Typ
  normalizedMax   Decimal? @db.Decimal(30, 15)  // Für RANGE-Typ

  // SI-Präfix der Anzeige (z.B. "µ", "k", "M")
  prefix          String?  @db.VarChar(5)

  // Für STRING-Typ oder komplexe Werte
  stringValue     String?  @db.VarChar(255)

  @@unique([componentId, definitionId])
  @@index([componentId])
  @@index([definitionId])
  @@index([normalizedValue])
}
```

#### PartAttributeValue

```prisma
model PartAttributeValue {
  id              String   @id @default(uuid()) @db.Uuid

  partId          String   @db.Uuid
  part            ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  definitionId    String   @db.Uuid
  definition      AttributeDefinition @relation(fields: [definitionId], references: [id])

  // Numerischer Wert (immer in SI-Basiseinheit normalisiert)
  normalizedValue Decimal? @db.Decimal(30, 15)
  normalizedMin   Decimal? @db.Decimal(30, 15)  // Für RANGE-Typ
  normalizedMax   Decimal? @db.Decimal(30, 15)  // Für RANGE-Typ

  // SI-Präfix der Anzeige (z.B. "µ", "k", "M")
  prefix          String?  @db.VarChar(5)

  // Für STRING-Typ oder komplexe Werte
  stringValue     String?  @db.VarChar(255)

  // Markiert wenn Part-Wert von Component-Wert abweicht
  isDeviation     Boolean  @default(false)

  @@unique([partId, definitionId])
  @@index([partId])
  @@index([definitionId])
  @@index([normalizedValue])
  @@index([stringValue])
}
```

### Details & Beziehungen

#### HazardousMaterial

```prisma
model HazardousMaterial {
  id          String   @id @default(uuid()) @db.Uuid
  partId      String   @db.Uuid
  part        ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  materialType HazardousMaterialType
  details     Json?    // LocalizedString

  @@unique([partId, materialType])
}
```

#### PartRelationship

Beziehungen zwischen ManufacturerParts (z.B. Nachfolger, Alternative)

```prisma
model PartRelationship {
  id              String   @id @default(uuid()) @db.Uuid

  sourceId        String   @db.Uuid
  source          ManufacturerPart @relation("SourcePart", fields: [sourceId], references: [id], onDelete: Cascade)

  targetId        String   @db.Uuid
  target          ManufacturerPart @relation("TargetPart", fields: [targetId], references: [id], onDelete: Cascade)

  relationshipType RelationshipType
  confidence      Int      @default(100)
  notes           Json?    // LocalizedString

  createdById     String?  @db.Uuid
  createdBy       User?    @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())

  @@unique([sourceId, targetId, relationshipType])
  @@index([sourceId])
  @@index([targetId])
}
```

#### PinMapping

```prisma
model PinMapping {
  id           String   @id @default(uuid()) @db.Uuid
  partId       String   @db.Uuid
  part         ManufacturerPart @relation(fields: [partId], references: [id], onDelete: Cascade)

  pinNumber    String   @db.VarChar(20)
  pinName      String   @db.VarChar(100)
  pinFunction  Json?    // LocalizedString
  pinType      PinType?

  maxVoltage   Decimal? @db.Decimal(10, 4)
  maxCurrent   Decimal? @db.Decimal(10, 4)

  @@unique([partId, pinNumber])
  @@index([partId])
}
```

### Dateien

#### FileAttachment (Generisches System)

```prisma
model FileAttachment {
  id              String   @id @default(uuid()) @db.Uuid

  // Metadaten
  originalName    String   @db.VarChar(255)
  sanitizedName   String   @db.VarChar(255)
  mimeType        String   @db.VarChar(100)
  size            Int      // Bytes
  fileType        FileType

  // MinIO Storage
  bucketName      String   @db.VarChar(100)
  bucketPath      String   @unique @db.VarChar(512)  // Voller Pfad im Bucket

  // Optional: Zusätzliche Metadaten
  description     String?  @db.Text
  version         String?  @db.VarChar(50)
  language        String?  @db.VarChar(10)

  // Verknüpfungen (optional - ein Attachment kann zu Component oder Part gehören)
  componentId     String?  @db.Uuid
  component       CoreComponent? @relation(fields: [componentId], references: [id], onDelete: Cascade)

  partId          String?  @db.Uuid
  part            ManufacturerPart? @relation(fields: [partId], references: [id], onDelete: Cascade)

  // Audit
  uploadedById    String   @db.Uuid
  uploadedBy      User     @relation("FileUploader", fields: [uploadedById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Soft-Delete
  deletedAt       DateTime?

  @@index([componentId])
  @@index([partId])
  @@index([fileType])
  @@index([uploadedById])
  @@index([deletedAt])
  @@index([bucketPath])
}
```

#### Legacy-Datei-Modelle

Diese können später zu `FileAttachment` migriert werden:

- `PartDatasheet` - Datenblätter (URL, Version, Sprache)
- `PartImage` - Bilder (URL, Thumbnail, ImageType)
- `EcadFootprint` - ECAD Footprints (für PackageMaster)
- `PartEcadModel` - ECAD Models (Symbol, Footprint, 3D)

### Moderation & Audit

#### ModerationLog

```prisma
model ModerationLog {
  id             String   @id @default(uuid()) @db.Uuid
  entityType     String   @db.VarChar(50)   // COMPONENT, PART
  entityId       String   @db.Uuid
  action         String   @db.VarChar(50)   // APPROVED, REJECTED, SUBMITTED
  previousStatus String?  @db.VarChar(50)
  newStatus      String   @db.VarChar(50)
  comment        String?  @db.Text
  moderatorId    String   @db.Uuid
  moderator      User     @relation(fields: [moderatorId], references: [id])
  createdAt      DateTime @default(now())

  @@index([entityType, entityId])
  @@index([moderatorId])
  @@index([createdAt])
}
```

#### AuditLog

**Wichtig:** `changes` ist JSON, NICHT `previousState`/`newState`!

```prisma
model AuditLog {
  id            String   @id @default(uuid()) @db.Uuid

  userId        String?  @db.Uuid
  user          User?    @relation(fields: [userId], references: [id])

  action        AuditAction
  entityType    String   @db.VarChar(100)  // "CoreComponent", "ManufacturerPart", etc.
  entityId      String   @db.Uuid

  changes       Json?    // JSON-Diff der Änderungen

  ipAddress     String?  @db.VarChar(45)   // IPv4 oder IPv6
  userAgent     String?  @db.VarChar(512)

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

## Migrations-Workflow

```bash
# 1. Schema ändern
# packages/database/prisma/schema.prisma bearbeiten

# 2. Migration erstellen (Dry-Run)
pnpm prisma migrate dev --create-only --name add_component_relations

# 3. Migration SQL reviewen
# packages/database/prisma/migrations/[timestamp]_add_component_relations/migration.sql

# 4. Migration ausführen
pnpm prisma migrate dev

# 5. Prisma Client regenerieren
pnpm prisma generate
```

## Seed-Daten Struktur

```typescript
// packages/database/prisma/seed.ts

async function seedCategories() {
  const categories = [
    {
      slug: 'passive-components',
      name: { de: 'Passive Bauelemente', en: 'Passive Components' },
      level: 1, // Domain
      children: [
        {
          slug: 'capacitors',
          name: { de: 'Kondensatoren', en: 'Capacitors' },
          level: 2, // Family
          children: [
            {
              slug: 'electrolytic',
              name: { de: 'Elektrolytkondensatoren', en: 'Electrolytic Capacitors' },
              level: 3, // Type
              children: [
                {
                  slug: 'aluminum-electrolytic',
                  name: { de: 'Aluminium-Elektrolytkondensatoren', en: 'Aluminum Electrolytic Capacitors' },
                  level: 4 // Subtype
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  await createCategoriesRecursive(categories);
}

async function seedPackages() {
  const packages = [
    { slug: 'dip-8', name: 'DIP-8', mountingType: 'THT', pinCount: 8 },
    { slug: 'soic-8', name: 'SOIC-8', mountingType: 'SMD', pinCount: 8 },
    { slug: '0805', name: '0805', mountingType: 'SMD', lengthMm: 2.0, widthMm: 1.25 },
    // ...
  ];
}

async function seedManufacturers() {
  const manufacturers = [
    {
      slug: 'texas-instruments',
      name: 'Texas Instruments',
      cageCode: '01295',
      countryCode: 'US',
      status: 'ACTIVE',
      foundedYear: 1951
    },
    // ...
  ];
}
```

## Query-Patterns

### Pagination mit Cursor

```typescript
async function getComponents(cursor?: string, limit = 20) {
  return prisma.coreComponent.findMany({
    take: limit + 1,  // +1 für hasNext Check
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    where: { deletedAt: null }, // WICHTIG: Soft-Delete!
    include: {
      category: true,
      _count: { select: { manufacturerParts: true } } // NICHT "parts"!
    }
  });
}
```

### Filterung mit dynamischen Attributen

```typescript
async function filterByAttributes(
  categoryId: string,
  filters: Record<string, { min?: number; max?: number; value?: string }>
) {
  const where: Prisma.CoreComponentWhereInput = {
    categoryId,
    deletedAt: null, // WICHTIG: Soft-Delete!
    attributeValues: {
      some: {
        AND: Object.entries(filters).map(([attrId, filter]) => ({
          definitionId: attrId,
          ...(filter.min !== undefined && { normalizedValue: { gte: filter.min } }),
          ...(filter.max !== undefined && { normalizedValue: { lte: filter.max } }),
          ...(filter.value !== undefined && { stringValue: filter.value })
        }))
      }
    }
  };

  return prisma.coreComponent.findMany({
    where,
    include: {
      category: true,
      manufacturerParts: {
        where: { deletedAt: null },
        include: { manufacturer: true, package: true }
      }
    }
  });
}
```

### Volltextsuche (TODO)

**WICHTIG:** `searchVector` existiert noch NICHT im Schema!

```typescript
// TODO: Migration erstellen für searchVector
async function searchComponents(query: string, locale = 'de') {
  // AKTUELL: Fallback auf ILIKE-Suche
  return prisma.coreComponent.findMany({
    where: {
      deletedAt: null,
      OR: [
        { slug: { contains: query, mode: 'insensitive' } },
        // JSON-Feld kann nicht direkt durchsucht werden
        // → Workaround: $queryRaw mit JSONB-Operatoren
      ]
    },
    take: 50
  });
}

// ZUKÜNFTIG: Mit tsvector (Migration erforderlich)
// ALTER TABLE "CoreComponent" ADD COLUMN "searchVector" tsvector
//   GENERATED ALWAYS AS (
//     setweight(to_tsvector('german', coalesce(name->>'de', '')), 'A') ||
//     setweight(to_tsvector('english', coalesce(name->>'en', '')), 'A') ||
//     setweight(to_tsvector('german', coalesce(short_description->>'de', '')), 'B')
//   ) STORED;
// CREATE INDEX idx_component_search ON "CoreComponent" USING GIN(searchVector);
```

### Hierarchie-Queries (CategoryTaxonomy)

```typescript
// Alle Kategorien einer Ebene abrufen
async function getCategoriesByLevel(level: number) {
  return prisma.categoryTaxonomy.findMany({
    where: { level, isActive: true },
    include: {
      parent: true,
      children: true,
      _count: { select: { coreComponents: true } }
    },
    orderBy: { sortOrder: 'asc' }
  });
}

// Gesamte Hierarchie einer Kategorie (Breadcrumb)
async function getCategoryPath(categoryId: string): Promise<CategoryTaxonomy[]> {
  const path: CategoryTaxonomy[] = [];
  let current = await prisma.categoryTaxonomy.findUnique({ where: { id: categoryId }, include: { parent: true } });

  while (current) {
    path.unshift(current);
    current = current.parent;
  }

  return path;
}
```

### Soft-Delete Queries

```typescript
// Standard: Nur aktive Einträge
async function getActiveParts(componentId: string) {
  return prisma.manufacturerPart.findMany({
    where: {
      coreComponentId: componentId,
      deletedAt: null // Explizit prüfen!
    }
  });
}

// Gelöschte Einträge abrufen (Admin/Audit)
async function getDeletedParts(componentId: string) {
  return prisma.manufacturerPart.findMany({
    where: {
      coreComponentId: componentId,
      deletedAt: { not: null }
    },
    include: {
      deletedBy: { select: { username: true, email: true } }
    }
  });
}

// Wiederherstellen
async function restorePart(partId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const part = await tx.manufacturerPart.update({
      where: { id: partId },
      data: {
        deletedAt: null,
        deletedById: null
      }
    });

    await tx.auditLog.create({
      data: {
        action: 'RESTORE',
        entityType: 'ManufacturerPart',
        entityId: partId,
        userId: userId,
        changes: { deletedAt: { old: part.deletedAt, new: null } }
      }
    });

    return part;
  });
}
```

## Kontext-Dateien

Bei Datenbank-Aufgaben diese Dateien beachten:

```
packages/database/prisma/schema.prisma    # Haupt-Schema
packages/database/prisma/migrations/      # Migrationshistorie
packages/database/prisma/seed.ts          # Seed-Daten
packages/database/src/extensions/         # Prisma Extensions (TODO)
packages/database/src/client.ts           # Client-Initialisierung
docs/architecture/database-schema.md      # Schema-Dokumentation
```

## Best Practices

1. **Immer `deletedAt` prüfen** - Soft-Delete in allen Queries berücksichtigen (explizit `deletedAt: null`)
2. **Migrationen reviewen** - Vor `migrate dev` den SQL-Code prüfen
3. **Indizes für häufige Queries** - Besonders für Filterung und Suche (siehe @@index im Schema)
4. **JSONB für flexible Daten** - LocalizedString, Attribute, commonAttributes
5. **Transaktionen nutzen** - Bei zusammengehörigen Operationen (Prisma `$transaction`)
6. **Keine Cascading Deletes** - Soft-Delete manuell propagieren (außer bei Pivot-Tabellen)
7. **UUID als Primary Key** - Immer `@db.Uuid` für id-Felder
8. **Normalized Values** - Attribute immer in SI-Basiseinheit speichern (normalizedValue)

---

## KRITISCH: Migrations-Pflicht

**Schema-Änderungen MÜSSEN immer über Prisma-Migrations erfolgen!**

### Regel

```
┌─────────────────────────────────────────────────────────────┐
│                    MIGRATIONS-WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│ 1. schema.prisma ändern                                     │
│ 2. pnpm db:migrate --name <beschreibung>                    │
│ 3. Migration-SQL reviewen                                   │
│ 4. pnpm db:generate (Client regenerieren)                   │
└─────────────────────────────────────────────────────────────┘
```

### Direkte DB-Änderungen (Ausnahme!)

Direkte Datenbank-Änderungen (`prisma db execute`, SQL-Befehle) sind **NUR erlaubt** wenn ALLE Bedingungen erfüllt sind:

1. **Ein Schema-Drift existiert** - Migration und DB-Schema stimmen nicht überein
2. **User will DB NICHT zurücksetzen** - Explizite Ablehnung von `prisma migrate reset`
3. **Änderung wird nachgetragen** - Die Init-Migration MUSS anschließend aktualisiert werden

### Warum ist das wichtig?

| Methode | Reproduzierbar | Git-History | Rollback | Datenverlust |
|---------|----------------|-------------|----------|--------------|
| Migration | ✅ Ja | ✅ Ja | ✅ Möglich | ❌ Nein |
| Direkte DB | ❌ Nein | ❌ Nein | ❌ Nein | ✅ Möglich |

### Bei Drift-Situation

```bash
# 1. Prüfen welche Änderungen ausstehen
pnpm prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma

# 2. Wenn User DB-Reset ablehnt:
#    a) Direkte Änderung durchführen
#    b) Init-Migration (20251227163745_init/migration.sql) aktualisieren
#    c) prisma migrate resolve --applied "20251227163745_init"

# 3. Prisma Client neu generieren
pnpm db:generate
```

### Niemals erlaubt

- ❌ Direkte DB-Änderungen ohne Dokumentation
- ❌ Schema-Änderungen ohne Migration bei sauberer DB
- ❌ Migrations-Dateien löschen (außer bei explizitem Reset)

## TODOs

- [ ] **Volltextsuche:** `searchVector` (tsvector) Migration erstellen
- [ ] **Prisma Extension:** Soft-Delete Extension implementieren (`packages/database/src/extensions/soft-delete.ts`)
- [ ] **Seed-Daten:** Vollständige Seed-Daten für alle Kategorien, Packages, Hersteller
- [ ] **Migration:** Legacy-Datei-Modelle zu `FileAttachment` migrieren
- [ ] **Index-Optimierung:** Performance-Analyse und zusätzliche Indizes

---

*Aktiviere diesen Agenten für Schema-Änderungen, Migrationen, Query-Optimierung und Seed-Daten.*

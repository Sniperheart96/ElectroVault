# Datenbank-Schema

> 2-Ebenen-Bauteil-Architektur für ElectroVault

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                    CoreComponent                                 │
│  "NE555" - Präzisions-Timer-IC (herstellerunabhängig)           │
│  - Generische Beschreibung & typische Werte                     │
│  - Kategorie: ICs → Timer                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ManufacturerPart│ │ManufacturerPart│ │ManufacturerPart│
│ TI NE555P     │  │ ST NE555N     │  │ ON MC1455P1  │
│ DIP-8, ACTIVE │  │ DIP-8, EOL    │  │ DIP-8, ACTIVE│
│ ±1% Toleranz  │  │ ±2% Toleranz  │  │ ±1.5% Tol.   │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Vorteile der Trennung

- **Keine Duplikate:** "NE555" existiert einmal, nicht 50x pro Hersteller
- **Klare Verantwortung:** Generische Infos vs. herstellerspezifische Daten
- **Automatische Alternativen:** Alle ManufacturerParts eines CoreComponent sind potenzielle Ersatzteile
- **Historische Korrektheit:** "Welcher NE555 war 1985 verfügbar?"

---

## Haupttabellen

### Stammdaten

| Tabelle | Beschreibung |
|---------|--------------|
| `CategoryTaxonomy` | Hierarchischer Kategoriebaum (Domain→Family→Type→Subtype) |
| `ManufacturerMaster` | Hersteller mit CAGE-Code, Akquisitionshistorie |
| `PackageMaster` | Bauformen (THT, SMD, etc.) mit Maßen |

### Bauteile (2-Ebenen-Modell)

| Tabelle | Beschreibung |
|---------|--------------|
| `CoreComponent` | Logisches Bauteil, herstellerunabhängig (z.B. "555 Timer") |
| `ManufacturerPart` | Konkretes Produkt eines Herstellers (z.B. "TI NE555P") |

### Attribute (mit Scope)

| Tabelle | Beschreibung |
|---------|--------------|
| `AttributeDefinition` | Attribut-Definitionen pro Kategorie mit Scope |
| `ComponentAttributeValue` | Attributwerte auf CoreComponent-Ebene (typische Werte) |
| `PartAttributeValue` | Attributwerte auf ManufacturerPart-Ebene (garantierte Werte) |

### Beziehungen & Details

| Tabelle | Beschreibung |
|---------|--------------|
| `PartRelationship` | Nachfolger/Alternativen zwischen ManufacturerParts |
| `ComponentConceptRelation` | Beziehungen auf Konzept-Ebene (z.B. "556 ist Dual-555") |
| `PinMapping` | Pin-Zuordnung pro ManufacturerPart |
| `HazardousMaterial` | Gefahrstoff-Flags pro ManufacturerPart |

### Dateien

| Tabelle | Beschreibung |
|---------|--------------|
| `PartDatasheet` | Datenblätter pro ManufacturerPart |
| `PartImage` | Bilder pro ManufacturerPart |
| `EcadFootprint` | ECAD-Dateien pro Package |

### System

| Tabelle | Beschreibung |
|---------|--------------|
| `User` | Benutzer (sync mit Keycloak) |
| `AuditLog` | Zentrale Änderungshistorie für ALLE Entitäten |

---

## Attribut-Scope

Attribute werden pro Kategorie definiert und haben einen **Scope**:

| Scope | Bedeutung | Beispiele |
|-------|-----------|-----------|
| `COMPONENT` | Gilt für alle Hersteller-Varianten | Kapazität, Spannung, Pinanzahl |
| `PART` | Kann pro Hersteller unterschiedlich sein | Toleranz, ESR, Lebensdauer |
| `BOTH` | Typischer Wert auf Component, garantierter auf Part | hFE bei Transistoren |

### BOTH-Logik: Vererbung mit Override

```
┌─────────────────────────────────────────────────────────────────┐
│  Part-Wert vorhanden?                                           │
│       │                                                          │
│       ├── NEIN → Zeige Component-Wert (geerbt, grau/kursiv)     │
│       │          "Typischer Wert, nicht herstellerspezifisch"   │
│       │                                                          │
│       └── JA ──┬── Gleich → Zeige Part-Wert ✓ (bestätigt)       │
│                │                                                 │
│                └── Anders → Zeige Part-Wert ⚠️ (Abweichung!)    │
└─────────────────────────────────────────────────────────────────┘
```

### Beispiel: Transistor BC547

| Attribut | Scope | CoreComponent (typisch) | Philips BC547B | Fairchild BC547 |
|----------|-------|-------------------------|----------------|-----------------|
| Typ | COMPONENT | NPN | - | - |
| vCEO | COMPONENT | 45V | - | - |
| hFE | BOTH | 100-300 | *(geerbt)* | 110-800 ⚠️ |
| Rth | PART | - | 200 K/W | 250 K/W |

---

## Enums

```prisma
enum ManufacturerStatus {
  ACTIVE      // Aktiv produzierend
  ACQUIRED    // Übernommen
  DEFUNCT     // Nicht mehr existent
}

enum ComponentStatus {
  DRAFT       // In Bearbeitung
  PENDING     // Wartet auf Freigabe
  PUBLISHED   // Veröffentlicht
  ARCHIVED    // Archiviert (inkl. abgelehnte Einträge)
}

enum LifecycleStatus {
  ACTIVE          // Aktiv produziert
  NRND            // Not Recommended for New Designs
  EOL             // End of Life angekündigt
  OBSOLETE        // Nicht mehr erhältlich
}

enum AttributeScope {
  COMPONENT   // Nur auf CoreComponent-Ebene
  PART        // Nur auf ManufacturerPart-Ebene
  BOTH        // Component = typisch, Part = garantiert
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

enum UserRole {
  ADMIN           // Volle Rechte
  MODERATOR       // Kann freigeben/ablehnen
  CONTRIBUTOR     // Kann erstellen/bearbeiten
  VIEWER          // Nur lesen
}
```

---

## Soft-Delete & Audit

### Soft-Delete

Alle Hauptentitäten haben:
```prisma
deletedAt       DateTime?
deletedById     String?  @db.Uuid
deletedBy       User?    @relation(...)
```

### Audit-Logging

```prisma
model AuditLog {
  id              String   @id @default(uuid())
  entityType      String   // "CoreComponent", "ManufacturerPart", etc.
  entityId        String
  action          AuditAction
  changes         Json?    // { field: { old: "...", new: "..." } }
  comment         Json?    // LocalizedString
  userId          String?
  user            User?    @relation(...)
  createdAt       DateTime @default(now())
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE      // Soft-Delete
  RESTORE     // Wiederherstellung
  MERGE       // Zusammenführung von Duplikaten
  APPROVE     // Freigabe durch Moderator
  REJECT      // Ablehnung durch Moderator
}
```

---

## Vollständiges Schema

Das vollständige Prisma-Schema befindet sich in:
```
packages/database/prisma/schema.prisma
```

Umfang: 716 Zeilen mit 20+ Modellen.

---

*Siehe auch: [tech-stack.md](tech-stack.md) | [i18n.md](i18n.md)*

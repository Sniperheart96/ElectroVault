# Dokumentation vs. Code - Analyse

**Erstellt:** 2025-12-28
**Zweck:** Vergleich der Dokumentation mit dem tatsächlich implementierten Code

---

## Zusammenfassung

Diese Analyse vergleicht die Projektdokumentation in `docs/` mit dem implementierten Code. Die meisten Implementierungen entsprechen der Dokumentation, jedoch wurden einige Abweichungen, Erweiterungen und potenzielle Inkonsistenzen identifiziert.

---

## 1. Prisma-Schema Abweichungen

### 1.1 ComponentStatus vs. Dokumentation

**Dokumentation (database-schema.md):**
```prisma
enum ComponentStatus {
  DRAFT           // Entwurf
  PENDING_REVIEW  // Wartet auf Freigabe
  ACTIVE          // Aktiv/Freigegeben
  ARCHIVED        // Archiviert
  REJECTED        // Abgelehnt
}
```

**Tatsächlicher Code (schema.prisma):**
```prisma
enum ComponentStatus {
  DRAFT       // In Bearbeitung
  PENDING     // Wartet auf Freigabe
  PUBLISHED   // Veröffentlicht
  ARCHIVED    // Archiviert
}
```

**Abweichung:**
- `PENDING_REVIEW` → `PENDING` (kürzerer Name)
- `ACTIVE` → `PUBLISHED` (semantisch anders)
- `REJECTED` fehlt im Code

**Bewertung:** Die Code-Version ist besser, da:
- `PENDING` ist prägnanter
- `PUBLISHED` drückt den Status klarer aus als `ACTIVE`
- `REJECTED` Einträge werden stattdessen als `ARCHIVED` mit einem ModerationLog-Eintrag geführt (bessere Nachvollziehbarkeit)

**Empfehlung:** Dokumentation anpassen.

---

### 1.2 ConceptRelationType Abweichung

**Dokumentation (component-relations.md):**
```prisma
enum ConceptRelationType {
  DUAL_VERSION
  QUAD_VERSION
  LOW_POWER_VERSION
  HIGH_SPEED_VERSION
  MILITARY_VERSION
  AUTOMOTIVE_VERSION
  FUNCTIONAL_EQUIV
}
```

**Frontend Relations-Editor verwendet andere Typen:**
```typescript
type RelationType =
  | 'EQUIVALENT'
  | 'SIMILAR'
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'REPLACEMENT'
  | 'COMPLEMENT'
  | 'REQUIRES'
  | 'CONFLICTS';
```

**Abweichung:**
Der Frontend-Code (`relations-editor.tsx`) definiert völlig andere Beziehungstypen als das Prisma-Schema und die Dokumentation.

**Bewertung:**
- Das Prisma-Schema hat `ConceptRelationType` mit technischen Varianten (DUAL_VERSION, etc.)
- Die Frontend-Komponente nutzt eigene generische Typen (EQUIVALENT, SIMILAR, etc.)
- Die API-Endpoints für `/relations` (in `api.ts`) erwarten diese generischen Typen
- ABER: Es gibt keinen Backend-Service der diese generischen Typen verarbeitet!

**Kritisch:** Die Route `/relations` wird im API-Client referenziert, existiert aber nicht als eigenständige Route! Die Component-Relations nutzen die `/components/:id/relations` Endpoints.

**Empfehlung:**
1. Die generischen Typen (EQUIVALENT, SIMILAR, etc.) sind intuitiver für Endnutzer
2. Das `ConceptRelationType` im Schema beschreibt technische Hardware-Varianten
3. Dies könnten zwei separate Konzepte sein, die aber nicht klar getrennt dokumentiert sind
4. Die API-Client-Methoden `createRelation()`, `updateRelation()`, `deleteRelation()` und `getRelation()` rufen nicht-existente Endpoints auf!

---

### 1.3 PartRelationship vs. ComponentConceptRelation

**Im Schema existieren zwei Beziehungsmodelle:**

1. `ComponentConceptRelation` - Beziehungen zwischen CoreComponents (im Code)
2. `PartRelationship` - Beziehungen zwischen ManufacturerParts (im Schema)

**Dokumentation erwähnt:**
- Phase 4: "Beziehungen verwalten (Alternativen, Nachfolger)"
- component-relations.md beschreibt nur ComponentConceptRelation

**Bewertung:**
- PartRelationship (zwischen konkreten Herstellerteilen) ist nicht im Frontend implementiert
- ComponentConceptRelation (zwischen logischen Bauteilen) ist implementiert
- Die Dokumentation vermischt diese Konzepte teilweise

**Empfehlung:** Klare Unterscheidung in der Dokumentation:
- **ComponentConceptRelation**: "NE555 hat eine CMOS-Version ICM7555"
- **PartRelationship**: "TI NE555P kann durch ST NE555N ersetzt werden"

---

## 2. API-Endpunkte Diskrepanzen

### 2.1 Nicht-existente Endpoints im API-Client

**Der API-Client (api.ts) definiert:**
```typescript
getRelation(id: string)        // GET /relations/:id
createRelation(data)           // POST /relations
updateRelation(id, data)       // PATCH /relations/:id
deleteRelation(id)             // DELETE /relations/:id
createBulkRelations(data)      // POST /relations/bulk
```

**Diese Endpoints existieren NICHT im Backend!**

Die tatsächlichen Endpoints für Component-Relations sind:
- `GET /api/v1/components/:id/relations`
- `POST /api/v1/components/:id/relations`
- `PATCH /api/v1/components/:id/relations/:relationId`
- `DELETE /api/v1/components/:id/relations/:relationId`

**Bewertung:** Der API-Client hat veraltete/nie implementierte Methoden.

**Empfehlung:** Entfernen oder korrekt implementieren der nicht-funktionierenden API-Client-Methoden.

---

### 2.2 Pagination Response-Format

**Dokumentation (phase-2-component-api.md):**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Tatsächlicher Code (api.ts Interface):**
```typescript
interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Abweichung:** `meta` → `pagination`

**Bewertung:** Kleine Inkonsistenz, Code-Version ist akzeptabel.

**Empfehlung:** Dokumentation anpassen auf `pagination`.

---

## 3. Fehlende Implementierungen

### 3.1 Laut Dokumentation geplant, aber nicht implementiert

| Feature | Dokumentation | Status |
|---------|---------------|--------|
| OpenAPI/Swagger | phase-2 "optional" | Nicht implementiert |
| PostgreSQL Volltextsuche | phase-2 "optional" | Nicht implementiert |
| mathjs Einheiten-Parsing | tech-stack.md | Nicht implementiert |
| Prisma Client Extensions (Soft-Delete, Audit) | tech-stack.md | Manuell implementiert statt Extension |
| packages/ui (shadcn shared) | tech-stack.md | Nicht vorhanden, UI-Komponenten in apps/web |

### 3.2 mathjs Integration fehlt

**Dokumentation (tech-stack.md):**
```typescript
import { unit } from 'mathjs';
const parsed = unit("100 uF");
const normalizedValue = parsed.toNumber('F'); // 0.0001
```

**Realität:** mathjs ist nicht installiert, keine SI-Einheiten-Normalisierung implementiert.

**Bewertung:** Signifikante Feature-Lücke für eine Bauteil-Datenbank.

**Empfehlung:**
- mathjs hinzufügen für Einheiten-Parsing
- Oder: Alternative wie `convert-units` oder eigene Implementierung

---

### 3.3 Prisma Extensions

**Dokumentation (tech-stack.md):**
```typescript
export const prisma = new PrismaClient()
  .$extends(softDeleteExtension)
  .$extends(auditLogExtension);
```

**Realität (packages/database/src/index.ts):**
- Keine Extensions implementiert
- Soft-Delete wird manuell in Services gehandhabt
- Audit-Logging wird manuell in Services aufgerufen

**Bewertung:** Beide Ansätze funktionieren, Extensions wären DRY-er.

**Empfehlung:** Aktuelle manuelle Implementierung beibehalten, aber Dokumentation aktualisieren.

---

## 4. Package-Struktur Abweichungen

### 4.1 packages/ui existiert nicht

**Dokumentation:**
```
packages/
├── ui/                    # Shared UI Components (shadcn/ui)
```

**Realität:**
- Kein `packages/ui` Ordner
- shadcn/ui Komponenten direkt in `apps/web/src/components/ui/`

**Bewertung:** Pragmatische Entscheidung, da nur eine Frontend-App existiert.

**Empfehlung:** Dokumentation anpassen oder package erstellen wenn zweite App kommt.

---

### 4.2 packages/shared/src/units fehlt

**Dokumentation (tech-stack.md):**
```
packages/shared/
├── src/
│   ├── units/
│   │   ├── parser.ts
│   │   ├── normalize.ts
│   │   └── categories.ts
```

**Realität:**
- Nur `packages/shared/src/i18n/` existiert
- Kein `units/` Ordner

**Bewertung:** Feature nicht implementiert.

---

## 5. UI/Frontend Abweichungen

### 5.1 Anzahl UI-Komponenten

**Dokumentation (phase-3-frontend.md):** "16 Stück" bzw. "19 Stück"

**Tatsächlich in apps/web/src/components/ui/:**
- button.tsx
- input.tsx
- card.tsx
- badge.tsx
- breadcrumb.tsx
- dialog.tsx
- table.tsx
- toast.tsx, toaster.tsx
- label.tsx
- select.tsx
- textarea.tsx
- skeleton.tsx
- form.tsx
- alert-dialog.tsx
- avatar.tsx
- checkbox.tsx
- collapsible.tsx
- alert.tsx
- tabs.tsx
- progress.tsx

**Gezählt: 20 Komponenten** (mehr als dokumentiert)

**Empfehlung:** Dokumentation aktualisieren.

---

### 5.2 Fehlende Detailseiten

**Dokumentation (phase-3-frontend.md):**
```
/components/:slug - Komponenten-Detail mit Parts
```

**Realität:**
- Route existiert: `apps/web/src/app/components/[slug]/page.tsx`
- Aber: Detailseiten zeigen grundlegende Infos, keine vollständigen Part-Listen

**Bewertung:** Basis implementiert, Details könnten erweitert werden.

---

## 6. Auth-System

### 6.1 Rollen Case-Sensitivity

**Dokumentation (auth-keycloak.md):**
> Keycloak-Rollen sind lowercase (`admin`), Code erwartet oft uppercase (`ADMIN`).

**Code (routes/components/index.ts):**
```typescript
app.requireRole('CONTRIBUTOR')  // Uppercase
```

**Bewertung:** Das Auth-Plugin scheint case-insensitive zu funktionieren (laut auth-keycloak.md), was gut ist.

**Potentielles Problem:** Wenn jemand den Code liest, könnte er annehmen dass Keycloak auch ADMIN (uppercase) erwartet.

---

## 7. i18n-System

### 7.1 next-intl vs. Dokumentation

**Dokumentation:** next-intl konfiguriert mit messages/de.json und messages/en.json

**Realität:**
- `apps/web/messages/de.json` existiert
- `apps/web/messages/en.json` existiert
- `apps/web/src/i18n/request.ts` existiert

**Bewertung:** Korrekt implementiert.

---

### 7.2 API-Response Lokalisierung

**Dokumentation (i18n.md):**
```json
{
  "name": "Kondensator",
  "name_locales": ["de", "en"],
  "name_all": { "de": "Kondensator", "en": "Capacitor" }
}
```

**Realität:** API gibt LocalizedString direkt zurück, keine Aufspaltung in `name_locales` oder `name_all`.

```json
{
  "name": { "de": "Kondensator", "en": "Capacitor" }
}
```

**Bewertung:** Die Realität ist einfacher und praktikabler. Die Dokumentation beschreibt ein aufwändigeres System das nicht implementiert wurde.

**Empfehlung:** Dokumentation anpassen.

---

## 8. Beziehungstypen-Chaos

### Zusammenfassung der Beziehungstypen im Projekt

| Ort | Typen | Verwendung |
|-----|-------|------------|
| Prisma `ConceptRelationType` | DUAL_VERSION, QUAD_VERSION, LOW_POWER_VERSION, HIGH_SPEED_VERSION, MILITARY_VERSION, AUTOMOTIVE_VERSION, FUNCTIONAL_EQUIV | Hardware-Varianten |
| Prisma `RelationshipType` | SUCCESSOR, PREDECESSOR, ALTERNATIVE, FUNCTIONAL_EQUIV, VARIANT, SECOND_SOURCE, COUNTERFEIT_RISK | Part-Beziehungen (nicht im UI) |
| Frontend `RelationType` | EQUIVALENT, SIMILAR, UPGRADE, DOWNGRADE, REPLACEMENT, COMPLEMENT, REQUIRES, CONFLICTS | Relations-Editor |
| Dokumentation component-relations.md | ConceptRelationType | ✓ |
| Dokumentation phase-4.md | "Beziehungen: EQUIVALENT, SIMILAR, UPGRADE..." | Frontend-Typen |

**Problem:** Drei verschiedene Beziehungstyp-Sets, die nicht zusammenpassen.

**Empfehlung:**
1. Entscheiden welche Typen benötigt werden
2. Schema, Code und Dokumentation synchronisieren
3. Eventuell: ConceptRelationType um generische Typen erweitern ODER
4. PartRelationship nutzen und ComponentConceptRelation für technische Varianten belassen

---

## 9. File-Upload-System

### 9.1 Doppeltes Dateisystem

**Im Schema:**
1. `FileAttachment` - Neues generisches System
2. `PartDatasheet`, `PartImage`, `EcadFootprint`, `PartEcadModel` - Legacy-Modelle

**Dokumentation (phase-4-community.md):** Nur FileAttachment erwähnt.

**Realität:** Beide Systeme existieren parallel im Schema.

**Kommentar im Schema:**
```prisma
// Bestehende Modelle (Legacy - können später migriert werden)
model PartDatasheet { ... }
```

**Bewertung:** Technische Schulden, aber bewusst dokumentiert.

---

## 10. Positiv: Was gut umgesetzt wurde

1. **2-Ebenen-Architektur** (CoreComponent → ManufacturerPart): Exakt wie dokumentiert
2. **Soft-Delete**: Konsistent implementiert
3. **LocalizedString**: Funktioniert wie beschrieben
4. **Kategorie-Hierarchie**: 4 Ebenen korrekt implementiert
5. **Audit-Logging**: Vorhanden und funktional
6. **Moderation-Queue**: Vollständig implementiert
7. **Pin-Mapping**: Komplett mit UI
8. **Admin-UI**: Alle dokumentierten Features vorhanden

---

## 11. Handlungsempfehlungen

### Hohe Priorität

1. **API-Client bereinigen**: Nicht-existente Endpoints entfernen
2. **Beziehungstypen klären**: Ein einheitliches Set definieren
3. **Dokumentation synchronisieren**: ComponentStatus, Pagination-Format

### Mittlere Priorität

4. **packages/ui erwägen**: Wenn zweite App geplant
5. **mathjs evaluieren**: SI-Einheiten-Parsing hinzufügen?
6. **Legacy-Datemodelle**: Migration oder Entfernung planen

### Niedrige Priorität

7. **Prisma Extensions**: Nice-to-have für DRY-Code
8. **OpenAPI**: Hilfreich für externe Entwickler
9. **UI-Komponenten-Zählung**: Nur Dokumentations-Update

---

*Ende der Analyse*

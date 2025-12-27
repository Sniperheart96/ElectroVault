# Phase 4: Community-Features (MVP)

**Status:** ⏳ Geplant
**Fortschritt:** 0%

---

## Übersicht

Phase 4 implementiert die Features für Community-Beiträge: Erstellung, Upload und Moderation.

---

## Aufgaben

- [ ] Komponenten-Erstellung (Formular)
- [ ] Dynamische Attribut-Formulare (basierend auf Kategorie)
- [ ] Datasheet-Upload (MinIO)
- [ ] Bild-Upload
- [ ] Pin-Mapping Editor
- [ ] Beziehungen verwalten (Alternativen, Nachfolger)
- [ ] Moderations-Queue

---

## Komponenten-Erstellung

### Workflow

1. Nutzer wählt Kategorie
2. Formular zeigt kategoriespezifische Attribute
3. Nutzer füllt Pflichtfelder aus
4. Optional: Datenblatt/Bilder hochladen
5. Absenden → Status: PENDING_REVIEW
6. Moderator prüft und gibt frei

### Dynamische Attribute

```typescript
// API liefert Attribut-Definitionen pro Kategorie
const attributes = await api.get(`/categories/${categoryId}/attributes`);

// Formular wird dynamisch generiert
attributes.forEach(attr => {
  if (attr.dataType === 'DECIMAL') {
    form.register(attr.name, { valueAsNumber: true });
  } else if (attr.dataType === 'RANGE') {
    form.register(`${attr.name}_min`);
    form.register(`${attr.name}_max`);
  }
});
```

---

## Datei-Upload (MinIO)

### Architektur

```
Browser → API → MinIO
           ↓
         Prisma (Metadaten)
```

### API-Endpunkte

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/v1/upload/datasheet` | Datenblatt hochladen |
| POST | `/api/v1/upload/image` | Bild hochladen |
| DELETE | `/api/v1/files/:id` | Datei löschen |

### Validierung

- **Datasheets:** PDF, max 50MB
- **Bilder:** JPG/PNG/WebP, max 10MB
- Virus-Scan (optional, ClamAV)

---

## Pin-Mapping Editor

Visueller Editor für Pin-Zuordnungen:

```
┌─────────────────────┐
│  IC (Top View)      │
├──┬──┬──┬──┬──┬──┬──┤
│ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│
├──┴──┴──┴──┴──┴──┴──┤
│  GND│ TR│OUT│RST│CVT│THR│DIS│VCC │
│  PWR│ IN│OUT│ IN│ANA│ IN│OUT│PWR │
└─────────────────────┘
```

---

## Beziehungs-Editor

Verknüpfungen zwischen Bauteilen:

| Typ | Beschreibung |
|-----|--------------|
| SUCCESSOR | Neuere Version |
| ALTERNATIVE | Anderer Hersteller |
| FUNCTIONAL_EQUIV | Gleiche Funktion |
| SECOND_SOURCE | Lizenzierte Kopie |

---

## Moderations-Queue

### Status-Flow

```
DRAFT → PENDING_REVIEW → ACTIVE
                       ↘ REJECTED
```

### Moderator-Ansicht

- Liste aller PENDING_REVIEW Einträge
- Vergleichs-Ansicht (Änderungen hervorgehoben)
- Approve/Reject mit Kommentar
- Batch-Aktionen

---

*Nächste Phase: [phase-5-devices.md](phase-5-devices.md)*

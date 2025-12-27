# Phase 5: Geräte-Reparatur-Datenbank

**Status:** ⏳ Geplant
**Fortschritt:** 0%

---

## Konzept

Nicht nur Schaltpläne scannen, sondern vollständige Bauteil-Verknüpfungen für Reparaturen dokumentieren. Ermöglicht Schaltplan-Rekonstruktion durch Dokumentation.

---

## Hierarchie

```
Gerät (Device)
  └── Baugruppe (Assembly)
        └── Bauteil-Position (ComponentPosition)
              ├── Verknüpftes Bauteil (→ CoreComponent)
              ├── Lötpunkte (SolderPoints)
              └── Alternativ-Bauteile (Replacements)
```

---

## Datenbank-Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `Device` | Gerät (Fernseher, Radio, etc.) mit Hersteller, Modell, Baujahr |
| `DeviceDocument` | Handbücher, Schaltpläne, Service-Manuals |
| `Assembly` | Baugruppe innerhalb eines Geräts (z.B. Netzteil, Tuner) |
| `AssemblyMedia` | Fotos, Detail-Schaltpläne der Baugruppe |
| `ComponentPosition` | Konkrete Bauteil-Position auf einer Baugruppe |
| `SolderPoint` | Lötpunkte eines Bauteils (für Schaltplan-Rekonstruktion) |
| `PositionReplacement` | Dokumentierte Alternativ-Bauteile von anderen Nutzern |

---

## Beispiel-Workflow

1. **Nutzer A** legt "Grundig TV 1965" an
2. Fügt Baugruppe "Netzteil" hinzu mit Foto
3. Dokumentiert Bauteil C12 an Position "Elko 100µF" mit 2 Lötpunkten
4. **Nutzer B** repariert gleiches Gerät, sieht dass Nutzer A bei C12 einen modernen Ersatz verwendet hat
5. Ohne Schaltplan kann durch Lötpunkt-Dokumentation der Stromfluss rekonstruiert werden

---

## Aufgaben

- [ ] Device CRUD API
- [ ] Assembly CRUD mit Medien-Upload
- [ ] ComponentPosition mit Lötpunkt-Editor
- [ ] Verknüpfung zu CoreComponent/ManufacturerPart
- [ ] Replacement-Dokumentation (welcher Nutzer hat was ersetzt)
- [ ] Reparatur-Historie pro Gerät
- [ ] Schaltplan-Viewer mit interaktiven Bauteil-Markierungen
- [ ] Such-Funktion: "Zeige alle Geräte mit Bauteil X"

---

## UI-Konzept

### Geräte-Detailseite

```
┌────────────────────────────────────────────────┐
│ Grundig TV Super Color 1580                    │
│ Baujahr: 1985 | Hersteller: Grundig            │
├────────────────────────────────────────────────┤
│ [Foto] [Schaltplan] [Service-Manual]           │
├────────────────────────────────────────────────┤
│ Baugruppen:                                    │
│ ├── Netzteil (12 Bauteile dokumentiert)        │
│ ├── Tuner (5 Bauteile dokumentiert)            │
│ └── Horizontal-Ablenkung (8 Bauteile)          │
├────────────────────────────────────────────────┤
│ Reparatur-Erfolge von anderen Nutzern:         │
│ • C45 ersetzt durch moderne Alternative (3x)   │
│ • TR2 häufig defekt (5 Berichte)               │
└────────────────────────────────────────────────┘
```

### Lötpunkt-Editor

```
         ┌───────────────────┐
         │     Baugruppe     │
         │    (Foto/Scan)    │
         │                   │
    ●────┤ C12              │
    │    │  ○ Lötpunkt 1    │
    │    │  ○ Lötpunkt 2    │
    │    └───────────────────┘
    │
    └──→ Verbindung zu: R15 Pin 1
```

---

## Schaltplan-Rekonstruktion

Durch Dokumentation der Lötpunkte und deren Verbindungen kann ein vereinfachter Schaltplan automatisch generiert werden:

```
C12 (100µF) ───┬─── GND
               │
               └─── R15 (1kΩ) ─── TR1 Basis
```

---

*Vorherige Phase: [phase-4-community.md](phase-4-community.md)*

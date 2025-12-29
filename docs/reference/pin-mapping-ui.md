# Pin-Mapping UI

## Übersicht

Das Pin-Mapping-Feature ermöglicht es, die Pin-Belegung von Bauteilen (CoreComponents) zu dokumentieren und zu verwalten. Da alle Herstellervarianten eines Bauteils das gleiche Pin-Mapping haben müssen, wird es auf Component-Ebene definiert.

## Komponenten

### PinMappingEditor

**Datei:** `apps/web/src/components/admin/pin-mapping-editor.tsx`

Eine vollständige UI zur Verwaltung von Pin-Definitionen für ein Component.

#### Features

- Tabellenansicht aller Pins mit Inline-Editing
- Pin-Typen mit visuellen Farb-Badges
- Drag & Drop Reorder mit Pfeil-Buttons
- Einzelner Pin hinzufügen
- Bulk-Import über CSV-Format
- Löschen-Bestätigung mit AlertDialog

#### Props

```typescript
interface PinMappingEditorProps {
  componentId: string;
}
```

#### Pin-Datenmodell

```typescript
interface Pin {
  id: string;
  componentId: string;
  pinNumber: string;       // "1", "2", "VCC", "GND", etc.
  pinName: string;         // Name des Pins
  pinFunction: LocalizedString | null;
  pinType: PinType | null; // POWER, GROUND, INPUT, OUTPUT, etc.
  maxVoltage: number | null;
  maxCurrent: number | null;
}
```

#### Pin-Typen

| Typ | Label | Farbe | Verwendung |
|-----|-------|-------|------------|
| POWER | Power | Rot | Versorgungsspannung (VCC, VDD, etc.) |
| GROUND | Ground | Schwarz | Masse (GND, VSS, etc.) |
| INPUT | Input | Grün | Eingangssignale |
| OUTPUT | Output | Blau | Ausgangssignale |
| BIDIRECTIONAL | Bidirektional | Violett | I/O-Pins |
| NC | NC (Not Connected) | Grau | Nicht verbunden |
| ANALOG | Analog | Orange | Analoge Signale |
| DIGITAL | Digital | Cyan | Digitale Signale |
| CLOCK | Clock | Gelb | Taktsignale |
| OTHER | Sonstiges | Grau | Sonstige |

#### Bulk-Import Format

CSV-Format mit Semikolon als Zeilen-Trenner:

```
pinNummer,pinName,pinTyp;pinNummer,pinName,pinTyp
```

Beispiel:
```
1,VCC,POWER;2,GND,GROUND;3,IN,INPUT;4,OUT,OUTPUT;5,CLK,CLOCK
```

Der Pin-Typ ist optional. Wird er weggelassen, ist der Pin ohne Typ.

### Integration in ComponentDialog

**Datei:** `apps/web/src/components/admin/component-dialog.tsx`

Der PinMappingEditor ist als Tab im Component-Dialog integriert.

#### Verhalten

- Wird nur angezeigt, wenn das Component bereits gespeichert ist (isEdit mode)
- Als Tab innerhalb des Component-Dialogs
- Ermöglicht die Verwaltung aller Pins eines Components

```tsx
<TabsContent value="pins" className="space-y-4 mt-4">
  <PinMappingEditor componentId={component.id} />
</TabsContent>
```

## API-Integration

### API Client Methoden

**Datei:** `apps/web/src/lib/api.ts`

Folgende Methoden wurden zum ApiClient hinzugefügt:

```typescript
// Pin Management
getPinsByComponentId(componentId: string): Promise<ApiResponse<Pin[]>>
createPin(componentId: string, data: CreatePinInput): Promise<ApiResponse<Pin>>
bulkCreatePins(componentId: string, pins: CreatePinInput[]): Promise<ApiResponse<Pin[]>>
updatePin(id: string, data: UpdatePinInput): Promise<ApiResponse<Pin>>
deletePin(id: string): Promise<void>
reorderPins(componentId: string, pins: ReorderPinInput[]): Promise<ApiResponse<Pin[]>>
deleteAllPins(componentId: string): Promise<void>
```

> **Hinweis:** `getPin(id)` wurde entfernt, da Pins immer über das Component geladen werden (`getPinsByComponentId`). Für Edit/Delete wird nur die Pin-ID benötigt.

### Backend Endpoints

Die UI nutzt folgende Backend-Endpoints:

- `GET /components/:componentId/pins` - Alle Pins eines Components
- `POST /components/:componentId/pins` - Neuen Pin erstellen
- `POST /components/:componentId/pins/bulk` - Mehrere Pins erstellen
- `PATCH /pins/:id` - Pin aktualisieren
- `DELETE /pins/:id` - Pin löschen
- `POST /components/:componentId/pins/reorder` - Pin-Reihenfolge ändern
- `DELETE /components/:componentId/pins` - Alle Pins löschen (Moderator)

## Zod Schemas

**Package:** `@electrovault/schemas`

```typescript
import {
  CreatePinSchema,
  UpdatePinSchema,
  BulkCreatePinsSchema,
  ReorderPinSchema,
  BulkReorderPinsSchema,
  type CreatePinInput,
  type UpdatePinInput,
  type PinType,
} from '@electrovault/schemas';
```

## Verwendete shadcn/ui Komponenten

- `Table` - Tabellen-Darstellung der Pins
- `Form` - Formular-Validierung
- `Input` - Text-Eingabefelder
- `Select` - Dropdown für Pin-Typen
- `Button` - Aktions-Buttons
- `Badge` - Visuelle Typ-Anzeige
- `Textarea` - Bulk-Import Eingabe
- `AlertDialog` - Löschen-Bestätigung
- `Collapsible` - Ausklappbare Sektion
- `Tabs` - Tab-Navigation zwischen Liste und Bulk-Import

## State Management

Der Editor nutzt einen `refreshKey` State, um die Pin-Liste nach Änderungen neu zu laden:

```typescript
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  const loadPins = async () => {
    const response = await api.getPinsByComponentId(componentId);
    setPins(response.data);
  };
  loadPins();
}, [componentId, api, toast, refreshKey]);

// Nach Änderungen
setRefreshKey((prev) => prev + 1);
```

Dies vermeidet die Notwendigkeit einer separaten `loadPins()` Funktion und hält die Dependencies sauber.

## UX-Details

### Inline-Editing

Alle Pin-Felder können direkt in der Tabelle bearbeitet werden. Änderungen werden sofort an das Backend gesendet.

### Visuelle Pin-Typen

Jeder Pin-Typ hat eine eigene Farbe im Badge-Format, um die Funktion auf einen Blick zu erkennen:

- Power (rot) - Spannungsversorgung
- Ground (schwarz) - Masse
- Input (grün) - Eingänge
- Output (blau) - Ausgänge
- Clock (gelb) - Takt

### Reorder-Funktionalität

Pins können mit Pfeil-Buttons nach oben oder unten verschoben werden. Die neue Reihenfolge wird automatisch in die `pinNumber` übernommen.

### Bulk-Import

Für ICs mit vielen Pins ist der Bulk-Import effizienter als einzelnes Hinzufügen:

1. Tab "Bulk-Import" wählen
2. CSV-Format eingeben
3. "Pins importieren" klicken

## Best Practices

1. **Pin-Nummern konsistent halten** - Entweder numerisch (1, 2, 3) oder symbolisch (VCC, GND)
2. **Pin-Typen setzen** - Hilft beim automatischen Schaltplan-Routing
3. **Deutsche Funktionsbeschreibung** - Im `pinFunction.de` Feld
4. **Bulk-Import für viele Pins** - Effizienter als einzelnes Hinzufügen

## Fehlerbehandlung

- Alle API-Fehler werden als Toast-Nachrichten angezeigt
- Löschen-Aktionen erfordern Bestätigung via AlertDialog
- Ungültige Bulk-Import-Daten zeigen spezifische Fehlermeldung
- Keine Dummy-Daten im Fehlerfall (siehe CLAUDE.md)

## Verwandte Dokumentation

- [Database Schema](../architecture/database-schema.md)
- [API-Endpunkte](api-endpoints.md)
- [Pin-Mapping Anleitung](../guides/pin-mapping.md)

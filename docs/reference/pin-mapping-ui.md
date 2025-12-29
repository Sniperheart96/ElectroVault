# Pin-Mapping UI

## Übersicht

Das Pin-Mapping-Feature ermöglicht es, die Pin-Belegung von Bauteilen (ManufacturerParts) zu dokumentieren und zu verwalten.

## Komponenten

### PinMappingEditor

**Datei:** `apps/web/src/components/admin/pin-mapping-editor.tsx`

Eine vollständige UI zur Verwaltung von Pin-Definitionen für ein Part.

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
  partId: string;
}
```

#### Pin-Datenmodell

```typescript
interface Pin {
  id: string;
  partId: string;
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

### Integration in PartDialog

**Datei:** `apps/web/src/components/admin/part-dialog.tsx`

Der PinMappingEditor ist als ausklappbare Sektion in den Part-Dialog integriert.

#### Verhalten

- Wird nur angezeigt, wenn das Part bereits gespeichert ist (isEdit mode)
- Als Collapsible-Komponente, um Platz zu sparen
- Badge zeigt an, dass Pin-Belegung verfügbar ist
- Öffnet standardmäßig geschlossen

```tsx
{isEdit && part && (
  <div className="border-t pt-4 mt-4">
    <Collapsible open={pinMappingOpen} onOpenChange={setPinMappingOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Pin-Mapping</span>
            <Badge variant="secondary">Belegung</Badge>
          </div>
          {pinMappingOpen ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <PinMappingEditor partId={part.id} />
      </CollapsibleContent>
    </Collapsible>
  </div>
)}
```

## API-Integration

### API Client Methoden

**Datei:** `apps/web/src/lib/api.ts`

Folgende Methoden wurden zum ApiClient hinzugefügt:

```typescript
// Pin Management
getPinsByPartId(partId: string): Promise<ApiResponse<Pin[]>>
createPin(partId: string, data: CreatePinInput): Promise<ApiResponse<Pin>>
bulkCreatePins(partId: string, pins: CreatePinInput[]): Promise<ApiResponse<Pin[]>>
updatePin(id: string, data: UpdatePinInput): Promise<ApiResponse<Pin>>
deletePin(id: string): Promise<void>
reorderPins(partId: string, pins: ReorderPinInput[]): Promise<ApiResponse<Pin[]>>
deleteAllPins(partId: string): Promise<void>
```

> **Hinweis:** `getPin(id)` wurde entfernt, da Pins immer über den Part geladen werden (`getPinsByPartId`). Für Edit/Delete wird nur die Pin-ID benötigt.

### Backend Endpoints

Die UI nutzt folgende Backend-Endpoints:

- `GET /parts/:partId/pins` - Alle Pins eines Parts
- `POST /parts/:partId/pins` - Neuen Pin erstellen
- `POST /parts/:partId/pins/bulk` - Mehrere Pins erstellen
- `PATCH /pins/:id` - Pin aktualisieren
- `DELETE /pins/:id` - Pin löschen
- `POST /parts/:partId/pins/reorder` - Pin-Reihenfolge ändern
- `DELETE /parts/:partId/pins` - Alle Pins löschen (Moderator)

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
    const response = await api.getPinsByPartId(partId);
    setPins(response.data);
  };
  loadPins();
}, [partId, api, toast, refreshKey]);

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

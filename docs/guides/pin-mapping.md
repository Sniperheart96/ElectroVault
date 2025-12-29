# Pin-Mapping - Anleitung

## Konzept

Pin-Mapping ermöglicht die detaillierte Dokumentation der Pin-Belegung elektronischer Bauteile. Jedes CoreComponent kann eine beliebige Anzahl von Pins haben, die mit Namen, Typen und Funktionen beschrieben werden. Da alle Herstellervarianten eines Bauteils das gleiche Pin-Mapping haben müssen (sonst wäre es nicht das gleiche Bauteil), wird das Pin-Mapping auf Component-Ebene definiert.

### Wann wird Pin-Mapping verwendet?

- **ICs und Mikrocontroller** - Alle digitalen und analogen ICs
- **Transistoren** - Basis, Kollektor, Emitter bzw. Gate, Drain, Source
- **Steckverbinder** - Mehrpolige Stecker und Buchsen
- **Passive Bauteile** - Bei polarisierten Bauteilen (z.B. Elkos: +/-)
- **Module** - Komplexe Module mit definierten Anschlusspunkten

### Einsatzzweck

- Schaltplan-Digitalisierung: Pins können in ECAD-Systemen referenziert werden
- Reparatur-Dokumentation: Pinout für Geräte-Reparaturen
- Ersatzteil-Suche: Kompatibilitätsprüfung anhand Pin-Kompatibilität
- Historische Bauteile: Dokumentation veralteter Bauteile ohne verfügbare Datenblätter

---

## Datenmodell

### PinMapping

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Eindeutige ID des Pins |
| `componentId` | UUID | Referenz zum CoreComponent |
| `pinNumber` | String (max 20) | Pin-Nummer oder -Bezeichnung (z.B. "1", "VCC", "A0") |
| `pinName` | String (max 100) | Technischer Name des Pins |
| `pinFunction` | LocalizedString (optional) | Mehrsprachige Beschreibung der Pin-Funktion |
| `pinType` | PinType (optional) | Typ des Pins (siehe unten) |
| `maxVoltage` | Decimal (optional) | Maximale Spannung in Volt |
| `maxCurrent` | Decimal (optional) | Maximaler Strom in Ampere |

**Constraint:** Die Kombination `(componentId, pinNumber)` ist eindeutig - pro Component kann jede Pin-Nummer nur einmal vorkommen.

### PinType Enum

| Wert | Beschreibung | Anwendungsbeispiel |
|------|--------------|-------------------|
| `POWER` | Versorgungsspannung | VCC, VDD, 5V, 3.3V |
| `GROUND` | Masse | GND, VSS, 0V |
| `INPUT` | Eingang | IN, RX, MISO, Trigger |
| `OUTPUT` | Ausgang | OUT, TX, MOSI, Output |
| `BIDIRECTIONAL` | Bidirektional | SDA, SCL, GPIO |
| `NC` | Not Connected | NC, n.c. |
| `ANALOG` | Analog-Pin | ADC, DAC, AREF |
| `DIGITAL` | Digital-Pin | D0-D7, Datenbus |
| `CLOCK` | Takt-Signal | CLK, XTAL, OSC |
| `OTHER` | Sonstiges | Spezialfunktionen |

**Hinweis:** `pinType` ist optional - bei einfachen Bauteilen (z.B. Widerstand) kann es weggelassen werden.

---

## API-Endpunkte

### GET /api/v1/components/:componentId/pins

Gibt alle Pins eines CoreComponent zurück.

**Authentifizierung:** Nicht erforderlich (öffentlich lesbar)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "componentId": "660e8400-e29b-41d4-a716-446655440000",
      "pinNumber": "1",
      "pinName": "VCC",
      "pinFunction": {
        "de": "Positive Versorgungsspannung",
        "en": "Positive supply voltage"
      },
      "pinType": "POWER",
      "maxVoltage": 16.0,
      "maxCurrent": 0.1
    }
  ]
}
```

### POST /api/v1/components/:componentId/pins

Erstellt einen neuen Pin.

**Authentifizierung:** `CONTRIBUTOR` oder höher

**Request Body:**
```json
{
  "pinNumber": "1",
  "pinName": "VCC",
  "pinFunction": {
    "de": "Positive Versorgungsspannung"
  },
  "pinType": "POWER",
  "maxVoltage": 16.0,
  "maxCurrent": 0.1
}
```

**Response:** `201 Created` mit erstelltem Pin

**Fehler:**
- `409 Conflict` - Pin-Nummer existiert bereits für dieses Component
- `404 Not Found` - CoreComponent existiert nicht

### POST /api/v1/components/:componentId/pins/bulk

Erstellt mehrere Pins auf einmal.

**Authentifizierung:** `CONTRIBUTOR` oder höher

**Request Body:**
```json
{
  "pins": [
    {
      "pinNumber": "1",
      "pinName": "GND",
      "pinType": "GROUND"
    },
    {
      "pinNumber": "2",
      "pinName": "TRIGGER",
      "pinType": "INPUT"
    },
    {
      "pinNumber": "3",
      "pinName": "OUTPUT",
      "pinType": "OUTPUT"
    }
  ]
}
```

**Response:** `201 Created` mit Array der erstellten Pins

**Fehler:**
- `400 Bad Request` - Doppelte Pin-Nummern im Input
- `409 Conflict` - Pin-Nummern existieren bereits

### PATCH /api/v1/pins/:id

Aktualisiert einen Pin.

**Authentifizierung:** `CONTRIBUTOR` oder höher

**Request Body:** Alle Felder sind optional
```json
{
  "pinName": "Neuer Name",
  "pinType": "BIDIRECTIONAL"
}
```

**Response:** `200 OK` mit aktualisiertem Pin

### DELETE /api/v1/pins/:id

Löscht einen Pin.

**Authentifizierung:** `CONTRIBUTOR` oder höher

**Response:** `204 No Content`

### POST /api/v1/components/:componentId/pins/reorder

Ändert die Reihenfolge oder Nummern von Pins.

**Authentifizierung:** `CONTRIBUTOR` oder höher

**Request Body:**
```json
{
  "pins": [
    { "id": "uuid-1", "pinNumber": "3" },
    { "id": "uuid-2", "pinNumber": "1" },
    { "id": "uuid-3", "pinNumber": "2" }
  ]
}
```

**Response:** `200 OK` mit `{ "success": true }`

**Fehler:**
- `400 Bad Request` - Pins gehören nicht zum Component oder doppelte Nummern

### DELETE /api/v1/components/:componentId/pins

Löscht alle Pins eines Components.

**Authentifizierung:** `MODERATOR` oder höher

**Response:** `200 OK` mit `{ "deletedCount": 8 }`

---

## Beispiele

### Beispiel 1: IC mit 8 Pins (555 Timer)

```json
[
  { "pinNumber": "1", "pinName": "GND", "pinType": "GROUND" },
  { "pinNumber": "2", "pinName": "TRIGGER", "pinType": "INPUT" },
  { "pinNumber": "3", "pinName": "OUTPUT", "pinType": "OUTPUT" },
  { "pinNumber": "4", "pinName": "RESET", "pinType": "INPUT" },
  { "pinNumber": "5", "pinName": "CONTROL", "pinType": "INPUT" },
  { "pinNumber": "6", "pinName": "THRESHOLD", "pinType": "INPUT" },
  { "pinNumber": "7", "pinName": "DISCHARGE", "pinType": "OUTPUT" },
  { "pinNumber": "8", "pinName": "VCC", "pinType": "POWER" }
]
```

### Beispiel 2: Transistor (NPN)

```json
[
  { "pinNumber": "1", "pinName": "Emitter", "pinType": "OUTPUT" },
  { "pinNumber": "2", "pinName": "Basis", "pinType": "INPUT" },
  { "pinNumber": "3", "pinName": "Kollektor", "pinType": "OUTPUT" }
]
```

### Beispiel 3: Mikrocontroller (ATmega328P)

```json
[
  { "pinNumber": "1", "pinName": "PC6", "pinType": "BIDIRECTIONAL", "pinFunction": { "de": "Reset / ADC6" } },
  { "pinNumber": "2", "pinName": "PD0", "pinType": "BIDIRECTIONAL", "pinFunction": { "de": "RXD / PCINT16" } },
  { "pinNumber": "7", "pinName": "VCC", "pinType": "POWER", "maxVoltage": 5.5 },
  { "pinNumber": "8", "pinName": "GND", "pinType": "GROUND" },
  { "pinNumber": "9", "pinName": "XTAL1", "pinType": "CLOCK", "pinFunction": { "de": "Oszillator Pin 1" } },
  { "pinNumber": "10", "pinName": "XTAL2", "pinType": "CLOCK", "pinFunction": { "de": "Oszillator Pin 2" } }
]
```

### Beispiel 4: Steckverbinder (HDMI)

```json
[
  { "pinNumber": "1", "pinName": "TMDS Data2+", "pinType": "DIGITAL" },
  { "pinNumber": "2", "pinName": "TMDS Data2 Shield", "pinType": "GROUND" },
  { "pinNumber": "3", "pinName": "TMDS Data2-", "pinType": "DIGITAL" },
  { "pinNumber": "18", "pinName": "+5V Power", "pinType": "POWER", "maxVoltage": 5.0, "maxCurrent": 0.5 },
  { "pinNumber": "19", "pinName": "Hot Plug Detect", "pinType": "DIGITAL" }
]
```

### Beispiel 5: Passives Bauteil mit Polarität (Elektrolytkondensator)

```json
[
  { "pinNumber": "1", "pinName": "Positiv (+)" },
  { "pinNumber": "2", "pinName": "Negativ (-)" }
]
```

**Hinweis:** Bei passiven Bauteilen ohne besondere Funktion kann `pinType` weggelassen werden.

---

## Frontend-Nutzung

### Pin-Mapping-Editor Komponente

Die Komponente `<PinMappingEditor componentId="..." />` bietet eine vollständige Benutzeroberfläche zum Verwalten von Pins.

**Features:**
- Einzelne Pins hinzufügen/bearbeiten/löschen
- Bulk-Import im CSV-Format
- Inline-Bearbeitung in Tabelle
- Pin-Reihenfolge ändern (Drag & Drop simuliert)
- Farbcodierte Pin-Typen

**Verwendung:**
```tsx
import { PinMappingEditor } from '@/components/admin/pin-mapping-editor';

function ComponentEditPage({ componentId }: { componentId: string }) {
  return (
    <div>
      <h1>Component bearbeiten</h1>
      <PinMappingEditor componentId={componentId} />
    </div>
  );
}
```

### Bulk-Import Format

Der Pin-Mapping-Editor unterstützt ein CSV-Format für schnellen Import:

**Format:**
```
pinNummer,pinName,pinTyp;pinNummer,pinName,pinTyp;...
```

**Beispiel:**
```
1,GND,GROUND;2,TRIGGER,INPUT;3,OUTPUT,OUTPUT;4,RESET,INPUT;5,CONTROL,INPUT;6,THRESHOLD,INPUT;7,DISCHARGE,OUTPUT;8,VCC,POWER
```

**Regeln:**
- Semikolon (`;`) trennt einzelne Pins
- Komma (`,`) trennt Felder eines Pins
- `pinTyp` ist optional - kann weggelassen werden
- Verfügbare Typen: `POWER`, `GROUND`, `INPUT`, `OUTPUT`, `BIDIRECTIONAL`, `NC`, `ANALOG`, `DIGITAL`, `CLOCK`, `OTHER`

### API-Nutzung in React

```tsx
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

function MyComponent({ componentId }: { componentId: string }) {
  const api = useApi();
  const { toast } = useToast();

  const handleCreatePin = async () => {
    try {
      await api.createPin(componentId, {
        pinNumber: '1',
        pinName: 'VCC',
        pinType: 'POWER',
        pinFunction: { de: 'Versorgungsspannung' },
      });
      toast({
        title: 'Erfolg',
        description: 'Pin wurde erstellt.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Pin konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  return <button onClick={handleCreatePin}>Pin erstellen</button>;
}
```

---

## Best Practices

### 1. Konsistente Pin-Nummerierung

Entweder numerisch ODER symbolisch - nicht mischen.

```
Numerisch (empfohlen bei ICs):
1, 2, 3, 4, 5, 6, 7, 8

Symbolisch (bei Transistoren, einfachen Bauteilen):
VCC, GND, IN, OUT

Gemischt (vermeiden):
1, VCC, 3, GND    // Verwirrend!
```

### 2. Pin-Typen konsequent setzen

```
Alle Power-Pins:
VCC → POWER
VDD → POWER
5V  → POWER

Alle Ground-Pins:
GND → GROUND
VSS → GROUND
0V  → GROUND

NC-Pins explizit markieren:
Pin 7 → NC, Typ: NC
Pin 15 → NC, Typ: NC
```

### 3. Funktionsbeschreibungen lokalisiert

```json
{
  "pinFunction": {
    "de": "Positive Versorgungsspannung",
    "en": "Positive supply voltage"
  }
}
```

### 4. Spannungs- und Stromangaben

Bei Power-Pins und kritischen Pins sollten `maxVoltage` und `maxCurrent` angegeben werden:

```json
{
  "pinNumber": "8",
  "pinName": "VCC",
  "pinType": "POWER",
  "maxVoltage": 16.0,
  "maxCurrent": 0.1,
  "pinFunction": {
    "de": "Versorgungsspannung 4.5V bis 16V, max. 100mA"
  }
}
```

### 5. Bulk-Import für viele Pins

Bei Bauteilen mit vielen Pins (z.B. Mikrocontroller mit 40+ Pins) ist der Bulk-Import effizienter als einzelne Pins zu erstellen.

```
1,PC6,BIDIRECTIONAL;2,PD0,BIDIRECTIONAL;3,PD1,BIDIRECTIONAL;4,PD2,BIDIRECTIONAL;...
```

### 6. Pin-Reihenfolge beibehalten

Die Pin-Reihenfolge sollte der physischen Anordnung im Datenblatt entsprechen:

- Bei DIP-Gehäusen: Pin 1 oben links, gegen Uhrzeigersinn
- Bei SOIC/TSSOP: Pin 1 oben links, gegen Uhrzeigersinn
- Bei Transistoren: Basis, Emitter, Kollektor (typische Reihenfolge)

---

## Validierung

### Pin-Nummer

- Pflichtfeld
- Maximal 20 Zeichen
- Muss eindeutig sein pro Component
- Kann alphanumerisch sein (z.B. "A1", "VCC", "GPIO0")

### Pin-Name

- Pflichtfeld
- Maximal 100 Zeichen
- Technischer Name des Pins

### Pin-Typ

- Optional
- Muss einem der PinType-Enum-Werte entsprechen
- Kann `null` sein (bei passiven Bauteilen ohne besondere Funktion)

### Pin-Funktion

- Optional
- LocalizedString-Format: `{ "de": "...", "en": "..." }`
- Kann mehrere Sprachen enthalten

### Spannungs- und Stromangaben

- Optional
- Müssen positiv sein wenn angegeben
- Decimal-Format (z.B. `5.5`, `0.1`)

---

## Fehlerbehandlung

### Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `409 Conflict` | Pin-Nummer existiert bereits | Andere Pin-Nummer verwenden oder bestehenden Pin aktualisieren |
| `404 Not Found` | Component-ID ungültig | Prüfen ob CoreComponent existiert |
| `400 Bad Request` | Doppelte Pin-Nummern im Bulk-Import | Duplikate entfernen |
| `400 Bad Request` | Ungültiger PinType | Nur erlaubte PinType-Werte verwenden |

### Beispiel: Try-Catch bei API-Aufrufen

```tsx
const handleCreatePin = async (data: CreatePinInput) => {
  try {
    await api.createPin(componentId, data);
    toast({ title: 'Erfolg', description: 'Pin wurde erstellt.' });
  } catch (error) {
    console.error('Failed to create pin:', error);

    let errorMessage = 'Pin konnte nicht erstellt werden.';

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        errorMessage = 'Pin-Nummer existiert bereits.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Component nicht gefunden.';
      }
    }

    toast({
      title: 'Fehler',
      description: errorMessage,
      variant: 'destructive',
    });
  }
};
```

---

## Verwandte Dokumentation

- [Pin-Mapping UI Architektur](../architecture/pin-mapping-ui.md)
- [Zod Schemas](../../packages/schemas/README.md)
- [Lokalisierung](../architecture/i18n.md)

---

*Erstellt: 2025-12-29*

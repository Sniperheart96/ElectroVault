# Pin-Mapping UI - Verwendungsbeispiele

## Grundlegende Verwendung

### 1. Teil-Editor öffnen und Pin-Mapping bearbeiten

```tsx
// In einer Admin-Seite (z.B. parts-list.tsx)
import { PartDialog } from '@/components/admin/part-dialog';

function PartsListPage() {
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setDialogOpen(true);
  };

  return (
    <>
      {/* Parts-Liste */}
      <Button onClick={() => handleEditPart(somePart)}>
        Bearbeiten
      </Button>

      {/* Part-Dialog mit Pin-Mapping */}
      <PartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        part={selectedPart}
        onSaved={() => {
          // Refresh parts list
          setDialogOpen(false);
        }}
      />
    </>
  );
}
```

### 2. Standalone Pin-Mapping Editor

```tsx
// Wenn du nur den Pin-Editor brauchst (z.B. auf einer separaten Pin-Seite)
import { PinMappingEditor } from '@/components/admin/pin-mapping-editor';

function PinMappingPage({ partId }: { partId: string }) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Pin-Belegung bearbeiten</h1>
      <PinMappingEditor partId={partId} />
    </div>
  );
}
```

## Bulk-Import Beispiele

### Standard-IC mit 8 Pins (z.B. 555 Timer)

```csv
1,GND,GROUND;2,TRIGGER,INPUT;3,OUTPUT,OUTPUT;4,RESET,INPUT;5,CONTROL,INPUT;6,THRESHOLD,INPUT;7,DISCHARGE,OUTPUT;8,VCC,POWER
```

### Mikrocontroller mit vielen Pins (z.B. ATmega328P)

```csv
1,PC6,BIDIRECTIONAL;2,PD0,BIDIRECTIONAL;3,PD1,BIDIRECTIONAL;4,PD2,BIDIRECTIONAL;5,PD3,BIDIRECTIONAL;6,PD4,BIDIRECTIONAL;7,VCC,POWER;8,GND,GROUND;9,XTAL1,CLOCK;10,XTAL2,CLOCK;11,PD5,BIDIRECTIONAL;12,PD6,BIDIRECTIONAL;13,PD7,BIDIRECTIONAL;14,PB0,BIDIRECTIONAL;15,PB1,BIDIRECTIONAL;16,PB2,BIDIRECTIONAL;17,PB3,BIDIRECTIONAL;18,PB4,BIDIRECTIONAL;19,PB5,BIDIRECTIONAL;20,AVCC,POWER;21,AREF,ANALOG;22,GND,GROUND;23,PC0,ANALOG;24,PC1,ANALOG;25,PC2,ANALOG;26,PC3,ANALOG;27,PC4,BIDIRECTIONAL;28,PC5,BIDIRECTIONAL
```

### Op-Amp DIP-8 (z.B. LM358)

```csv
1,OUT1,OUTPUT;2,IN1-,INPUT;3,IN1+,INPUT;4,GND,GROUND;5,IN2+,INPUT;6,IN2-,INPUT;7,OUT2,OUTPUT;8,VCC,POWER
```

### Logic Gate (z.B. 74HC00 - Quad NAND)

```csv
1,1A,INPUT;2,1B,INPUT;3,1Y,OUTPUT;4,2A,INPUT;5,2B,INPUT;6,2Y,OUTPUT;7,GND,GROUND;8,3Y,OUTPUT;9,3A,INPUT;10,3B,INPUT;11,4Y,OUTPUT;12,4A,INPUT;13,4B,INPUT;14,VCC,POWER
```

### Kondensator oder Widerstand (nur 2 Pins, keine Typen)

```csv
1,Terminal 1;2,Terminal 2
```

## API-Verwendung (für Custom Components)

### Pins manuell laden und anzeigen

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/use-api';
import type { Pin } from '@/lib/api';

function PinList({ partId }: { partId: string }) {
  const api = useApi();
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    const loadPins = async () => {
      const response = await api.getPinsByPartId(partId);
      setPins(response.data);
    };
    loadPins();
  }, [partId, api]);

  return (
    <ul>
      {pins.map((pin) => (
        <li key={pin.id}>
          Pin {pin.pinNumber}: {pin.pinName} ({pin.pinType})
        </li>
      ))}
    </ul>
  );
}
```

### Einzelnen Pin erstellen

```tsx
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

function AddPinButton({ partId }: { partId: string }) {
  const api = useApi();
  const { toast } = useToast();

  const handleAddPin = async () => {
    try {
      await api.createPin(partId, {
        pinNumber: '1',
        pinName: 'VCC',
        pinType: 'POWER',
        pinFunction: { de: 'Versorgungsspannung' },
      });
      toast({
        title: 'Erfolg',
        description: 'Pin wurde hinzugefügt.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Pin konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  return <Button onClick={handleAddPin}>Pin hinzufügen</Button>;
}
```

### Pins reordern

```tsx
import { useApi } from '@/hooks/use-api';

function ReorderPinsButton({ partId, pins }: { partId: string; pins: Pin[] }) {
  const api = useApi();

  const handleReorder = async () => {
    // Reverse order als Beispiel
    const reversed = [...pins].reverse();
    const reorderedPins = reversed.map((pin, index) => ({
      id: pin.id,
      pinNumber: (index + 1).toString(),
    }));

    await api.reorderPins(partId, reorderedPins);
  };

  return <Button onClick={handleReorder}>Reihenfolge umkehren</Button>;
}
```

## Validierung

### Pin-Nummer Validierung

```tsx
import { CreatePinSchema } from '@electrovault/schemas';

// Beispiel: Pin-Nummer validieren
const result = CreatePinSchema.safeParse({
  pinNumber: 'VCC', // ✅ OK
  pinName: 'Versorgungsspannung',
  pinType: 'POWER',
});

if (!result.success) {
  console.error(result.error);
}
```

### Bulk-Import Validierung

```tsx
import { BulkCreatePinsSchema } from '@electrovault/schemas';

const bulkData = {
  pins: [
    { pinNumber: '1', pinName: 'VCC', pinType: 'POWER' },
    { pinNumber: '2', pinName: 'GND', pinType: 'GROUND' },
  ],
};

const result = BulkCreatePinsSchema.safeParse(bulkData);

if (result.success) {
  // Bulk-Import durchführen
  await api.bulkCreatePins(partId, result.data.pins);
}
```

## Best Practices

### 1. Pin-Funktionen lokalisiert beschreiben

```tsx
await api.createPin(partId, {
  pinNumber: '1',
  pinName: 'VCC',
  pinType: 'POWER',
  pinFunction: {
    de: 'Positive Versorgungsspannung',
    en: 'Positive supply voltage',
  },
});
```

### 2. Konsistente Pin-Nummerierung

```tsx
// ✅ RICHTIG - Entweder numerisch
'1', '2', '3', '4', ...

// ✅ RICHTIG - Oder symbolisch
'VCC', 'GND', 'IN', 'OUT', ...

// ❌ FALSCH - Gemischt
'1', 'VCC', '3', 'GND', ... // Verwirrend!
```

### 3. Pin-Typen konsequent setzen

```tsx
// Alle Power-Pins sollten POWER sein
{ pinNumber: 'VCC', pinType: 'POWER' }
{ pinNumber: 'VDD', pinType: 'POWER' }
{ pinNumber: '5V', pinType: 'POWER' }

// Alle Ground-Pins sollten GROUND sein
{ pinNumber: 'GND', pinType: 'GROUND' }
{ pinNumber: 'VSS', pinType: 'GROUND' }
```

### 4. NC-Pins dokumentieren

```tsx
// Nicht verbundene Pins sollten als NC markiert werden
{ pinNumber: '7', pinName: 'NC', pinType: 'NC' }
{ pinNumber: '15', pinName: 'NC', pinType: 'NC' }
```

## Fehlerbehandlung

### Try-Catch bei API-Aufrufen

```tsx
const handleCreatePin = async (data: CreatePinInput) => {
  try {
    await api.createPin(partId, data);
    toast({ title: 'Erfolg', description: 'Pin wurde erstellt.' });
  } catch (error) {
    console.error('Failed to create pin:', error);
    toast({
      title: 'Fehler',
      description: error instanceof Error ? error.message : 'Pin konnte nicht erstellt werden.',
      variant: 'destructive',
    });
  }
};
```

### Validierung vor Bulk-Import

```tsx
const handleBulkImport = async (csvText: string) => {
  const lines = csvText.split(';').filter(l => l.trim());

  if (lines.length === 0) {
    toast({
      title: 'Fehler',
      description: 'Keine gültigen Pin-Daten gefunden.',
      variant: 'destructive',
    });
    return;
  }

  try {
    const pins = lines.map(line => {
      const [pinNumber, pinName, pinType] = line.split(',');
      if (!pinNumber || !pinName) {
        throw new Error(`Ungültige Zeile: ${line}`);
      }
      return { pinNumber: pinNumber.trim(), pinName: pinName.trim(), pinType: pinType?.trim() || null };
    });

    await api.bulkCreatePins(partId, pins);
    toast({ title: 'Erfolg', description: `${pins.length} Pins importiert.` });
  } catch (error) {
    toast({
      title: 'Fehler',
      description: error instanceof Error ? error.message : 'Bulk-Import fehlgeschlagen.',
      variant: 'destructive',
    });
  }
};
```

## Verwandte Dokumentation

- [Pin-Mapping UI Architektur](../architecture/pin-mapping-ui.md)
- [API Client Dokumentation](../architecture/api-client.md)
- [Zod Schemas](../../packages/schemas/README.md)

---

*Erstellt: 2025-12-28*
*Version: 1.0*

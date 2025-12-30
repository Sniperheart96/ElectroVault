# ElectroVault - Seed Data Modules

Dieses Verzeichnis enthält modulare Seed-Daten für verschiedene Komponenten-Domains.

## Struktur

```
seeds/
├── types.ts                      # Gemeinsame Typen und Helper-Funktionen
├── 01-passive-components.ts      # Passive Bauelemente
├── 02-semiconductors.ts          # Halbleiter (TODO)
├── 03-electromechanical.ts       # Elektromechanik (TODO)
├── 04-optoelectronics.ts         # Optoelektronik (TODO)
└── 05-vacuum-tubes.ts            # Röhren (TODO)
```

## Verwendung

### Modulares Seeding

```bash
# Modulares Seed-Script ausführen (empfohlen)
npx tsx prisma/seed-modular.ts
```

### Einzelne Module in bestehende seed.ts integrieren

```typescript
import { seedPassiveComponents } from './seeds/01-passive-components';

async function main() {
  await seedPassiveComponents(prisma);
  // ... weitere Seeds
}
```

## Neue Seed-Module erstellen

1. Erstelle eine neue Datei: `XX-domain-name.ts`
2. Exportiere eine async Funktion: `export async function seedDomainName(prisma: PrismaClient)`
3. Nutze die Helper aus `types.ts`:
   - `ls()` - LocalizedString mit _original
   - `createCategoryTree()` - Rekursive Kategorie-Erstellung
   - `createAttributes()` - Attribut-Definitionen

### Beispiel

```typescript
import { PrismaClient } from '@prisma/client';
import {
  ls,
  createCategoryTree,
  createAttributes,
  type CategoryDef,
  type AttributeDef,
  AttributeDataType,
  AttributeScope,
} from './types';

export async function seedSemiconductors(prisma: PrismaClient): Promise<void> {
  console.log('📦 Seeding Semiconductors...');

  const tree: CategoryDef[] = [
    {
      slug: 'semiconductors',
      name: ls({ en: 'Semiconductors', de: 'Halbleiter' }),
      level: 0,
      sortOrder: 2,
      children: [
        {
          slug: 'diodes',
          name: ls({ en: 'Diodes', de: 'Dioden' }),
          level: 1,
          sortOrder: 1,
        },
      ],
    },
  ];

  const categoryMap = await createCategoryTree(prisma, tree);

  // Attribute erstellen...
  const diodesId = categoryMap.get('diodes');
  if (diodesId) {
    await createAttributes(prisma, diodesId, [
      {
        name: 'forward_voltage',
        displayName: ls({ en: 'Forward Voltage', de: 'Durchlassspannung' }),
        unit: 'V',
        dataType: AttributeDataType.NUMBER,
        scope: AttributeScope.PART,
        isFilterable: true,
        sortOrder: 1,
      },
    ]);
  }

  console.log('✅ Semiconductors seeding complete!');
}
```

## Helper-Funktionen

### `ls(strings)` - LocalizedString

Erstellt ein LocalizedString-Objekt mit automatischem `_original` Marker.

```typescript
ls({ en: 'Resistor', de: 'Widerstand' })
// → { _original: 'en', en: 'Resistor', de: 'Widerstand' }
```

### `createCategoryTree(prisma, categories, parentId?)`

Erstellt rekursiv eine Kategorie-Hierarchie.

**Returns:** `Map<slug, id>` für einfaches Auffinden von Kategorien

### `createAttributes(prisma, categoryId, attributes)`

Erstellt Attribut-Definitionen für eine Kategorie.

## Best Practices

1. **Hierarchie:** Nutze die 4-Ebenen-Struktur (Domain → Family → Type → Subtype)
2. **Lokalisierung:** Immer mindestens `en` und `de` angeben
3. **Attribute vererben:** Attribute werden von Parent-Kategorien geerbt
4. **SI-Einheiten:** Nutze SI-Basiseinheiten (F, Ω, H, V, A, Hz, etc.)
5. **Scope beachten:**
   - `COMPONENT` - Gilt für alle Hersteller-Parts
   - `PART` - Herstellerspezifisch
   - `BOTH` - Typisch auf Component, garantiert auf Part
6. **Label-Attribute:** Pro Kategorie sollte mindestens 1 Attribut `isLabel: true` haben
7. **sortOrder:** Vergebe sinnvolle sortOrder-Werte für konsistente Anzeige

## Attribute DataTypes

| DataType | Verwendung |
|----------|------------|
| `NUMBER` | Numerische Werte (mit SI-Präfixen) |
| `STRING` | Freitext |
| `SELECT` | Einzelauswahl aus `allowedValues` |
| `MULTISELECT` | Mehrfachauswahl aus `allowedValues` |
| `LABEL` | Hauptattribut mit SI-Präfixen (wird als Label angezeigt) |
| `BOOLEAN` | Ja/Nein |

## Attribute Scopes

| Scope | Verwendung |
|-------|------------|
| `COMPONENT` | Herstellerunabhängig (z.B. Kapazität) |
| `PART` | Herstellerspezifisch (z.B. Toleranz, ESR) |
| `BOTH` | Typisch auf Component, garantiert auf Part |

---

*Für weitere Informationen siehe: `.claude/agents/component-data-agent.md`*

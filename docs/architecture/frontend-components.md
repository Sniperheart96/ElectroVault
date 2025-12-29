# Frontend-Komponenten

ElectroVault verwendet Next.js 14 App Router mit TypeScript, TailwindCSS und shadcn/ui als UI-Framework.

## Komponenten-Übersicht

```
apps/web/src/components/
├── admin/                   # Admin-Panel-Komponenten (Dialoge, Listen, Manager)
│   ├── admin-sidebar.tsx           # Sidebar für Admin-Bereich
│   ├── attribute-dialog.tsx        # Attribut-Definition erstellen/bearbeiten
│   ├── attribute-fields.tsx        # Dynamische Attributfelder für Formulare
│   ├── category-dialog.tsx         # Kategorie erstellen/bearbeiten
│   ├── component-dialog.tsx        # Bauteil erstellen/bearbeiten (mit Tabs)
│   ├── delete-confirm-dialog.tsx   # Wiederverwendbarer Lösch-Dialog
│   ├── manufacturer-dialog.tsx     # Hersteller erstellen/bearbeiten
│   ├── moderation-actions.tsx      # Moderation-Buttons (Approve/Reject)
│   ├── package-3d-models.tsx       # 3D-Modell-Manager für Packages
│   ├── package-dialog.tsx          # Gehäuseform erstellen/bearbeiten
│   ├── part-dialog.tsx             # Hersteller-Variante erstellen/bearbeiten
│   ├── part-files-manager.tsx      # Datei-Manager für Parts
│   ├── pin-mapping-editor.tsx      # Pin-Mapping-Editor für Parts
│   └── relations-editor.tsx        # Beziehungen zwischen Bauteilen
├── components/              # Bauteil-Anzeige-Komponenten
│   ├── category-sidebar.tsx        # Kategorie-Filter-Sidebar
│   ├── components-list.tsx         # Liste aller Bauteile
│   └── components-page-layout.tsx  # Layout für Bauteil-Seiten
├── forms/                   # Wiederverwendbare Formular-Komponenten
│   ├── category-cascade-select.tsx # Kaskadierender Kategorie-Selector
│   ├── file-upload.tsx             # Universeller Datei-Upload
│   └── localized-input.tsx         # Mehrsprachige Text-Eingabe
├── layout/                  # Layout-Komponenten
│   ├── breadcrumb.tsx              # Breadcrumb-Navigation
│   ├── footer.tsx                  # Seiten-Footer
│   └── header.tsx                  # Seiten-Header mit Navigation
├── manufacturers/           # Hersteller-Komponenten
│   └── manufacturers-list.tsx      # Liste aller Hersteller
├── packages/                # Gehäuseform-Komponenten
│   └── packages-list.tsx           # Liste aller Gehäuseformen
├── providers/               # React-Context-Provider
│   └── session-provider.tsx        # next-auth Session-Provider
└── ui/                      # shadcn/ui Basis-Komponenten
    ├── alert.tsx
    ├── alert-dialog.tsx
    ├── avatar.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── checkbox.tsx
    ├── collapsible.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── pagination.tsx
    ├── progress.tsx
    ├── select.tsx
    ├── skeleton.tsx
    ├── table.tsx
    ├── table-pagination.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    ├── toast.tsx
    └── toaster.tsx
```

## Admin-Komponenten

### ComponentDialog

Komplexer Dialog für Bauteile mit mehreren Tabs:

**Tabs:**
- **Stammdaten** - Name, Kategorie, Status, Serie, Beschreibungen
- **Attribute** - Dynamische Attributfelder basierend auf Kategorie
- **Varianten** - Hersteller-Varianten (Parts) verwalten
- **Beziehungen** - Beziehungen zu anderen Bauteilen

**Workflow:**
1. Erstellen eines Bauteils → Speichern → Wechsel zu "Varianten"-Tab
2. Dialog bleibt nach Erstellung offen, damit Parts hinzugefügt werden können
3. Vollständiges Laden des Bauteils beim Bearbeiten (inkl. Parts, Attribute)

**Technische Details:**
- Nutzt `useForm` von react-hook-form + Zod-Validierung
- Attributwerte werden als State verwaltet (`componentAttributes`)
- Lokaler State für Parts-Liste mit CRUD-Operationen
- Unterstützt onDataChanged-Callback für List-Refresh ohne Dialog-Schließen

### PartDialog

Dialog für Hersteller-Varianten:

**Features:**
- MPN (Manufacturer Part Number) als Pflichtfeld
- Ordering Code, Lifecycle-Status, Package-Auswahl
- RoHS/REACH-Compliance
- Part-spezifische Attribute
- Pin-Mapping-Editor (Tab)
- Datei-Manager (Tab)

**Technische Details:**
- Preset-Unterstützung für `componentId` und `categoryId`
- Automatisches Laden von Attributen basierend auf Kategorie
- Attributwerte getrennt nach COMPONENT/PART-Scope

### PinMappingEditor

Pin-Editor für IC-Packages:

**Features:**
- Pin-Tabelle mit inline-Editing
- Bulk-Import (CSV-Format)
- Pin-Reihenfolge ändern (Hoch/Runter)
- Pin-Typen (POWER, GROUND, INPUT, OUTPUT, etc.)
- LocalizedString-Unterstützung für Pin-Funktion

**CSV-Format:**
```
pinNummer,pinName,pinTyp;pinNummer,pinName,pinTyp
1,VCC,POWER;2,GND,GROUND;3,IN,INPUT;4,OUT,OUTPUT
```

**Technische Details:**
- Nutzt `refreshKey`-Pattern für Reload nach Änderungen
- Inline-Editing mit direktem API-Update
- Bulk-Create-Endpoint für Import

### AttributeFields

Dynamische Attributfelder basierend auf Kategorie-Definitionen:

**Features:**
- Automatisches Laden von Attributen für eine Kategorie
- Scope-Filter (COMPONENT, PART, BOTH)
- Unterstützung für alle Datentypen:
  - **DECIMAL/INTEGER** - Numerische Eingabe mit SI-Präfix-Unterstützung
  - **STRING** - Text-Eingabe
  - **BOOLEAN** - Checkbox
- SI-Präfix-Auswahl (µ, n, p, k, M, etc.)
- Komma/Punkt-Unterstützung für Dezimalzahlen

**SI-Präfix-Normalisierung:**
```typescript
// Eingabe: 22 µF
// Normalisiert: 0.000022 F (in Basis-Einheit)
// Anzeige: 22 (µF)
```

**Technische Details:**
- NumericInput-Komponente mit lokalem State für Eingabe
- Normalisierung bei Blur
- Rundung um Floating-Point-Fehler zu vermeiden
- Sichtbare Indikatoren für Pflichtfelder

### RelationsEditor

Beziehungen zwischen Bauteilen verwalten:

**Beziehungstypen (ConceptRelationType):**
- **DUAL_VERSION** - Dual-Version (z.B. 556 ist Dual-555)
- **QUAD_VERSION** - Quad-Version (z.B. LM324 ist Quad-LM358)
- **LOW_POWER_VERSION** - Stromsparende Version
- **HIGH_SPEED_VERSION** - Schnellere Version
- **MILITARY_VERSION** - Militärische Spezifikation (MIL-SPEC)
- **AUTOMOTIVE_VERSION** - Automotive-qualifiziert (AEC-Q100/101)
- **FUNCTIONAL_EQUIV** - Funktional gleichwertig

**Features:**
- Komponenten-Suche für Ziel-Bauteil
- Notizen (mehrsprachig)
- Anzeige von eingehenden und ausgehenden Beziehungen
- Visuelle Unterscheidung durch Icons und Badges

**Technische Details:**
- API liefert `{ outgoing: [], incoming: [] }`
- Kombiniert zu flachem Array für Anzeige
- Nur Notes können bearbeitet werden (relationType unveränderlich)

## Form-Komponenten

### LocalizedInput

Mehrsprachige Text-Eingabe mit Tab-Auswahl:

**Features:**
- Sprach-Tabs (DE, EN standardmäßig)
- Umschaltung zwischen Input und Textarea (`multiline`-Prop)
- Visueller Indikator für aktive Sprache

**Props:**
```typescript
interface LocalizedInputProps {
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  locales?: string[];          // Standard: ['de', 'en']
  multiline?: boolean;         // Textarea statt Input
  placeholder?: string;
}
```

### CategoryCascadeSelect

Kaskadierender Kategorie-Selector für hierarchische Kategorien:

**Features:**
- Dynamische Ebenen-Anzahl (unbegrenzte Tiefe)
- Labels: "Hauptkategorie", "Unterkategorie", "Typ", "Subtyp", dann "Ebene N"
- Nur Blatt-Kategorien (ohne Kinder) auswählbar
- Automatische Synchronisation mit externem Value
- Kindanzahl-Anzeige in Dropdown

**Technische Details:**
- `categoryMap` für schnellen Zugriff auf alle Kategorien
- `findPathToCategory` findet Pfad von Wurzel zu beliebiger Kategorie
- `levelsToShow` berechnet dynamisch welche Ebenen sichtbar sind
- `isComplete` prüft ob Blatt-Kategorie ausgewählt

**Verwendung:**
```typescript
<CategoryCascadeSelect
  categoryTree={categoryTree}
  value={categoryId}
  onChange={setCategoryId}
  loading={loading}
  error={errorMessage}
/>
```

### FileUpload

Universelle Datei-Upload-Komponente mit Drag & Drop:

**Unterstützte Typen:**
- **datasheet** - PDF-Datenblätter (max 50 MB, Sprachen erforderlich)
- **part-image** - Bauteil-Bilder (JPEG/PNG/WebP, max 10 MB)
- **pinout** - Pinout-Diagramme (Bilder/PDF, max 10 MB)
- **logo** - Hersteller-Logos (JPEG/PNG/WebP/SVG, max 5 MB)
- **category-icon** - Kategorie-Icons (JPEG/PNG/WebP/SVG, max 5 MB)
- **model3d** - 3D-Modelle (STEP/STL/OBJ, max 50 MB)
- **other** - Sonstige Dateien (max 50 MB, Sprachen optional)

**Features:**
- Drag & Drop-Unterstützung
- Upload-Fortschritt mit Progress-Bar
- Validierung von Dateigröße und -typ
- Sprachen-Unterstützung für Datasheets
- Vorschau hochgeladener Dateien
- Download-Link für existierende Dateien

**Props:**
```typescript
interface FileUploadProps {
  type: FileUploadType;
  value?: UploadedFile | null;
  onUpload: (file: UploadedFile | ImageUploadResult) => void;
  onRemove?: () => void;
  partId?: string;
  componentId?: string;
  manufacturerId?: string;
  categoryId?: string;
  packageId?: string;
  languages?: string[];        // Für Datasheets erforderlich
  label?: string;
  description?: string;
  disabled?: boolean;
}
```

**Endpoint-Mapping:**
```typescript
const FILE_CONFIGS: Record<FileUploadType, {
  accept: string;
  maxSize: number;
  endpoint: string;
}> = {
  datasheet: { endpoint: '/files/datasheet' },
  'part-image': { endpoint: '/files/part-image' },
  pinout: { endpoint: '/files/pinout' },
  logo: { endpoint: '/files/manufacturer-logo' },
  'category-icon': { endpoint: '/files/category-icon' },
  model3d: { endpoint: '/files/package-3d' },
  other: { endpoint: '/files/other' },
};
```

## Layout-Komponenten

### Header

Haupt-Navigation mit Authentifizierung:

**Features:**
- Logo und Hauptnavigation
- Desktop/Mobile-Navigation
- Benutzer-Info mit Rollen-Badge (Admin/Moderator)
- Logout-Button
- Moderation-Link für Admin/Moderatoren

**Navigation-Items:**
- Bauteile (`/components`)
- Hersteller (`/manufacturers`)
- Gehäuseformen (`/packages`)
- Moderation (`/admin`) - Nur für Admin/Moderator

**Technische Details:**
- Nutzt next-intl für Übersetzungen
- next-auth Session-Handling
- Rollenbasierte Anzeige von Links
- Responsive Design mit Mobile-Menu-Toggle

### Footer

Standard-Footer mit Links und Copyright:

**Bereiche:**
- ElectroVault-Beschreibung
- Schnelllinks (Dokumentation, GitHub, etc.)
- Copyright-Hinweis

### Breadcrumb

Breadcrumb-Navigation für hierarchische Strukturen:

**Features:**
- Dynamische Breadcrumb-Items
- Home-Link
- Aktuelle Seite nicht anklickbar

## Hooks

### useApi

Hook für authentifizierten API-Zugriff in Client-Komponenten:

**Features:**
- Automatisches Setzen des Access-Tokens aus der Session
- Token-Update bei Session-Änderungen
- Cleanup bei Component-Unmount

**Verwendung:**
```typescript
'use client';

function MyComponent() {
  const api = useApi();

  const loadData = async () => {
    const result = await api.getComponents({ limit: 10 });
    console.log(result.data);
  };
}
```

**Technische Details:**
- Nutzt globalen `api`-Client aus `@/lib/api`
- Token wird via `useEffect` gesetzt und gecleanup
- Verhindert Memory Leaks durch Token-Cleanup

### useCategoriesFlat

Hook zum Laden flacher Kategorie-Liste:

**Features:**
- Lädt alle Kategorien als flache Liste
- Loading-State
- Error-Handling

### useToast

shadcn/ui Toast-Hook für Benachrichtigungen:

**Verwendung:**
```typescript
const { toast } = useToast();

toast({
  title: 'Erfolg',
  description: 'Bauteil wurde erstellt.',
});

toast({
  title: 'Fehler',
  description: 'Speichern fehlgeschlagen.',
  variant: 'destructive',
});
```

## API-Client

### ApiClient

Zentrale API-Schnittstelle für Frontend:

**Architektur:**
- Singleton-Instanz: `api` (global)
- Factory-Funktion: `createApiClient(token)` (Server-Side)
- Async-Funktion: `getAuthenticatedApiClient()` (Server Components)

**Hauptmethoden:**

**Kategorien:**
- `getCategories()` - Alle Kategorien (mit Pagination)
- `getCategoryTree()` - Hierarchische Struktur
- `getCategoryBySlug(slug)` - Einzelne Kategorie
- `getCategoryPath(id)` - Pfad von Wurzel zu Kategorie

**Hersteller:**
- `getManufacturers()` - Alle Hersteller
- `searchManufacturers(query)` - Volltextsuche
- `createManufacturer(data)` - Hersteller erstellen
- `updateManufacturer(id, data)` - Hersteller aktualisieren

**Bauteile:**
- `getComponents()` - Alle Bauteile
- `getComponentBySlug(slug)` - Einzelnes Bauteil
- `createComponent(data)` - Bauteil erstellen
- `updateComponent(id, data)` - Bauteil aktualisieren

**Parts:**
- `getParts()` - Alle Hersteller-Varianten
- `searchParts(query)` - Volltextsuche
- `createPart(data)` - Part erstellen
- `updatePart(id, data)` - Part aktualisieren

**Dateien:**
- `uploadFile(type, file, options)` - Datei hochladen
- `upload3DModel(file, packageId)` - 3D-Modell hochladen
- `uploadManufacturerLogo(file, manufacturerId)` - Logo hochladen
- `getFilesByPart(partId)` - Dateien eines Parts
- `deleteFile(id)` - Datei löschen

**Moderation:**
- `getModerationQueue()` - Alle ausstehenden Items
- `approveComponent(id)` - Bauteil freigeben
- `rejectComponent(id, comment)` - Bauteil ablehnen
- `batchApprove(ids)` - Mehrere Bauteile freigeben

**Pin-Mappings:**
- `getPinsByPartId(partId)` - Alle Pins eines Parts
- `createPin(partId, data)` - Pin erstellen
- `bulkCreatePins(partId, pins)` - Mehrere Pins erstellen
- `reorderPins(partId, pins)` - Pin-Reihenfolge ändern

**Beziehungen:**
- `getComponentRelations(componentId)` - Beziehungen laden
- `createRelation(data)` - Beziehung erstellen
- `updateRelation(componentId, relationId, data)` - Beziehung aktualisieren
- `deleteRelation(componentId, relationId)` - Beziehung löschen

**Response-Format:**
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

**Error-Handling:**
```typescript
try {
  const result = await api.getComponents();
} catch (error) {
  console.error('API Error:', error.message);
}
```

## UI-Komponenten (shadcn/ui)

Alle Basis-Komponenten stammen von shadcn/ui:

**Formulare:**
- `Button` - Buttons mit Varianten (default, outline, ghost, destructive)
- `Input` - Text-Eingabefelder
- `Textarea` - Mehrzeilige Text-Eingabe
- `Select` - Dropdown-Auswahl
- `Checkbox` - Checkboxen
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` - Form-Integration mit react-hook-form

**Layout:**
- `Card`, `CardHeader`, `CardContent` - Content-Cards
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` - Modale Dialoge
- `AlertDialog` - Bestätigungs-Dialoge
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab-Navigation

**Feedback:**
- `Alert`, `AlertDescription` - Info-Boxen
- `Toast`, `Toaster` - Toast-Benachrichtigungen
- `Skeleton` - Loading-Platzhalter
- `Progress` - Fortschrittsbalken
- `Badge` - Status-Badges

**Daten:**
- `Table`, `TableHeader`, `TableRow`, `TableCell` - Datentabellen
- `Pagination`, `TablePagination` - Pagination-Controls

**Icons:**
- Lucide-React Icons (z.B. `Plus`, `Pencil`, `Trash2`, `Upload`)

## Best Practices

### Form-Handling

**react-hook-form + Zod:**
```typescript
const form = useForm<CreateComponentInput>({
  resolver: zodResolver(CreateComponentSchema),
  defaultValues: {
    name: { de: '', en: '' },
    categoryId: '',
    status: 'DRAFT',
  },
});

const onSubmit = async (data: CreateComponentInput) => {
  try {
    await api.createComponent(data);
    toast({ title: 'Erfolg', description: 'Bauteil erstellt.' });
  } catch (error) {
    toast({ title: 'Fehler', variant: 'destructive' });
  }
};

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="name" ... />
  </form>
</Form>
```

### API-Aufrufe

**Client-Komponenten:**
```typescript
'use client';

import { useApi } from '@/hooks/use-api';

function MyComponent() {
  const api = useApi();

  useEffect(() => {
    const load = async () => {
      const result = await api.getComponents();
      setData(result.data);
    };
    load();
  }, [api]);
}
```

**Server-Komponenten:**
```typescript
import { getAuthenticatedApiClient } from '@/lib/api';

export default async function Page() {
  const api = await getAuthenticatedApiClient();
  const result = await api.getComponents();

  return <div>{result.data.length} Bauteile</div>;
}
```

### Lokalisierung

**LocalizedString-Anzeige:**
```typescript
function getLocalizedName(name: LocalizedString, locale = 'de'): string {
  return name[locale] || name.en || Object.values(name)[0] || '[MISSING]';
}

// Verwendung
<span>{getLocalizedName(component.name, 'de')}</span>
```

**i18n in Client-Komponenten:**
```typescript
import { useTranslations } from 'next-intl';

function Header() {
  const t = useTranslations('nav');
  return <Link>{t('components')}</Link>;
}
```

### State-Management

**Lokaler State für Listen:**
```typescript
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(false);

const reload = async () => {
  setLoading(true);
  try {
    const result = await api.getItems();
    setItems(result.data);
  } finally {
    setLoading(false);
  }
};
```

**Refresh-Pattern:**
```typescript
const [refreshKey, setRefreshKey] = useState(0);

const reload = () => setRefreshKey(prev => prev + 1);

useEffect(() => {
  loadData();
}, [refreshKey]);
```

### Error-Handling

**Toast-Benachrichtigungen:**
```typescript
try {
  await api.createComponent(data);
  toast({
    title: 'Erfolg',
    description: 'Bauteil wurde erstellt.',
  });
} catch (error) {
  toast({
    title: 'Fehler',
    description: error.message || 'Operation fehlgeschlagen.',
    variant: 'destructive',
  });
}
```

**Error-Boundaries:**
- Nutze Next.js error.tsx für Error-Handling

### Performance

**Code-Splitting:**
- Dialoge werden erst bei Öffnung geladen (lazy import)
- Große Komponenten in separate Chunks

**Memoization:**
```typescript
const categoryMap = useMemo(() => {
  const map = new Map();
  traverse(categoryTree);
  return map;
}, [categoryTree]);
```

**useCallback für Event-Handler:**
```typescript
const handleChange = useCallback((value: string) => {
  onChange(value);
}, [onChange]);
```

## Verwandte Dokumentation

- [Pin-Mapping UI](../reference/pin-mapping-ui.md) - Details zu Pin-Mapping-Komponenten
- [i18n](i18n.md) - Internationalisierung und LocalizedString
- [Tech-Stack](tech-stack.md) - Technologie-Entscheidungen

---

*Letzte Aktualisierung: 2025-12-29*

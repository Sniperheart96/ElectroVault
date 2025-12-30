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
│   └── components-page-layout.tsx  # Layout für Bauteil-Seiten (Legacy)
├── forms/                   # Wiederverwendbare Formular-Komponenten
│   ├── category-cascade-select.tsx # Kaskadierender Kategorie-Selector
│   ├── file-upload.tsx             # Universeller Datei-Upload
│   └── localized-input.tsx         # Mehrsprachige Text-Eingabe
├── layout/                  # Layout-Komponenten
│   ├── breadcrumb.tsx              # Breadcrumb-Navigation
│   ├── footer.tsx                  # Seiten-Footer
│   ├── header.tsx                  # Seiten-Header mit Navigation
│   └── user-menu.tsx               # User-Menü (Auth-State, Logout, Admin-Link)
├── manufacturers/           # Hersteller-Komponenten
│   └── manufacturers-list.tsx      # Liste aller Hersteller
├── packages/                # Gehäuseform-Komponenten
│   └── packages-list.tsx           # Liste aller Gehäuseformen
├── providers/               # React-Context-Provider
│   └── session-provider.tsx        # next-auth Session-Provider
├── skeletons/               # Shell First Skeleton-Komponenten
│   └── index.tsx                   # Alle Skeleton-Platzhalter
└── ui/                      # shadcn/ui Basis-Komponenten
    └── ...                         # Standard shadcn/ui Komponenten
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

## Filter-Komponenten

Komponenten für die attribut-basierte Suche in der Bauteil-Liste.

```
apps/web/src/components/filters/
├── attribute-filter-sidebar.tsx    # Haupt-Sidebar mit Filter-Controls
├── active-filters.tsx              # Badge-Anzeige aktiver Filter
├── filter-conflict-dialog.tsx      # Dialog bei Kategorie-Wechsel
└── filter-controls/
    ├── index.tsx                   # Wrapper mit Collapsible
    ├── decimal-filter.tsx          # Min/Max mit SI-Präfix
    ├── integer-filter.tsx          # Ganzzahl-Filter
    ├── string-filter.tsx           # Text-Contains-Filter
    ├── boolean-filter.tsx          # Ja/Nein Radio-Buttons
    ├── range-filter.tsx            # Bereichs-Abfrage
    ├── select-filter.tsx           # Einfachauswahl (Radio)
    └── multiselect-filter.tsx      # Mehrfachauswahl (Checkboxen)
```

### AttributeFilterSidebar

Haupt-Komponente für die Filter-Sidebar, lädt Attribute basierend auf Kategorie.

**Props:**
```typescript
interface AttributeFilterSidebarProps {
  categoryId: string | null;           // Aktuelle Kategorie
  filters: AttributeFilter[];          // Aktive Filter
  onFiltersChange: (filters: AttributeFilter[]) => void;
  isOpen: boolean;                     // Sheet offen/geschlossen
  onClose: () => void;
}
```

**Workflow:**
1. Lädt filterbare Attribute der ausgewählten Kategorie (inkl. vererbter)
2. Zeigt Filter-Controls für jeden Attribut-Typ
3. Lokaler State bis "Anwenden" geklickt wird
4. "Zurücksetzen" leert alle Filter

### Filter-Controls

Jedes Control verwaltet seinen eigenen State und konvertiert zu `AttributeFilter`.

**DecimalFilter:**
- Min/Max-Eingaben mit SI-Präfix-Dropdown
- Normalisierung zu SI-Basiseinheit bei Submit
- Unterstützt Komma und Punkt als Dezimaltrenner
- Speichert `displayValue` und `displayPrefix` für UI-Wiederherstellung

**MultiselectFilter:**
- Checkboxen für erlaubte Werte (`allowedValues`)
- AND/OR-Toggle für Verknüpfung
- Operatoren: `hasAll` (UND), `hasAny` (ODER)
- Werte werden kommasepariert gespeichert

**SelectFilter:**
- Radio-Buttons inkl. "Alle"-Option
- Operator: `eq` für exakten Match

### useFilterState Hook

Verwaltet Filter im URL-State für Sharing und Bookmarking.

**Datei:** `apps/web/src/hooks/use-filter-state.ts`

```typescript
const {
  filters,        // Aktive Filter (AttributeFilter[])
  setFilters,     // Alle Filter setzen
  setFilter,      // Einzelnen Filter setzen/aktualisieren
  removeFilter,   // Filter entfernen (by definitionId)
  clearFilters,   // Alle löschen
  getFilter,      // Filter für definitionId holen
  hasFilters,     // Boolean: Filter aktiv?
} = useFilterState();
```

**URL-Format:**
```
/components?categorySlug=capacitors&filters=%5B%7B%22definitionId%22...%7D%5D
```

**Features:**
- Filter werden als JSON im `filters` Query-Parameter gespeichert
- Bei Filteränderung: `page` wird auf 1 zurückgesetzt
- Zod-Validierung beim Lesen aus URL
- Fehlerhafte Filter werden geloggt und ignoriert

### ActiveFilters

Badge-Anzeige der aktiven Filter mit Remove-Button.

**Props:**
```typescript
interface ActiveFiltersProps {
  filters: AttributeFilter[];
  attributes: AttributeDefinition[];  // Für displayName-Lookup
  onRemove: (definitionId: string) => void;
  onClearAll: () => void;
}
```

**Darstellung:**
- Badge pro Filter: `Kapazität: 1µF - 100µF`
- X-Button zum Entfernen einzelner Filter
- "Alle löschen"-Button am Ende

## Layout-Komponenten

### Header

Haupt-Navigation mit Authentifizierung:

**Features:**
- Logo und Hauptnavigation
- Desktop/Mobile-Navigation
- Lazy-Loading der UserMenu-Komponente (Suspense)
- Moderation-Link für Admin/Moderatoren (Desktop)

**Navigation-Items:**
- Bauteile (`/components`)
- Hersteller (`/manufacturers`)
- Gehäuseformen (`/packages`)
- Moderation (`/admin`) - Nur für Admin/Moderator (Desktop-Menü via `AdminNavLink`)

**Technische Details:**
- Nutzt next-intl für Übersetzungen
- Suspense-Wrapper für UserMenu mit UserMenuSkeleton
- Responsive Design mit Mobile-Menu-Toggle
- Server Component mit Client Component-Integration

### UserMenu

Client-Komponente für Authentifizierungsstatus:

**Features:**
- Login-Button wenn nicht eingeloggt
- Benutzer-Info mit Name/Email
- Rollen-Badges (Admin/Moderator)
- Logout-Button mit Callback
- Admin-Link für Mobile (Shield-Icon)

**Komponenten:**
- `UserMenu` - Haupt-Komponente mit Session-Handling
- `AdminNavLink` - Separater Link für Desktop-Navigation

**Technische Details:**
- Nutzt `useSession()` Hook von next-auth
- Zeigt `UserMenuSkeleton` während Loading
- Rollenbasierte Anzeige (Admin/Moderator)
- Responsive Design (Desktop/Mobile unterschiedlich)

**Verwendung:**
```typescript
// Im Header (Server Component)
<Suspense fallback={<UserMenuSkeleton />}>
  <UserMenu />
</Suspense>

// Desktop-Navigation
<AdminNavLink /> {/* Zeigt Link nur wenn berechtigt */}
```

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

**Route Groups + Shell First Pattern:**

Die Anwendung nutzt Next.js Route Groups für instant Client-Side Navigation. Das Layout bleibt bei Navigation stehen - nur der Content wechselt.

**App-Struktur:**
```
app/
├── (main)/                    # Route Group für öffentliche Seiten
│   ├── layout.tsx             # Shared Layout (Header + Footer)
│   ├── page.tsx               # Homepage
│   ├── loading.tsx            # FEHLT - Könnte hinzugefügt werden
│   ├── components/            # Bauteile
│   │   ├── page.tsx
│   │   ├── loading.tsx        # Loading-Placeholder
│   │   ├── [slug]/
│   │   │   └── page.tsx       # Bauteil-Detail
│   │   └── _components/       # Private Komponenten
│   │       └── components-page-content.tsx
│   ├── manufacturers/         # Hersteller
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── [slug]/
│   │   │   └── page.tsx       # Hersteller-Detail
│   │   └── _components/
│   │       └── manufacturers-content.tsx
│   ├── packages/              # Bauformen
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── _components/
│   │       └── packages-content.tsx
│   ├── about/                 # Statische Seiten
│   │   └── page.tsx
│   ├── help/
│   │   ├── page.tsx
│   │   └── faq-accordion.tsx  # FAQ-Komponente
│   ├── contact/
│   │   ├── page.tsx
│   │   └── contact-form.tsx   # Kontaktformular
│   ├── impressum/
│   │   └── page.tsx
│   └── datenschutz/
│       └── page.tsx
├── admin/                     # Separates Layout (Sidebar)
│   ├── layout.tsx
│   └── loading.tsx            # Admin-Loading-Placeholder
├── auth/                      # Separates Layout (Minimal)
│   └── layout.tsx
└── layout.tsx                 # Root Layout (Providers)
```

**Vorteile Route Groups:**
- **Instant Navigation** - Header/Footer bleiben gemounted, nur `{children}` wechselt
- **Keine Server-Roundtrips** für Layout-Teile
- **Shared State** im Header bleibt erhalten (z.B. User-Session)

**Shared Layout** (`(main)/layout.tsx`):
```typescript
export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

**Seiten-Struktur** (keine eigenen Header/Footer mehr):
```typescript
// (main)/components/page.tsx
export default async function ComponentsPage({ searchParams }) {
  const params = await searchParams;

  return (
    <div className="flex-1 flex">
      <Suspense fallback={<CategorySidebarSkeleton />}>
        <ComponentsContent variant="sidebar" {...params} />
      </Suspense>
      <Suspense fallback={<ComponentsTableSkeleton />}>
        <ComponentsContent variant="list" {...params} />
      </Suspense>
    </div>
  );
}
```

**Route Naming Conventions:**
- `(main)/` - Route Group (nicht in URL sichtbar)
- `_components/` - Private Komponenten-Ordner (nicht routbar)
- `[slug]/` - Dynamic Route Parameter

**Skeleton-Komponenten** (`components/skeletons/index.tsx`):

Alle Skeleton-Komponenten für Shell First Loading Pattern:

**Layout Skeletons:**
- `HeaderSkeleton` - Header-Platzhalter (Logo, Navigation, Auth)
- `UserMenuSkeleton` - User-Menü-Platzhalter (Login/Logout-Button)
- `CategorySidebarSkeleton` - Kategorie-Sidebar mit Tree-Struktur
- `AdminSidebarSkeleton` - Admin-Sidebar mit Navigation
- `BreadcrumbSkeleton` - Breadcrumb-Navigation-Platzhalter

**Tabellen Skeletons:**
- `TableSkeleton` - Generische Tabelle (konfigurierbar: rows, columns)
- `ComponentsTableSkeleton` - Bauteile-Tabelle mit Expand-Funktion
- `ManufacturersTableSkeleton` - Hersteller-Tabelle mit Logo-Platzhalter
- `PackagesTableSkeleton` - Bauformen-Tabelle mit Typ-Badges

**Card Skeletons:**
- `StatCardSkeleton` - Einzelne Statistik-Karte
- `StatsGridSkeleton` - Grid von Statistik-Karten (konfigurierbar: count)
- `ComponentCardSkeleton` - Bauteil-Karte mit Bild und Details

**Page Skeletons:**
- `ComponentsPageSkeleton` - Komplette Bauteile-Seite (Sidebar + Tabelle)
- `ManufacturersPageSkeleton` - Komplette Hersteller-Seite
- `AdminDashboardSkeleton` - Admin-Dashboard mit Stats + Activity
- `HomePageSkeleton` - Homepage mit Hero, Stats, Featured

**Utility Skeletons:**
- `SearchInputSkeleton` - Such-Eingabefeld
- `ButtonSkeleton` - Button (konfigurierbar: sm, default, lg)

**loading.tsx Dateien:**
```
app/
├── (main)/
│   ├── components/loading.tsx     → ComponentsPageSkeleton
│   ├── manufacturers/loading.tsx  → ManufacturersPageSkeleton
│   └── packages/loading.tsx       → PackagesTableSkeleton (in CardLayout)
└── admin/loading.tsx              → AdminDashboardSkeleton
```

**Verwendung:**
```typescript
// Inline in Page mit Suspense
<Suspense fallback={<CategorySidebarSkeleton />}>
  <CategorySidebar />
</Suspense>

// Oder als loading.tsx
// app/(main)/components/loading.tsx
export default function Loading() {
  return <ComponentsPageSkeleton />;
}
```

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

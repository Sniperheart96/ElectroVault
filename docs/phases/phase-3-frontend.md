# Phase 3: Frontend Basis

**Status:** ✅ Abgeschlossen
**Fortschritt:** 100%

---

## Übersicht

Phase 3 implementiert das Next.js Frontend mit Admin-UI und Benutzeroberfläche.

---

## Aufgaben

- [x] Next.js mit App Router
- [x] TailwindCSS + shadcn/ui
- [x] Auth-Flow mit NextAuth + Keycloak
- [x] Layout (Header, Footer)
- [x] Homepage mit Suchfeld und Statistiken
- [x] Komponenten-Liste mit Pagination
- [x] Kategorie-Browser (Baum)
- [x] Hersteller-Liste mit Pagination
- [x] i18n-Setup (next-intl) mit DE/EN
- [x] API-Client für Backend-Kommunikation
- [x] Auth-Middleware für geschützte Routen
- [x] Komponenten-Detailseite
- [x] Kategorie-Detailseite
- [x] Hersteller-Detailseite
- [x] Suchinterface mit Filtern
- [x] Admin-Dashboard
- [x] Admin-Sidebar mit Rollenprüfung
- [x] Admin: Komponenten-Verwaltung (CRUD)
- [x] Admin: Kategorien-Verwaltung (CRUD, Baum)
- [x] Admin: Hersteller-Verwaltung (CRUD)
- [x] Admin: Benutzer-Übersicht
- [x] Admin: Attribut-Definitionen (integriert in CategoryDialog mit Tab-Navigation)
- [x] Admin: Package/Bauformen Verwaltung (CRUD)
- [x] Admin: ManufacturerPart/Hersteller-Varianten (integriert in ComponentDialog mit Tab-Navigation)

---

## Implementierte Struktur

```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Homepage
│   │   ├── layout.tsx                # Root-Layout mit Provider
│   │   ├── globals.css               # Tailwind + shadcn Styles
│   │   ├── components/
│   │   │   ├── page.tsx              # Komponenten-Liste
│   │   │   └── [slug]/page.tsx       # Komponenten-Detail
│   │   ├── categories/
│   │   │   ├── page.tsx              # Kategorie-Browser (Baum)
│   │   │   └── [slug]/page.tsx       # Kategorie-Detail
│   │   ├── manufacturers/
│   │   │   ├── page.tsx              # Hersteller-Liste
│   │   │   └── [slug]/page.tsx       # Hersteller-Detail
│   │   ├── search/
│   │   │   └── page.tsx              # Erweiterte Suche
│   │   ├── auth/
│   │   │   ├── signin/page.tsx       # Login-Seite
│   │   │   ├── signout/page.tsx      # Logout-Seite
│   │   │   └── error/page.tsx        # Auth-Fehlerseite
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin-Layout mit Sidebar
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── components/page.tsx   # Komponenten-Verwaltung
│   │   │   ├── categories/page.tsx   # Kategorien-Verwaltung
│   │   │   ├── manufacturers/page.tsx # Hersteller-Verwaltung
│   │   │   ├── packages/page.tsx     # Package/Bauformen
│   │   │   └── users/page.tsx        # Benutzer-Übersicht
│   │   ├── about/page.tsx            # Über uns
│   │   ├── contact/page.tsx          # Kontakt
│   │   ├── help/page.tsx             # Hilfe & FAQ
│   │   ├── impressum/page.tsx        # Impressum
│   │   └── datenschutz/page.tsx      # Datenschutz
│   │   └── api/
│   │       └── auth/[...nextauth]/
│   │           └── route.ts          # NextAuth API Route
│   ├── components/
│   │   ├── ui/                       # shadcn/ui Komponenten (16 Stück)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── form.tsx
│   │   │   └── avatar.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx            # Navigationsleiste mit Auth
│   │   │   ├── footer.tsx
│   │   │   └── breadcrumb.tsx
│   │   ├── admin/
│   │   │   ├── admin-sidebar.tsx     # Admin-Navigation
│   │   │   ├── component-dialog.tsx  # Component CRUD Dialog (mit Hersteller-Varianten Tab)
│   │   │   ├── category-dialog.tsx   # Category CRUD Dialog (mit Attribute Tab)
│   │   │   ├── manufacturer-dialog.tsx # Manufacturer CRUD Dialog
│   │   │   ├── attribute-dialog.tsx  # Attribut-Definition Dialog (eingebettet in CategoryDialog)
│   │   │   ├── package-dialog.tsx    # Package CRUD Dialog
│   │   │   ├── part-dialog.tsx       # ManufacturerPart Dialog (eingebettet in ComponentDialog)
│   │   │   └── delete-confirm-dialog.tsx
│   │   ├── forms/
│   │   │   └── localized-input.tsx   # DE/EN Input-Komponente
│   │   └── providers/
│   │       └── session-provider.tsx  # NextAuth Provider
│   ├── hooks/
│   │   ├── use-toast.ts              # Toast-Hook
│   │   ├── use-api.ts                # Auth API Hook für Client Components
│   │   └── use-categories-flat.ts    # Kategorie-Helfer (NEU)
│   ├── lib/
│   │   ├── api.ts                    # API-Client mit Auth-Support
│   │   ├── auth.ts                   # NextAuth Konfiguration
│   │   ├── auth-server.ts            # Server-side Auth Utilities
│   │   └── utils.ts                  # cn() Helper
│   ├── i18n/
│   │   └── request.ts                # next-intl Konfiguration
│   └── middleware.ts                 # Route Protection
├── messages/
│   ├── de.json                       # Deutsche Übersetzungen
│   └── en.json                       # Englische Übersetzungen
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── package.json
```

---

## Seiten

### Öffentliche Seiten

| Route | Beschreibung | Status |
|-------|--------------|--------|
| `/` | Homepage mit Suchfeld, Stats, Featured Categories | ✅ |
| `/components` | Komponenten-Liste mit Pagination | ✅ |
| `/components/:slug` | Komponenten-Detailseite mit Parts | ✅ |
| `/categories` | Kategorie-Baum (rekursiv) | ✅ |
| `/categories/:slug` | Kategorie mit Unterkategorien und Bauteilen | ✅ |
| `/manufacturers` | Hersteller-Liste mit Pagination | ✅ |
| `/manufacturers/:slug` | Hersteller-Detail | ✅ |
| `/search` | Erweiterte Suche mit Filtern | ✅ |
| `/about` | Über ElectroVault | ✅ |
| `/help` | Hilfe & FAQ | ✅ |
| `/contact` | Kontaktformular | ✅ |
| `/impressum` | Impressum | ✅ |
| `/datenschutz` | Datenschutzerklärung | ✅ |

### Auth-Seiten

| Route | Beschreibung | Status |
|-------|--------------|--------|
| `/auth/signin` | Keycloak-Login | ✅ |
| `/auth/signout` | Abmelde-Bestätigung | ✅ |
| `/auth/error` | Auth-Fehler-Anzeige | ✅ |

### Admin-Bereich (geschützt)

| Route | Beschreibung | Status |
|-------|--------------|--------|
| `/admin` | Dashboard mit Statistiken | ✅ |
| `/admin/components` | Komponenten-Verwaltung (CRUD) | ✅ |
| `/admin/categories` | Kategorien-Verwaltung (Baum-Editor) | ✅ |
| `/admin/manufacturers` | Hersteller-Verwaltung (CRUD) | ✅ |
| `/admin/users` | Benutzer-Übersicht | ✅ |

---

## Suchinterface

Das Suchinterface (`/search`) bietet:

- **Typ-Auswahl:** Bauteile, Hersteller-Varianten, Hersteller
- **Freitext-Suche** mit Echtzeit-Filterung
- **Filter:**
  - Kategorie (für Bauteile)
  - Hersteller (für Parts)
  - Status (ACTIVE, NRND, EOL, OBSOLETE)
- **URL-Parameter** für Bookmarks und Sharing
- **Responsive Design** für Mobile

---

## Admin-Bereich

### Dashboard

- Statistik-Karten (Komponenten, Hersteller, Kategorien)
- Schnellaktionen
- Übersicht kürzlich aktualisierter Einträge

### Komponenten-Verwaltung

- Tabelle mit Suche und Filtern
- CRUD-Dialog mit LocalizedInput und **Tab-Navigation**:
  - **Tab "Stammdaten":** Name, Kategorie, Status, Beschreibung
  - **Tab "Hersteller-Varianten":** (nur beim Bearbeiten)
    - Liste aller ManufacturerParts für dieses Bauteil
    - CRUD für Hersteller-Varianten direkt im Dialog
    - Warnung wenn keine Variante vorhanden (mind. 1 erforderlich)
- Kategorie-Auswahl (Baum)
- Status-Verwaltung
- Link zur öffentlichen Detailseite

### Kategorien-Verwaltung

- Interaktiver Baum-Editor
- CRUD-Dialog mit LocalizedInput und **Tab-Navigation**:
  - **Tab "Stammdaten":** Name, Parent, Beschreibung, Sortierung
  - **Tab "Attribute":** (nur beim Bearbeiten)
    - Eigene Attribute dieser Kategorie
    - Vererbte Attribute von Parent-Kategorien (Collapsible)
    - CRUD für Attribute direkt im Dialog
- Parent-Auswahl mit Zirkelvermeidung
- Sortierreihenfolge

### Package/Bauformen Verwaltung

- Tabelle mit Suche
- CRUD-Dialog
- Mounting-Types: THT, SMD, Radial, Axial, Chassis, Other
- Dimensionen (L/W/H), Pitch, Pin-Count
- JEDEC/EIA Standards

### Hersteller-Verwaltung

- Tabelle mit Suche
- CRUD-Dialog
- CAGE-Code, Land, Website
- Status-Verwaltung

### Benutzer-Übersicht

- Benutzer-Liste aus Keycloak
- Rollen-Anzeige
- Link zur Keycloak Admin-Konsole

---

## Auth-Integration

### NextAuth mit Keycloak

```typescript
// apps/web/src/lib/auth.ts
- KeycloakProvider konfiguriert
- JWT Token Refresh
- Rollen-Extraktion aus Keycloak Token
- Session mit accessToken und Rollen
- Logout-Sync mit Keycloak
```

### Middleware Route Protection

```typescript
// apps/web/src/middleware.ts
- /admin/* erfordert admin oder moderator Rolle
- /profile/* erfordert Authentifizierung
- /contribute/* erfordert contributor Rolle oder höher
```

### Auth Utilities

```typescript
// Server-side (apps/web/src/lib/auth-server.ts)
getSession()        // Aktuelle Session abrufen
getCurrentUser()    // Aktuellen User abrufen
isAdmin()           // Prüft Admin-Rolle
isModerator()       // Prüft Moderator-Rolle
isContributor()     // Prüft Contributor-Rolle

// Client-side (via useSession hook)
const { data: session, status } = useSession();
```

---

## i18n-Setup

### Konfiguration

- **Library:** next-intl
- **Standard-Sprache:** Deutsch (de)
- **Verfügbare Sprachen:** de, en
- **Fallback:** Automatisch auf verfügbare Übersetzung

### Verwendung

```typescript
// Server Component
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('nav');
t('components') // "Bauteile" oder "Components"

// Client Component
import { useTranslations } from 'next-intl';
const t = useTranslations('nav');
t('components')
```

---

## UI-Komponenten (19 Stück)

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| Button | `ui/button.tsx` | Alle Varianten (default, outline, ghost, etc.) |
| Input | `ui/input.tsx` | Text-Eingabefeld |
| Card | `ui/card.tsx` | Card, CardHeader, CardContent, etc. |
| Badge | `ui/badge.tsx` | Status-Badges (success, warning, destructive) |
| Breadcrumb | `ui/breadcrumb.tsx` | Navigation-Breadcrumbs |
| Dialog | `ui/dialog.tsx` | Modal-Dialoge |
| AlertDialog | `ui/alert-dialog.tsx` | Bestätigungs-Dialoge |
| Table | `ui/table.tsx` | Daten-Tabellen |
| Toast | `ui/toast.tsx` | Benachrichtigungen |
| Toaster | `ui/toaster.tsx` | Toast-Container |
| Label | `ui/label.tsx` | Formular-Labels |
| Select | `ui/select.tsx` | Dropdown-Auswahl |
| Textarea | `ui/textarea.tsx` | Mehrzeilige Eingabe |
| Skeleton | `ui/skeleton.tsx` | Lade-Platzhalter |
| Form | `ui/form.tsx` | react-hook-form Integration |
| Avatar | `ui/avatar.tsx` | Benutzer-Avatare |
| Tabs | `ui/tabs.tsx` | Tab-Navigation (für Dialoge) |
| Collapsible | `ui/collapsible.tsx` | Einklappbare Bereiche |
| Alert | `ui/alert.tsx` | Warnhinweise |

---

## API-Client

```typescript
// apps/web/src/lib/api.ts

// Unauthentifizierte Anfragen
import { api } from '@/lib/api';
const categories = await api.getCategories();

// Authentifizierte Anfragen (Server Components)
import { getAuthenticatedApiClient } from '@/lib/api';
const authApi = await getAuthenticatedApiClient();
const result = await authApi.getComponents();

// Authentifizierte Anfragen (Client Components)
// Verwendet den useApi() Hook aus @/hooks/use-api
import { useApi } from '@/hooks/use-api';

function MyComponent() {
  const api = useApi(); // Token wird automatisch aus Session gesetzt
  // ...
  await api.createManufacturer(data);
}

// Verfügbare Methoden
// Categories
api.getCategories(params?)
api.getCategoryTree()
api.getCategoryBySlug(slug)
api.getCategoryPath(id)
api.createCategory(data)
api.updateCategory(id, data)
api.deleteCategory(id)

// Manufacturers
api.getManufacturers(params?)
api.searchManufacturers(query, limit?)
api.getManufacturerBySlug(slug)
api.createManufacturer(data)
api.updateManufacturer(id, data)
api.deleteManufacturer(id)

// Components
api.getComponents(params?)
api.getComponentBySlug(slug)
api.createComponent(data)
api.updateComponent(id, data)
api.deleteComponent(id)

// Parts
api.getParts(params?)
api.searchParts(query, limit?)
api.getPartByMpn(mpn)

// Packages
api.getPackages(params?)
api.searchPackages(query, limit?)
```

---

## Hinweise zur Entwicklung

### Keycloak Setup

Keycloak muss als Linux-Container laufen (nicht auf Windows Server nativ).
Optionen:
1. WSL2 mit Docker Desktop
2. Externer Linux-Server/VM
3. Azure/AWS Keycloak Service

### Umgebungsvariablen

```bash
# .env.local für Frontend
KEYCLOAK_URL=http://keycloak-host:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=your-secret

NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret
```

---

## Abgeschlossen

Phase 3 ist vollständig implementiert. Alle geplanten Features sind umgesetzt:

- Öffentliche Seiten mit i18n
- Detailseiten für Komponenten, Kategorien, Hersteller
- Erweiterte Suche mit Filtern
- Vollständiger Admin-Bereich mit CRUD
- Auth-Integration mit Keycloak

---

*Nächste Phase: [phase-4-community.md](phase-4-community.md)*

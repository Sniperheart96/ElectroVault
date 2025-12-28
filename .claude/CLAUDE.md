# ElectroVault - KI-Kontext

## Projektübersicht

**ElectroVault** ist eine Community-gepflegte Datenbank für elektrische Bauteile mit Fokus auf:
- Historische und moderne Komponenten (Röhren bis Nanotechnologie)
- Geräte-Reparatur-Dokumentation
- Schaltplan-Digitalisierung
- Umfassende Metadaten (Gefahrstoffe, Datierung, Militär-Specs, ECAD)

## Tech-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14+ (App Router), TailwindCSS, shadcn/ui |
| Backend | Fastify, Prisma, PostgreSQL |
| Auth | Keycloak + next-auth |
| Storage | MinIO (S3-kompatibel) |
| Monorepo | Turborepo + pnpm |
| Sprache | Deutsch (i18n-ready) |

## Kritische Domain-Konzepte

### 2-Ebenen-Bauteil-Architektur

```
CoreComponent (Logisches Bauteil)
    ↓ 1:n
ManufacturerPart (Konkretes Produkt)
```

- **CoreComponent** = Herstellerunabhängig (z.B. "555 Timer")
- **ManufacturerPart** = Konkretes Produkt eines Herstellers (z.B. "TI NE555P")

### Attribut-Scope

| Scope | Bedeutung | Beispiel |
|-------|-----------|----------|
| COMPONENT | Gilt für alle Hersteller | Pinanzahl, Grundkapazität |
| PART | Herstellerspezifisch | Toleranz, ESR, Lebensdauer |
| BOTH | Typisch auf Component, garantiert auf Part | Kapazitätswert |

### Lokalisierung (LocalizedString)

Alle Freitextfelder werden als JSON gespeichert:

```typescript
type LocalizedString = {
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  zh?: string;
};

// Beispiel
{ "de": "Kondensator", "en": "Capacitor" }
```

**Fallback-Kette:** Angefragte Sprache → Englisch → Erste verfügbare

### Kategorie-Hierarchie

```
Domain → Family → Type → Subtype (4 Ebenen)

Beispiel:
Passive Components → Capacitors → Electrolytic → Aluminum Electrolytic
```

### Lifecycle-Status

| Status | Bedeutung |
|--------|-----------|
| ACTIVE | In Produktion, empfohlen |
| NRND | Not Recommended for New Designs |
| EOL | End of Life angekündigt |
| OBSOLETE | Nicht mehr erhältlich |

## Benutzer-Rollen

| Rolle | Rechte |
|-------|--------|
| ADMIN | Vollzugriff, Benutzerverwaltung |
| MODERATOR | Inhalte freigeben, bearbeiten |
| CONTRIBUTOR | Inhalte erstellen, eigene bearbeiten |
| VIEWER | Nur lesen |

## Projektstruktur

```
electrovault/
├── .claude/                    # KI-Kontext & Agenten
│   ├── CLAUDE.md              # Dieses Dokument
│   └── agents/                # Agenten-Definitionen
├── apps/
│   ├── web/                   # Next.js Frontend + Admin
│   └── api/                   # Fastify Backend
├── packages/
│   ├── database/              # Prisma Schema & Extensions
│   ├── schemas/               # Zod-Validierung (shared)
│   ├── auth/                  # Keycloak/next-auth Wrapper
│   ├── ui/                    # shadcn/ui Komponenten
│   └── shared/                # Utils, Types, Constants
├── docker/                    # Container-Configs
└── docs/                      # Dokumentation
```

## Häufige Befehle

```bash
# Entwicklung
pnpm dev          # Alle Apps starten (Frontend :3000, API :3001)
pnpm build        # Production Build
pnpm lint         # ESLint + Prettier
pnpm test         # Vitest Tests ausführen

# Datenbank
pnpm db:migrate   # Prisma Migration ausführen
pnpm db:seed      # Seed-Daten laden
pnpm db:studio    # Prisma Studio öffnen
pnpm db:reset     # Datenbank zurücksetzen (Vorsicht!)
```

## Ausführungsumgebung

**Claude Code läuft direkt auf dem Windows Server (ITME-SERVER).**

```
Arbeitsverzeichnis: C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault
Server: Windows Server 2019 (ITME-SERVER)

Lokale Dienste (pgAdmin Server: "Development"):
├── PostgreSQL 18: Port 5432 (Datenbank: electrovault_dev)
├── Keycloak (Docker): Port 8080 (Realm: electrovault)
└── MinIO (Docker): Port 9000/9001 (Bucket: electrovault-files)
```

**Vorteile des direkten Server-Betriebs:**
- Kein UNC-Pfad-Problem mehr - alle `pnpm`-Befehle funktionieren
- Direkter Zugriff auf PostgreSQL (localhost:5432)
- Direkter Zugriff auf Docker-Container
- PowerShell-Befehle für Server-Administration möglich

## Wichtige Konventionen

1. **Soft-Delete** - Nichts wird physisch gelöscht (`deletedAt` Timestamp)
2. **Audit-Logging** - Jede Mutation wird protokolliert
3. **Zod-First** - Schema einmal definieren, überall nutzen
4. **Deutsche UI** - Aber i18n-ready für spätere Übersetzungen
5. **TypeScript strict** - Keine `any` Types erlaubt
6. **Keine Dummy-Daten in Fallbacks** - Fallback-Funktionen dürfen NIEMALS Dummy- oder Fake-Daten zurückgeben

## Fehlerbehandlung - Kritische Regel

**Fallback-Funktionen dürfen niemals fehlerhaften Code verschleiern!**

```typescript
// ❌ FALSCH - Verschleiert den Fehler mit Dummy-Daten
function getComponent(id: string) {
  try {
    return database.findById(id);
  } catch (error) {
    return { id: 'dummy', name: 'Fallback Component' }; // VERBOTEN!
  }
}

// ✅ RICHTIG - Fehler wird sichtbar gemacht
function getComponent(id: string) {
  try {
    return database.findById(id);
  } catch (error) {
    logger.error('Failed to fetch component', { id, error });
    throw new ComponentNotFoundError(id); // Oder: return null mit Fehlerbehandlung im UI
  }
}

// ✅ RICHTIG - Fallback mit klarer Fehlermeldung
function getLocalizedName(data: LocalizedString, locale: string): string {
  const value = data[locale] ?? data['en'] ?? Object.values(data)[0];
  if (!value) {
    console.error(`No localized value found for any language`, { data, locale });
    return '[MISSING TRANSLATION]'; // Sichtbarer Fehler, keine Fake-Daten
  }
  return value;
}
```

**Regeln:**
- Ein Fallback darf den Absturz verhindern, aber der Fehler MUSS sichtbar werden
- Logging ist Pflicht bei jedem Fallback
- Sichtbare Indikatoren im UI (z.B. `[FEHLER]`, `[MISSING]`) statt unsichtbarer Fake-Daten
- Im Zweifel: Lieber einen Fehler werfen als stillschweigend falsche Daten liefern

## GitHub Repository

**Repository:** https://github.com/Sniperheart96/ElectroVault

### Zugriff auf GitHub Actions (für Claude Code)

Claude Code kann GitHub Actions-Status direkt über die GitHub API abrufen:

```bash
# Neueste Workflow-Runs abrufen
curl https://api.github.com/repos/Sniperheart96/ElectroVault/actions/runs?per_page=3

# Spezifischen Run abrufen (ersetze RUN_ID)
curl https://api.github.com/repos/Sniperheart96/ElectroVault/actions/runs/RUN_ID

# Job-Details abrufen
curl https://api.github.com/repos/Sniperheart96/ElectroVault/actions/runs/RUN_ID/jobs
```

**Mit WebFetch-Tool:**
```typescript
WebFetch(
  "https://api.github.com/repos/Sniperheart96/ElectroVault/actions/runs?per_page=1",
  "Parse JSON und zeige status, conclusion, name"
)
```

**Keine Authentifizierung nötig** für öffentliche Repository-Daten (Actions, Issues, PRs).

### CI/CD Status

- **Aktive Jobs:** Unit Tests, Integration Tests
- **Deaktiviert (Phase 0):** E2E Tests, Lint & Type Check
  - Werden in Phase 1 aktiviert, sobald Apps existieren

### Branches

- `main` - Production-ready Code
- `develop` - Development Branch (TODO: erstellen)

---

## KRITISCH: Agenten-Nutzung ist PFLICHT

### Regel 1: Immer den passenden Agenten verwenden

**Bei JEDER Aufgabe MUSS geprüft werden, ob ein passender Agent existiert.**

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTEN-ENTSCHEIDUNG                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Aufgabe analysieren                                      │
│ 2. Passenden Agenten aus Liste unten suchen                 │
│ 3. Agent gefunden? → Agent aktivieren und nutzen            │
│ 4. Kein Agent passt? → User fragen (siehe Regel 2)          │
└─────────────────────────────────────────────────────────────┘
```

**Warum?**
- Agenten haben spezialisiertes Domain-Wissen
- Konsistente Arbeitsweise über alle Aufgaben
- Dokumentations-Meldepflicht wird eingehalten
- Best Practices werden automatisch angewendet

### Regel 2: Fehlende Agenten vorschlagen

**Wenn KEIN passender Agent existiert, MUSS der User gefragt werden:**

```markdown
## Neuen Agenten vorschlagen

Ich habe keinen passenden Agenten für diese Aufgabe gefunden.

**Aufgabenbereich:** [Beschreibung der Aufgabe]

**Vorschlag für neuen Agenten:**

| Eigenschaft | Wert |
|-------------|------|
| Name | [agent-name] |
| Beschreibung | [Kurzbeschreibung] |
| Fokus | [Hauptverantwortlichkeiten] |
| Datei | `agents/[agent-name]-agent.md` |

**Soll ich diesen Agenten erstellen?**
```

### Regel 3: Agent-Zuordnung nach Aufgabentyp

| Aufgabentyp | Agent |
|-------------|-------|
| Prisma Schema, Migrationen, Queries | **Database** |
| API-Endpoints, Services, Validierung | **API** |
| React, Next.js, UI-Komponenten | **Frontend** |
| Keycloak, Login, Rollen, Sessions | **Auth** |
| Docker, Server, Backups, DevOps | **Infrastructure** |
| Vitest, Playwright, CI/CD | **Testing** |
| Kategorien, Attribute, Elektronik-Domain | **Component Data** |
| Phasen-Doku, Features, Glossar | **Documentation** |

---

## Verfügbare Agenten

Spezialisierte Agenten für verschiedene Aufgabenbereiche:

| Agent | Datei | Fokus |
|-------|-------|-------|
| **Documentation** | `agents/documentation-agent.md` | **Zentrale Dokumentation** |
| Infrastructure | `agents/infrastructure-agent.md` | Server, Docker, Backups |
| Database | `agents/database-agent.md` | Prisma, Migrationen |
| Auth | `agents/auth-agent.md` | Keycloak, Rollen |
| API | `agents/api-agent.md` | Fastify, Services |
| Component Data | `agents/component-data-agent.md` | Elektronik-Domain |
| Frontend | `agents/frontend-agent.md` | Next.js, UI |
| Testing | `agents/testing-agent.md` | Tests, CI/CD |

---

## Agenten-Workflow: Dokumentations-Meldepflicht

**KRITISCH:** Nach jeder abgeschlossenen Arbeit MUSS der Documentation Agent informiert werden!

### Ablauf

```
1. Agent erledigt Aufgabe (z.B. API Agent implementiert neuen Endpoint)
2. Agent meldet an Documentation Agent:
   - Was wurde implementiert?
   - Welche Schnittstellen (APIs, Enums, Types)?
   - Welche Namenskonventionen?
   - Welche Phase betrifft es?
3. Documentation Agent aktualisiert:
   - Phasen-Dokument (Status)
   - Feature-Dokumentation
   - Schnittstellen-Glossar
   - CHANGELOG
```

### Meldungs-Template

```markdown
## Meldung an Documentation Agent

**Agent:** [api|database|frontend|auth|infrastructure|testing|component-data]
**Phase:** [0-5]
**Typ:** [Feature|Bugfix|Refactoring|Schema-Änderung|Security-Fix]

### Zusammenfassung
[1-2 Sätze was gemacht wurde]

### Implementierte Features
- Feature 1: [Beschreibung]

### Neue/Geänderte Schnittstellen
| Name | Typ | Beschreibung |
|------|-----|--------------|
| POST /api/v1/example | API | Beispiel |
| ExampleEnum | Enum | WERT_1, WERT_2 |

### Namenskonventionen verwendet
| Begriff | Deutsch | Englisch | Kontext |
|---------|---------|----------|---------|
| Example | Beispiel | Example | Kontext |

### Betroffene Dateien
- path/to/file.ts (neu/geändert)
```

### Warum ist das wichtig?

1. **Konsistente Dokumentation** - Alles wird an der richtigen Stelle dokumentiert
2. **Namenskonventionen** - Einheitliche Begriffe über alle Agenten
3. **Schnittstellen-Übersicht** - Zentrale Referenz für APIs, Enums, Types
4. **Phasen-Tracking** - Status der Implementierung immer aktuell
5. **CHANGELOG** - Automatische Änderungshistorie

---

## Wichtige Hinweise für Claude Code

### Direkter Server-Zugriff

Da Claude Code direkt auf ITME-SERVER läuft:

1. **Alle pnpm-Befehle funktionieren** - Kein UNC-Pfad-Workaround nötig
2. **PowerShell verfügbar** - Für Server-Administration und Dienste-Management
3. **Docker-Zugriff** - Container können direkt verwaltet werden
4. **PostgreSQL lokal** - Verbindung über `localhost:5432`

### Typische Arbeitsabläufe

```bash
# Dependencies installieren
pnpm install

# Tests ausführen
pnpm test

# Prisma Client generieren
pnpm db:generate

# Migrationen ausführen
pnpm db:migrate

# Entwicklungsserver starten
pnpm dev
```

### Dev-Server starten - WICHTIG

**Vor dem Starten eines Dev-Servers IMMER prüfen ob bereits einer läuft!**

```powershell
# Prüfen ob Port 3000 oder 3001 belegt ist
netstat -ano | findstr ":3000 :3001"

# Falls belegt: Prozess beenden (PID aus netstat nehmen)
Stop-Process -Id <PID> -Force
```

**Regeln:**
- Es darf nur EIN Frontend-Server laufen (Port 3000)
- Es darf nur EIN API-Server laufen (Port 3001)
- Vor `pnpm dev` immer alte Prozesse beenden
- Bei Port-Konflikten: Nicht einfach anderen Port nehmen, sondern alten Prozess beenden

### Server-Dienste prüfen

```powershell
# PostgreSQL Status
Get-Service postgresql*

# Docker Container Status
docker ps

# Port-Belegung prüfen
netstat -ano | findstr ":5432 :8080 :9000"
```

---

## Dokumentations-Richtlinien

### Struktur

```
docs/
├── README.md                      # Hauptübersicht mit Links
├── CHANGELOG.md                   # Änderungshistorie
├── architecture/                  # Architektur-Entscheidungen
│   ├── tech-stack.md             # Technologie-Entscheidungen
│   ├── i18n.md                   # Internationalisierung
│   ├── database-schema.md        # Prisma-Schema Details
│   └── development-environment.md # Server-Setup
└── phases/                        # Implementierungs-Phasen
    ├── phase-0-setup.md          # Projekt-Setup
    ├── phase-1-database-auth.md  # Datenbank & Auth
    ├── phase-2-component-api.md  # Component API
    ├── phase-3-frontend.md       # Frontend
    ├── phase-4-community.md      # Community-Features
    └── phase-5-devices.md        # Geräte-Reparatur-DB
```

### Dateinamen-Konventionen

- **Kleinschreibung** mit Bindestrichen: `phase-1-database-auth.md`
- **Keine Unterstriche** oder CamelCase
- **Sprechende Namen**: Inhalt beschreiben
- **Einheitlich**: Alle Phasen-Dateien folgen dem Muster `phase-X-beschreibung.md`

### Markdown-Regeln

1. **Überschriften**: Maximal 3 Ebenen (`#`, `##`, `###`)
2. **Code-Blöcke**: Immer mit Sprach-Tag (```typescript, ```bash, etc.)
3. **Links**: Relative Pfade zu anderen Docs
4. **Status-Icons**: ✅ Fertig, ⏳ In Arbeit, ❌ Blockiert
5. **Keine Emojis** in Überschriften (außer Status-Icons)
6. **Tabellen**: Für strukturierte Daten bevorzugen

### Was gehört wohin?

| Inhalt | Dokument |
|--------|----------|
| Technologie-Entscheidungen | `architecture/tech-stack.md` |
| i18n-Details | `architecture/i18n.md` |
| Datenbank-Schema | `architecture/database-schema.md` |
| Server/Credentials | `architecture/development-environment.md` |
| Phase-spezifische Aufgaben | `phases/phase-X-*.md` |
| Änderungen | `CHANGELOG.md` |
| Schnellübersicht | `docs/README.md` |

### Neue Dokumentation erstellen

1. Passenden Ordner wählen (`architecture/` oder `phases/`)
2. Dateiname nach Konvention
3. Einheitliche Struktur (Übersicht → Details → Nächste Schritte)
4. Links zu verwandten Dokumenten am Ende
5. In `docs/README.md` verlinken

---

*Letzte Aktualisierung: 2025-12-28 (Agenten-Pflicht hinzugefügt)*

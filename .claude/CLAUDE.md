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

Alle Freitextfelder werden als JSON gespeichert.

**Details:** Siehe [docs/architecture/i18n.md](docs/architecture/i18n.md)

**Kurz:**
- Type: `LocalizedString = { en?: string; de?: string; fr?: string; es?: string; zh?: string }`
- Beispiel: `{ "de": "Kondensator", "en": "Capacitor" }`
- Fallback: Angefragte Sprache → Englisch → Erste verfügbare

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

### Branches

- `main` - Production-ready Code

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

## Dokumentations-Struktur

Die Dokumentation beschreibt ausschließlich den **Ist-Zustand** des Projekts.

```
docs/
├── README.md                      # Einstiegspunkt & Navigation
├── CHANGELOG.md                   # Änderungshistorie
├── architecture/                  # System-Architektur
│   ├── tech-stack.md             # Technologien & Libraries
│   ├── database-schema.md        # Prisma-Schema
│   ├── auth-keycloak.md          # Auth-Implementierung
│   ├── i18n.md                   # Lokalisierung
│   ├── api-helpers.md            # Backend-Helper
│   └── frontend-components.md    # UI-Komponenten
├── guides/                        # Anleitungen
│   ├── development-setup.md      # Server, Credentials, Setup
│   └── pin-mapping.md            # Pin-Mapping Nutzung
└── reference/                     # Referenz-Material
    ├── api-endpoints.md          # REST-API Übersicht
    ├── pin-mapping-ui.md         # Pin-Mapping UI-Komponenten
    └── known-issues.md           # Bekannte Probleme
```

### Dateinamen-Konventionen

- **Kleinschreibung** mit Bindestrichen: `development-setup.md`
- **Keine Unterstriche** oder CamelCase
- **Sprechende Namen**: Inhalt beschreiben

### Markdown-Regeln

1. **Überschriften**: Maximal 3 Ebenen (`#`, `##`, `###`)
2. **Code-Blöcke**: Immer mit Sprach-Tag (```typescript, ```bash, etc.)
3. **Links**: Relative Pfade zu anderen Docs
4. **Keine Emojis** in Überschriften
5. **Tabellen**: Für strukturierte Daten bevorzugen

### Was gehört wohin?

| Inhalt | Dokument |
|--------|----------|
| Technologie-Entscheidungen | `architecture/tech-stack.md` |
| Datenbank-Schema | `architecture/database-schema.md` |
| Auth-Details | `architecture/auth-keycloak.md` |
| Server/Setup | `guides/development-setup.md` |
| API-Referenz | `reference/api-endpoints.md` |
| Bekannte Probleme | `reference/known-issues.md` |
| Änderungen | `CHANGELOG.md` |

---

*Letzte Aktualisierung: 2025-12-29*

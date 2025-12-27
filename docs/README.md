# ElectroVault - Dokumentation

> **Letzte Aktualisierung:** 2025-12-27
> **Aktueller Status:** Phase 0 ✅ | Phase 1 ✅ | Phase 2 ✅ | Phase 3 ⏳

## Schnellnavigation

### Projekt-Status

| Phase | Status | Beschreibung | Dokumentation |
|-------|--------|--------------|---------------|
| **Phase 0** | ✅ 100% | Projekt-Setup, Monorepo, Docker | [phase-0-setup.md](phases/phase-0-setup.md) |
| **Phase 1** | ✅ 100% | Datenbank, Auth, API-Grundlagen | [phase-1-database-auth.md](phases/phase-1-database-auth.md) |
| **Phase 2** | ✅ 100% | CRUD-APIs, Attribut-System | [phase-2-component-api.md](phases/phase-2-component-api.md) |
| **Phase 3** | ⏳ 0% | Frontend, Admin-UI | [phase-3-frontend.md](phases/phase-3-frontend.md) |
| **Phase 4** | ⏳ 0% | Community-Features | [phase-4-community.md](phases/phase-4-community.md) |
| **Phase 5** | ⏳ 0% | Geräte-Reparatur-DB | [phase-5-devices.md](phases/phase-5-devices.md) |

### Architektur

| Dokument | Inhalt |
|----------|--------|
| [tech-stack.md](architecture/tech-stack.md) | Technologie-Entscheidungen, Bibliotheken |
| [i18n.md](architecture/i18n.md) | Internationalisierung, LocalizedString |
| [database-schema.md](architecture/database-schema.md) | Prisma-Schema, 2-Ebenen-Architektur |
| [development-environment.md](architecture/development-environment.md) | Server-Setup, Credentials |
| [auth-keycloak.md](architecture/auth-keycloak.md) | **JWT-Validierung, User-Sync, Fallstricke** |

### Weitere Dokumente

- [CHANGELOG.md](CHANGELOG.md) - Änderungshistorie
- [../README.md](../README.md) - Projekt-Hauptseite
- [../.claude/CLAUDE.md](../.claude/CLAUDE.md) - KI-Kontext

---

## Dokumentations-Konventionen

### Dateinamen

- **Kleinschreibung** mit Bindestrichen: `phase-1-database-auth.md`
- **Keine Unterstriche** oder gemischte Schreibweise
- **Sprechende Namen**: Beschreiben den Inhalt

### Struktur

```
docs/
├── README.md                      # Diese Übersicht
├── CHANGELOG.md                   # Änderungshistorie
├── architecture/                  # Architektur-Entscheidungen
│   ├── tech-stack.md
│   ├── i18n.md
│   ├── database-schema.md
│   ├── development-environment.md
│   └── auth-keycloak.md           # JWT, User-Sync, Fallstricke
└── phases/                        # Implementierungs-Phasen
    ├── phase-0-setup.md
    ├── phase-1-database-auth.md
    ├── phase-2-component-api.md
    ├── phase-3-frontend.md
    ├── phase-4-community.md
    └── phase-5-devices.md
```

### Markdown-Richtlinien

1. **Überschriften**: Maximal 3 Ebenen (`#`, `##`, `###`)
2. **Code-Blöcke**: Immer mit Sprach-Tag (```typescript, ```bash, etc.)
3. **Links**: Relative Pfade zu anderen Docs
4. **Status-Icons**: ✅ Fertig, ⏳ In Arbeit, ❌ Blockiert
5. **Keine Emojis** in Überschriften (außer Status-Icons)

---

*Dokumentation gepflegt von Claude Code*

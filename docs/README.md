# ElectroVault - Dokumentation

> Interne Entwickler-Dokumentation für das ElectroVault-Projekt.

## Schnellnavigation

### Architektur

| Dokument | Inhalt |
|----------|--------|
| [tech-stack.md](architecture/tech-stack.md) | Technologien, Libraries, Entscheidungen |
| [database-schema.md](architecture/database-schema.md) | Prisma-Schema, 2-Ebenen-Architektur |
| [auth-keycloak.md](architecture/auth-keycloak.md) | JWT-Validierung, User-Sync, Rollen |
| [i18n.md](architecture/i18n.md) | Internationalisierung, LocalizedString |
| [api-helpers.md](architecture/api-helpers.md) | Backend Helper-Funktionen |
| [frontend-components.md](architecture/frontend-components.md) | UI-Komponenten & Hooks |

### Anleitungen

| Dokument | Inhalt |
|----------|--------|
| [development-setup.md](guides/development-setup.md) | Server-Setup, Credentials, Erste Schritte |
| [pin-mapping.md](guides/pin-mapping.md) | Pin-Mapping Nutzung & Beispiele |

### Referenz

| Dokument | Inhalt |
|----------|--------|
| [api-endpoints.md](reference/api-endpoints.md) | REST-API Übersicht (alle Endpunkte) |
| [pin-mapping-ui.md](reference/pin-mapping-ui.md) | Pin-Mapping UI-Komponenten |
| [known-issues.md](reference/known-issues.md) | Bekannte Probleme & Workarounds |

### Weitere Dokumente

- [CHANGELOG.md](CHANGELOG.md) - Änderungshistorie
- [../README.md](../README.md) - Projekt-Hauptseite
- [../.claude/CLAUDE.md](../.claude/CLAUDE.md) - KI-Kontext

---

## Dokumentations-Struktur

```
docs/
├── README.md                      # Diese Übersicht
├── CHANGELOG.md                   # Änderungshistorie
├── architecture/                  # System-Architektur
│   ├── tech-stack.md
│   ├── database-schema.md
│   ├── auth-keycloak.md
│   ├── i18n.md
│   ├── api-helpers.md
│   └── frontend-components.md
├── guides/                        # Anleitungen
│   ├── development-setup.md
│   └── pin-mapping.md
└── reference/                     # Referenz-Material
    ├── api-endpoints.md
    ├── pin-mapping-ui.md
    └── known-issues.md
```

## Konventionen

### Dateinamen

- **Kleinschreibung** mit Bindestrichen: `development-setup.md`
- **Keine Unterstriche** oder gemischte Schreibweise
- **Sprechende Namen**: Beschreiben den Inhalt

### Markdown-Richtlinien

1. **Überschriften**: Maximal 3 Ebenen (`#`, `##`, `###`)
2. **Code-Blöcke**: Immer mit Sprach-Tag (```typescript, ```bash, etc.)
3. **Links**: Relative Pfade zu anderen Docs
4. **Keine Emojis** in Überschriften

---

*Dokumentation gepflegt von Claude Code*

# Keycloak Konfiguration für ElectroVault

## Realm: electrovault

### Rollen

| Rolle | Beschreibung | Berechtigungen |
|-------|--------------|----------------|
| **admin** | Administrator | Vollzugriff auf alle Funktionen |
| **moderator** | Moderator | Inhalte freigeben, bearbeiten, löschen |
| **contributor** | Contributor | Inhalte erstellen, eigene bearbeiten |
| **viewer** | Viewer | Nur Lesezugriff (Standard) |

### Clients

#### electrovault-web
- **Client ID**: `electrovault-web`
- **Typ**: Confidential Client
- **Protocol**: OpenID Connect
- **Verwendung**: Next.js Frontend

#### electrovault-api
- **Client ID**: `electrovault-api`
- **Typ**: Bearer-only
- **Protocol**: OpenID Connect
- **Verwendung**: Fastify Backend (Service Account)

## Setup

### Option 1: Realm Import (Empfohlen)

```bash
# Keycloak Admin Console öffnen
http://ITME-SERVER:8080

# 1. Login als admin
# 2. "Add Realm" → "Import"
# 3. Datei auswählen: realm-export.json
# 4. "Create" klicken
```

### Option 2: Manuell einrichten

#### 1. Realm erstellen

1. Keycloak Admin Console öffnen
2. "Add Realm" klicken
3. Name: `electrovault`
4. Display Name: `ElectroVault`
5. Enabled: `true`

#### 2. Rollen erstellen

1. Realm Settings → Roles
2. Folgende Rollen erstellen:
   - `admin`
   - `moderator`
   - `contributor`
   - `viewer`

#### 3. Client erstellen (Web)

1. Clients → Create
2. Client ID: `electrovault-web`
3. Client Protocol: `openid-connect`
4. Access Type: `confidential`
5. Valid Redirect URIs:
   - `http://localhost:3000/*`
   - `http://ITME-SERVER:3000/*`
6. Web Origins:
   - `http://localhost:3000`
   - `http://ITME-SERVER:3000`

#### 4. Client Secret speichern

1. Clients → `electrovault-web` → Credentials
2. Client Secret kopieren
3. In `.env.local` eintragen:

```bash
KEYCLOAK_CLIENT_SECRET=<dein-client-secret>
```

#### 5. Test-Benutzer erstellen

1. Users → Add User
2. Username: `testuser`
3. Email: `test@electrovault.local`
4. Enabled: `true`
5. Credentials → Set Password
6. Role Mappings → Assign Role → `contributor`

## Umgebungsvariablen

In `.env.local`:

```bash
# Keycloak
KEYCLOAK_URL=http://ITME-SERVER:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=<secret-aus-keycloak>

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generiere-mit-openssl-rand-base64-32>
```

## Client Secrets generieren

```bash
# Secret für NextAuth generieren
openssl rand -base64 32
```

## Keycloak Admin URLs

- **Admin Console**: http://ITME-SERVER:8080/admin
- **Account Console**: http://ITME-SERVER:8080/realms/electrovault/account
- **OpenID Config**: http://ITME-SERVER:8080/realms/electrovault/.well-known/openid-configuration

## Troubleshooting

### "Invalid Redirect URI"

Stelle sicher, dass die Redirect URIs in Keycloak exakt mit deiner Anwendung übereinstimmen.

### "Client not found"

Prüfe ob der Client `electrovault-web` im Realm `electrovault` existiert.

### Realm Import schlägt fehl

1. Prüfe ob Keycloak läuft
2. Prüfe JSON-Syntax in `realm-export.json`
3. Importiere manuell über die Admin Console

## Next Steps

Nach dem Keycloak-Setup:

1. Client Secret in `.env.local` eintragen
2. NextAuth in Next.js konfigurieren
3. Test-Login durchführen
4. Rollen-basierte Autorisierung testen

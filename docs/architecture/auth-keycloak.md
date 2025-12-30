# Authentifizierung und Autorisierung

Dokumentation der Keycloak-Integration in ElectroVault.

## Übersicht

ElectroVault verwendet **Keycloak** als zentralen Identity Provider (IdP) für Authentifizierung und Autorisierung. Die Integration erfolgt über zwei Ebenen:

- **Frontend (Next.js)**: next-auth mit Keycloak Provider
- **Backend (Fastify)**: JWT-Validierung via JWKS

```
┌─────────────────────────────────────────────────────────────┐
│                        ARCHITEKTUR                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                    ┌──────────────┐          │
│  │ Browser  │◄──────────────────►│  Next.js     │          │
│  │ (Client) │   Session Cookie   │  Frontend    │          │
│  └──────────┘                    └──────┬───────┘          │
│       │                                  │                  │
│       │ (1) Login-Redirect               │ (2) Token        │
│       ▼                                  ▼     Exchange     │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Keycloak    │◄─────────────│  next-auth   │            │
│  │  (IdP)       │   OAuth2/    │  (packages/  │            │
│  │              │   OIDC       │   auth)      │            │
│  └──────┬───────┘              └──────────────┘            │
│         │                              │                    │
│         │ (3) JWT Token                │                    │
│         │                              │ (4) API Request    │
│         │                              ▼    (Bearer Token)  │
│         │                      ┌──────────────┐             │
│         │                      │  Fastify     │             │
│         │                      │  API         │             │
│         │                      └──────┬───────┘             │
│         │                             │                     │
│         │ (5) JWKS Verify              │                     │
│         └─────────────────────────────┘                     │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │  PostgreSQL Database                 │                  │
│  │  ┌────────────────────────────────┐  │                  │
│  │  │ User Table (Sync)              │  │                  │
│  │  │ - externalId (Keycloak sub)    │  │                  │
│  │  │ - email, username, displayName │  │                  │
│  │  │ - role, lastLoginAt            │  │                  │
│  │  └────────────────────────────────┘  │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Flow:**

1. Browser redirectet zu Keycloak Login
2. Nach erfolgreicher Authentifizierung tauscht next-auth den Authorization Code gegen Tokens
3. Keycloak gibt Access Token (JWT) und Refresh Token zurück
4. Next.js speichert Session Cookie, API-Calls verwenden Access Token
5. Fastify validiert JWT via JWKS (Public Key von Keycloak)

---

## Keycloak-Konfiguration

### Realm und Client

| Eigenschaft | Wert | Quelle |
|-------------|------|--------|
| URL | http://localhost:8080 | KEYCLOAK_URL |
| Realm | electrovault | KEYCLOAK_REALM |
| Client ID | electrovault-web | KEYCLOAK_CLIENT_ID |
| Client Secret | (generiert) | KEYCLOAK_CLIENT_SECRET |

**OIDC Endpoints:**

- Authorization: `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/auth`
- Token: `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token`
- UserInfo: `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/userinfo`
- JWKS: `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs`
- Logout: `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/logout`

### Rollen-System

Keycloak verwaltet 4 Rollen, die im Realm `electrovault` definiert sind:

| Keycloak-Rolle | Datenbank-Enum | Hierarchie | Beschreibung |
|----------------|----------------|------------|--------------|
| admin | ADMIN | 1 (höchste) | Volle Rechte, Benutzerverwaltung |
| moderator | MODERATOR | 2 | Inhalte freigeben/ablehnen |
| contributor | CONTRIBUTOR | 3 | Inhalte erstellen/bearbeiten |
| viewer | VIEWER | 4 (niedrigste) | Nur lesen |

**Hierarchie-Vererbung:**

- ADMIN hat alle Rechte von MODERATOR, CONTRIBUTOR, VIEWER
- MODERATOR hat alle Rechte von CONTRIBUTOR, VIEWER
- CONTRIBUTOR hat alle Rechte von VIEWER

**Implementierung:** `KeycloakClient.hasAnyRole()` prüft Hierarchie automatisch.

### Token-Struktur

**JWT Payload (Auszug):**

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "preferred_username": "johndoe",
  "name": "John Doe",
  "azp": "electrovault-web",
  "aud": "account",
  "realm_access": {
    "roles": ["viewer"]
  },
  "resource_access": {
    "electrovault-web": {
      "roles": ["contributor"]
    }
  }
}
```

**Wichtige Felder:**

- `sub` - Keycloak User ID (wird als `externalId` in DB gespeichert)
- `azp` - Authorized Party (Client ID) - wird zur Validierung geprüft
- `aud` - Audience (meist "account") - wird NICHT geprüft
- `realm_access.roles` - Realm-Rollen
- `resource_access.{clientId}.roles` - Client-spezifische Rollen

**Rolle-Extraktion:** Beide Listen werden gemerged, Client-Rollen haben Vorrang.

---

## Next.js Frontend Integration

### next-auth Konfiguration

**Datei:** `apps/web/src/lib/auth.ts`

**Provider:** Keycloak OAuth 2.0 / OIDC

```typescript
KeycloakProvider({
  clientId: keycloakConfig.clientId,
  clientSecret: keycloakConfig.clientSecret,
  issuer: keycloakConfig.issuer,
  authorization: {
    params: {
      scope: 'openid email profile',
    },
  },
  checks: ['pkce', 'state'],
})
```

**Scopes:**

- `openid` - OIDC Standard
- `email` - E-Mail-Adresse
- `profile` - Name, Username, Profilbild

**Security Checks:**

- PKCE (Proof Key for Code Exchange) - Schutz gegen Authorization Code Interception
- State Parameter - CSRF-Schutz

### Session Management

**Strategie:** JWT (clientseitig verschlüsselt im Cookie)

**Session-Dauer:** 30 Tage (Rolling Session)

- Bei jeder Aktivität wird die Session um 30 Tage verlängert
- `updateAge: 24h` - Session wird mindestens alle 24 Stunden aktualisiert
- Besucht der User die Seite innerhalb von 30 Tagen erneut, beginnt der Countdown von vorne

**Cookie-Konfiguration:**

| Cookie | Zweck | httpOnly | sameSite | secure |
|--------|-------|----------|----------|--------|
| next-auth.session-token | Session | true | lax | prod: true, dev: false |
| next-auth.csrf-token | CSRF-Schutz | true | lax | prod: true, dev: false |
| next-auth.pkce.code_verifier | PKCE | true | lax | prod: true, dev: false |

**Session-Objekt:**

```typescript
{
  user: {
    id: string;           // Keycloak sub
    email: string | null;
    name: string | null;
    image: string | null;
    roles: string[];      // ['admin', 'moderator', ...]
  },
  accessToken: string;    // JWT für API-Calls
  error?: string;         // 'RefreshAccessTokenError' wenn Token-Refresh fehlschlägt
}
```

### JWT Callbacks

**1. JWT Callback:** Verarbeitet Token beim Login und Refresh

```typescript
async jwt({ token, account, user }) {
  // Beim Login: Access Token und Rollen extrahieren
  if (account && user) {
    const decodedToken = decodeJWT(account.access_token);
    return {
      ...token,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      expiresAt: account.expires_at,
      roles: extractRoles(decodedToken),
    };
  }

  // Token noch gültig? → zurückgeben
  if (Date.now() < token.expiresAt * 1000) {
    return token;
  }

  // Token abgelaufen → refreshen
  return refreshAccessToken(token);
}
```

**2. Session Callback:** Erstellt Session-Objekt für Client

```typescript
async session({ session, token }) {
  return {
    ...session,
    accessToken: token.accessToken,
    error: token.error,
    user: {
      ...session.user,
      id: token.sub,
      roles: token.roles || [],
    },
  };
}
```

### Token Refresh

**Ablauf:**

1. JWT Callback prüft ob Token abgelaufen (`expiresAt`)
2. Falls ja: POST zu `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token`
3. Body: `grant_type=refresh_token&refresh_token={token}`
4. Response: Neuer Access Token, neuer Refresh Token (optional)
5. Bei Fehler: `error: 'RefreshAccessTokenError'` im Token

**Implementierung:** `apps/web/src/lib/auth.ts` - `refreshAccessToken()`

### Logout

**Single Logout (SLO):** Beim Logout wird auch Keycloak-Session beendet.

**Event Handler:**

```typescript
events: {
  async signOut({ token }) {
    if (token?.refreshToken) {
      await fetch(`{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/logout`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          refresh_token: token.refreshToken,
        }),
      });
    }
  },
}
```

### Auth-Seiten

| Route | Component | Zweck |
|-------|-----------|-------|
| /auth/signin | `apps/web/src/app/auth/signin/page.tsx` | Login-Seite, redirectet zu Keycloak |
| /auth/signout | `apps/web/src/app/auth/signout/page.tsx` | Logout-Seite |
| /auth/error | `apps/web/src/app/auth/error/page.tsx` | Fehlerseite |

**Login-Flow:**

1. User klickt auf "Anmelden"
2. `signIn('keycloak', { callbackUrl: '/' })`
3. Redirect zu Keycloak Login
4. Nach Login: Redirect zurück zu `callbackUrl`

### Server-Side Auth Utilities

**Datei:** `apps/web/src/lib/auth-server.ts`

Funktionen für Server Components und API Routes:

```typescript
// Session abrufen
const session = await getSession();

// Aktuellen User abrufen
const user = await getCurrentUser();

// Prüfen ob authentifiziert
const isAuth = await isAuthenticated();

// Rolle prüfen
const hasRole = await userHasRole('admin');
const hasAny = await userHasAnyRole(['admin', 'moderator']);

// Convenience-Funktionen
const admin = await isAdmin();
const mod = await isModerator();
const contrib = await isContributor();
```

**Wichtig:** Die Convenience-Funktionen `isModerator()` und `isContributor()` prüfen MEHRERE Rollen (inkl. ADMIN), da Admins alle Rechte haben:

```typescript
// isModerator() erlaubt ADMIN und MODERATOR
await userHasAnyRole([Roles.ADMIN, Roles.MODERATOR])

// isContributor() erlaubt ADMIN, MODERATOR und CONTRIBUTOR
await userHasAnyRole([Roles.ADMIN, Roles.MODERATOR, Roles.CONTRIBUTOR])
```

**Rollen-Konstanten:**

```typescript
export const Roles = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;
```

### Frontend Rollen-Helper

**Datei:** `apps/web/src/lib/auth.ts`

**Wichtig:** Die Frontend-Helper `hasRole()` und `hasAnyRole()` haben KEINE Hierarchie-Logik - sie prüfen nur direkte Rollen-Matches:

```typescript
// Frontend: Nur direkte Rollen-Prüfung
export function hasRole(session: Session | null, role: string): boolean {
  return session?.user?.roles?.includes(role) ?? false;
}

export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  return roles.some(role => hasRole(session, role));
}
```

Für Hierarchie-Logik im Frontend müssen die Rollen-Arrays explizit angegeben werden:

```typescript
// Moderator-Rechte (inkl. Admin)
hasAnyRole(session, ['admin', 'moderator'])

// Contributor-Rechte (inkl. Admin und Moderator)
hasAnyRole(session, ['admin', 'moderator', 'contributor'])
```

---

## Fastify Backend Integration

### Auth Plugin

**Datei:** `packages/auth/src/fastify/index.ts`

Fastify-Plugin für JWT-Validierung und Rollen-Prüfung.

**Initialisierung:**

```typescript
import authPlugin, { createKeycloakClient } from '@electrovault/auth';
import { prisma } from '@electrovault/database';

const keycloak = createKeycloakClient();

await fastify.register(authPlugin, {
  keycloak,
  prisma,
});
```

### Hooks und Decorators

**1. optionalAuth** - Setzt `request.user` wenn Token vorhanden

```typescript
fastify.get('/api/public', {
  preHandler: fastify.optionalAuth,
}, async (request, reply) => {
  if (request.user) {
    return { message: `Hallo ${request.user.displayName}` };
  }
  return { message: 'Hallo Gast' };
});
```

**2. requireAuth** - Auth erforderlich, sonst 401

```typescript
fastify.get('/api/protected', {
  preHandler: fastify.requireAuth,
}, async (request, reply) => {
  return { userId: request.user.dbId };
});
```

**3. requireRole** - Rolle erforderlich, sonst 403

```typescript
fastify.delete('/api/admin/users/:id', {
  preHandler: fastify.requireRole('admin'),
}, async (request, reply) => {
  // Nur Admins dürfen User löschen
});

// Mehrere Rollen erlauben
fastify.post('/api/moderation/approve', {
  preHandler: fastify.requireRole(['admin', 'moderator']),
}, async (request, reply) => {
  // Admins und Moderatoren dürfen freigeben
});
```

### Request.user Objekt

**Type:** `AuthenticatedUser` (nach optionalAuth/requireAuth)

```typescript
interface AuthenticatedUser {
  id: string;           // Keycloak sub
  email?: string;
  username?: string;
  displayName?: string;
  roles: string[];      // ['admin', 'moderator', ...]
  dbId?: string;        // UUID aus lokaler DB (nach Sync)
  dbRole?: UserRole;    // ADMIN | MODERATOR | CONTRIBUTOR | VIEWER
}
```

**Type Guard:** `assertAuthenticated()` für Type Safety

```typescript
import { assertAuthenticated, type AuthenticatedRequest } from '@electrovault/auth';

async function handler(request: FastifyRequest, reply: FastifyReply) {
  assertAuthenticated(request);
  // TypeScript weiß jetzt: request.user.dbId existiert!
  const userId = request.user.dbId; // string, nicht string | undefined
}
```

**Type nach assertAuthenticated:** `VerifiedUser` mit garantierten `dbId` und `dbRole`.

### JWT-Validierung

**Klasse:** `KeycloakClient` (`packages/auth/src/keycloak.ts`)

**Validierungs-Schritte:**

1. JWKS von Keycloak laden (gecacht)
2. JWT-Signatur verifizieren (jose Library)
3. Issuer prüfen (`{KEYCLOAK_URL}/realms/{REALM}`)
4. Authorized Party (`azp`) prüfen (muss `KEYCLOAK_CLIENT_ID` sein)
5. Token-Payload extrahieren

**Implementierung:**

```typescript
async verifyToken(token: string): Promise<TokenPayload> {
  const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: this.issuer,
  });

  if (payload.azp !== this.config.clientId) {
    throw new Error(`Token was issued for client "${payload.azp}", expected "${this.config.clientId}"`);
  }

  return payload as TokenPayload;
}
```

**Warum wird `aud` nicht geprüft?** Keycloak setzt `aud: "account"` (für den Account-Service), aber `azp` enthält den requesting Client. Die `azp`-Prüfung ist sicherer.

### Rollen-Prüfung mit Hierarchie

**Methode:** `hasAnyRole(userInfo, requiredRoles)`

**Hierarchie-Logik:**

```typescript
const roleHierarchy = {
  admin: ['admin', 'moderator', 'contributor', 'viewer'],
  moderator: ['moderator', 'contributor', 'viewer'],
  contributor: ['contributor', 'viewer'],
  viewer: ['viewer'],
};
```

**Beispiel:**

- User hat Rolle `moderator`
- Endpoint erfordert `contributor`
- Result: ERLAUBT (moderator schließt contributor ein)

**Case-Insensitive:** Keycloak-Rollen sind lowercase, API-Enums sind UPPERCASE - wird automatisch normalisiert.

---

## User-Sync zwischen Keycloak und Datenbank

### Synchronisations-Service

**Datei:** `packages/auth/src/user-sync.ts`

**Funktion:** `syncUser(prisma, { userInfo, avatarUrl? })`

**Ablauf:**

1. User aus Keycloak kommt rein (UserInfo)
2. Höchste Rolle bestimmen (aus Keycloak-Rollen)
3. User in DB upserten (create or update)
4. Timestamp `lastLoginAt` aktualisieren

**Prisma Upsert:**

```typescript
await prisma.user.upsert({
  where: { externalId: userInfo.id },
  update: {
    email: userInfo.email,
    username: userInfo.username,
    displayName: userInfo.displayName,
    role: getHighestRole(userInfo.roles),
    avatarUrl: avatarUrl,
    lastLoginAt: new Date(),
  },
  create: {
    externalId: userInfo.id,
    email: userInfo.email,
    username: userInfo.username || `user-${userInfo.id.substring(0, 8)}`,
    displayName: userInfo.displayName,
    role: getHighestRole(userInfo.roles),
    avatarUrl: avatarUrl,
    lastLoginAt: new Date(),
  },
});
```

**Rollen-Mapping:**

```typescript
const ROLE_MAPPING = {
  admin: 'ADMIN',
  moderator: 'MODERATOR',
  contributor: 'CONTRIBUTOR',
  viewer: 'VIEWER',
};

function getHighestRole(keycloakRoles: string[]): UserRole {
  const hierarchy = ['ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'VIEWER'];
  for (const role of hierarchy) {
    if (keycloakRoles.includes(role.toLowerCase())) {
      return role;
    }
  }
  return 'VIEWER'; // Default
}
```

**Zeitpunkt:** User-Sync erfolgt bei jedem API-Request mit gültigem Token (via `requireAuth` oder `optionalAuth`).

### User Model (Datenbank)

**Tabelle:** `User` (Prisma Schema)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primärschlüssel (lokal generiert) |
| externalId | String (unique) | Keycloak `sub` (Subject ID) |
| email | String (unique) | E-Mail-Adresse |
| username | String (unique) | Benutzername |
| displayName | String? | Anzeigename |
| avatarUrl | String? | Profilbild-URL |
| role | UserRole | Höchste Rolle (ADMIN/MODERATOR/CONTRIBUTOR/VIEWER) |
| bio | String? | Profiltext |
| location | String? | Standort |
| website | String? | Website |
| preferences | JSON | Benutzer-Einstellungen |
| isActive | Boolean | Aktiv/Deaktiviert |
| lastLoginAt | DateTime? | Letzter Login |
| createdAt | DateTime | Erstellungsdatum |
| updatedAt | DateTime | Letzte Änderung |

**Index:** `externalId` (unique) für schnelles Lookup

**Soft Delete:** User werden nicht gelöscht, sondern `isActive = false` gesetzt.

### User-Verwaltungs-Funktionen

```typescript
// User synchronisieren (create or update)
await syncUser(prisma, { userInfo });

// Letzten Login aktualisieren
await updateLastLogin(prisma, externalId);

// User deaktivieren
await deactivateUser(prisma, externalId);

// User reaktivieren
await reactivateUser(prisma, externalId);
```

---

## Bekannte Fallstricke

### 1. Audience Mismatch

**Problem:** Standard-JWT-Libraries erwarten `aud` = Client-ID, aber Keycloak setzt `aud: "account"`.

**Lösung:** `azp`-Prüfung statt `aud` (siehe oben in JWT-Validierung).

### 2. Issuer URL Mismatch

**Problem:** Frontend und API müssen dieselbe Keycloak-URL verwenden.

```bash
# Beide müssen identisch sein
KEYCLOAK_URL=http://192.168.178.80:8080  # Keine localhost/IP-Mischung!
```

### 3. Rollen Case-Sensitivity

**Problem:** Keycloak-Rollen sind lowercase (`admin`), DB-Enums sind UPPERCASE (`ADMIN`).

**Lösung:** Automatisches Mapping via `ROLE_MAPPING` in user-sync.ts.

### 4. User-ID vs. Database-ID

**Problem:** `request.user.id` ist Keycloak-ID, nicht die lokale DB-ID.

```typescript
// ❌ FALSCH
createdById: request.user.id  // Keycloak-UUID

// ✅ RICHTIG
createdById: request.user.dbId  // Lokale DB-UUID
```

**Lösung:** Immer `assertAuthenticated()` verwenden für garantiertes `dbId`.

---

## Environment-Variablen

### Backend (Fastify)

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=<generiert>
DATABASE_URL=postgresql://user:pass@localhost:5432/electrovault
```

### Frontend (Next.js)

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=<generiert>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generiert mit openssl rand -base64 32>
```

**NEXTAUTH_URL:** Basis-URL der Anwendung (für Callbacks)

**NEXTAUTH_SECRET:** Secret für JWT-Verschlüsselung (mind. 32 Zeichen)

---

## Code-Beispiele

### Frontend: Geschützte Seite (Server Component)

```typescript
import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth-server';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  // Prüfung mit Helper-Funktion
  if (!(await isAdmin())) {
    redirect('/');
  }

  // Alternative: Direkte Rollen-Prüfung
  // if (!session.user.roles.includes('admin')) {
  //   redirect('/');
  // }

  return <div>Admin-Bereich</div>;
}
```

### Frontend: Bedingte Anzeige (Client Component)

```typescript
'use client';
import { useSession } from 'next-auth/react';
import { Roles } from '@/lib/auth';

export function AdminButton() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles?.includes(Roles.ADMIN) ?? false;

  if (!isAdmin) return null;

  return <button>Admin-Funktion</button>;
}

// Mit mehreren erlaubten Rollen (z.B. Moderator-Rechte)
export function ModeratorButton() {
  const { data: session } = useSession();
  const roles = session?.user?.roles ?? [];
  const canModerate = roles.includes('admin') || roles.includes('moderator');

  if (!canModerate) return null;

  return <button>Moderieren</button>;
}
```

### Backend: Geschützte Route

```typescript
import { assertAuthenticated } from '@electrovault/auth';

fastify.post('/api/components', {
  preHandler: fastify.requireRole(['admin', 'moderator', 'contributor']),
}, async (request, reply) => {
  assertAuthenticated(request);

  // TypeScript weiß: request.user.dbId existiert
  const component = await prisma.coreComponent.create({
    data: {
      ...request.body,
      createdById: request.user.dbId,
    },
  });

  return component;
});
```

### Backend: Optionale Auth

```typescript
fastify.get('/api/components/:slug', {
  preHandler: fastify.optionalAuth,
}, async (request, reply) => {
  const component = await getComponent(request.params.slug);

  // Zusätzliche Daten für authentifizierte User
  if (request.user?.dbId) {
    component.isFavorited = await checkFavorite(component.id, request.user.dbId);
  }

  return component;
});
```

---

## Sicherheits-Features

### Token-Validierung

- JWT-Signatur via JWKS (Public Key Cryptography)
- Issuer-Prüfung (nur Tokens von unserem Keycloak-Realm)
- Client-Prüfung (`azp` muss `electrovault-web` sein)
- Expiration automatisch geprüft (jose Library)

### Session-Sicherheit

- httpOnly Cookies (kein JavaScript-Zugriff)
- sameSite: lax (CSRF-Schutz)
- secure: true in Production (nur HTTPS)
- PKCE für Authorization Code Flow
- State Parameter gegen CSRF

### Rollen-Hierarchie

- Admins haben automatisch alle Rechte
- Hierarchie wird serverseitig geprüft
- Kein Umgehen durch Token-Manipulation möglich

### Token Refresh

- Access Token: Kurze Lebensdauer (Keycloak Default: 5 Minuten, **empfohlen: 30 Minuten**)
- Refresh Token: Längere Lebensdauer (30 Tage)
- Automatischer Refresh im JWT Callback
- Bei Fehler: Automatisches Logout, User muss neu einloggen
- Frontend reagiert auf `session.error === 'RefreshAccessTokenError'` mit Auto-Logout

**Empfohlene Keycloak-Einstellung:**

In der Keycloak Admin Console unter **Realm Settings → Tokens**:

| Einstellung | Empfohlener Wert | Begründung |
|-------------|------------------|------------|
| Access Token Lifespan | 30 Minuten | Reduziert Token-Refresh-Last |
| Client Session Idle | 30 Tage | Passend zur NextAuth-Session |
| Client Session Max | 30 Tage | Passend zur NextAuth-Session |
| SSO Session Idle | 30 Tage | Konsistenz mit App-Session |
| SSO Session Max | 30 Tage | Konsistenz mit App-Session |

---

## Zusammenfassung

**Architektur:**

- Keycloak als Single Source of Truth für Identitäten
- Next.js Frontend: Session-Cookie via next-auth
- Fastify Backend: JWT Bearer Token Validierung
- PostgreSQL: User-Daten gecacht, Keycloak bleibt Master

**Rollen:**

- 4 Rollen mit Hierarchie (ADMIN > MODERATOR > CONTRIBUTOR > VIEWER)
- Rollen in Keycloak definiert, in DB synchronisiert
- Automatische Hierarchie-Prüfung

**Session-Lifecycle:**

1. Login via Keycloak OAuth 2.0 / OIDC
2. Access Token + Refresh Token im JWT Cookie
3. User in DB synchronisiert bei jedem Request
4. Token automatisch refreshed bei Expiration
5. Logout beendet Keycloak-Session

**Security:**

- PKCE + State für OAuth Flow
- httpOnly Cookies gegen XSS
- JWKS Signature Verification
- Rollen-Prüfung serverseitig

**Packages:**

- `@electrovault/auth` - Shared Auth Logic (Keycloak Client, User Sync, Fastify Plugin, next-auth Config)
- `apps/web/src/lib/auth.ts` - Next.js Auth Config
- `apps/web/src/lib/auth-server.ts` - Server-Side Utilities

---

*Letzte Aktualisierung: 2025-12-30*

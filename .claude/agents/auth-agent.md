---
name: auth
description: Authentifizierung & Autorisierung - Keycloak Integration, next-auth Setup, JWT Validierung, rollenbasierte Zugriffskontrolle
model: sonnet
color: red
---

# Auth Agent - Authentifizierung & Autorisierung

## Rolle

Du bist der Auth Agent für ElectroVault. Du verwaltest die Keycloak-Integration, next-auth Setup, JWT-Validierung und rollenbasierte Zugriffskontrolle.

## Verantwortlichkeiten

- Keycloak-Integration und Realm-Konfiguration
- next-auth Setup mit Next.js App Router
- JWT-Validierung im Fastify-Backend
- Rollen-basierte Zugriffskontrolle (RBAC) mit Hierarchie
- User-Sync zwischen Keycloak und PostgreSQL
- Session-Management und Token-Refresh
- PKCE und State Protection

## Domain-Wissen

### Rollen-System

```typescript
enum UserRole {
  ADMIN = 'ADMIN',           // Vollzugriff, Benutzerverwaltung
  MODERATOR = 'MODERATOR',   // Inhalte freigeben, bearbeiten
  CONTRIBUTOR = 'CONTRIBUTOR', // Inhalte erstellen, eigene bearbeiten
  VIEWER = 'VIEWER'          // Nur lesen (Standard für neue User)
}
```

### Rollen-Hierarchie

ElectroVault verwendet eine Rollen-Hierarchie, bei der höhere Rollen automatisch alle Berechtigungen niedrigerer Rollen erben:

```
ADMIN → MODERATOR → CONTRIBUTOR → VIEWER

Admin:       [admin, moderator, contributor, viewer]
Moderator:   [moderator, contributor, viewer]
Contributor: [contributor, viewer]
Viewer:      [viewer]
```

**Implementation:** `packages/auth/src/keycloak.ts` - `hasAnyRole()`

### Rollen-Konvention: Case-Insensitive Mapping

```typescript
Keycloak (lowercase): admin, moderator, contributor, viewer
PostgreSQL (UPPERCASE): ADMIN, MODERATOR, CONTRIBUTOR, VIEWER
Code: Case-insensitive Vergleich

// Mapping in user-sync.ts
const ROLE_MAPPING: Record<string, UserRole> = {
  admin: 'ADMIN',
  moderator: 'MODERATOR',
  contributor: 'CONTRIBUTOR',
  viewer: 'VIEWER',
};
```

**Wichtig:** Alle Rollen-Checks sind case-insensitive, um Keycloak-Flexibilität zu erhalten.

### Berechtigungsmatrix

| Aktion | VIEWER | CONTRIBUTOR | MODERATOR | ADMIN |
|--------|--------|-------------|-----------|-------|
| Bauteile lesen | ✓ | ✓ | ✓ | ✓ |
| Bauteile erstellen | ✗ | ✓ | ✓ | ✓ |
| Eigene bearbeiten | ✗ | ✓ | ✓ | ✓ |
| Fremde bearbeiten | ✗ | ✗ | ✓ | ✓ |
| Freigeben/Ablehnen | ✗ | ✗ | ✓ | ✓ |
| Löschen | ✗ | ✗ | ✓ | ✓ |
| Benutzer verwalten | ✗ | ✗ | ✗ | ✓ |
| System-Einstellungen | ✗ | ✗ | ✗ | ✓ |

### OAuth 2.0 / OIDC Flow mit PKCE

```
1. User klickt "Login"
2. next-auth generiert PKCE Code Verifier + Challenge
3. Redirect zu Keycloak mit code_challenge + state
4. User authentifiziert sich bei Keycloak
5. Keycloak redirect mit Authorization Code + state
6. next-auth verifiziert state (CSRF-Schutz)
7. Backend tauscht Code + Code Verifier gegen Tokens
8. Access Token (JWT) für API-Calls
9. Refresh Token für Token-Erneuerung (rotation)
```

**PKCE (Proof Key for Code Exchange):** Schützt vor Authorization Code Interception.

**State Protection:** Verhindert CSRF-Attacken beim Redirect.

## Keycloak Konfiguration

### Realm-Struktur

```
Realm: electrovault
├── Clients
│   ├── electrovault-web (Frontend)
│   │   ├── Client Protocol: openid-connect
│   │   ├── Access Type: confidential
│   │   ├── Client Secret: <generiert>
│   │   ├── Valid Redirect URIs: http://ITME-SERVER:3000/*
│   │   ├── Web Origins: http://ITME-SERVER:3000
│   │   ├── PKCE: enabled (S256)
│   │   └── Standard Flow: enabled
│   └── electrovault-api (Backend, optional für Service-Account)
│       ├── Access Type: confidential
│       └── Service Account: enabled
├── Realm Roles
│   ├── admin
│   ├── moderator
│   ├── contributor
│   └── viewer (default role)
├── Client Scopes
│   └── roles (mappt Realm-Rollen + Client-Rollen in Token)
└── Identity Providers (optional)
    ├── Google
    └── GitHub
```

**WICHTIG:** Client-Typ ist `confidential`, nicht `public`. Web-App benötigt Client Secret für Token-Exchange.

### Realm Export/Import

```bash
# Export (im Container)
docker exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm electrovault \
  --users realm_file

# Kopieren
docker cp keycloak:/tmp/export/electrovault-realm.json ./docker/keycloak/

# Import bei Start
docker run -v ./docker/keycloak:/opt/keycloak/data/import \
  keycloak start-dev --import-realm
```

## next-auth Integration

### Konfiguration

```typescript
// apps/web/src/lib/auth.ts
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      checks: ['pkce', 'state'], // PKCE + CSRF Protection
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        // Decode access token to extract roles
        const decodedToken = JSON.parse(
          Buffer.from(account.access_token!.split('.')[1], 'base64').toString()
        );

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          roles: extractRoles(decodedToken),
        };
      }

      // Return previous token if not expired
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Token expired, try to refresh
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        error: token.error,
        user: {
          ...session.user,
          id: token.sub!, // Keycloak User ID
          roles: token.roles || [],
        },
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Tage - bleibt nach Browser-Neustart
  },
  events: {
    async signOut({ token }) {
      // Keycloak Single Logout
      if (token?.refreshToken) {
        await fetch(`${keycloakIssuer}/protocol/openid-connect/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
            refresh_token: token.refreshToken,
          }),
        });
      }
    },
  },
};
```

### Token Refresh mit Expiry-Check

```typescript
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(
      `${keycloakIssuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken!,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
```

### Cookie Config für Development

```typescript
// Development: HTTP allowed (kein HTTPS auf ITME-SERVER)
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false, // Development: HTTP allowed
    },
  },
  pkceCodeVerifier: {
    name: 'next-auth.pkce.code_verifier',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
      maxAge: 60 * 15, // 15 minutes
    },
  },
  state: {
    name: 'next-auth.state',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
      maxAge: 60 * 15, // 15 minutes
    },
  },
  // ... weitere Cookies
}
```

**Production:** `secure: true` für HTTPS-Only Cookies.

### App Router Integration

```typescript
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Session-Zugriff (Server Component)

```typescript
// apps/web/src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const isAdmin = session.user.roles.includes('admin');

  return <Dashboard user={session.user} isAdmin={isAdmin} />;
}
```

### Session-Zugriff (Client Component)

```typescript
'use client';

import { useSession } from 'next-auth/react';

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Skeleton />;
  if (!session) return <LoginButton />;

  return <Avatar user={session.user} roles={session.user.roles} />;
}
```

### Rollen-Helper

```typescript
// apps/web/src/lib/auth.ts
export const Roles = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;

export function hasRole(session: Session | null, role: string): boolean {
  return session?.user?.roles?.includes(role) ?? false;
}

export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  return roles.some(role => hasRole(session, role));
}
```

## Fastify Backend Auth

### Keycloak JWT-Validierung

```typescript
// packages/auth/src/keycloak.ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

export class KeycloakClient {
  private jwksUrl: string;
  private issuer: string;

  constructor(private config: KeycloakConfig) {
    this.jwksUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/certs`;
    this.issuer = `${config.url}/realms/${config.realm}`;
  }

  /**
   * Verify and decode Keycloak JWT
   * Keycloak tokens have `aud: "account"`, actual client is in `azp`
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: this.issuer,
      // Don't check audience - Keycloak uses azp for client
    });

    const typedPayload = payload as unknown as TokenPayload;

    // Verify token was issued for our client (azp = authorized party)
    if (typedPayload.azp && typedPayload.azp !== this.config.clientId) {
      throw new Error(`Token issued for wrong client`);
    }

    return typedPayload;
  }

  /**
   * Extract user info from token
   */
  extractUserInfo(payload: TokenPayload): UserInfo {
    const clientRoles = payload.resource_access?.[this.config.clientId]?.roles ?? [];
    const realmRoles = payload.realm_access?.roles ?? [];
    const allRoles = Array.from(new Set([...clientRoles, ...realmRoles]));

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
      displayName: payload.name,
      roles: allRoles,
    };
  }

  /**
   * Full validation + user extraction
   */
  async validateToken(token: string): Promise<UserInfo> {
    const payload = await this.verifyToken(token);
    return this.extractUserInfo(payload);
  }

  /**
   * Check role with hierarchy support
   */
  hasAnyRole(userInfo: UserInfo, requiredRoles: string[]): boolean {
    const normalizedUserRoles = userInfo.roles.map(r => r.toLowerCase());

    const roleHierarchy: Record<string, string[]> = {
      admin: ['admin', 'moderator', 'contributor', 'viewer'],
      moderator: ['moderator', 'contributor', 'viewer'],
      contributor: ['contributor', 'viewer'],
      viewer: ['viewer'],
    };

    // Admin can do everything
    if (normalizedUserRoles.includes('admin')) {
      return true;
    }

    // Check each required role + hierarchy
    return requiredRoles.some(required => {
      const normalized = required.toLowerCase();
      // Direct match
      if (normalizedUserRoles.includes(normalized)) return true;
      // Hierarchy: does user have higher role?
      for (const [userRole, includedRoles] of Object.entries(roleHierarchy)) {
        if (normalizedUserRoles.includes(userRole) && includedRoles.includes(normalized)) {
          return true;
        }
      }
      return false;
    });
  }
}
```

### Fastify Auth Plugin mit User-Sync

```typescript
// packages/auth/src/fastify/index.ts
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { KeycloakClient, UserInfo } from '../keycloak';
import { syncUser } from '../user-sync';

export interface AuthenticatedUser extends UserInfo {
  dbId?: string;      // PostgreSQL UUID
  dbRole?: UserRole;  // UPPERCASE Role
}

const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, options) => {
  const { keycloak, prisma } = options;

  fastify.decorateRequest('user', null);

  /**
   * Sync user to DB and add dbId + dbRole
   */
  async function syncUserToDb(userInfo: UserInfo): Promise<AuthenticatedUser> {
    const authenticatedUser: AuthenticatedUser = { ...userInfo };

    if (prisma) {
      try {
        const dbUser = await syncUser(prisma, { userInfo });
        authenticatedUser.dbId = dbUser.id;
        authenticatedUser.dbRole = dbUser.role;
      } catch (error) {
        fastify.log.error({ error, userId: userInfo.id }, 'User sync failed');
        // Continue without dbId - user can still authenticate
      }
    }

    return authenticatedUser;
  }

  /**
   * Extract Bearer token
   */
  function extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
  }

  /**
   * optionalAuth: Setzt user wenn Token vorhanden, sonst kein Fehler
   */
  fastify.decorate('optionalAuth', async (request, reply) => {
    const token = extractToken(request);
    if (!token) return; // Kein Token = Public Access

    try {
      const userInfo = await keycloak.validateToken(token);
      request.user = await syncUserToDb(userInfo);
    } catch (error) {
      request.log.warn({ error }, 'Invalid token in optionalAuth');
      // Ignorieren - Public Access
    }
  });

  /**
   * requireAuth: Auth erforderlich
   */
  fastify.decorate('requireAuth', async (request, reply) => {
    const token = extractToken(request);
    if (!token) {
      return reply.code(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' },
      });
    }

    try {
      const userInfo = await keycloak.validateToken(token);
      request.user = await syncUserToDb(userInfo);
    } catch (error) {
      request.log.error({ error }, 'Token validation failed');
      return reply.code(401).send({
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
      });
    }
  });

  /**
   * requireRole: Rolle erforderlich (mit Hierarchie)
   */
  fastify.decorate('requireRole', (role: string | string[]) => {
    const requiredRoles = Array.isArray(role) ? role : [role];

    return async (request, reply) => {
      await fastify.requireAuth(request, reply);
      if (!request.user) return; // Bereits von requireAuth abgelehnt

      const hasRole = keycloak.hasAnyRole(request.user, requiredRoles);
      if (!hasRole) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: `Required role(s): ${requiredRoles.join(', ')}`,
          },
        });
      }
    };
  });
};

export default fp(authPlugin, { name: 'auth-plugin', fastify: '4.x' });
```

### Geschützte Routen

```typescript
// apps/api/src/routes/components.ts

// Public + Auth: Jeder kann lesen, Autoren sehen ihre Drafts
fastify.get('/components', {
  preHandler: fastify.optionalAuth,
}, async (request) => {
  return componentService.findAll({
    userId: request.user?.dbId, // Undefined = nur Published
  });
});

// Auth erforderlich
fastify.post('/components', {
  preHandler: fastify.requireAuth,
  schema: { body: CreateComponentSchema },
}, async (request) => {
  return componentService.create({
    ...request.body,
    createdBy: request.user!.dbId!,
  });
});

// Rolle erforderlich (mit Hierarchie)
fastify.delete('/components/:id', {
  preHandler: fastify.requireRole(['moderator', 'admin']),
}, async (request) => {
  return componentService.delete(request.params.id);
});
```

## User-Sync

### Keycloak → PostgreSQL

```typescript
// packages/auth/src/user-sync.ts
import type { PrismaClient, UserRole } from '@electrovault/database';

const ROLE_MAPPING: Record<string, UserRole> = {
  admin: 'ADMIN',
  moderator: 'MODERATOR',
  contributor: 'CONTRIBUTOR',
  viewer: 'VIEWER',
};

/**
 * Get highest role from Keycloak roles
 */
function getHighestRole(keycloakRoles: string[]): UserRole {
  const hierarchy: UserRole[] = ['ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'VIEWER'];

  for (const hierarchyRole of hierarchy) {
    const keycloakRole = Object.keys(ROLE_MAPPING).find(
      k => ROLE_MAPPING[k] === hierarchyRole
    );
    if (keycloakRole && keycloakRoles.includes(keycloakRole)) {
      return hierarchyRole;
    }
  }

  return 'VIEWER'; // Default
}

/**
 * Sync user to DB (upsert)
 */
export async function syncUser(
  prisma: PrismaClient,
  options: SyncUserOptions
) {
  const { userInfo, avatarUrl } = options;
  const role = getHighestRole(userInfo.roles);

  return prisma.user.upsert({
    where: { externalId: userInfo.id },
    update: {
      email: userInfo.email || '',
      username: userInfo.username || userInfo.email || 'unknown',
      displayName: userInfo.displayName,
      role,
      avatarUrl: avatarUrl || undefined,
      lastLoginAt: new Date(),
    },
    create: {
      externalId: userInfo.id,
      email: userInfo.email || '',
      username: userInfo.username || userInfo.email || `user-${userInfo.id.substring(0, 8)}`,
      displayName: userInfo.displayName,
      role,
      avatarUrl: avatarUrl || undefined,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}
```

**WICHTIG:** User-Feld heißt `externalId`, nicht `keycloakId`.

## Kontext-Dateien

Bei Auth-Aufgaben diese Dateien beachten:

```
packages/auth/src/
├── index.ts                       # Package Exports
├── keycloak.ts                    # JWT-Validierung, Rollen-Hierarchie
├── user-sync.ts                   # Keycloak → PostgreSQL Sync
├── fastify/
│   └── index.ts                   # Fastify Auth Plugin
└── nextauth/
    └── index.ts                   # next-auth Options Factory

apps/web/src/
├── lib/
│   └── auth.ts                    # next-auth Config (aktiv verwendet)
├── app/api/auth/[...nextauth]/
│   └── route.ts                   # next-auth API Route
└── app/auth/
    ├── signin/page.tsx            # Login-Seite
    ├── signout/page.tsx           # Logout-Seite
    └── error/page.tsx             # Auth-Fehler-Seite

packages/database/prisma/schema.prisma  # User-Model (externalId)
docker/keycloak/realm-export.json      # Keycloak Realm Config
.env.example                           # Keycloak Credentials
```

## Umgebungsvariablen

```env
# Keycloak
KEYCLOAK_URL=http://ITME-SERVER:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=<generiert-nach-realm-setup>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin123

# next-auth
NEXTAUTH_URL=http://ITME-SERVER:3000
NEXTAUTH_SECRET=<random-min-32-chars>

# PostgreSQL (für User-Sync)
DATABASE_URL=postgresql://user:password@localhost:5432/electrovault_dev
```

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

## Sicherheitshinweise

### Development (aktuell)

1. **NEXTAUTH_SECRET** - Mindestens 32 Zeichen, zufällig generiert
2. **Keycloak Admin** - Starkes Passwort, nicht default
3. **Cookie Secure** - `false` für HTTP-Development
4. **PKCE** - Aktiviert für Authorization Code Flow
5. **State Protection** - Aktiviert für CSRF-Schutz
6. **Token Expiry** - Access Token kurzlebig (Keycloak-Default: 5 min)
7. **Refresh Token Rotation** - Neuer Token bei jedem Refresh

### Production

1. **HTTPS Only** - `secure: true` für alle Cookies
2. **CORS** - Nur erlaubte Origins in Keycloak
3. **Rate Limiting** - Auf Login-Endpoints
4. **Token Storage** - Niemals im localStorage (nur httpOnly Cookies)
5. **Keycloak Hardening** - Siehe Keycloak Production Docs
6. **Audit Logging** - Alle Auth-Events protokollieren

---

*Aktiviere diesen Agenten für Keycloak-Setup, Login-Flows, Berechtigungen und Session-Management.*

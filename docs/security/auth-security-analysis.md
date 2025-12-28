# ElectroVault - Authentifizierungs-Sicherheitsanalyse

**Datum:** 2025-12-28
**Analysiert von:** Auth Agent
**Version:** Phase 4 (Community Features)

---

## Executive Summary

Das Authentifizierungssystem von ElectroVault nutzt Keycloak (OIDC) mit next-auth im Frontend und JWT-Validierung im Fastify-Backend. Die Analyse zeigt **mehrere kritische Sicherheitslücken** und Schwächen, die vor dem Produktivbetrieb behoben werden müssen.

### Risikobewertung

| Kategorie | Schweregrad | Status |
|-----------|-------------|--------|
| Token-Sicherheit | 🔴 KRITISCH | Fehlende Secrets |
| Session-Management | 🟡 MITTEL | Verbesserungsbedarf |
| CSRF-Schutz | 🟢 GUT | Implementiert |
| Rollen-System | 🟡 MITTEL | Inkonsistenzen |
| API-Authentifizierung | 🟢 GUT | Korrekt implementiert |
| Logout-Flow | 🟡 MITTEL | Teilweise fehlerhaft |
| Cookie-Konfiguration | 🔴 KRITISCH | Unsicher für Production |

---

## 1. NextAuth Konfiguration (Frontend)

### 1.1 JWT-Konfiguration

**Datei:** `apps/web/src/lib/auth.ts`

#### ✅ Gut implementiert

```typescript
callbacks: {
  async jwt({ token, account, user }) {
    // Rollen-Extraktion aus Keycloak Token
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
}
```

**Positiv:**
- Korrekte JWT-Dekodierung (Base64)
- Rollen werden aus `realm_access` und `resource_access` extrahiert
- Token-Expiry wird gespeichert
- Refresh-Token wird sicher behandelt

#### ⚠️ Sicherheitsprobleme

**KRITISCH:** `.env.local` enthält schwachen Secret

```bash
# apps/web/.env.local (Zeile 6)
NEXTAUTH_SECRET=electrovault-dev-secret-change-in-production
```

**Risiko:**
- **Severity:** 🔴 KRITISCH
- **Impact:** Token-Fälschung, Session-Hijacking möglich
- **Wahrscheinlichkeit:** Hoch (Secret im Code-Repository sichtbar)

**Empfehlung:**
```bash
# Generiere SOFORT einen neuen Secret (mindestens 32 Zeichen)
openssl rand -base64 32

# NIEMALS in .env.local committen (ist bereits in .gitignore)
# Für Production: Secret Manager nutzen (z.B. Azure Key Vault, AWS Secrets Manager)
```

---

### 1.2 Token-Refresh Logik

**Datei:** `apps/web/src/lib/auth.ts` (Zeilen 49-85)

#### ✅ Gut implementiert

```typescript
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const tokenUrl = `${keycloakConfig.issuer}/protocol/openid-connect/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: keycloakConfig.clientId,
        client_secret: keycloakConfig.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken!,
      }),
    });

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Rotation!
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
    };
  } catch (error) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
```

**Positiv:**
- **Refresh Token Rotation** implementiert (Zeile 75)
- Fehlerbehandlung vorhanden
- Expiresät wird korrekt neu berechnet

#### ⚠️ Probleme

**Problem 1: Keine Retry-Logik**
- Bei Netzwerk-Fehlern wird sofort abgebrochen
- User wird ausgeloggt auch bei temporären Problemen

**Problem 2: Fehlende Token-Revocation**
- Bei `RefreshAccessTokenError` wird alter Token nicht explizit widerrufen
- Potenzielle Lücke wenn Token kompromittiert wurde

**Empfehlung:**
```typescript
async function refreshAccessToken(token: JWT, retryCount = 0): Promise<JWT> {
  const MAX_RETRIES = 2;

  try {
    // ... (bestehender Code)
  } catch (error) {
    // Bei Netzwerk-Fehlern: Retry
    if (retryCount < MAX_RETRIES && isNetworkError(error)) {
      await delay(1000 * (retryCount + 1));
      return refreshAccessToken(token, retryCount + 1);
    }

    // Bei Auth-Fehlern: Token revoken
    if (token.refreshToken) {
      await revokeToken(token.refreshToken);
    }

    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
```

---

### 1.3 Session-Management

**Datei:** `apps/web/src/lib/auth.ts` (Zeilen 175-178)

```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 Tage
}
```

#### ⚠️ Sicherheitsprobleme

**Problem:** Zu lange Session-Lebenszeit

**Risiko:**
- **Severity:** 🟡 MITTEL
- Bei gestohlenen Cookies kann Angreifer 30 Tage lang zugreifen
- Widerspruch zu Best Practices (empfohlen: 24h - 7 Tage)

**Empfehlung:**
```typescript
session: {
  strategy: 'jwt',
  maxAge: process.env.NODE_ENV === 'production'
    ? 7 * 24 * 60 * 60   // Production: 7 Tage
    : 30 * 24 * 60 * 60, // Development: 30 Tage
  updateAge: 24 * 60 * 60, // Session alle 24h verlängern bei Aktivität
}
```

---

### 1.4 Cookie-Konfiguration

**Datei:** `apps/web/src/lib/auth.ts` (Zeilen 207-264)

```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,    // ✅ Gut
      sameSite: 'lax',   // ✅ Gut
      path: '/',         // ✅ Gut
      secure: false,     // 🔴 KRITISCH in Production!
    },
  },
  // ... (alle weiteren Cookies haben secure: false)
}
```

#### 🔴 KRITISCHES Sicherheitsproblem

**Risiko:**
- **Severity:** 🔴 KRITISCH in Production
- Cookies werden über **unverschlüsselte HTTP-Verbindungen** übertragen
- **Man-in-the-Middle-Angriffe** möglich
- Session-Hijacking trivial

**Warum aktuell `secure: false`?**
- Entwicklungsumgebung nutzt HTTP (kein SSL)
- IP-Zugriff (192.168.178.80:3000) statt localhost

**Empfehlung:**

```typescript
const isProduction = process.env.NODE_ENV === 'production';

cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      secure: isProduction, // NUR in Production auf true
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    },
  },
  // ... (gleiche Logik für alle anderen Cookies)
}
```

**Production-Checkliste:**
- [ ] HTTPS erzwingen (Nginx/Traefik Reverse Proxy)
- [ ] `secure: true` für alle Cookies
- [ ] `sameSite: 'strict'` für maximale Sicherheit
- [ ] `COOKIE_DOMAIN` korrekt setzen (z.B. `.electrovault.com`)

---

## 2. Keycloak-Integration

### 2.1 OIDC-Konfiguration

**Datei:** `apps/web/src/lib/auth.ts` (Zeilen 114-124)

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

#### ✅ Sehr gut implementiert

**Positiv:**
- **PKCE (Proof Key for Code Exchange)** aktiviert
  - Schützt gegen Authorization Code Interception Attacks
  - Besonders wichtig für Public Clients
- **State-Parameter** aktiviert
  - CSRF-Schutz beim OAuth-Flow
- Scopes korrekt definiert (`openid email profile`)

#### ⚠️ Fehlende Scopes

**Problem:** Keycloak-Rollen werden nicht explizit angefordert

```typescript
// Aktuell
scope: 'openid email profile'

// Besser (falls Keycloak so konfiguriert)
scope: 'openid email profile roles'
```

**Risiko:**
- Rollen werden aktuell trotzdem geliefert (Standard in Keycloak)
- Aber: Nicht explizit angefordert → könnte bei Keycloak-Konfigurationsänderungen fehlen

**Empfehlung:**
```typescript
authorization: {
  params: {
    scope: 'openid email profile roles', // Explizit roles anfordern
    // Optional: Offline-Zugriff für Refresh-Tokens
    // scope: 'openid email profile roles offline_access',
  },
}
```

---

### 2.2 Client-Secret Management

**Datei:** `apps/web/.env.local` (Zeile 12)

```bash
KEYCLOAK_CLIENT_SECRET=
```

#### 🔴 KRITISCHES Problem

**Problem:** Client Secret ist leer

**Risiko:**
- **Severity:** 🔴 KRITISCH
- Token-Refresh schlägt fehl (Zeile 60 in auth.ts)
- Logout-Flow funktioniert nicht (Zeile 193)
- Keycloak lehnt Anfragen ab

**Warum leer?**
- Keycloak Realm noch nicht vollständig konfiguriert
- Client `electrovault-web` wurde als **Public Client** erstellt (kein Secret)

**Lösung:**

**Option A: Confidential Client (empfohlen für Server-Side)**
```bash
# In Keycloak Admin:
1. Realm: electrovault → Clients → electrovault-web
2. Settings → Access Type: confidential (statt public)
3. Save → Credentials Tab → Regenerate Secret
4. Secret kopieren in .env.local

KEYCLOAK_CLIENT_SECRET=<generated-secret>
```

**Option B: Public Client (für rein Client-Side Apps)**
```typescript
// In auth.ts
clientSecret: keycloakConfig.clientSecret || '', // Leer für Public Clients

// ABER: Token-Refresh und Logout müssen dann ohne Secret funktionieren
// Nicht empfohlen für Next.js (hat Server-Side Komponenten)
```

**Empfehlung:** **Nutze Option A** (Confidential Client)

---

### 2.3 Logout-Flow

**Datei:** `apps/web/src/lib/auth.ts` (Zeilen 181-201)

```typescript
events: {
  async signOut({ token }) {
    if (token?.refreshToken) {
      try {
        const logoutUrl = `${keycloakConfig.issuer}/protocol/openid-connect/logout`;
        await fetch(logoutUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: keycloakConfig.clientId,
            client_secret: keycloakConfig.clientSecret,
            refresh_token: token.refreshToken,
          }),
        });
      } catch (error) {
        console.error('Error logging out from Keycloak:', error);
      }
    }
  }
}
```

#### ⚠️ Probleme

**Problem 1: Fehlerbehandlung zu permissiv**
- Bei Fehler wird nur geloggt, aber User wird trotzdem ausgeloggt
- Keycloak-Session bleibt aktiv → Single-Sign-On-Lücke

**Problem 2: Fehlende Token-Validierung**
- Kein Check ob `token.refreshToken` noch gültig ist
- Bei abgelaufenen Tokens schlägt Logout fehl

**Problem 3: Client Secret fehlt (siehe 2.2)**

**Empfehlung:**
```typescript
events: {
  async signOut({ token }) {
    if (!token?.refreshToken) {
      app.log.warn('No refresh token available for Keycloak logout');
      return; // Lokaler Logout ist trotzdem erfolgt
    }

    try {
      const logoutUrl = `${keycloakConfig.issuer}/protocol/openid-connect/logout`;
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          refresh_token: token.refreshToken,
        }),
        signal: AbortSignal.timeout(5000), // 5s Timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Keycloak logout failed: ${response.status} - ${error}`);
      }

      app.log.info('Successfully logged out from Keycloak');
    } catch (error) {
      // Kritischer Fehler: Keycloak-Session bleibt aktiv
      app.log.error({ error }, 'CRITICAL: Keycloak logout failed - SSO session still active');

      // Optional: User benachrichtigen
      // (könnte via Session-Flag gesetzt werden)
    }
  }
}
```

---

## 3. Session-Management

### 3.1 SessionProvider

**Datei:** `apps/web/src/components/providers/session-provider.tsx`

```typescript
<NextAuthSessionProvider
  refetchInterval={4 * 60}        // Alle 4 Minuten
  refetchOnWindowFocus={true}     // Bei Tab-Fokus
>
  <SessionErrorHandler>
    {children}
  </SessionErrorHandler>
</NextAuthSessionProvider>
```

#### ✅ Gut implementiert

**Positiv:**
- **Automatische Token-Erneuerung** alle 4 Minuten
  - Keycloak Access Tokens haben meist 5-15 Min Laufzeit
  - Refresh erfolgt rechtzeitig vor Ablauf
- **Tab-Fokus-Check** aktiviert
  - Session wird reaktiviert nach längerer Inaktivität
- **Error-Handler** für RefreshAccessTokenError
  - Automatischer Logout bei Token-Problemen

#### ⚠️ Verbesserungspotenzial

**Problem 1: Hardcoded Refresh-Intervall**

```typescript
// Besser: Dynamisch basierend auf Token-Expiry
refetchInterval={
  session?.expiresAt
    ? Math.max(60, (session.expiresAt - Date.now() / 1000) * 0.8)
    : 4 * 60
}
```

**Problem 2: Fehlende Offline-Detection**
- Bei Netzwerk-Verlust wird User ausgeloggt
- Keine Unterscheidung zwischen "Token abgelaufen" und "Netzwerk weg"

**Empfehlung:**
```typescript
function SessionErrorHandler({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Netzwerk-Status überwachen
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      if (!isOnline) {
        console.warn('Token-Refresh fehlgeschlagen - Netzwerk offline');
        // NICHT ausloggen, sondern warten bis Netzwerk zurück ist
        return;
      }

      console.warn('Token konnte nicht erneuert werden. Automatischer Logout...');
      signOut({ callbackUrl: '/auth/signin?error=SessionExpired' });
    }
  }, [session?.error, isOnline]);

  return <>{children}</>;
}
```

---

### 3.2 Session-Speicherung

#### ✅ Sicher (JWT-Strategie)

```typescript
session: {
  strategy: 'jwt',
}
```

**Positiv:**
- Keine Server-seitige Session-Speicherung nötig
- Horizontal skalierbar (Stateless)
- Kein Session-Store-Leak möglich

**Trade-offs:**
- Größere Cookies (JWT ist größer als Session-ID)
- Sessions können nicht serverseitig widerrufen werden
  - **Mitigation:** Kurze Token-Lebenszeiten + Refresh-Rotation

---

## 4. Rollen-System

### 4.1 Rollen-Hierarchie

**Datei:** `packages/auth/src/keycloak.ts` (Zeilen 124-129)

```typescript
const roleHierarchy: Record<string, string[]> = {
  admin: ['admin', 'moderator', 'contributor', 'viewer'],
  moderator: ['moderator', 'contributor', 'viewer'],
  contributor: ['contributor', 'viewer'],
  viewer: ['viewer'],
};
```

#### ✅ Sehr gut implementiert

**Positiv:**
- Hierarchie korrekt definiert
- Admins haben automatisch alle niedrigeren Rechte
- Case-insensitive Vergleich (Zeile 112-113)

---

### 4.2 Server-Side vs Client-Side Auth

#### ⚠️ Inkonsistenzen gefunden

**Server-Side (korrekt):**

```typescript
// apps/web/src/app/admin/layout.tsx
const session = await getServerSession(authOptions);

if (!session || !hasAnyRole(session, [Roles.ADMIN, Roles.MODERATOR])) {
  redirect('/auth/signin?callbackUrl=/admin');
}
```

**Client-Side (zu simpel):**

```typescript
// apps/web/src/components/layout/header.tsx
const isAdmin = session?.user?.roles?.includes('admin');
const isModerator = session?.user?.roles?.includes('moderator');

{(isAdmin || isModerator) && (
  <Link href="/admin">Admin</Link>
)}
```

**Problem:**
- Client-Side nutzt keine Rollen-Hierarchie
- Direkter String-Vergleich statt `hasRole()` Helper
- Inkonsistent zu Server-Side-Logik

**Risiko:**
- **Severity:** 🟡 MITTEL
- Nur UI-Problem (Server-Side ist geschützt)
- Aber: Verwirrend für User mit Hierarchie-Rollen

**Empfehlung:**
```typescript
// apps/web/src/components/layout/header.tsx
import { hasRole, hasAnyRole, Roles } from '@/lib/auth';

const isAdmin = hasRole(session, Roles.ADMIN);
const canAccessAdmin = hasAnyRole(session, [Roles.ADMIN, Roles.MODERATOR]);

{canAccessAdmin && (
  <Link href="/admin">Admin</Link>
)}
```

---

### 4.3 Middleware-Schutz

**Datei:** `apps/web/src/middleware.ts`

```typescript
const protectedRoutes: { path: string; roles?: string[] }[] = [
  { path: '/admin', roles: ['admin', 'moderator'] },
  { path: '/profile' },
  { path: '/contribute', roles: ['admin', 'moderator', 'contributor'] },
];
```

#### ⚠️ Schwächen

**Problem 1: Keine Rollen-Hierarchie**
- Middleware nutzt einfachen `includes()` Check
- Moderator hat kein Zugriff auf `/contribute` (obwohl hierarchisch höher als Contributor)

**Problem 2: Race Condition**
- Middleware läuft VOR Server Components
- Bei Token-Refresh kann Middleware alten Token sehen

**Problem 3: Fehlende Audit-Logs**
- Unauthorized-Access-Versuche werden nicht geloggt

**Empfehlung:**
```typescript
// apps/web/src/middleware.ts
import { hasAnyRole } from '@/lib/auth';

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    const matchedRoute = protectedRoutes.find(
      (route) => pathname === route.path || pathname.startsWith(`${route.path}/`)
    );

    if (matchedRoute && matchedRoute.roles) {
      // Nutze Rollen-Hierarchie
      const hasRequiredRole = hasAnyRole(
        { user: { roles: (token?.roles as string[]) || [] } },
        matchedRoute.roles
      );

      if (!hasRequiredRole) {
        // Log unauthorized access attempt
        console.warn('Unauthorized access attempt', {
          path: pathname,
          userId: token?.sub,
          userRoles: token?.roles,
          requiredRoles: matchedRoute.roles,
        });

        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  // ... (rest bleibt gleich)
);
```

---

## 5. API-Authentifizierung (Fastify Backend)

### 5.1 JWT-Validierung

**Datei:** `packages/auth/src/keycloak.ts` (Zeilen 57-76)

```typescript
async verifyToken(token: string): Promise<TokenPayload> {
  const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: this.issuer,
  });

  const typedPayload = payload as unknown as TokenPayload;

  // Verify azp (authorized party)
  if (typedPayload.azp && typedPayload.azp !== this.config.clientId) {
    throw new Error(`Token issued for "${typedPayload.azp}", expected "${this.config.clientId}"`);
  }

  return typedPayload;
}
```

#### ✅ Exzellent implementiert

**Positiv:**
- **JWKS (JSON Web Key Set)** Remote-Validation
  - Public Keys werden von Keycloak geholt
  - Automatische Key-Rotation unterstützt
  - Keine Secrets im Backend nötig
- **Issuer-Validierung** aktiv
- **azp (Authorized Party)** Check
  - Verhindert Token-Replay von anderen Clients
- **Signatur-Validierung** durch `jwtVerify()`

#### ℹ️ Hinweis zu `audience`

```typescript
// Aktuell KEIN audience-Check
// Keycloak setzt aud: "account" (Standard)
// Client ist in azp → wird separat geprüft
```

**Warum kein `audience`-Check?**
- Keycloak-Besonderheit: `aud` ist standardmäßig "account"
- Tatsächlicher Client steht in `azp` (Authorized Party)
- Implementierung ist **korrekt** für Keycloak

---

### 5.2 Fastify Auth-Plugin

**Datei:** `packages/auth/src/fastify/index.ts`

```typescript
fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
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
    return reply.code(401).send({
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
});
```

#### ✅ Sehr gut implementiert

**Positiv:**
- Bearer-Token-Extraktion korrekt
- User-Sync in Datenbank bei jedem Request
  - Stellt sicher, dass lokale Rollen aktuell sind
- Fehlerbehandlung korrekt

#### ⚠️ Performance-Überlegung

**Problem:** User-Sync bei JEDEM Request

```typescript
// Jeder API-Call macht:
1. JWT-Validierung (schnell, cached)
2. Keycloak JWKS Fetch (gecached)
3. Prisma upsert (Datenbank-Roundtrip) ← Langsam!
```

**Risiko:**
- Performance-Bottleneck bei vielen Requests
- Unnötige DB-Last

**Empfehlung:**
```typescript
async function syncUserToDb(userInfo: UserInfo): Promise<AuthenticatedUser> {
  const authenticatedUser: AuthenticatedUser = { ...userInfo };

  if (prisma) {
    try {
      // Cache DB-User für 5 Minuten
      const cacheKey = `user:${userInfo.id}`;
      let dbUser = await cache.get(cacheKey);

      if (!dbUser) {
        dbUser = await syncUser(prisma, { userInfo });
        await cache.set(cacheKey, dbUser, 300); // 5 Min TTL
      }

      authenticatedUser.dbId = dbUser.id;
      authenticatedUser.dbRole = dbUser.role;
    } catch (error) {
      fastify.log.error({ error, userId: userInfo.id }, 'Failed to sync user');
    }
  }

  return authenticatedUser;
}
```

---

### 5.3 Rollen-basierte Zugriffskontrolle

**Datei:** `packages/auth/src/fastify/index.ts` (Zeilen 115-137)

```typescript
fastify.decorate('requireRole', (role: string | string[]) => {
  const requiredRoles = Array.isArray(role) ? role : [role];

  return async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.requireAuth(request, reply);

    if (!request.user) return;

    const hasRole = keycloak.hasAnyRole(request.user, requiredRoles);
    if (!hasRole) {
      return reply.code(403).send({
        error: { code: 'FORBIDDEN', message: `Required role(s): ${requiredRoles.join(', ')}` },
      });
    }
  };
});
```

#### ✅ Exzellent implementiert

**Positiv:**
- Nutzt Rollen-Hierarchie (`hasAnyRole`)
- Korrekte 401 vs 403 Unterscheidung
- Flexibel (String oder Array)

#### ℹ️ Verwendung in Routes

```typescript
// apps/api/src/routes/audit/index.ts
app.get('/', {
  onRequest: app.requireRole('ADMIN'),
}, async (request, reply) => {
  // Nur für Admins
});

app.post('/files', {
  onRequest: app.requireAuth,
  preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
}, async (request, reply) => {
  // Für Contributor und höher
});
```

**Positiv:**
- Konsistente Verwendung
- Klare Trennung von Auth (onRequest) und Authz (preHandler)

---

## 6. Security-Issues

### 6.1 CSRF-Schutz

#### ✅ Implementiert (next-auth)

**Datei:** `apps/web/src/lib/auth.ts`

```typescript
checks: ['pkce', 'state'],  // State = CSRF-Token

cookies: {
  csrfToken: {
    name: `next-auth.csrf-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
    },
  },
}
```

**Positiv:**
- CSRF-Token wird automatisch von next-auth verwaltet
- `state`-Parameter im OAuth-Flow
- `sameSite: 'lax'` verhindert Cross-Site-Requests

---

### 6.2 Session-Fixation

#### ✅ Geschützt

**Mechanismus:**
- JWT-basierte Sessions (keine Session-IDs)
- Bei Login wird neuer JWT erstellt
- Alte JWTs werden durch Expiry ungültig

**Positiv:**
- Session-Fixation nicht möglich
- Token-Refresh erzeugt neue Tokens

---

### 6.3 Token-Exposure

#### ⚠️ Risiken

**Problem 1: Access-Token in Session-Callback**

```typescript
// apps/web/src/lib/auth.ts (Zeile 157)
return {
  ...session,
  accessToken: token.accessToken,  // ← Wird an Client gesendet!
  refreshToken: token.refreshToken, // ← Wird an Client gesendet!
}
```

**Risiko:**
- Access-Token ist **lesbar im Browser** (via `useSession()`)
- XSS-Angriff könnte Token stehlen
- Refresh-Token im Client ist **extrem kritisch**

**Empfehlung:**
```typescript
async session({ session, token }): Promise<Session> {
  return {
    ...session,
    // NUR Access-Token (wird für API-Calls benötigt)
    accessToken: token.accessToken,
    // NIEMALS Refresh-Token an Client senden!
    // refreshToken: token.refreshToken, ← ENTFERNEN!
    error: token.error,
    user: {
      ...session.user,
      id: token.sub!,
      roles: token.roles || [],
    },
  };
}
```

**Problem 2: Token in URL (Redirect)**

```typescript
// apps/web/src/middleware.ts (Zeile 41)
url.searchParams.set('error', 'unauthorized');
```

**Risiko (gering):**
- Error-Codes in URL sichtbar
- Keine sensiblen Daten → OK

---

### 6.4 XSS-Schutz

#### ✅ Mehrschichtig geschützt

**Layer 1: httpOnly Cookies**
```typescript
httpOnly: true  // JavaScript kann nicht auf Cookies zugreifen
```

**Layer 2: Content Security Policy (CSP)**
```typescript
// apps/api/src/app.ts (Zeilen 82-90)
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // ...
    },
  },
});
```

**Layer 3: React (Auto-Escaping)**
- Next.js escaped alle User-Inputs automatisch

**Positiv:** Multi-Layer Defense funktioniert

---

### 6.5 Rate-Limiting

#### ✅ Implementiert

**Datei:** `apps/api/src/app.ts` (Zeilen 94-98)

```typescript
await app.register(rateLimit, {
  max: 100,           // 100 Requests
  timeWindow: '1 minute',
  cache: 10000,
});
```

**Positiv:**
- Schutz gegen Brute-Force
- Schutz gegen DoS

#### ⚠️ Verbesserung

**Problem:** Global Rate-Limit

**Empfehlung:**
```typescript
// Unterschiedliche Limits für verschiedene Routen
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => {
    // IP-basiert + User-ID (falls eingeloggt)
    return request.user?.id || request.ip;
  },
  errorResponseBuilder: (request, context) => ({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Try again in ${Math.ceil(context.after / 1000)}s`,
    },
  }),
});

// Strengere Limits für Login/Auth
app.register(rateLimit, {
  max: 5,
  timeWindow: '15 minutes',
}, { prefix: '/api/v1/auth' });
```

---

## 7. Zusammenfassung & Empfehlungen

### 7.1 Kritische Sicherheitslücken (SOFORT beheben)

| # | Problem | Datei | Zeile | Severity | Aufwand |
|---|---------|-------|-------|----------|---------|
| 1 | **Schwacher NEXTAUTH_SECRET** | `apps/web/.env.local` | 6 | 🔴 KRITISCH | 5 Min |
| 2 | **Fehlendes KEYCLOAK_CLIENT_SECRET** | `apps/web/.env.local` | 12 | 🔴 KRITISCH | 15 Min |
| 3 | **Cookie `secure: false` in Production** | `apps/web/src/lib/auth.ts` | 214 | 🔴 KRITISCH | 30 Min |
| 4 | **Refresh-Token an Client gesendet** | `apps/web/src/lib/auth.ts` | 158 | 🔴 KRITISCH | 10 Min |

### 7.2 Wichtige Verbesserungen (vor Production)

| # | Problem | Severity | Aufwand |
|---|---------|----------|---------|
| 1 | Session maxAge zu lang (30 Tage) | 🟡 MITTEL | 5 Min |
| 2 | Keine Token-Revocation bei Refresh-Fehler | 🟡 MITTEL | 1h |
| 3 | Middleware nutzt keine Rollen-Hierarchie | 🟡 MITTEL | 30 Min |
| 4 | Logout-Fehler nicht kritisch behandelt | 🟡 MITTEL | 30 Min |
| 5 | User-Sync bei jedem Request (Performance) | 🟡 MITTEL | 2h |

### 7.3 Nice-to-Have

- Offline-Detection in SessionProvider
- Dynamisches Refresh-Intervall basierend auf Token-Expiry
- Audit-Logging für Unauthorized-Access-Versuche
- Strengere Rate-Limits für Auth-Endpoints

---

## 8. Checkliste: Production-Readiness

### Vor Go-Live ALLE Punkte abhaken:

#### Secrets & Konfiguration
- [ ] NEXTAUTH_SECRET mit mindestens 32 Zeichen generiert
- [ ] KEYCLOAK_CLIENT_SECRET korrekt gesetzt
- [ ] Alle Secrets aus Code/Repository entfernt
- [ ] `.env.local` in `.gitignore` (bereits vorhanden)
- [ ] Secret Manager eingerichtet (Azure Key Vault / AWS Secrets Manager)

#### Cookies
- [ ] `secure: true` für ALLE Cookies in Production
- [ ] `sameSite: 'strict'` aktiviert
- [ ] `COOKIE_DOMAIN` korrekt konfiguriert
- [ ] Session `maxAge` auf 7 Tage reduziert

#### HTTPS & Infrastruktur
- [ ] HTTPS erzwungen (Nginx/Traefik)
- [ ] HTTP → HTTPS Redirect aktiv
- [ ] SSL-Zertifikat gültig (Let's Encrypt / Wildcard)
- [ ] HSTS-Header gesetzt (`Strict-Transport-Security`)

#### Token-Management
- [ ] Refresh-Token NICHT an Client senden
- [ ] Token-Revocation implementiert
- [ ] Token-Rotation bei Refresh aktiv (bereits ✅)
- [ ] Logout-Flow testet (Keycloak + NextAuth)

#### Rollen & Autorisierung
- [ ] Middleware nutzt Rollen-Hierarchie
- [ ] Client-Side nutzt `hasRole()` Helpers
- [ ] Alle geschützten Routen getestet
- [ ] Server-Side Auth IMMER aktiv (nie nur Client-Side)

#### Monitoring & Logging
- [ ] Audit-Logs für fehlgeschlagene Login-Versuche
- [ ] Monitoring für Token-Refresh-Fehler
- [ ] Alerting bei Keycloak-Ausfall
- [ ] Session-Metrics (Login/Logout-Rate)

#### Tests
- [ ] E2E-Tests für Login-Flow
- [ ] E2E-Tests für Logout-Flow
- [ ] E2E-Tests für Token-Refresh
- [ ] E2E-Tests für Rollen-basierte Zugriffskontrolle
- [ ] Penetration-Test durchgeführt

---

## 9. Kontakt & Weitere Analyse

Bei Fragen zu dieser Analyse:
- **Auth Agent:** `.claude/agents/auth-agent.md`
- **Security-Dokumentation:** `docs/security/`
- **Keycloak-Setup:** `docker/keycloak/README.md`

**Nächste Schritte:**
1. Kritische Lücken beheben (siehe 7.1)
2. Keycloak Realm vollständig konfigurieren
3. Production-Secrets generieren
4. E2E-Tests für Auth-Flow schreiben
5. Penetration-Test beauftragen

---

*Ende der Analyse*

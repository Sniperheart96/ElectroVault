# Keycloak-Authentifizierung

> Wichtige Hinweise zur JWT-Token-Validierung und User-Sync

---

## Keycloak JWT Token-Struktur

Keycloak-Tokens enthalten wichtige Claims, die sich von anderen OAuth-Providern unterscheiden:

```json
{
  "iss": "http://192.168.178.80:8080/realms/electrovault",
  "aud": "account",
  "azp": "electrovault-web",
  "sub": "a44bac15-bd14-4505-b84c-add17ec7badd",
  "realm_access": {
    "roles": ["admin", "offline_access", "uma_authorization"]
  }
}
```

### Wichtige Felder

| Feld | Bedeutung | Hinweis |
|------|-----------|---------|
| `iss` | Issuer URL | **Muss exakt matchen!** IP vs. localhost beachten |
| `aud` | Audience | Bei Keycloak oft `"account"`, NICHT unser Client! |
| `azp` | Authorized Party | **Das ist unser Client** (`electrovault-web`) |
| `sub` | Subject (User ID) | Keycloak-interne UUID |
| `realm_access.roles` | Rollen | **Kleinschreibung!** (admin, nicht ADMIN) |

---

## Bekannte Fallstricke

### 1. Audience Mismatch

**Problem:** Standard-JWT-Libraries erwarten `aud` = Client-ID, aber Keycloak setzt `aud: "account"`.

**Lösung:** Wir prüfen `azp` statt `aud`:

```typescript
// ❌ FALSCH - schlägt fehl weil aud = "account"
const { payload } = await jwtVerify(token, JWKS, {
  audience: 'electrovault-web',  // Token hat aud: "account"!
});

// ✅ RICHTIG - azp prüfen
const { payload } = await jwtVerify(token, JWKS, {
  issuer: this.issuer,
  // Keine audience-Prüfung hier
});

// Dann manuell azp prüfen
if (payload.azp !== 'electrovault-web') {
  throw new Error('Token was issued for wrong client');
}
```

### 2. Issuer URL Mismatch

**Problem:** Frontend und API müssen dieselbe Keycloak-URL verwenden.

```
Frontend: KEYCLOAK_URL=http://192.168.178.80:8080
API:      KEYCLOAK_URL=http://localhost:8080      ❌ FEHLER!
```

Der Token-Issuer ist die URL, mit der der User authentifiziert wurde. Wenn die API eine andere URL erwartet, schlägt die Validierung fehl.

**Lösung:** Konsistente URLs in allen `.env`-Dateien:

```env
# apps/api/.env
KEYCLOAK_URL=http://192.168.178.80:8080  # Muss mit Frontend übereinstimmen!

# apps/web/.env.local
KEYCLOAK_URL=http://192.168.178.80:8080
```

### 3. Rollen Case-Sensitivity

**Problem:** Keycloak-Rollen sind lowercase (`admin`), Code erwartet oft uppercase (`ADMIN`).

**Lösung:** Case-insensitive Vergleich:

```typescript
// ❌ FALSCH - schlägt fehl
if (user.roles.includes('ADMIN')) { ... }

// ✅ RICHTIG - case-insensitive
if (user.roles.some(r => r.toLowerCase() === 'admin')) { ... }
```

### 4. User-ID vs. Database-ID

**Problem:** `request.user.id` ist die Keycloak-UUID, nicht die lokale Datenbank-UUID.

```typescript
// ❌ FALSCH - Keycloak-ID als Foreign Key → Constraint Violation!
const manufacturer = await prisma.manufacturerMaster.create({
  data: {
    createdById: request.user?.id,  // Keycloak-UUID!
  }
});

// ✅ RICHTIG - Lokale Datenbank-ID
const manufacturer = await prisma.manufacturerMaster.create({
  data: {
    createdById: request.user?.dbId,  // Lokale UUID aus User-Tabelle
  }
});
```

---

## User-Sync-Architektur

Der User wird bei jedem authentifizierten Request automatisch synchronisiert:

```
Keycloak Token → validateToken() → syncUser() → request.user
                                       ↓
                                  User-Tabelle
                                  (externalId = Keycloak-UUID)
                                       ↓
                                  request.user.dbId = lokale UUID
```

### AuthenticatedUser Interface

```typescript
interface AuthenticatedUser {
  // Von Keycloak
  id: string;           // Keycloak-UUID (sub claim)
  email?: string;
  username?: string;
  displayName?: string;
  roles: string[];      // Keycloak-Rollen (lowercase!)

  // Von lokalem User-Sync
  dbId?: string;        // Lokale Datenbank-UUID
  dbRole?: UserRole;    // Gemappte Rolle (ADMIN, MODERATOR, etc.)
}
```

### Verwendung in Routes

```typescript
app.post('/manufacturers', {
  onRequest: app.requireRole('CONTRIBUTOR'),  // Keycloak-Rolle (case-insensitive)
}, async (request, reply) => {
  const userId = request.user?.dbId;  // Für Datenbank-FK

  const manufacturer = await manufacturerService.create(data, userId);
  return reply.code(201).send({ data: manufacturer });
});
```

---

## Rollen-Hierarchie

Die Rollen-Prüfung unterstützt eine Hierarchie:

```
ADMIN > MODERATOR > CONTRIBUTOR > VIEWER
```

Ein Admin hat automatisch alle Rechte eines Moderators, Contributors und Viewers:

```typescript
// User hat Rolle "admin"
app.requireRole('CONTRIBUTOR')  // ✅ Zugriff erlaubt (admin > contributor)
app.requireRole('ADMIN')        // ✅ Zugriff erlaubt
```

---

## Konfiguration

### API (.env)

```env
# Muss mit Frontend-URL übereinstimmen!
KEYCLOAK_URL=http://192.168.178.80:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
```

### Frontend (.env.local)

```env
KEYCLOAK_URL=http://192.168.178.80:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=  # Falls confidential client
```

---

## Debugging

### Token dekodieren

JWT-Tokens können auf https://jwt.io dekodiert werden. Wichtige Felder prüfen:

1. `iss` - Stimmt die URL exakt?
2. `azp` - Ist das unser Client?
3. `exp` - Ist der Token abgelaufen?
4. `realm_access.roles` - Hat der User die nötige Rolle?

### API-Logs

Fehler bei der Token-Validierung werden geloggt:

```
ERROR: Token validation failed
  - "Token was issued for wrong client"  → azp stimmt nicht
  - "unexpected iss claim"               → Issuer-URL falsch
  - "jwt expired"                        → Token abgelaufen
```

---

*Letzte Aktualisierung: 2025-12-28*
*Siehe auch: [development-environment.md](development-environment.md) | [phase-1-database-auth.md](../phases/phase-1-database-auth.md)*

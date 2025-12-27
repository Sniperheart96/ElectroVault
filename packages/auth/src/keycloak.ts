// Keycloak Client & Token Validation
import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
}

export interface TokenPayload {
  sub: string; // Keycloak user ID
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  azp?: string; // Authorized Party (the client that requested the token)
  aud?: string | string[]; // Audience
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
}

export interface UserInfo {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  roles: string[];
}

/**
 * Keycloak Client
 */
export class KeycloakClient {
  private jwksUrl: string;
  private issuer: string;

  constructor(private config: KeycloakConfig) {
    this.jwksUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/certs`;
    this.issuer = `${config.url}/realms/${config.realm}`;
  }

  /**
   * Verify and decode a Keycloak JWT token
   *
   * Keycloak tokens have `aud: "account"` by default (for the account service).
   * The actual client is in `azp` (Authorized Party).
   * We verify the signature and issuer, then manually check azp.
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

      // Verify signature and issuer only - we'll check azp manually
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: this.issuer,
        // Don't check audience - Keycloak uses azp for the requesting client
      });

      const typedPayload = payload as unknown as TokenPayload;

      // Verify the token was issued for our client (azp = authorized party)
      if (typedPayload.azp && typedPayload.azp !== this.config.clientId) {
        throw new Error(
          `Token was issued for client "${typedPayload.azp}", expected "${this.config.clientId}"`
        );
      }

      return typedPayload;
    } catch (error) {
      throw new Error(`Token verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Extract user info from token payload
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
   * Full token validation and user extraction
   */
  async validateToken(token: string): Promise<UserInfo> {
    const payload = await this.verifyToken(token);
    return this.extractUserInfo(payload);
  }

  /**
   * Check if user has required role (case-insensitive)
   * Keycloak roles are lowercase, API expects uppercase
   */
  hasRole(userInfo: UserInfo, requiredRole: string): boolean {
    const normalizedRequired = requiredRole.toLowerCase();
    return userInfo.roles.some((role) => role.toLowerCase() === normalizedRequired);
  }

  /**
   * Check if user has any of the required roles (case-insensitive)
   * Also checks role hierarchy: admin > moderator > contributor > viewer
   */
  hasAnyRole(userInfo: UserInfo, requiredRoles: string[]): boolean {
    const normalizedUserRoles = userInfo.roles.map((r) => r.toLowerCase());

    // Role hierarchy: higher roles include lower permissions
    const roleHierarchy: Record<string, string[]> = {
      admin: ['admin', 'moderator', 'contributor', 'viewer'],
      moderator: ['moderator', 'contributor', 'viewer'],
      contributor: ['contributor', 'viewer'],
      viewer: ['viewer'],
    };

    // Check if user has admin - admins can do everything
    if (normalizedUserRoles.includes('admin')) {
      return true;
    }

    // Check each required role
    return requiredRoles.some((required) => {
      const normalizedRequired = required.toLowerCase();
      // Direct match
      if (normalizedUserRoles.includes(normalizedRequired)) {
        return true;
      }
      // Hierarchy check: does user have a higher role?
      for (const [userRole, includedRoles] of Object.entries(roleHierarchy)) {
        if (normalizedUserRoles.includes(userRole) && includedRoles.includes(normalizedRequired)) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Get well-known OpenID configuration
   */
  get wellKnownUrl(): string {
    return `${this.issuer}/.well-known/openid-configuration`;
  }

  /**
   * Get authorization endpoint
   */
  get authorizationUrl(): string {
    return `${this.issuer}/protocol/openid-connect/auth`;
  }

  /**
   * Get token endpoint
   */
  get tokenUrl(): string {
    return `${this.issuer}/protocol/openid-connect/token`;
  }

  /**
   * Get userinfo endpoint
   */
  get userInfoUrl(): string {
    return `${this.issuer}/protocol/openid-connect/userinfo`;
  }

  /**
   * Get logout endpoint
   */
  get logoutUrl(): string {
    return `${this.issuer}/protocol/openid-connect/logout`;
  }
}

/**
 * Create Keycloak client from environment variables
 */
export function createKeycloakClient(): KeycloakClient {
  const config: KeycloakConfig = {
    url: process.env.KEYCLOAK_URL || '',
    realm: process.env.KEYCLOAK_REALM || '',
    clientId: process.env.KEYCLOAK_CLIENT_ID || '',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  };

  if (!config.url || !config.realm || !config.clientId) {
    throw new Error('Missing required Keycloak configuration in environment variables');
  }

  return new KeycloakClient(config);
}

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
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const JWKS = createRemoteJWKSet(new URL(this.jwksUrl));

      const { payload } = await jwtVerify(token, JWKS, {
        issuer: this.issuer,
        audience: this.config.clientId,
      });

      return payload as unknown as TokenPayload;
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
   * Check if user has required role
   */
  hasRole(userInfo: UserInfo, requiredRole: string): boolean {
    return userInfo.roles.includes(requiredRole);
  }

  /**
   * Check if user has any of the required roles
   */
  hasAnyRole(userInfo: UserInfo, requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => userInfo.roles.includes(role));
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

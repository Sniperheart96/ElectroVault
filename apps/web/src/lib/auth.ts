/**
 * NextAuth Configuration for Keycloak
 */
import type { NextAuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      roles: string[];
    };
  }

  interface User {
    id: string;
    roles?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    roles?: string[];
    error?: string;
  }
}

// Keycloak configuration from environment
const keycloakConfig = {
  issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const tokenUrl = `${keycloakConfig.issuer}/protocol/openid-connect/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: keycloakConfig.clientId,
        client_secret: keycloakConfig.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

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

/**
 * Extract roles from Keycloak token
 */
function extractRoles(token: Record<string, unknown>): string[] {
  const roles: string[] = [];

  // Realm roles
  const realmAccess = token.realm_access as { roles?: string[] } | undefined;
  if (realmAccess?.roles) {
    roles.push(...realmAccess.roles);
  }

  // Client roles
  const resourceAccess = token.resource_access as Record<string, { roles?: string[] }> | undefined;
  const clientRoles = resourceAccess?.[keycloakConfig.clientId]?.roles;
  if (clientRoles) {
    roles.push(...clientRoles);
  }

  return [...new Set(roles)]; // Remove duplicates
}

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
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
    }),
  ],

  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        // Decode the access token to get roles
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

    async session({ session, token }): Promise<Session> {
      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
        user: {
          ...session.user,
          id: token.sub!,
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
    // Production: 7 Tage für erhöhte Sicherheit, Development: 30 Tage für Komfort
    maxAge: process.env.NODE_ENV === 'production' ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60,
  },

  events: {
    async signOut({ token }) {
      // Logout from Keycloak as well
      if (token?.refreshToken) {
        try {
          const logoutUrl = `${keycloakConfig.issuer}/protocol/openid-connect/logout`;
          await fetch(logoutUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
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
    },
  },

  debug: process.env.NODE_ENV === 'development',

  // Cookie configuration
  // secure: true in production (HTTPS only), false in development (HTTP allowed for local testing)
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

/**
 * Helper to check if user has a specific role
 */
export function hasRole(session: Session | null, role: string): boolean {
  return session?.user?.roles?.includes(role) ?? false;
}

/**
 * Helper to check if user has any of the specified roles
 */
export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  return roles.some(role => hasRole(session, role));
}

/**
 * Role constants matching Keycloak configuration
 */
export const Roles = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;

export type Role = typeof Roles[keyof typeof Roles];

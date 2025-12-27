// NextAuth configuration for Keycloak
import type { NextAuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

interface KeycloakProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * Create NextAuth options for Keycloak
 */
export function createNextAuthOptions(): NextAuthOptions {
  const keycloakUrl = process.env.KEYCLOAK_URL || '';
  const keycloakRealm = process.env.KEYCLOAK_REALM || '';
  const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || '';
  const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || '';

  if (!keycloakUrl || !keycloakRealm || !keycloakClientId || !keycloakClientSecret) {
    throw new Error('Missing required Keycloak configuration for NextAuth');
  }

  const issuer = `${keycloakUrl}/realms/${keycloakRealm}`;

  return {
    providers: [
      KeycloakProvider({
        clientId: keycloakClientId,
        clientSecret: keycloakClientSecret,
        issuer,
        authorization: {
          params: {
            scope: 'openid email profile',
          },
        },
        profile(profile: KeycloakProfile) {
          return {
            id: profile.sub,
            name: profile.name || profile.preferred_username,
            email: profile.email,
            image: profile.picture,
          };
        },
      }),
    ],

    callbacks: {
      async jwt({ token, user, account }) {
        // Initial sign in
        if (account && user) {
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
          };
        }

        // Return previous token if not expired
        if (Date.now() < (token.expiresAt as number) * 1000) {
          return token;
        }

        // Token expired, try refresh
        return refreshAccessToken(token);
      },

      async session({ session, token }): Promise<Session> {
        return {
          ...session,
          user: {
            ...session.user,
            id: (token.user as { id: string }).id,
          },
          accessToken: token.accessToken as string,
          error: token.error as string | undefined,
        };
      },
    },

    pages: {
      signIn: '/auth/login',
      signOut: '/auth/logout',
      error: '/auth/error',
    },

    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
  };
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const keycloakUrl = process.env.KEYCLOAK_URL || '';
    const keycloakRealm = process.env.KEYCLOAK_REALM || '';
    const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || '';
    const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || '';

    const tokenEndpoint = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: keycloakClientId,
        client_secret: keycloakClientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

'use client';

/**
 * NextAuth Session Provider
 * Client component wrapper for NextAuth session context
 *
 * Features:
 * - Automatische Token-Erneuerung alle 4 Minuten
 * - Automatischer Logout bei Token-Fehlern
 */
import { SessionProvider as NextAuthSessionProvider, signOut, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Wrapper-Komponente die auf Token-Fehler reagiert und automatisch ausloggt
 */
function SessionErrorHandler({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Wenn ein RefreshAccessTokenError vorliegt, automatisch ausloggen
    if (session?.error === 'RefreshAccessTokenError') {
      console.warn('Token konnte nicht erneuert werden. Automatischer Logout...');
      signOut({ callbackUrl: '/auth/signin?error=SessionExpired' });
    }
  }, [session?.error]);

  return <>{children}</>;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Alle 4 Minuten Token-Status prüfen und ggf. refreshen
      refetchInterval={4 * 60}
    >
      <SessionErrorHandler>
        {children}
      </SessionErrorHandler>
    </NextAuthSessionProvider>
  );
}

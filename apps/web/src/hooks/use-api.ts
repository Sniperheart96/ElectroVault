'use client';

/**
 * Hook for authenticated API access in client components
 * Automatically sets the access token from the session
 */
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { api, type ApiClient } from '@/lib/api';

/**
 * Returns the global API client with the access token automatically set
 * from the current session. Updates token when session changes.
 *
 * Bei Token-Fehlern (RefreshAccessTokenError) wird automatisch ausgeloggt.
 */
export function useApi(): ApiClient {
  const { data: session } = useSession();

  useEffect(() => {
    // Token-Refresh fehlgeschlagen → automatisch ausloggen
    if (session?.error === 'RefreshAccessTokenError') {
      console.warn('Session expired, logging out automatically');
      signOut({ callbackUrl: '/' });
      return;
    }

    // Token setzen wenn vorhanden
    if (session?.accessToken) {
      api.setToken(session.accessToken);
    } else {
      api.setToken(null);
    }

    // KEIN Cleanup beim Unmount - das Token bleibt gültig für andere Komponenten
    // Die globale API-Instanz wird von mehreren Komponenten geteilt
  }, [session?.accessToken, session?.error]);

  return api;
}

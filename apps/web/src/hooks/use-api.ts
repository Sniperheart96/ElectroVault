'use client';

/**
 * Hook for authenticated API access in client components
 * Automatically sets the access token from the session
 */
import { useSession } from 'next-auth/react';
import { useMemo, useEffect } from 'react';
import { api, createApiClient, type ApiClient } from '@/lib/api';

/**
 * Returns the global API client with the access token automatically set
 * from the current session. Updates token when session changes.
 */
export function useApi(): ApiClient {
  const { data: session } = useSession();

  // Set and cleanup token with useEffect to prevent memory leaks
  useEffect(() => {
    if (session?.accessToken) {
      api.setToken(session.accessToken);
    } else {
      api.setToken(null);
    }

    // Cleanup: Remove token when component unmounts
    return () => {
      api.setToken(null);
    };
  }, [session?.accessToken]);

  return api;
}

/**
 * Creates a new API client instance with the access token from the session.
 * Use this when you need a separate client instance.
 */
export function useApiClient(): ApiClient {
  const { data: session } = useSession();

  const client = useMemo(() => {
    return createApiClient(session?.accessToken);
  }, [session?.accessToken]);

  return client;
}

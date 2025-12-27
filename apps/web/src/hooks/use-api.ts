'use client';

/**
 * Hook for authenticated API access in client components
 * Automatically sets the access token from the session
 */
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { api, createApiClient, type ApiClient } from '@/lib/api';

/**
 * Returns the global API client with the access token automatically set
 * from the current session. Updates token when session changes.
 *
 * IMPORTANT: Token is set synchronously during render to ensure it's
 * available immediately when the component makes API calls.
 */
export function useApi(): ApiClient {
  const { data: session } = useSession();

  // Set token synchronously during render (before any API calls)
  // This is safe because setToken only updates an internal variable
  if (session?.accessToken) {
    api.setToken(session.accessToken);
  } else {
    api.setToken(null);
  }

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

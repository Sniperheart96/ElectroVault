/**
 * Server-side Auth Utilities
 * Use these in Server Components and API routes
 */
import { getServerSession } from 'next-auth';
import { authOptions, hasRole, hasAnyRole, Roles } from './auth';
import type { Session } from 'next-auth';

/**
 * Get the current session on the server
 */
export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if the current user has a specific role
 */
export async function userHasRole(role: string): Promise<boolean> {
  const session = await getSession();
  return hasRole(session, role);
}

/**
 * Check if the current user has any of the specified roles
 */
export async function userHasAnyRole(roles: string[]): Promise<boolean> {
  const session = await getSession();
  return hasAnyRole(session, roles);
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return userHasRole(Roles.ADMIN);
}

/**
 * Check if the current user is a moderator (or admin)
 */
export async function isModerator(): Promise<boolean> {
  return userHasAnyRole([Roles.ADMIN, Roles.MODERATOR]);
}

/**
 * Check if the current user is a contributor (or higher)
 */
export async function isContributor(): Promise<boolean> {
  return userHasAnyRole([Roles.ADMIN, Roles.MODERATOR, Roles.CONTRIBUTOR]);
}

// Re-export role constants
export { Roles } from './auth';

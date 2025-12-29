/**
 * Permission helpers for UI components
 */
import { Session } from 'next-auth';
import { hasAnyRole, Roles } from './auth';

/**
 * Check if user can edit content (create, update, delete)
 * All authenticated users with CONTRIBUTOR, MODERATOR, or ADMIN role can edit
 */
export function canEdit(session: Session | null): boolean {
  if (!session) return false;
  return hasAnyRole(session, [Roles.CONTRIBUTOR, Roles.MODERATOR, Roles.ADMIN]);
}

/**
 * Check if user can access admin area (Users, Moderation)
 * Only ADMIN and MODERATOR can access
 */
export function canAccessAdmin(session: Session | null): boolean {
  if (!session) return false;
  return hasAnyRole(session, [Roles.ADMIN, Roles.MODERATOR]);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: Session | null): boolean {
  return session !== null && session.user !== undefined;
}

// User Sync Service
// Synchronisiert Keycloak-Benutzer mit lokaler Datenbank

import type { PrismaClient, UserRole } from '@electrovault/database';
import type { UserInfo } from './keycloak';

/**
 * Role mapping: Keycloak → ElectroVault
 */
const ROLE_MAPPING: Record<string, UserRole> = {
  admin: 'ADMIN',
  moderator: 'MODERATOR',
  contributor: 'CONTRIBUTOR',
  viewer: 'VIEWER',
};

/**
 * Get highest role from user roles
 */
function getHighestRole(keycloakRoles: string[]): UserRole {
  const roleHierarchy: UserRole[] = ['ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'VIEWER'];

  for (const hierarchyRole of roleHierarchy) {
    const keycloakRole = Object.keys(ROLE_MAPPING).find(
      (k) => ROLE_MAPPING[k] === hierarchyRole
    );
    if (keycloakRole && keycloakRoles.includes(keycloakRole)) {
      return hierarchyRole;
    }
  }

  return 'VIEWER'; // Default role
}

export interface SyncUserOptions {
  userInfo: UserInfo;
  avatarUrl?: string;
}

/**
 * Sync Keycloak user to local database
 * Creates new user or updates existing user
 */
export async function syncUser(
  prisma: PrismaClient,
  options: SyncUserOptions
): Promise<{ id: string; email: string; role: UserRole }> {
  const { userInfo, avatarUrl } = options;

  const role = getHighestRole(userInfo.roles);

  // Upsert user
  const user = await prisma.user.upsert({
    where: {
      externalId: userInfo.id,
    },
    update: {
      email: userInfo.email || '',
      username: userInfo.username || userInfo.email || 'unknown',
      displayName: userInfo.displayName,
      role,
      avatarUrl: avatarUrl || undefined,
      lastLoginAt: new Date(),
    },
    create: {
      externalId: userInfo.id,
      email: userInfo.email || '',
      username: userInfo.username || userInfo.email || `user-${userInfo.id.substring(0, 8)}`,
      displayName: userInfo.displayName,
      role,
      avatarUrl: avatarUrl || undefined,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return user;
}

/**
 * Get or create user from Keycloak user info
 * Alias for syncUser for backwards compatibility
 */
export async function getOrCreateUser(
  prisma: PrismaClient,
  userInfo: UserInfo
): Promise<{ id: string; email: string; role: UserRole }> {
  return syncUser(prisma, { userInfo });
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(
  prisma: PrismaClient,
  externalId: string
): Promise<void> {
  await prisma.user.update({
    where: { externalId },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(
  prisma: PrismaClient,
  externalId: string
): Promise<void> {
  await prisma.user.update({
    where: { externalId },
    data: { isActive: false },
  });
}

/**
 * Reactivate user
 */
export async function reactivateUser(
  prisma: PrismaClient,
  externalId: string
): Promise<void> {
  await prisma.user.update({
    where: { externalId },
    data: { isActive: true },
  });
}

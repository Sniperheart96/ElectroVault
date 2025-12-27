// Tests for User Sync Service
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { syncUser, getOrCreateUser } from './user-sync';
import type { UserInfo } from './keycloak';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

describe('User Sync Service', () => {
  beforeEach(async () => {
    // Clean users table
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    // Clean up
    await prisma.user.deleteMany({});
  });

  describe('syncUser', () => {
    it('should create a new user if not exists', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        roles: ['contributor'],
      };

      const result = await syncUser(prisma, { userInfo });

      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('CONTRIBUTOR');

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { externalId: 'keycloak-123' },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.username).toBe('testuser');
      expect(dbUser?.displayName).toBe('Test User');
    });

    it('should update existing user on subsequent sync', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        roles: ['contributor'],
      };

      // First sync
      await syncUser(prisma, { userInfo });

      // Second sync with updated data
      const updatedUserInfo: UserInfo = {
        ...userInfo,
        displayName: 'Updated Name',
        roles: ['admin'],
      };

      const result = await syncUser(prisma, { userInfo: updatedUserInfo });

      expect(result.role).toBe('ADMIN');

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { externalId: 'keycloak-123' },
      });
      expect(dbUser?.displayName).toBe('Updated Name');
      expect(dbUser?.role).toBe('ADMIN');
    });

    it('should handle missing email gracefully', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        username: 'testuser',
        roles: ['viewer'],
      };

      const result = await syncUser(prisma, { userInfo });

      expect(result.email).toBe('');
      expect(result.role).toBe('VIEWER');
    });

    it('should set highest role when user has multiple roles', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['admin', 'moderator', 'contributor', 'viewer'],
      };

      const result = await syncUser(prisma, { userInfo });

      expect(result.role).toBe('ADMIN');
    });

    it('should default to VIEWER role when no valid roles provided', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['unknown-role'],
      };

      const result = await syncUser(prisma, { userInfo });

      expect(result.role).toBe('VIEWER');
    });

    it('should update lastLoginAt timestamp', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['viewer'],
      };

      const before = new Date();
      await syncUser(prisma, { userInfo });
      const after = new Date();

      const dbUser = await prisma.user.findUnique({
        where: { externalId: 'keycloak-123' },
      });

      expect(dbUser?.lastLoginAt).not.toBeNull();
      expect(dbUser?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(dbUser?.lastLoginAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getOrCreateUser', () => {
    it('should work as alias for syncUser', async () => {
      const userInfo: UserInfo = {
        id: 'keycloak-123',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['moderator'],
      };

      const result = await getOrCreateUser(prisma, userInfo);

      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('MODERATOR');

      const dbUser = await prisma.user.findUnique({
        where: { externalId: 'keycloak-123' },
      });
      expect(dbUser).not.toBeNull();
    });
  });
});

// Disconnect after all tests
afterEach(async () => {
  await prisma.$disconnect();
});

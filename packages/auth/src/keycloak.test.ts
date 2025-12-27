// Tests for Keycloak Client
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeycloakClient, type TokenPayload } from './keycloak';

describe('KeycloakClient', () => {
  let client: KeycloakClient;

  beforeEach(() => {
    client = new KeycloakClient({
      url: 'http://localhost:8080',
      realm: 'electrovault',
      clientId: 'electrovault-web',
    });
  });

  describe('extractUserInfo', () => {
    it('should extract user info from token payload', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        preferred_username: 'testuser',
        name: 'Test User',
        realm_access: {
          roles: ['viewer'],
        },
        resource_access: {
          'electrovault-web': {
            roles: ['contributor'],
          },
        },
      };

      const userInfo = client.extractUserInfo(payload);

      expect(userInfo.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(userInfo.email).toBe('test@example.com');
      expect(userInfo.username).toBe('testuser');
      expect(userInfo.displayName).toBe('Test User');
      expect(userInfo.roles).toContain('viewer');
      expect(userInfo.roles).toContain('contributor');
    });

    it('should handle missing optional fields', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
      };

      const userInfo = client.extractUserInfo(payload);

      expect(userInfo.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(userInfo.email).toBeUndefined();
      expect(userInfo.username).toBeUndefined();
      expect(userInfo.displayName).toBeUndefined();
      expect(userInfo.roles).toEqual([]);
    });

    it('should deduplicate roles', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        realm_access: {
          roles: ['admin', 'viewer'],
        },
        resource_access: {
          'electrovault-web': {
            roles: ['admin', 'moderator'],
          },
        },
      };

      const userInfo = client.extractUserInfo(payload);

      // Should contain unique roles only
      expect(userInfo.roles).toEqual(expect.arrayContaining(['admin', 'viewer', 'moderator']));
      expect(userInfo.roles.length).toBe(3);
    });
  });

  describe('hasRole', () => {
    const userInfo = {
      id: '123',
      roles: ['contributor', 'viewer'],
    };

    it('should return true if user has role', () => {
      expect(client.hasRole(userInfo, 'contributor')).toBe(true);
    });

    it('should return false if user does not have role', () => {
      expect(client.hasRole(userInfo, 'admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    const userInfo = {
      id: '123',
      roles: ['contributor', 'viewer'],
    };

    it('should return true if user has any of the roles', () => {
      expect(client.hasAnyRole(userInfo, ['admin', 'contributor'])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      expect(client.hasAnyRole(userInfo, ['admin', 'moderator'])).toBe(false);
    });

    it('should return true if user has all of the roles', () => {
      expect(client.hasAnyRole(userInfo, ['contributor', 'viewer'])).toBe(true);
    });
  });

  describe('endpoints', () => {
    it('should provide correct well-known URL', () => {
      expect(client.wellKnownUrl).toBe(
        'http://localhost:8080/realms/electrovault/.well-known/openid-configuration'
      );
    });

    it('should provide correct authorization URL', () => {
      expect(client.authorizationUrl).toBe(
        'http://localhost:8080/realms/electrovault/protocol/openid-connect/auth'
      );
    });

    it('should provide correct token URL', () => {
      expect(client.tokenUrl).toBe(
        'http://localhost:8080/realms/electrovault/protocol/openid-connect/token'
      );
    });

    it('should provide correct userinfo URL', () => {
      expect(client.userInfoUrl).toBe(
        'http://localhost:8080/realms/electrovault/protocol/openid-connect/userinfo'
      );
    });

    it('should provide correct logout URL', () => {
      expect(client.logoutUrl).toBe(
        'http://localhost:8080/realms/electrovault/protocol/openid-connect/logout'
      );
    });
  });
});

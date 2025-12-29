// ElectroVault Auth Package
// Keycloak integration for Fastify and NextAuth

export * from './keycloak';
export * from './user-sync';
export { default as authPlugin } from './fastify/index';
export {
  assertAuthenticated,
  type AuthenticatedUser,
  type VerifiedUser,
  type AuthenticatedRequest,
} from './fastify/index';
export { createNextAuthOptions } from './nextauth/index';

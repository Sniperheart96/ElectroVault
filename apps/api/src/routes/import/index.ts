/**
 * Import Routes - Haupt-Router für Import-System
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import importSourceRoutes from './sources';
import importMappingRoutes from './mappings';

/**
 * Import Routes Plugin
 * Registriert alle Import-bezogenen Routes unter /import
 */
export default async function importRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // Import Sources: /import/sources
  app.register(importSourceRoutes, { prefix: '/sources' });

  // Import Mappings: /import/mappings
  app.register(importMappingRoutes, { prefix: '/mappings' });

  // TODO: Weitere Routes für Phase 3+
  // Jobs: /import/jobs
  // Unmapped Attributes: /import/unmapped-attributes
}

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@electrovault/database';

/**
 * Stats Routes - Öffentliche Statistiken
 */
const statsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /stats
   * Öffentliche Statistiken (Bauteile, Hersteller, Nutzer)
   */
  fastify.get('/', async () => {
    const [componentsCount, manufacturersCount, usersCount] = await Promise.all([
      prisma.coreComponent.count({
        where: { deletedAt: null, status: 'PUBLISHED' },
      }),
      prisma.manufacturerMaster.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.user.count({
        where: { isActive: true },
      }),
    ]);

    return {
      data: {
        components: componentsCount,
        manufacturers: manufacturersCount,
        users: usersCount,
      },
    };
  });
};

export default statsRoutes;

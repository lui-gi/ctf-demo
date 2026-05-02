import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../../config/env.js';
import { requireAdmin } from '../_auth.js';
import { adminIslandsRoutes } from './islands.js';
import { adminVoyageRoutes } from './voyage.js';
import { adminModerationRoutes } from './moderation.js';
import { adminSandboxRoutes } from './sandbox.js';
import type { SandboxSessionRegistry } from '../../services/sandboxSessions.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
  broadcastIslandStatus?: (ev: { slug: string; status: 'published' | 'archived' | 'draft' }) => void;
  broadcastVoyageState?: (ev: { frozen: boolean }) => void;
  /** Shared with routes/islands.ts so admin can see/close live shell sessions. */
  sandboxSessions?: SandboxSessionRegistry;
}

export function adminRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    // Hard role gate at the prefix level — every admin route inherits this.
    app.addHook('preHandler', requireAdmin(deps.env));

    await app.register(adminIslandsRoutes(deps), { prefix: '/islands' });
    await app.register(adminVoyageRoutes(deps), { prefix: '/voyage' });
    await app.register(adminModerationRoutes(deps), { prefix: '/' });
    await app.register(
      adminSandboxRoutes({ pool: deps.pool, env: deps.env, sandboxSessions: deps.sandboxSessions }),
      { prefix: '/sandbox' },
    );

    app.post('/charts/recalc', async (req, reply) => {
      const { flushChartsCache } = await import('../../services/charts.js');
      const { audit } = await import('../../services/audit.js');
      const charts = await flushChartsCache(deps.pool, deps.redis, deps.env);
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'charts.recalc',
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, message: 'Charts recalculated.', charts });
    });
  };
}

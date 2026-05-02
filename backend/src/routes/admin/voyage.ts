import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../../config/env.js';
import { freezeVoyage, unfreezeVoyage, isFrozen } from '../../services/voyage.js';
import { audit } from '../../services/audit.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
  broadcastVoyageState?: (ev: { frozen: boolean }) => void;
}

export function adminVoyageRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/', async () => {
      const frozen = await isFrozen(deps.pool, deps.redis);
      return { ok: true, frozen };
    });

    app.post('/freeze', async (req, reply) => {
      await freezeVoyage(deps.pool, deps.redis);
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'voyage.freeze',
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      if (deps.broadcastVoyageState) deps.broadcastVoyageState({ frozen: true });
      return reply.send({ ok: true, message: 'The Charts are frozen. Pirates be on standby.' });
    });

    app.post('/unfreeze', async (req, reply) => {
      await unfreezeVoyage(deps.pool, deps.redis);
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'voyage.unfreeze',
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      if (deps.broadcastVoyageState) deps.broadcastVoyageState({ frozen: false });
      return reply.send({ ok: true, message: 'Voyage resumes. Hoist the colors.' });
    });
  };
}

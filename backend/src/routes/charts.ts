import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';
import { getTop20Cached, getCrewStanding } from '../services/charts.js';
import { requireAuth, type AuthedRequest } from './_auth.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
}

export function chartsRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.addHook('preHandler', requireAuth(deps.env));

    app.get('/', async () => {
      const top = await getTop20Cached(deps.pool, deps.redis, deps.env);
      return { ok: true, charts: top };
    });

    app.get('/me', async (req, reply) => {
      const r = req as AuthedRequest;
      if (!r.user.crew_id) {
        return reply.code(403).send({
          ok: false,
          code: 'ERR_NO_CREW',
          message: 'No Crew, no standing on the Charts.',
        });
      }
      const standing = await getCrewStanding(deps.pool, r.user.crew_id);
      return { ok: true, standing };
    });
  };
}

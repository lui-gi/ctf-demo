import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import { loadEnv, corsOrigins } from './config/env.js';
import { getPool, getRedis, closeAll } from './db/index.js';
import { authRoutes } from './routes/auth.js';
import { crewRoutes } from './routes/crews.js';
import { islandRoutes } from './routes/islands.js';
import { chartsRoutes } from './routes/charts.js';
import { adminRoutes } from './routes/admin/index.js';
import { startWebsocket } from './ws/index.js';
import { SandboxSessionRegistry } from './services/sandboxSessions.js';

export async function buildApp(): Promise<{ app: FastifyInstance; start: () => Promise<void>; stop: () => Promise<void> }> {
  const env = loadEnv();
  const pool = getPool(env);
  const redis = getRedis(env);

  const app = Fastify({
    logger: env.NODE_ENV === 'production'
      ? { level: 'info' }
      : { level: 'debug', transport: undefined },
    trustProxy: true,
    bodyLimit: 1024 * 1024,
    ignoreTrailingSlash: true,
  });

  await app.register(fastifyCors, {
    origin: corsOrigins(env),
    credentials: true,
  });

  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: env.JWT_SECRET });
  await app.register(fastifyRateLimit, {
    global: false, // routes opt in per-handler for fine-grained policy
    redis,
    nameSpace: 'progctf-rl:',
  });
  // WebSocket plugin powers the per-Island /shell route. Socket.io still owns
  // the live Charts bus on /ws — these don't conflict (different paths).
  await app.register(fastifyWebsocket);

  // Health
  app.get('/health', async () => ({
    ok: true,
    name: 'progctf-backend',
    voyage: 'in_progress',
    ts: new Date().toISOString(),
  }));

  // Routes — order matters only for prefix collision; this is fine.
  await app.register(authRoutes({ pool, env }), { prefix: '/api/auth' });
  await app.register(crewRoutes({ pool, env }), { prefix: '/api/crews' });
  await app.register(chartsRoutes({ pool, redis, env }), { prefix: '/api/charts' });

  // We register the WS bus AFTER fastify ready so islands/admin can wire broadcasts to it.
  // For simplicity we wire a no-op placeholder bus, then replace at start() time.
  // Track the active bus through a mutable ref to avoid plugin re-registration.
  type SolveEv = { crewId: string; crewName: string; islandSlug: string; islandTitle: string; awarded: number; firstBlood: boolean };
  type StatusEv = { slug: string; status: 'published' | 'archived' | 'draft' };
  type FreezeEv = { frozen: boolean };
  const wsRef: {
    broadcastSolve: (ev: SolveEv) => void;
    broadcastIslandStatus: (ev: StatusEv) => void;
    broadcastVoyageState: (ev: FreezeEv) => void;
  } = {
    broadcastSolve: () => undefined,
    broadcastIslandStatus: () => undefined,
    broadcastVoyageState: () => undefined,
  };

  // Shared per-Crew shell session ledger — both islandRoutes (writer) and
  // adminRoutes (reader / force-close) need the SAME instance.
  const sandboxSessions = new SandboxSessionRegistry({
    redis,
    idleTimeoutSecs: env.SHELL_IDLE_TIMEOUT_SECS,
    log: app.log,
  });

  await app.register(
    islandRoutes({
      pool, redis, env,
      broadcastSolve: (ev) => wsRef.broadcastSolve(ev),
      sandboxSessions,
    }),
    { prefix: '/api/islands' },
  );
  await app.register(
    adminRoutes({
      pool, redis, env,
      broadcastIslandStatus: (ev) => wsRef.broadcastIslandStatus(ev),
      broadcastVoyageState: (ev) => wsRef.broadcastVoyageState(ev),
      sandboxSessions,
    }),
    { prefix: '/admin' },
  );

  let wsHandle: Awaited<ReturnType<typeof startWebsocket>> | null = null;

  const start = async () => {
    await app.listen({ port: env.PORT, host: env.HOST });
    wsHandle = startWebsocket({
      app,
      http: app.server,
      pool,
      redis,
      env,
    });
    wsRef.broadcastSolve = wsHandle.bus.broadcastSolve;
    wsRef.broadcastIslandStatus = wsHandle.bus.broadcastIslandStatus;
    wsRef.broadcastVoyageState = wsHandle.bus.broadcastVoyageState;
    app.log.info(`progctf backend ready on ${env.HOST}:${env.PORT}`);
  };

  const stop = async () => {
    try {
      if (wsHandle) await wsHandle.stop();
    } catch (err) {
      app.log.error({ err }, 'ws stop failed');
    }
    sandboxSessions.stop();
    await app.close();
    await closeAll();
  };

  return { app, start, stop };
}

// Allow running directly: `tsx src/server.ts` or `node dist/server.js`
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isMain) {
  buildApp()
    .then(async ({ start, stop }) => {
      await start();
      const shutdown = async (sig: string) => {
        console.log(`[server] ${sig} received — striking sail...`);
        await stop();
        process.exit(0);
      };
      process.on('SIGINT', () => void shutdown('SIGINT'));
      process.on('SIGTERM', () => void shutdown('SIGTERM'));
    })
    .catch((err) => {
      console.error('[server] failed to start', err);
      process.exit(1);
    });
}

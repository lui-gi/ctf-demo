import { Server as IOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';
import { verifyAccessToken, AUTH_COOKIES } from '../auth/jwt.js';
import { startChartsBroadcaster, attachSolveBroadcasts, type WSBus } from './charts.js';
import type { FastifyInstance } from 'fastify';

interface Deps {
  app: FastifyInstance;
  http: HttpServer;
  pool: Pool;
  redis: Redis;
  env: Env;
}

export interface WSHandle {
  io: IOServer;
  bus: WSBus;
  stop: () => Promise<void>;
}

export function startWebsocket(deps: Deps): WSHandle {
  const io = new IOServer(deps.http, {
    cors: {
      origin: deps.env.CORS_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    },
    path: '/ws',
  });

  // Handshake auth: accept JWT via socket.handshake.auth.token OR cookie.
  io.use((socket: Socket, next) => {
    try {
      const tokenFromAuth = (socket.handshake.auth as { token?: string } | undefined)?.token;
      const cookieHeader = socket.handshake.headers.cookie ?? '';
      const cookieToken = parseCookie(cookieHeader, AUTH_COOKIES.ACCESS);
      const token = tokenFromAuth || cookieToken;
      if (!token) return next(new Error('no auth token'));
      const claims = verifyAccessToken(deps.app as unknown as Parameters<typeof verifyAccessToken>[0], token);
      (socket.data as { user: typeof claims }).user = claims;
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on('connection', (socket) => {
    const user = (socket.data as { user: { sub: string; crew_id: string | null } }).user;
    socket.join('global');
    if (user.crew_id) {
      socket.join(`crew:${user.crew_id}`);
    }
    socket.emit('hello', { sub: user.sub, crew_id: user.crew_id });
  });

  const bus: WSBus = {
    broadcastSolve: (ev) => {
      io.to('global').emit('charts.update.hint', { kind: 'solve', ...ev });
      if (ev.firstBlood) {
        io.to('global').emit('charts.first_blood', {
          island_slug: ev.islandSlug,
          crew_name: ev.crewName,
          awarded_at: new Date().toISOString(),
        });
      }
    },
    broadcastIslandStatus: (ev) => {
      const evt = ev.status === 'published'
        ? 'island.published'
        : ev.status === 'archived'
          ? 'island.archived'
          : 'island.draft';
      io.to('global').emit(evt, { slug: ev.slug });
    },
    broadcastVoyageState: (ev) => {
      io.to('global').emit(ev.frozen ? 'voyage.frozen' : 'voyage.unfrozen', {
        at: new Date().toISOString(),
      });
    },
    emitChartsSnapshot: (snapshot) => {
      io.to('global').emit('charts.update', snapshot);
    },
  };

  const stopper = startChartsBroadcaster({ pool: deps.pool, redis: deps.redis, env: deps.env, bus });
  attachSolveBroadcasts(bus);

  return {
    io,
    bus,
    stop: async () => {
      stopper();
      await new Promise<void>((resolve) => io.close(() => resolve()));
    },
  };
}

function parseCookie(header: string, name: string): string | null {
  const target = `${name}=`;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return null;
}

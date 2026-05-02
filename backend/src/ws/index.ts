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
  // @fastify/websocket installs a global `upgrade` listener that 404s any
  // path that doesn't match a registered Fastify route. socket.io ALSO needs
  // an upgrade listener for `/socket.io/...` handshakes. Both listeners fire
  // for every upgrade event and the order they were registered determines
  // who replies first — fastify-websocket was added at plugin-register time,
  // so it would 404 socket.io's handshake before socket.io ever sees it.
  //
  // Strategy: snapshot the existing upgrade listeners, instantiate the
  // IOServer (which appends ITS listener at the end), then re-order so
  // socket.io fires FIRST for /socket.io paths and the original fastify
  // listeners run only for non-socket.io upgrades. We do this by clearing
  // the listener list and re-adding a wrapper that demuxes by URL.
  const SOCKET_IO_PATH = '/socket.io';
  const priorUpgradeListeners = deps.http.listeners('upgrade').slice();
  deps.http.removeAllListeners('upgrade');

  const io = new IOServer(deps.http, {
    cors: {
      origin: deps.env.CORS_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    },
    // Default path `/socket.io` — matches the SPA's socket.io-client and the
    // Vite dev proxy. Phase-2's previous explicit `/ws` caused frontend 404s
    // because socket.io-client defaults didn't match.
  });

  // socket.io-installed upgrade listener now sits at index 0 (it was the
  // only one when IOServer attached). Re-append the prior fastify listeners
  // wrapped in a guard that skips socket.io paths so fastify-websocket
  // doesn't 404 socket.io upgrades.
  const sioUpgrade = deps.http.listeners('upgrade')[0] as (
    req: import('node:http').IncomingMessage,
    socket: import('node:stream').Duplex,
    head: Buffer,
  ) => void;
  deps.http.removeAllListeners('upgrade');
  deps.http.on('upgrade', (req, socket, head) => {
    const url = req.url ?? '';
    if (url.startsWith(SOCKET_IO_PATH)) {
      sioUpgrade(req, socket, head);
      return;
    }
    for (const listener of priorUpgradeListeners) {
      (listener as (
        req: import('node:http').IncomingMessage,
        socket: import('node:stream').Duplex,
        head: Buffer,
      ) => void)(req, socket, head);
    }
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

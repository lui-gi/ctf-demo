/**
 * Phase-2 — sandbox session tests for the per-Crew WS shell + admin visibility.
 *
 * Covers:
 *   1. Per-Crew isolation: two simulated WS connections, frames don't bleed.
 *   2. Idle timeout: a session that goes quiet past the timeout is closed
 *      (timeout overridden via env to 1s for testability).
 *   3. GET  /admin/sandbox/sessions returns the active sessions for an admin token.
 *   4. GET  /admin/sandbox/sessions returns 401/403 for a non-admin token.
 *   5. Audit: opening a WS shell session writes a `sandbox.session.start` row.
 *   6. DELETE /admin/sandbox/sessions/:islandSlug/:crewId force-closes a session.
 *
 * Setup mirrors `routes.test.ts`: a real Fastify app with a hand-rolled FakePool,
 * but here we ALSO mount the admin sandbox sub-routes (gated by requireAdmin)
 * so we can test the visibility endpoint end-to-end through the JWT pipeline.
 */
import { describe, it, expect } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import { islandRoutes } from '../src/routes/islands.js';
import { adminSandboxRoutes } from '../src/routes/admin/sandbox.js';
import { requireAdmin } from '../src/routes/_auth.js';
import { SandboxSessionRegistry } from '../src/services/sandboxSessions.js';
import type { Env } from '../src/config/env.js';
import type { Pool } from 'pg';

const TEST_ENV: Env = {
  NODE_ENV: 'test',
  PORT: 4002,
  HOST: '127.0.0.1',
  DB_URL: 'postgres://unused/unused',
  REDIS_URL: 'redis://unused',
  JWT_SECRET: 'unit-test-secret-must-be-long-enough-1234567890',
  JWT_EXPIRES_IN: '8h',
  JWT_REFRESH_EXPIRES_IN: '30d',
  ARGON2_PEPPER: 'unit-test-pepper-123456',
  CORS_ORIGINS: 'http://localhost:5173',
  COOKIE_DOMAIN: 'localhost',
  COOKIE_SECURE: false,
  SANDBOX_CONTROLLER_URL: 'http://localhost:8080',
  SANDBOX_CONTROLLER_TOKEN: 'dev',
  SHELL_IDLE_TIMEOUT_SECS: 300,
  CHARTS_CACHE_TTL: 5,
  SUBMIT_RATE_PER_MIN: 5,
  AUTH_RATE_PER_MIN: 10,
};

/**
 * Same fake-pool flavour as routes.test.ts — just inlined here so this file
 * doesn't need an import surface change. `allow()` registers a permanent
 * matcher (used for fire-and-forget audit() inserts).
 */
type Match = (sql: string, params: unknown[]) => boolean;
type Reply = { rows: unknown[]; rowCount?: number };
class FakePool {
  private queue: { match: Match; reply: Reply | (() => Reply) }[] = [];
  private standing: { match: Match; reply: Reply | (() => Reply) }[] = [];
  private capturedQueries: { sql: string; params: unknown[] }[] = [];
  expect(sqlSubstr: string, reply: Reply | (() => Reply)): void {
    this.queue.push({ match: (sql) => sql.includes(sqlSubstr), reply });
  }
  allow(sqlSubstr: string, reply: Reply | (() => Reply) = { rows: [] }): void {
    this.standing.push({ match: (sql) => sql.includes(sqlSubstr), reply });
  }
  async query(sql: string, params: unknown[] = []): Promise<Reply> {
    this.capturedQueries.push({ sql, params });
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].match(sql, params)) {
        const r = this.queue.splice(i, 1)[0].reply;
        const out = typeof r === 'function' ? r() : r;
        return { rowCount: out.rows.length, ...out };
      }
    }
    for (const s of this.standing) {
      if (s.match(sql, params)) {
        const out = typeof s.reply === 'function' ? s.reply() : s.reply;
        return { rowCount: out.rows.length, ...out };
      }
    }
    throw new Error(`FakePool: unexpected query\n  sql=${sql.replace(/\s+/g, ' ').slice(0, 200)}\n  params=${JSON.stringify(params)}`);
  }
  /** Captured queries for assertions (e.g. audit row content). */
  captured(): { sql: string; params: unknown[] }[] {
    return this.capturedQueries;
  }
}

interface BuildOpts {
  env?: Env;
  pool?: FakePool;
  registry?: SandboxSessionRegistry;
}

interface BuiltApp {
  app: FastifyInstance;
  pool: FakePool;
  registry: SandboxSessionRegistry;
  port: number;
  close: () => Promise<void>;
}

async function buildApp(opts: BuildOpts = {}): Promise<BuiltApp> {
  const env = opts.env ?? TEST_ENV;
  const pool = opts.pool ?? new FakePool();
  const registry =
    opts.registry ??
    new SandboxSessionRegistry({
      idleTimeoutSecs: env.SHELL_IDLE_TIMEOUT_SECS,
      sweepIntervalMs: 50,
    });
  // All tests in this file fire-and-forget audit; allow it.
  pool.allow('INSERT INTO audit_log');

  const app = Fastify({ logger: false });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: env.JWT_SECRET });
  await app.register(fastifyWebsocket);

  await app.register(
    islandRoutes({
      pool: pool as unknown as Pool,
      redis: {} as never,
      env,
      sandboxSessions: registry,
    }),
    { prefix: '/api/islands' },
  );

  // Mount the admin sandbox sub-route directly behind requireAdmin so we can
  // test it without spinning up the rest of /admin (which would pull in extra
  // schema dependencies we don't want here).
  await app.register(
    async (sub) => {
      sub.addHook('preHandler', requireAdmin(env));
      await sub.register(
        adminSandboxRoutes({ pool: pool as unknown as Pool, env, sandboxSessions: registry }),
        { prefix: '/sandbox' },
      );
    },
    { prefix: '/admin' },
  );

  await app.ready();
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address();
  if (typeof addr === 'string' || !addr) throw new Error('no port');
  const port = addr.port;

  return {
    app,
    pool,
    registry,
    port,
    close: async () => {
      registry.stop();
      await app.close();
    },
  };
}

function signToken(
  app: FastifyInstance,
  opts: { id: string; role?: 'pirate' | 'admin'; crew_id?: string | null; handle?: string },
): string {
  return (app as unknown as { jwt: { sign: (p: object, o?: object) => string } }).jwt.sign(
    {
      sub: opts.id,
      role: opts.role ?? 'pirate',
      crew_id: opts.crew_id ?? null,
      handle: opts.handle ?? 'tester',
      typ: 'access',
    },
    { expiresIn: '5m' },
  );
}

interface OpenShellResult {
  banner: { kind: string; text: string };
  out?: { kind: string; text: string; echo: string };
  /** Closes the underlying socket. The caller MUST call this. */
  close: () => Promise<void>;
}

/**
 * Open a WS shell, optionally send one line, collect the expected number of
 * frames, and KEEP the socket open until the caller invokes `close()`. This
 * lets isolation tests inspect the registry while sessions are still live.
 */
async function openShell(opts: {
  port: number;
  slug: string;
  token: string;
  send?: string;
}): Promise<OpenShellResult> {
  const { WebSocket } = await import('ws');
  const url = `ws://127.0.0.1:${opts.port}/api/islands/${opts.slug}/shell`;
  const messages: string[] = [];
  const need = opts.send !== undefined ? 2 : 1;

  // Attach the message listener BEFORE the socket opens so we don't miss the
  // banner frame that the WS handler sends synchronously on connect.
  const ws = new WebSocket(url, { headers: { authorization: `Bearer ${opts.token}` } });
  let resolveFrames: () => void = () => undefined;
  let rejectFrames: (err: Error) => void = () => undefined;
  const framesP = new Promise<void>((resolve, reject) => {
    resolveFrames = resolve;
    rejectFrames = reject;
  });
  ws.on('message', (data: Buffer) => {
    messages.push(data.toString('utf8'));
    if (messages.length >= need) resolveFrames();
  });
  ws.on('error', (err) => rejectFrames(err));

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('openShell handshake timed out')), 5000);
    ws.once('open', () => {
      clearTimeout(t);
      resolve();
    });
    ws.once('error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
  if (opts.send !== undefined) ws.send(opts.send);
  const framesTimeout = setTimeout(() => rejectFrames(new Error('openShell frames timed out')), 5000);
  try {
    await framesP;
  } finally {
    clearTimeout(framesTimeout);
  }

  const banner = JSON.parse(messages[0]) as { kind: string; text: string };
  const out =
    messages.length >= 2 ? (JSON.parse(messages[1]) as { kind: string; text: string; echo: string }) : undefined;
  return {
    banner,
    out,
    close: async () => {
      await new Promise<void>((resolve) => {
        ws.once('close', () => resolve());
        try { ws.close(); } catch { resolve(); }
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/*  1. Per-Crew isolation                                              */
/* ------------------------------------------------------------------ */
describe('WS shell — per-Crew isolation', () => {
  it('two crews on the same Island get distinct registry entries; output stays per-socket', async () => {
    const built = await buildApp();
    let a: OpenShellResult | undefined;
    let b: OpenShellResult | undefined;
    try {
      const tokA = signToken(built.app, { id: 'p-A', crew_id: 'crew-A', handle: 'crewA_pilot' });
      const tokB = signToken(built.app, { id: 'p-B', crew_id: 'crew-B', handle: 'crewB_pilot' });

      a = await openShell({ port: built.port, slug: 'drowned_admin', token: tokA, send: 'ls -la\n' });
      b = await openShell({ port: built.port, slug: 'drowned_admin', token: tokB, send: 'whoami\n' });

      // Each socket only sees its OWN echoed input — no bleed.
      expect(a.out?.echo).toBe('ls -la\n');
      expect(b.out?.echo).toBe('whoami\n');
      // Each banner addresses the right pirate.
      expect(a.banner.text).toMatch(/crewA_pilot/);
      expect(b.banner.text).toMatch(/crewB_pilot/);

      // Registry sees both entries, keyed distinctly. Sockets are still open.
      const list = built.registry.list();
      expect(list.length).toBe(2);
      const slugs = list.map((s) => s.island_slug).sort();
      expect(slugs).toEqual(['drowned_admin', 'drowned_admin']);
      const crewLabels = list.map((s) => s.crew_name).sort();
      expect(crewLabels).toEqual(['crewA_pilot', 'crewB_pilot']);
    } finally {
      if (a) await a.close();
      if (b) await b.close();
      await built.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  2. Idle timeout                                                    */
/* ------------------------------------------------------------------ */
describe('WS shell — idle timeout', () => {
  it('closes a session whose lastInputAt is older than the configured timeout', async () => {
    // Stand up a registry with a 1s timeout and a long sweep interval so the
    // manual sweep call is the only sweep — no race with the auto-sweeper.
    const reg = new SandboxSessionRegistry({
      idleTimeoutSecs: 1,
      sweepIntervalMs: 60_000,
    });
    try {
      let closerCalled = false;
      reg.open({
        islandSlug: 'desert_isle',
        crewId: 'crew-idle',
        crewName: 'lazy_pirate',
        pirateId: 'p-idle',
        closer: () => { closerCalled = true; },
      });
      expect(reg.size()).toBe(1);
      // Sweep BEFORE the idle window — should keep the entry.
      expect(reg.sweepIdle()).toBe(0);
      expect(reg.size()).toBe(1);
      // Wait past the 1s idle window, then sweep — entry must be evicted
      // and the closer must fire (so the WS handler force-closes the socket).
      await new Promise((r) => setTimeout(r, 1100));
      expect(reg.sweepIdle()).toBe(1);
      expect(reg.size()).toBe(0);
      expect(closerCalled).toBe(true);
    } finally {
      reg.stop();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  3 + 4. GET /admin/sandbox/sessions admin gating                    */
/* ------------------------------------------------------------------ */
describe('GET /admin/sandbox/sessions', () => {
  it('returns active sessions for an admin token', async () => {
    const built = await buildApp();
    try {
      // Seed a session directly in the registry — we don't need a real WS
      // for this case; we're testing the visibility surface.
      built.registry.open({
        islandSlug: 'kraken_cipher',
        crewId: 'crew-1',
        crewName: 'Black Pearl',
        pirateId: 'p-1',
        closer: () => undefined,
      });

      const adminTok = signToken(built.app, { id: 'admin-1', role: 'admin', handle: 'captain' });
      const res = await built.app.inject({
        method: 'GET',
        url: '/admin/sandbox/sessions',
        headers: { authorization: `Bearer ${adminTok}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.ok).toBe(true);
      expect(body.sessions).toHaveLength(1);
      expect(body.sessions[0]).toMatchObject({
        island_slug: 'kraken_cipher',
        crew_name: 'Black Pearl',
      });
      expect(typeof body.sessions[0].started_at).toBe('string');
      expect(typeof body.sessions[0].idle_seconds).toBe('number');
    } finally {
      await built.close();
    }
  });

  it('rejects non-admin token with 403', async () => {
    const built = await buildApp();
    try {
      const pirateTok = signToken(built.app, { id: 'p-1', role: 'pirate' });
      const res = await built.app.inject({
        method: 'GET',
        url: '/admin/sandbox/sessions',
        headers: { authorization: `Bearer ${pirateTok}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('ERR_NOT_ADMIN');
    } finally {
      await built.close();
    }
  });

  it('rejects unauthenticated request with 401', async () => {
    const built = await buildApp();
    try {
      const res = await built.app.inject({
        method: 'GET',
        url: '/admin/sandbox/sessions',
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().code).toBe('ERR_NO_AUTH');
    } finally {
      await built.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  5. Audit: session-start writes audit row                           */
/* ------------------------------------------------------------------ */
describe('WS shell — audit', () => {
  it('writes a sandbox.session.start audit row when a session opens', async () => {
    // Use a pool that captures inserts (allow() still satisfies them).
    const pool = new FakePool();
    const built = await buildApp({ pool });
    try {
      const tok = signToken(built.app, { id: 'p-audit', crew_id: 'crew-audit', handle: 'auditee' });
      await openShell({ port: built.port, slug: 'haunted_brig', token: tok });
      // Allow audit's async insert to land. The audit() call is fire-and-forget;
      // a single tick is enough since it's just a single await on pool.query.
      await new Promise((r) => setTimeout(r, 50));

      const inserts = pool.captured().filter(
        (q) => q.sql.includes('INSERT INTO audit_log') && q.params[1] === 'sandbox.session.start',
      );
      expect(inserts.length).toBe(1);
      expect(inserts[0].params[0]).toBe('p-audit');         // admin_pirate_id
      expect(inserts[0].params[1]).toBe('sandbox.session.start');
      expect(inserts[0].params[2]).toBe('haunted_brig');    // target_id (slug)
    } finally {
      await built.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  6. DELETE /admin/sandbox/sessions/:islandSlug/:crewId              */
/* ------------------------------------------------------------------ */
describe('DELETE /admin/sandbox/sessions/:islandSlug/:crewId', () => {
  it('admin can force-close an active session and the registry drops it', async () => {
    const built = await buildApp();
    try {
      let closerCalled = false;
      built.registry.open({
        islandSlug: 'kraken_cipher',
        crewId: 'crew-doom',
        crewName: 'Doomed Crew',
        pirateId: 'p-doom',
        closer: () => { closerCalled = true; },
      });
      expect(built.registry.size()).toBe(1);

      const adminTok = signToken(built.app, { id: 'admin-1', role: 'admin' });
      const res = await built.app.inject({
        method: 'DELETE',
        url: '/admin/sandbox/sessions/kraken_cipher/crew-doom',
        headers: { authorization: `Bearer ${adminTok}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);
      expect(closerCalled).toBe(true);
      expect(built.registry.size()).toBe(0);
    } finally {
      await built.close();
    }
  });

  it('returns 404 when the session is not in the registry', async () => {
    const built = await buildApp();
    try {
      const adminTok = signToken(built.app, { id: 'admin-1', role: 'admin' });
      const res = await built.app.inject({
        method: 'DELETE',
        url: '/admin/sandbox/sessions/nope_isle/no-crew',
        headers: { authorization: `Bearer ${adminTok}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe('ERR_NO_SESSION');
    } finally {
      await built.close();
    }
  });
});

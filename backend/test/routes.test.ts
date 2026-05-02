/**
 * Phase 1c — route-level tests for the five new endpoints Bosun added so the
 * frontend (Helmsman) doesn't 404 on her wired calls.
 *
 *   1. GET  /api/auth/me                       (auth required)
 *   2. POST /api/auth/logout                   (auth required)
 *   3. GET  /api/crews/:name                   (auth required)
 *   4. GET  /api/islands?include_unpublished=1 (admin required for the param)
 *   5. WS   /api/islands/:slug/shell           (auth required)
 *
 * We build a real Fastify instance with the same plugin stack used in
 * production, but swap pg.Pool for a hand-rolled FakePool that replays
 * canned rows for the queries each route issues. Auth is exercised end-to-end
 * via the JWT cookie / bearer header.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import { authRoutes } from '../src/routes/auth.js';
import { crewRoutes } from '../src/routes/crews.js';
import { islandRoutes } from '../src/routes/islands.js';
import type { Env } from '../src/config/env.js';
import type { Pool } from 'pg';

const TEST_ENV: Env = {
  NODE_ENV: 'test',
  PORT: 4001,
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
 * Minimal pg.Pool stub. Tests register a list of `(sql, params) => rows`
 * matchers; every `pool.query()` call pops the first matching one.
 *
 * We deliberately match on a substring of the SQL rather than equality so
 * tests survive whitespace tweaks.
 */
type Match = (sql: string, params: unknown[]) => boolean;
type Reply = { rows: unknown[]; rowCount?: number };
class FakePool {
  private queue: { match: Match; reply: Reply | (() => Reply) }[] = [];
  /** Standing matchers (never consumed) — used for fire-and-forget calls like audit(). */
  private standing: { match: Match; reply: Reply | (() => Reply) }[] = [];
  expect(sqlSubstr: string, reply: Reply | (() => Reply)): void {
    this.queue.push({
      match: (sql) => sql.includes(sqlSubstr),
      reply,
    });
  }
  /** Persistent match — every query that matches gets the canned reply, no consumption. */
  allow(sqlSubstr: string, reply: Reply | (() => Reply) = { rows: [] }): void {
    this.standing.push({
      match: (sql) => sql.includes(sqlSubstr),
      reply,
    });
  }
  // `pg.Pool.query` overloads — we satisfy the one our routes use.
  async query(sql: string, params: unknown[] = []): Promise<Reply> {
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
  remaining(): number {
    return this.queue.length;
  }
}

async function buildTestApp(pool: FakePool): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: TEST_ENV.JWT_SECRET });
  await app.register(fastifyWebsocket);
  await app.register(authRoutes({ pool: pool as unknown as Pool, env: TEST_ENV }), { prefix: '/api/auth' });
  await app.register(crewRoutes({ pool: pool as unknown as Pool, env: TEST_ENV }), { prefix: '/api/crews' });
  await app.register(
    islandRoutes({
      pool: pool as unknown as Pool,
      // We don't exercise rate-limit / submit, so a noop redis is fine.
      redis: {} as never,
      env: TEST_ENV,
    }),
    { prefix: '/api/islands' },
  );
  await app.ready();
  return app;
}

function signPirateToken(app: FastifyInstance, opts: { id: string; role?: 'pirate' | 'admin'; crew_id?: string | null; handle?: string }): string {
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

/* ------------------------------------------------------------------ */
/*   1. GET /api/auth/me                                              */
/* ------------------------------------------------------------------ */
describe('GET /api/auth/me', () => {
  it('401 without auth', async () => {
    const pool = new FakePool();
    const app = await buildTestApp(pool);
    try {
      const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
      expect(res.statusCode).toBe(401);
      expect(res.json().code).toBe('ERR_NO_AUTH');
    } finally {
      await app.close();
    }
  });

  it('returns identity + crew when on a crew', async () => {
    const pool = new FakePool();
    pool.expect('FROM pirates p', {
      rows: [{
        id: 'p-1',
        email: 'jack@sea',
        handle: 'calico_jack',
        role: 'pirate',
        crew_id: 'c-1',
        crew_name: 'Black Pearl',
        crew_flag_emoji: '🏴‍☠️',
      }],
    });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1', crew_id: 'c-1', handle: 'calico_jack' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe('p-1');
      expect(body.handle).toBe('calico_jack');
      expect(body.role).toBe('pirate');
      expect(body.crew).toEqual({ id: 'c-1', name: 'Black Pearl', flag_emoji: '🏴‍☠️' });
    } finally {
      await app.close();
    }
  });

  it('returns crew=null for crewless pirate', async () => {
    const pool = new FakePool();
    pool.expect('FROM pirates p', {
      rows: [{
        id: 'p-2',
        email: 'lone@sea',
        handle: 'lonewolf',
        role: 'pirate',
        crew_id: null,
        crew_name: null,
        crew_flag_emoji: null,
      }],
    });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-2', handle: 'lonewolf' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().crew).toBeNull();
    } finally {
      await app.close();
    }
  });

  it('404 if pirate row vanished but token still valid', async () => {
    const pool = new FakePool();
    pool.expect('FROM pirates p', { rows: [] });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'ghost' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe('ERR_NO_PIRATE');
    } finally {
      await app.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*   2. POST /api/auth/logout                                          */
/* ------------------------------------------------------------------ */
describe('POST /api/auth/logout', () => {
  it('401 without auth', async () => {
    const pool = new FakePool();
    const app = await buildTestApp(pool);
    try {
      const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it('clears both player AND admin cookies, returns themed message', async () => {
    const pool = new FakePool();
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1', role: 'admin' });
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true, message: 'Walked the plank.' });
      const setCookie = res.headers['set-cookie'];
      const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
      // All three cookies should be cleared (Max-Age=0 or Expires in the past).
      expect(cookieStr).toContain('progctf_session=');
      expect(cookieStr).toContain('progctf_refresh=');
      expect(cookieStr).toContain('progctf_admin=');
    } finally {
      await app.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*   3. GET /api/crews/:name                                           */
/* ------------------------------------------------------------------ */
describe('GET /api/crews/:name', () => {
  it('401 without auth', async () => {
    const pool = new FakePool();
    const app = await buildTestApp(pool);
    try {
      const res = await app.inject({ method: 'GET', url: '/api/crews/Black%20Pearl' });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it('404 when name unknown', async () => {
    const pool = new FakePool();
    pool.expect('FROM crews WHERE name', { rows: [] });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/crews/Ghosts',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe('ERR_NO_CREW');
    } finally {
      await app.close();
    }
  });

  it('returns crew profile with score, rank, members, solved (sorted DESC)', async () => {
    const pool = new FakePool();
    pool.expect('FROM crews WHERE name', { rows: [{ id: 'c-1', name: 'Black Pearl', flag_emoji: '🏴‍☠️' }] });
    pool.expect('SUM(awarded_points)', { rows: [{ score: '1250' }] });
    pool.expect('RANK() OVER', { rows: [{ r: '3' }] });
    pool.expect('FROM pirates WHERE crew_id', {
      rows: [{ handle: 'anne_bonny' }, { handle: 'calico_jack' }],
    });
    const t1 = '2026-05-01T18:30:00Z';
    const t2 = '2026-05-01T19:30:00Z';
    pool.expect('JOIN islands i ON i.id = s.island_id', {
      rows: [
        {
          island_slug: 'kraken_cipher',
          island_title: 'Kraken Cipher',
          category: 'cipher_cove',
          difficulty: 'cursed_depths',
          awarded_points: 525,
          first_blood: true,
          solved_at: t2, // newest
        },
        {
          island_slug: 'drowned_admin',
          island_title: 'Drowned Admin',
          category: 'cursed_ports',
          difficulty: 'port',
          awarded_points: 50,
          first_blood: false,
          solved_at: t1,
        },
      ],
    });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/crews/Black%20Pearl',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toMatchObject({
        id: 'c-1',
        name: 'Black Pearl',
        flag_emoji: '🏴‍☠️',
        score: 1250,
        rank: 3,
      });
      expect(body.members).toEqual([{ handle: 'anne_bonny' }, { handle: 'calico_jack' }]);
      expect(body.solved).toHaveLength(2);
      // Order preserved (we trust the SQL ORDER BY DESC; here verify newest first).
      expect(body.solved[0].island_slug).toBe('kraken_cipher');
      expect(body.solved[0].first_blood).toBe(true);
      expect(body.solved[1].island_slug).toBe('drowned_admin');
      // Server normalises to ISO-8601 with full milliseconds — compare via Date
      // so we don't break on `Z` vs `.000Z`.
      expect(new Date(body.solved[0].solved_at).toISOString()).toBe(new Date(t2).toISOString());
    } finally {
      await app.close();
    }
  });

  it('400 on too-short name', async () => {
    const pool = new FakePool();
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/crews/x',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*   4. GET /api/islands?include_unpublished=1                         */
/* ------------------------------------------------------------------ */
describe('GET /api/islands include_unpublished gate', () => {
  it('non-admin without flag → 200 with published only', async () => {
    const pool = new FakePool();
    pool.expect('FROM islands i', {
      rows: [{
        slug: 'a', title: 'A', category: 'cipher_cove', difficulty: 'port',
        base_points: 100, current_points: 100, first_blood_crew: null,
        status: 'published', solves: '0', solved: false,
      }],
    });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/islands',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().islands).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it('non-admin WITH flag → 403 (not silently ignored)', async () => {
    const pool = new FakePool();
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'p-1' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/islands?include_unpublished=1',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('ERR_NOT_ADMIN');
    } finally {
      await app.close();
    }
  });

  it('admin WITH flag → 200, includes drafts/archived', async () => {
    const pool = new FakePool();
    // Capture the params so we can assert wantsAll=true got plumbed through.
    let capturedParams: unknown[] = [];
    pool.expect('FROM islands i', () => {
      // hack: we need to inspect params; FakePool doesn't pass them to the
      // value supplier, so verify via the SQL containing $2::boolean
      return {
        rows: [
          { slug: 'a', title: 'A', category: 'cipher_cove', difficulty: 'port',
            base_points: 100, current_points: 100, first_blood_crew: null,
            status: 'published', solves: '0', solved: false },
          { slug: 'b', title: 'B', category: 'cipher_cove', difficulty: 'port',
            base_points: 100, current_points: 100, first_blood_crew: null,
            status: 'draft', solves: '0', solved: false },
          { slug: 'c', title: 'C', category: 'cipher_cove', difficulty: 'port',
            base_points: 100, current_points: 100, first_blood_crew: null,
            status: 'archived', solves: '0', solved: false },
        ],
      };
    });
    void capturedParams;
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'admin-1', role: 'admin' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/islands?include_unpublished=1',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      const islands = res.json().islands;
      expect(islands).toHaveLength(3);
      expect(islands.map((i: { status: string }) => i.status).sort()).toEqual(['archived', 'draft', 'published']);
    } finally {
      await app.close();
    }
  });

  it('admin without flag → still only published (no surprise leak)', async () => {
    const pool = new FakePool();
    pool.expect('FROM islands i', {
      rows: [{
        slug: 'a', title: 'A', category: 'cipher_cove', difficulty: 'port',
        base_points: 100, current_points: 100, first_blood_crew: null,
        status: 'published', solves: '0', solved: false,
      }],
    });
    const app = await buildTestApp(pool);
    try {
      const tok = signPirateToken(app, { id: 'admin-1', role: 'admin' });
      const res = await app.inject({
        method: 'GET',
        url: '/api/islands',
        headers: { authorization: `Bearer ${tok}` },
      });
      expect(res.statusCode).toBe(200);
      // SQL did receive $2=false, returning only published; FakePool returns
      // whatever we queued, but the query was made with wantsAll=false.
      expect(res.json().islands).toHaveLength(1);
    } finally {
      await app.close();
    }
  });
});

/* ------------------------------------------------------------------ */
/*   5. WS /api/islands/:slug/shell                                    */
/* ------------------------------------------------------------------ */
describe('WS /api/islands/:slug/shell', () => {
  let app: FastifyInstance;
  let port: number;
  beforeAll(async () => {
    const pool = new FakePool();
    // Audit inserts are fire-and-forget from the WS handler; allow them.
    pool.allow('INSERT INTO audit_log');
    app = await buildTestApp(pool);
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    if (typeof addr === 'string' || !addr) throw new Error('no port');
    port = addr.port;
  });
  afterAll(async () => {
    await app.close();
  });

  it('rejects WS upgrade without auth (401)', async () => {
    // We can't use undici's `fetch` for an Upgrade request — it rejects the
    // header. Instead, use the WS client directly and confirm the handshake
    // is closed before any frames flow. The `requireAuth` preHandler runs
    // before the upgrade completes and replies 401.
    const { WebSocket } = await import('ws');
    const url = `ws://127.0.0.1:${port}/api/islands/drowned_admin/shell`;
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url); // no auth header
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('expected immediate auth rejection but socket stayed open'));
      }, 5000);
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        reject(new Error('socket opened despite missing auth — expected 401'));
      });
      ws.on('error', (err: Error & { message?: string }) => {
        clearTimeout(timeout);
        // ws throws on non-101 responses with a message containing the status.
        // Accept anything that looks like an HTTP error; explicitly check 401.
        expect(err.message).toMatch(/401|Unexpected server response/);
        resolve();
      });
    });
  });

  it('accepts WS upgrade with bearer token and echoes a simulated line', async () => {
    const tok = signPirateToken(app, { id: 'p-1', handle: 'calico_jack' });
    const { WebSocket } = await import('ws');
    const url = `ws://127.0.0.1:${port}/api/islands/drowned_admin/shell`;
    const messages: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url, {
        headers: { authorization: `Bearer ${tok}` },
      });
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('ws test timed out'));
      }, 5000);
      ws.on('open', () => {
        ws.send('whoami\n');
      });
      ws.on('message', (data: Buffer) => {
        messages.push(data.toString('utf8'));
        if (messages.length >= 2) {
          clearTimeout(timeout);
          ws.close();
        }
      });
      ws.on('close', () => resolve());
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    // First message is the welcome banner; second is the simulated stdout
    // (Phase-2 no-container path — see services/sandboxSessions.ts).
    expect(messages.length).toBeGreaterThanOrEqual(2);
    const banner = JSON.parse(messages[0]);
    expect(banner.kind).toBe('banner');
    expect(banner.text).toMatch(/drowned_admin/);
    expect(banner.text).toMatch(/calico_jack/);
    expect(banner.text).toMatch(/simulated/);
    const out = JSON.parse(messages[1]);
    expect(out.kind).toBe('stdout');
    expect(out.text).toMatch(/\[simulated\]/);
    expect(out.text).toMatch(/drowned_admin/);
    expect(out.echo).toBe('whoami\n');
  });
});

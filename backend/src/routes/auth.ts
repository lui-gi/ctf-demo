import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import {
  signAccessToken,
  signRefreshToken,
  setSessionCookies,
  clearSessionCookies,
  AUTH_COOKIES,
  verifyRefreshToken,
} from '../auth/jwt.js';
import type { Env } from '../config/env.js';
import type { Pool } from 'pg';
import { requireAuth, type AuthedRequest } from './_auth.js';

interface AuthDeps {
  pool: Pool;
  env: Env;
}

const SignArticlesSchema = z.object({
  email: z.string().email().max(255),
  handle: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/, 'handle: alphanumerics, _ or - only'),
  password: z.string().min(8).max(256),
});

const BoardSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(256),
});

export function authRoutes(deps: AuthDeps): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    // Per-IP rate limit on auth (10/min per spec §10).
    const authRateLimit = {
      max: deps.env.AUTH_RATE_PER_MIN,
      timeWindow: '1 minute',
      keyGenerator: (req: { ip: string }) => `auth:${req.ip}`,
    };

    app.post(
      '/sign-articles',
      { config: { rateLimit: authRateLimit } },
      async (req, reply) => {
        const parsed = SignArticlesSchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.code(400).send({
            ok: false,
            code: 'ERR_BAD_INPUT',
            message: 'Yer Articles are smudged. Re-fill the form.',
            issues: parsed.error.issues,
          });
        }
        const { email, handle, password } = parsed.data;

        const existing = await deps.pool.query(
          `SELECT 1 FROM pirates WHERE email = $1 OR handle = $2 LIMIT 1`,
          [email.toLowerCase(), handle],
        );
        if ((existing.rowCount ?? 0) > 0) {
          return reply.code(409).send({
            ok: false,
            code: 'ERR_PIRATE_EXISTS',
            message: 'Another sailor already claimed that name or email.',
          });
        }

        const hash = await hashPassword(password, deps.env.ARGON2_PEPPER);
        const { rows } = await deps.pool.query<{ id: string; handle: string; role: 'pirate' | 'admin'; crew_id: string | null }>(
          `INSERT INTO pirates (email, handle, password_hash, role)
           VALUES ($1, $2, $3, 'pirate')
           RETURNING id, handle, role, crew_id`,
          [email.toLowerCase(), handle, hash],
        );
        const pirate = rows[0];

        // Auto-board after signing the Articles.
        const access = signAccessToken(app, deps.env, {
          id: pirate.id,
          role: pirate.role,
          crew_id: pirate.crew_id,
          handle: pirate.handle,
        });
        const refresh = signRefreshToken(app, deps.env, pirate.id);
        setSessionCookies(reply, deps.env, access, refresh, pirate.role === 'admin');

        return reply.code(201).send({
          ok: true,
          message: `Welcome aboard, ${pirate.handle}. Articles signed.`,
          pirate: { id: pirate.id, handle: pirate.handle, role: pirate.role, crew_id: pirate.crew_id },
        });
      },
    );

    app.post(
      '/board',
      { config: { rateLimit: authRateLimit } },
      async (req, reply) => {
        const parsed = BoardSchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.code(400).send({
            ok: false,
            code: 'ERR_BAD_INPUT',
            message: 'Boarding pass invalid.',
          });
        }
        const { email, password } = parsed.data;

        const { rows } = await deps.pool.query<{
          id: string;
          handle: string;
          password_hash: string;
          role: 'pirate' | 'admin';
          crew_id: string | null;
          banned_at: Date | null;
        }>(
          `SELECT id, handle, password_hash, role, crew_id, banned_at
             FROM pirates
             WHERE email = $1
             LIMIT 1`,
          [email.toLowerCase()],
        );

        // Always run a verify even if no row found, to keep timing consistent.
        const dummy = '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlkdW1teQ$' + 'A'.repeat(43);
        const target = rows[0]?.password_hash ?? dummy;
        const ok = await verifyPassword(target, password, deps.env.ARGON2_PEPPER);

        if (!ok || rows.length === 0) {
          return reply.code(401).send({
            ok: false,
            code: 'ERR_BAD_CREDENTIALS',
            message: 'Wrong name or password, sailor.',
          });
        }
        const pirate = rows[0];
        if (pirate.banned_at) {
          return reply.code(403).send({
            ok: false,
            code: 'ERR_BANNED',
            message: 'Yer name is on the brig list.',
          });
        }

        const access = signAccessToken(app, deps.env, {
          id: pirate.id,
          role: pirate.role,
          crew_id: pirate.crew_id,
          handle: pirate.handle,
        });
        const refresh = signRefreshToken(app, deps.env, pirate.id);
        setSessionCookies(reply, deps.env, access, refresh, pirate.role === 'admin');

        return reply.send({
          ok: true,
          message: `Boarded. Welcome back, ${pirate.handle}.`,
          pirate: { id: pirate.id, handle: pirate.handle, role: pirate.role, crew_id: pirate.crew_id },
        });
      },
    );

    app.post('/refresh', async (req, reply) => {
      const cookieJar = (req as unknown as { cookies: Record<string, string | undefined> }).cookies;
      const token = cookieJar[AUTH_COOKIES.REFRESH];
      if (!token) {
        return reply.code(401).send({ ok: false, code: 'ERR_NO_REFRESH', message: 'No refresh token.' });
      }
      let claims;
      try {
        claims = verifyRefreshToken(app, token);
      } catch {
        return reply.code(401).send({ ok: false, code: 'ERR_BAD_REFRESH', message: 'Refresh token invalid.' });
      }
      const { rows } = await deps.pool.query<{
        id: string;
        handle: string;
        role: 'pirate' | 'admin';
        crew_id: string | null;
        banned_at: Date | null;
      }>(
        `SELECT id, handle, role, crew_id, banned_at FROM pirates WHERE id = $1`,
        [claims.sub],
      );
      const pirate = rows[0];
      if (!pirate || pirate.banned_at) {
        return reply.code(401).send({ ok: false, code: 'ERR_BAD_REFRESH', message: 'Refresh denied.' });
      }
      const access = signAccessToken(app, deps.env, {
        id: pirate.id,
        role: pirate.role,
        crew_id: pirate.crew_id,
        handle: pirate.handle,
      });
      const refresh = signRefreshToken(app, deps.env, pirate.id);
      setSessionCookies(reply, deps.env, access, refresh, pirate.role === 'admin');
      return reply.send({ ok: true });
    });

    app.post('/disembark', async (_req, reply) => {
      clearSessionCookies(reply, deps.env);
      return reply.send({ ok: true, message: 'Disembarked.' });
    });

    /**
     * GET /api/auth/me — identity probe for the frontend.
     * Player JWT is httpOnly so the browser can't read it; this endpoint lets
     * the SPA discover who's logged in (and whether they're on a Crew yet).
     * Themed: returns the Pirate's identity + Crew colours.
     */
    app.get(
      '/me',
      { preHandler: requireAuth(deps.env) },
      async (req, reply) => {
        const r = req as AuthedRequest;
        const { rows } = await deps.pool.query<{
          id: string;
          email: string;
          handle: string;
          role: 'pirate' | 'admin';
          crew_id: string | null;
          crew_name: string | null;
          crew_flag_emoji: string | null;
        }>(
          `SELECT p.id, p.email, p.handle, p.role,
                  p.crew_id,
                  c.name       AS crew_name,
                  c.flag_emoji AS crew_flag_emoji
             FROM pirates p
             LEFT JOIN crews c ON c.id = p.crew_id
             WHERE p.id = $1
             LIMIT 1`,
          [r.user.id],
        );
        const me = rows[0];
        if (!me) {
          // JWT is valid but the Pirate has been scuttled from the DB.
          return reply.code(404).send({
            ok: false,
            code: 'ERR_NO_PIRATE',
            message: 'Yer name be off the manifest, sailor.',
          });
        }
        return reply.send({
          id: me.id,
          email: me.email,
          handle: me.handle,
          role: me.role,
          crew: me.crew_id
            ? {
                id: me.crew_id,
                name: me.crew_name,
                flag_emoji: me.crew_flag_emoji,
              }
            : null,
        });
      },
    );

    /**
     * POST /api/auth/logout — clears BOTH the player and admin cookies.
     * (We already had `/disembark` for legacy parity; `/logout` is the
     * frontend-friendly alias Helmsman wired her UI to call.)
     */
    app.post(
      '/logout',
      { preHandler: requireAuth(deps.env) },
      async (_req, reply) => {
        const base = { domain: deps.env.COOKIE_DOMAIN, path: '/' };
        reply.clearCookie(AUTH_COOKIES.ACCESS, base);
        reply.clearCookie(AUTH_COOKIES.REFRESH, base);
        reply.clearCookie(AUTH_COOKIES.ADMIN, base);
        return reply.send({ ok: true, message: 'Walked the plank.' });
      },
    );
  };

  return plugin;
}

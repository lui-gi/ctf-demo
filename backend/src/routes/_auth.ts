import type { FastifyReply, FastifyRequest } from 'fastify';
import { readAccessToken, verifyAccessToken, readAdminToken, type AccessClaims } from '../auth/jwt.js';
import type { Env } from '../config/env.js';

export interface AuthedUser {
  id: string;
  handle: string;
  role: 'pirate' | 'admin';
  crew_id: string | null;
}

export interface AuthedRequest extends FastifyRequest {
  user: AuthedUser;
}

/**
 * Pre-handler that enforces a valid pirate JWT (cookie or bearer).
 * Populates `req.user`.
 */
export function requireAuth(_env: Env) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const r = req as unknown as { cookies: Record<string, string | undefined>; headers: Record<string, string | undefined>; };
    const token = readAccessToken(r as unknown as Parameters<typeof readAccessToken>[0]);
    if (!token) {
      return reply.code(401).send({ ok: false, code: 'ERR_NO_AUTH', message: 'No JWT, no Voyage.' });
    }
    let claims: AccessClaims;
    try {
      claims = verifyAccessToken(req.server as unknown as Parameters<typeof verifyAccessToken>[0], token);
    } catch {
      return reply.code(401).send({ ok: false, code: 'ERR_BAD_AUTH', message: 'Yer token be rotten.' });
    }
    (req as AuthedRequest).user = {
      id: claims.sub,
      role: claims.role,
      crew_id: claims.crew_id,
      handle: claims.handle,
    };
  };
}

/**
 * Pre-handler that enforces admin role. Reads the dedicated admin cookie/bearer.
 * Per spec §4 + bosun brief: admin has its OWN role claim that is checked on every admin route.
 */
export function requireAdmin(_env: Env) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const r = req as unknown as { cookies: Record<string, string | undefined>; headers: Record<string, string | undefined>; };
    const token = readAdminToken(r as unknown as Parameters<typeof readAdminToken>[0]);
    if (!token) {
      return reply.code(401).send({ ok: false, code: 'ERR_NO_AUTH', message: 'No admin token.' });
    }
    let claims: AccessClaims;
    try {
      claims = verifyAccessToken(req.server as unknown as Parameters<typeof verifyAccessToken>[0], token);
    } catch {
      return reply.code(401).send({ ok: false, code: 'ERR_BAD_AUTH', message: 'Yer token be rotten.' });
    }
    if (claims.role !== 'admin') {
      return reply.code(403).send({ ok: false, code: 'ERR_NOT_ADMIN', message: 'Crew quarters only — admins past this point.' });
    }
    (req as AuthedRequest).user = {
      id: claims.sub,
      role: claims.role,
      crew_id: claims.crew_id,
      handle: claims.handle,
    };
  };
}

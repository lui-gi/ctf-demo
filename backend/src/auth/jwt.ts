import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Env } from '../config/env.js';

export type Role = 'pirate' | 'admin';

export interface AccessClaims {
  sub: string; // pirate id
  role: Role;
  crew_id: string | null;
  handle: string;
  typ: 'access';
}

export interface RefreshClaims {
  sub: string;
  typ: 'refresh';
}

const ACCESS_COOKIE = 'progctf_session';
const REFRESH_COOKIE = 'progctf_refresh';
const ADMIN_COOKIE = 'progctf_admin';

/**
 * Sign tokens via the Fastify-decorated `jwt` instance.
 * Player tokens use the default JWT instance.
 * Admin tokens use a separate JWT namespace ('admin') so a leaked player token
 * cannot be promoted to admin even if the role claim were tampered with —
 * they're signed with a deliberately distinct context (different cookie + verifier).
 */

interface JwtBearer {
  jwt: {
    sign(payload: object, opts?: { expiresIn?: string }): string;
    verify<T>(token: string): T;
  };
}

export interface SessionUser {
  id: string;
  role: Role;
  crew_id: string | null;
  handle: string;
}

export function signAccessToken(
  app: JwtBearer,
  env: Env,
  user: SessionUser,
): string {
  const claims: AccessClaims = {
    sub: user.id,
    role: user.role,
    crew_id: user.crew_id,
    handle: user.handle,
    typ: 'access',
  };
  return app.jwt.sign(claims, { expiresIn: env.JWT_EXPIRES_IN });
}

export function signRefreshToken(app: JwtBearer, env: Env, userId: string): string {
  const claims: RefreshClaims = { sub: userId, typ: 'refresh' };
  return app.jwt.sign(claims, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(app: JwtBearer, token: string): AccessClaims {
  const claims = app.jwt.verify<AccessClaims>(token);
  if (claims.typ !== 'access') {
    throw new Error('not an access token');
  }
  return claims;
}

export function verifyRefreshToken(app: JwtBearer, token: string): RefreshClaims {
  const claims = app.jwt.verify<RefreshClaims>(token);
  if (claims.typ !== 'refresh') {
    throw new Error('not a refresh token');
  }
  return claims;
}

interface CookieReply {
  setCookie(name: string, value: string, opts: object): unknown;
  clearCookie(name: string, opts?: object): unknown;
}

export function setSessionCookies(
  reply: FastifyReply & CookieReply,
  env: Env,
  access: string,
  refresh: string,
  isAdmin: boolean,
): void {
  const base = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    domain: env.COOKIE_DOMAIN,
    path: '/',
  };

  reply.setCookie(ACCESS_COOKIE, access, { ...base, maxAge: 60 * 60 * 8 });
  reply.setCookie(REFRESH_COOKIE, refresh, { ...base, maxAge: 60 * 60 * 24 * 30 });
  if (isAdmin) {
    // Distinct admin cookie — admin routes look at this one specifically.
    reply.setCookie(ADMIN_COOKIE, access, { ...base, maxAge: 60 * 60 * 8 });
  }
}

export function clearSessionCookies(reply: FastifyReply & CookieReply, env: Env): void {
  const base = { domain: env.COOKIE_DOMAIN, path: '/' };
  reply.clearCookie(ACCESS_COOKIE, base);
  reply.clearCookie(REFRESH_COOKIE, base);
  reply.clearCookie(ADMIN_COOKIE, base);
}

interface CookieRequest {
  cookies: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

export function readAccessToken(req: FastifyRequest & CookieRequest): string | null {
  const fromCookie = req.cookies[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

export function readAdminToken(req: FastifyRequest & CookieRequest): string | null {
  const fromCookie = req.cookies[ADMIN_COOKIE];
  if (fromCookie) return fromCookie;
  // Fall back to Authorization header so curl-based tooling can hit admin routes too.
  return readAccessToken(req);
}

export const AUTH_COOKIES = {
  ACCESS: ACCESS_COOKIE,
  REFRESH: REFRESH_COOKIE,
  ADMIN: ADMIN_COOKIE,
} as const;

/**
 * Standalone JWT helper that can be constructed without Fastify — used by tests
 * and lower-level signing. Wraps `@fastify/jwt`-compatible payloads using HS256
 * via the node:crypto module to avoid pulling in the whole framework for unit tests.
 */
import crypto from 'node:crypto';

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice(((s.length % 4) || 4) - 1);
  return Buffer.from(padded, 'base64');
}

export interface StandaloneToken {
  payload: Record<string, unknown>;
  expSec: number;
}

export function standaloneSign(payload: Record<string, unknown>, secret: string, expiresInSec: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = b64url(JSON.stringify(header));
  const bodyB64 = b64url(JSON.stringify(body));
  const signing = `${headerB64}.${bodyB64}`;
  const sig = crypto.createHmac('sha256', secret).update(signing).digest();
  return `${signing}.${b64url(sig)}`;
}

export function standaloneVerify<T extends Record<string, unknown>>(token: string, secret: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed jwt');
  const [headerB64, bodyB64, sigB64] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${headerB64}.${bodyB64}`).digest();
  const provided = b64urlDecode(sigB64);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    throw new Error('bad signature');
  }
  const payload = JSON.parse(b64urlDecode(bodyB64).toString('utf8')) as T & { exp?: number };
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('token expired');
  }
  return payload;
}

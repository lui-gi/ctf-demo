import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';
import type { Env } from '../../config/env.js';
import { audit } from '../../services/audit.js';
import type { SandboxSessionRegistry } from '../../services/sandboxSessions.js';

interface Deps {
  pool: Pool;
  env: Env;
  /**
   * Live shell-session registry — owned by server.ts and shared with
   * routes/islands.ts. Optional only because a couple of legacy test setups
   * register adminSandboxRoutes without the full server wiring; in production
   * server.ts always supplies it.
   */
  sandboxSessions?: SandboxSessionRegistry;
}

/**
 * Sandbox controller proxy. Calls Shipwright's sandbox controller HTTP API
 * (deployment-specific). Runs as an authenticated POST to:
 *   ${SANDBOX_CONTROLLER_URL}/sandbox/:id/rebuild
 * with bearer auth header SANDBOX_CONTROLLER_TOKEN.
 *
 * If the controller is unreachable we 502 — admins should know.
 *
 * Also exposes session-visibility endpoints (GET /sessions, DELETE
 * /sessions/:islandSlug/:crewId) backed by the in-process SandboxSessionRegistry
 * — see services/sandboxSessions.ts for the no-container design rationale.
 */
export function adminSandboxRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.post<{ Params: { id: string } }>('/:id/rebuild', async (req, reply) => {
      const url = `${deps.env.SANDBOX_CONTROLLER_URL.replace(/\/$/, '')}/sandbox/${encodeURIComponent(req.params.id)}/rebuild`;
      let upstreamStatus = 0;
      let upstreamBody: unknown = null;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'authorization': `Bearer ${deps.env.SANDBOX_CONTROLLER_TOKEN}`,
            'content-type': 'application/json',
          },
        });
        upstreamStatus = res.status;
        upstreamBody = await res.json().catch(() => null);
      } catch (err) {
        await audit(deps.pool, {
          adminPirateId: (req as unknown as { user: { id: string } }).user.id,
          action: 'sandbox.rebuild',
          targetId: req.params.id,
          payload: { error: (err as Error).message },
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        });
        return reply.code(502).send({
          ok: false,
          code: 'ERR_SANDBOX_DOWN',
          message: 'Shipwright controller unreachable.',
        });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'sandbox.rebuild',
        targetId: req.params.id,
        payload: { upstreamStatus },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.code(upstreamStatus < 400 ? 200 : 502).send({
        ok: upstreamStatus < 400,
        upstream: { status: upstreamStatus, body: upstreamBody },
      });
    });

    /**
     * GET /admin/sandbox/sessions — list active per-Crew shell sessions
     * across all Islands. Admin role gate is inherited from the /admin prefix
     * (requireAdmin). Returns idle_seconds computed at read time.
     */
    app.get('/sessions', async (req, reply) => {
      const sessions = deps.sandboxSessions?.list() ?? [];
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'sandbox.sessions.list',
        targetId: null,
        payload: { count: sessions.length },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, sessions });
    });

    /**
     * DELETE /admin/sandbox/sessions/:islandSlug/:crewId — forcibly close a
     * session (e.g. abuse, stuck client). The registry calls the WS closer
     * which sends a 1000 close frame to the player.
     */
    app.delete<{ Params: { islandSlug: string; crewId: string } }>(
      '/sessions/:islandSlug/:crewId',
      async (req, reply) => {
        const { islandSlug, crewId } = req.params;
        const closed = deps.sandboxSessions?.close(islandSlug, crewId) ?? false;
        await audit(deps.pool, {
          adminPirateId: (req as unknown as { user: { id: string } }).user.id,
          action: 'sandbox.sessions.close',
          targetId: `${islandSlug}/${crewId}`,
          payload: { closed },
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        });
        if (!closed) {
          return reply.code(404).send({ ok: false, code: 'ERR_NO_SESSION', message: 'No such active session.' });
        }
        return reply.send({ ok: true, message: 'Session keelhauled.' });
      },
    );
  };
}

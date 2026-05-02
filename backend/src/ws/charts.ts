import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';
import { getTop20Cached } from '../services/charts.js';

export interface SolveEvent {
  crewId: string;
  crewName: string;
  islandSlug: string;
  islandTitle: string;
  awarded: number;
  firstBlood: boolean;
}

export interface WSBus {
  broadcastSolve: (ev: SolveEvent) => void;
  broadcastIslandStatus: (ev: { slug: string; status: 'published' | 'archived' | 'draft' }) => void;
  broadcastVoyageState: (ev: { frozen: boolean }) => void;
  emitChartsSnapshot: (snapshot: unknown) => void;
}

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
  bus: WSBus;
}

/**
 * Push a fresh top-20 snapshot every CHARTS_CACHE_TTL seconds.
 * Returns a function that stops the broadcaster.
 */
export function startChartsBroadcaster(deps: Deps): () => void {
  const intervalMs = Math.max(1000, deps.env.CHARTS_CACHE_TTL * 1000);
  const handle = setInterval(async () => {
    try {
      const snapshot = await getTop20Cached(deps.pool, deps.redis, deps.env);
      deps.bus.emitChartsSnapshot(snapshot);
    } catch (err) {
      console.error('[ws/charts] broadcast failed', err);
    }
  }, intervalMs);
  return () => clearInterval(handle);
}

let solveListenerAttached = false;
/**
 * Wire up the callback that the validator service calls on every correct solve.
 * The actual `onCorrect` plumbing lives in routes/islands.ts which receives the bus.
 * This function exists so server.ts can pass the bus around symmetrically.
 */
export function attachSolveBroadcasts(_bus: WSBus): void {
  // Placeholder so the bus is "owned" by this module — the real wiring is in server.ts
  // which passes deps.bus.broadcastSolve into the validator's onCorrect.
  void _bus;
  if (solveListenerAttached) return;
  solveListenerAttached = true;
}

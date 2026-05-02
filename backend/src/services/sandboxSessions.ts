/**
 * Sandbox session ledger — Phase-2 in-process implementation.
 *
 * NO-CONTAINER PATH (current): Docker is not yet wired, so the WS shell route
 * does NOT spawn or attach to per-Crew containers. Instead this module keeps a
 * lightweight in-process registry of who is "in" which Island shell, mirrors
 * each session into Redis under `shell:{islandSlug}:{crewId}` for cross-process
 * admin visibility, and enforces an idle timeout. Player input is recorded
 * (last-input-at) and echoed back in a CLEARLY-MARKED simulated prompt — it is
 * NEVER executed in any shell.
 *
 * Phase-4 staging will replace the no-op exec layer with a real Shipwright
 * sandbox controller call (per spec §9). Until then, admins can audit who is
 * holding sessions open and force-close them via the admin sandbox API.
 *
 * Per-Crew isolation: a session is keyed by (islandSlug, crewId). Two crews on
 * the same Island get distinct registry entries; their input/output never cross
 * because each WebSocket has its own send() bound to its own socket instance.
 *
 * Idle timeout: configurable via env (SHELL_IDLE_TIMEOUT_SECS, default 300s).
 * The registry runs a single setInterval sweeper that closes sessions whose
 * `lastInputAt` is older than the timeout. Sweeper interval defaults to 5s but
 * can be overridden for tests.
 */

import type { Redis } from 'ioredis';

export interface SessionInfo {
  islandSlug: string;
  crewId: string;
  crewName: string;
  pirateId: string;
  startedAt: number;       // epoch ms
  lastInputAt: number;     // epoch ms
}

export interface SessionView {
  island_slug: string;
  crew_name: string;
  started_at: string;   // ISO
  last_input_at: string; // ISO
  idle_seconds: number;
}

export interface SessionRegistryOptions {
  redis?: Redis | null;
  /** Idle timeout in seconds. Default 300 (5 min). */
  idleTimeoutSecs?: number;
  /** Sweep interval in ms. Default 5000. */
  sweepIntervalMs?: number;
  /** Logger for sweeper failures (Fastify-style). */
  log?: { error?: (...args: unknown[]) => void };
}

interface InternalEntry extends SessionInfo {
  closer: () => void;
}

const REDIS_KEY_PREFIX = 'shell';

function redisKey(islandSlug: string, crewId: string): string {
  return `${REDIS_KEY_PREFIX}:${islandSlug}:${crewId}`;
}

export class SandboxSessionRegistry {
  private readonly entries = new Map<string, InternalEntry>();
  private readonly redis: Redis | null;
  private readonly idleTimeoutSecs: number;
  private readonly log?: SessionRegistryOptions['log'];
  private sweeper: NodeJS.Timeout | null = null;

  constructor(opts: SessionRegistryOptions = {}) {
    this.redis = opts.redis ?? null;
    this.idleTimeoutSecs = Math.max(1, opts.idleTimeoutSecs ?? 300);
    this.log = opts.log;
    const sweepMs = Math.max(50, opts.sweepIntervalMs ?? 5000);
    this.sweeper = setInterval(() => {
      try {
        this.sweepIdle();
      } catch (err) {
        this.log?.error?.({ err }, 'sandbox-sessions sweep failed');
      }
    }, sweepMs);
    // Don't keep the event loop alive just for the sweeper.
    if (typeof this.sweeper.unref === 'function') this.sweeper.unref();
  }

  /** Stop the sweeper. Tests should call this in afterAll. */
  stop(): void {
    if (this.sweeper) {
      clearInterval(this.sweeper);
      this.sweeper = null;
    }
  }

  /** Idle timeout currently in effect (seconds). */
  get idleTimeout(): number {
    return this.idleTimeoutSecs;
  }

  /**
   * Register a freshly-opened WS session. Replaces any prior entry under the
   * same (islandSlug, crewId) — the new socket wins; the old one is force-closed.
   * Returns a handle the WS handler uses to record input and to deregister on close.
   */
  open(args: {
    islandSlug: string;
    crewId: string;
    crewName: string;
    pirateId: string;
    closer: () => void;
  }): { touch: () => void; close: (reason?: string) => void } {
    const key = redisKey(args.islandSlug, args.crewId);
    // Close prior session if any (per-Crew isolation: only one live socket per
    // crew per Island; a second connection from the same Crew supersedes).
    const prior = this.entries.get(key);
    if (prior) {
      try { prior.closer(); } catch { /* socket may already be dead */ }
      this.entries.delete(key);
    }
    const now = Date.now();
    const entry: InternalEntry = {
      islandSlug: args.islandSlug,
      crewId: args.crewId,
      crewName: args.crewName,
      pirateId: args.pirateId,
      startedAt: now,
      lastInputAt: now,
      closer: args.closer,
    };
    this.entries.set(key, entry);
    void this.writeRedis(entry);
    return {
      touch: () => this.touch(args.islandSlug, args.crewId),
      close: () => this.close(args.islandSlug, args.crewId),
    };
  }

  /** Bump `lastInputAt` on player input. */
  touch(islandSlug: string, crewId: string): void {
    const key = redisKey(islandSlug, crewId);
    const entry = this.entries.get(key);
    if (!entry) return;
    entry.lastInputAt = Date.now();
    void this.writeRedis(entry);
  }

  /** Remove an entry without invoking the socket closer (call on socket close). */
  drop(islandSlug: string, crewId: string): void {
    const key = redisKey(islandSlug, crewId);
    if (this.entries.delete(key)) {
      void this.deleteRedis(key);
    }
  }

  /** Force-close: invoke the socket closer AND drop the entry. */
  close(islandSlug: string, crewId: string): boolean {
    const key = redisKey(islandSlug, crewId);
    const entry = this.entries.get(key);
    if (!entry) return false;
    try { entry.closer(); } catch { /* socket may already be dead */ }
    this.entries.delete(key);
    void this.deleteRedis(key);
    return true;
  }

  /** All currently-tracked sessions, sorted by start time ascending. */
  list(): SessionView[] {
    const now = Date.now();
    const out: SessionView[] = [];
    for (const e of this.entries.values()) {
      out.push({
        island_slug: e.islandSlug,
        crew_name: e.crewName,
        started_at: new Date(e.startedAt).toISOString(),
        last_input_at: new Date(e.lastInputAt).toISOString(),
        idle_seconds: Math.floor((now - e.lastInputAt) / 1000),
      });
    }
    out.sort((a, b) => a.started_at.localeCompare(b.started_at));
    return out;
  }

  /** Test/admin hook: how many sessions are tracked right now. */
  size(): number {
    return this.entries.size;
  }

  /** Run one idle sweep — exposed for deterministic tests. */
  sweepIdle(): number {
    const cutoff = Date.now() - this.idleTimeoutSecs * 1000;
    let closed = 0;
    for (const [key, entry] of this.entries) {
      if (entry.lastInputAt <= cutoff) {
        try { entry.closer(); } catch { /* socket may already be dead */ }
        this.entries.delete(key);
        void this.deleteRedis(key);
        closed++;
      }
    }
    return closed;
  }

  private async writeRedis(entry: InternalEntry): Promise<void> {
    if (!this.redis) return;
    try {
      const key = redisKey(entry.islandSlug, entry.crewId);
      const payload = JSON.stringify({
        island_slug: entry.islandSlug,
        crew_id: entry.crewId,
        crew_name: entry.crewName,
        pirate_id: entry.pirateId,
        started_at: entry.startedAt,
        last_input_at: entry.lastInputAt,
      });
      // TTL = 2× idle timeout so a missed sweep still expires the record.
      await this.redis.set(key, payload, 'EX', this.idleTimeoutSecs * 2);
    } catch (err) {
      this.log?.error?.({ err }, 'sandbox-sessions redis write failed');
    }
  }

  private async deleteRedis(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (err) {
      this.log?.error?.({ err }, 'sandbox-sessions redis delete failed');
    }
  }
}

import { Pool, type PoolConfig } from 'pg';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.js';

let pgPool: Pool | null = null;
let redis: Redis | null = null;

export function getPool(env: Env): Pool {
  if (pgPool) return pgPool;
  const config: PoolConfig = {
    connectionString: env.DB_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
  pgPool = new Pool(config);
  pgPool.on('error', (err) => {
    console.error('[pg] idle client error', err);
  });
  return pgPool;
}

export function getRedis(env: Env): Redis {
  if (redis) return redis;
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  client.on('error', (err) => {
    console.error('[redis] error', err);
  });
  redis = client;
  return client;
}

export async function closeAll(): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if (pgPool) {
    tasks.push(pgPool.end().catch((e) => console.error('[pg] close error', e)));
    pgPool = null;
  }
  if (redis) {
    tasks.push(redis.quit().catch((e) => console.error('[redis] close error', e)));
    redis = null;
  }
  await Promise.all(tasks);
}

/** Reset internal singletons — for tests that swap clients. */
export function _resetClients(): void {
  pgPool = null;
  redis = null;
}

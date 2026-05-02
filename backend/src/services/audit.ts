import type { Pool } from 'pg';

export interface AuditEntry {
  adminPirateId: string | null;
  action: string;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Append an entry to the admin audit log. Should be called from EVERY admin mutation.
 * Failures are swallowed to a console.error — we do NOT want a logging failure to block
 * the underlying admin op, but we want to scream about it in the console.
 */
export async function audit(pool: Pool, entry: AuditEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (admin_pirate_id, action, target_id, payload_json, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.adminPirateId,
        entry.action,
        entry.targetId ?? null,
        entry.payload ? JSON.stringify(entry.payload) : null,
        entry.ip ?? null,
        entry.userAgent ?? null,
      ],
    );
  } catch (err) {
    console.error('[audit] failed to write entry', { entry, err });
  }
}

#!/usr/bin/env node
/**
 * progctf — promote a Pirate to admin role.
 *
 * Single-purpose ops helper for the local dev stack. Connects with the same
 * DB_URL that the Fastify backend uses (read from env, then a sensible
 * docker-compose default if unset) and flips `pirates.role` to `'admin'` for
 * the email passed on the command line.
 *
 * Usage:
 *   node scripts/promote-admin.mjs <email>
 *   pnpm promote-admin <email>      # via package.json scripts entry
 *
 * Exit codes:
 *   0 — promoted (or already admin)
 *   1 — bad usage / no such pirate / DB unreachable
 *
 * Why this script and not a backend route? An admin-promotion endpoint is the
 * worst kind of footgun (open the route once and somebody, somewhere, leaves
 * it on in prod). Promotion is a side-channel by design — psql or this tiny
 * script. The script keeps the canonical SQL in one place and prints the same
 * confirmation line that the runbook documents.
 */
import { Client } from 'pg';

const email = process.argv[2];
if (!email || !email.includes('@')) {
  console.error('usage: node scripts/promote-admin.mjs <email>');
  process.exit(1);
}

const connectionString =
  process.env.DB_URL ??
  // Matches docker-compose dev defaults — adjust if your compose changes.
  'postgres://progctf:devpassword@localhost:5433/progctf';

const client = new Client({ connectionString });

try {
  await client.connect();
  const { rows } = await client.query(
    `UPDATE pirates
        SET role = 'admin'
      WHERE lower(email) = lower($1)
      RETURNING id, email, handle, role`,
    [email],
  );
  if (rows.length === 0) {
    console.error(`No Pirate found with email '${email}'. Sign Articles first, then re-run.`);
    process.exit(1);
  }
  const p = rows[0];
  console.log(`Promoted: ${p.handle} <${p.email}> id=${p.id} role=${p.role}`);
  console.log('Now log out and log back in so the admin cookie is set on this session.');
} catch (err) {
  console.error('promote-admin failed:', err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}

#!/usr/bin/env node
/**
 * progctf — seed the 30 Phase-1 Islands into Postgres.
 *
 * Reads each `challenges/<category>/<tier>/<slug>/spec.yaml` plus the sibling
 * `flag.txt`, hashes the canonical flag with argon2id (pepper = ARGON2_PEPPER
 * env var, matching the running backend), and upserts a row into the
 * `islands` table.
 *
 * Re-runnable: ON CONFLICT (slug) DO UPDATE so reseeds don't duplicate. The
 * `flag_hash` is rotated on every run (argon2 salt is random) — that's fine,
 * verify still works because argon2 stores the salt inside the encoded hash.
 *
 * Usage:
 *   pnpm seed:islands
 *   node scripts/seed-islands.mjs
 *
 * Env:
 *   DB_URL          — postgres connection string (default: docker compose dev)
 *   ARGON2_PEPPER   — must match the backend's pepper so flag verify works
 *
 * No third-party YAML dependency: each spec.yaml in this repo uses only
 * top-level scalar fields we care about (slug, title, category, difficulty),
 * so a 30-line hand-rolled scanner suffices.
 */
import { Client } from 'pg';
import argon2 from 'argon2';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');
const CHALLENGES_DIR = join(REPO_ROOT, 'challenges');

const FLAG_REGEX = /^progctf\{[a-z0-9_]+\}$/;

// argon2id params for FLAG hashing — must match backend/src/services/validator.ts
// (FLAG_ARGON_OPTS). Any drift here means submitted flags fail to verify.
const FLAG_ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 4,
};

const TIER_BASE_POINTS = {
  port: 100,
  open_sea: 200,
  cursed_depths: 400,
};

const VALID_CATEGORIES = new Set([
  'cursed_ports',
  'cipher_cove',
  'shipwrights_forge',
  'lighthouse',
  'crows_nest',
  'hidden_cargo',
  'keymaster',
]);
const VALID_DIFFICULTIES = new Set(['port', 'open_sea', 'cursed_depths']);

/**
 * Minimal YAML-ish line scanner. Reads top-level `key: value` pairs only,
 * stripping surrounding quotes. We only need slug/title/category/difficulty,
 * all of which are emitted as top-level scalars in every spec.yaml in the
 * repo. Indented (nested) keys are skipped, as are comments and blanks.
 */
function parseTopLevel(yaml) {
  const out = {};
  for (const rawLine of yaml.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;
    // top-level keys have NO leading whitespace
    if (/^\s/.test(line)) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    let val = rawVal.trim();
    // strip line-ending comments outside quotes (best-effort)
    if (!val.startsWith('"') && !val.startsWith("'")) {
      const hash = val.indexOf(' #');
      if (hash >= 0) val = val.slice(0, hash).trim();
    }
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === '' || val === '|' || val === '>' || val === '|+' || val === '|-' || val === '>+' || val === '>-') {
      continue; // block scalars (multiline body) — we don't need them here
    }
    out[key] = val;
  }
  return out;
}

async function* walkSpecs() {
  const categories = await readdir(CHALLENGES_DIR, { withFileTypes: true });
  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    if (!VALID_CATEGORIES.has(cat.name)) continue;
    const catDir = join(CHALLENGES_DIR, cat.name);
    const tiers = await readdir(catDir, { withFileTypes: true });
    for (const tier of tiers) {
      if (!tier.isDirectory()) continue;
      if (!VALID_DIFFICULTIES.has(tier.name)) continue;
      const tierDir = join(catDir, tier.name);
      const slugs = await readdir(tierDir, { withFileTypes: true });
      for (const s of slugs) {
        if (!s.isDirectory()) continue;
        const specPath = join(tierDir, s.name, 'spec.yaml');
        const flagPath = join(tierDir, s.name, 'flag.txt');
        try {
          await stat(specPath);
        } catch {
          continue; // not a challenge dir
        }
        yield {
          dirCategory: cat.name,
          dirDifficulty: tier.name,
          dirSlug: s.name,
          specPath,
          flagPath,
        };
      }
    }
  }
}

function describeIsland(spec, fallback) {
  const title = spec.title || fallback.title;
  return [
    `# ${title}`,
    '',
    `Category: **${fallback.category}** · Difficulty: **${fallback.difficulty}**.`,
    '',
    'Treasure awaits the careful hand. See the Whispers below if the seas trouble ye.',
  ].join('\n');
}

async function readFlag(flagPath, slug) {
  try {
    const raw = (await readFile(flagPath, 'utf8')).trim();
    if (FLAG_REGEX.test(raw)) return raw;
    console.warn(`[warn] ${slug}: flag.txt contents don't match FLAG_REGEX — using placeholder`);
  } catch {
    console.warn(`[warn] ${slug}: no flag.txt — using placeholder`);
  }
  return `progctf{placeholder_${slug}}`;
}

async function main() {
  const connectionString =
    process.env.DB_URL ?? 'postgres://progctf:devpassword@localhost:5433/progctf';
  const pepper = process.env.ARGON2_PEPPER ?? 'dev-argon2-pepper-not-for-prod-use';

  const client = new Client({ connectionString });
  await client.connect();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const distribution = {};

  for await (const entry of walkSpecs()) {
    const yaml = await readFile(entry.specPath, 'utf8');
    const spec = parseTopLevel(yaml);

    const slug = spec.slug || entry.dirSlug;
    // Trust the directory layout for category/difficulty — the spec.yaml
    // values must agree, but the directory is the source of truth so a
    // mistyped spec.yaml never lands a row in the wrong cluster.
    const category = entry.dirCategory;
    const difficulty = entry.dirDifficulty;
    const title = spec.title || slug.replace(/_/g, ' ');
    const basePoints = TIER_BASE_POINTS[difficulty];
    const description = describeIsland(spec, { title, category, difficulty });

    const flag = await readFlag(entry.flagPath, slug);
    const flagHash = await argon2.hash(flag + pepper, FLAG_ARGON_OPTS);

    const result = await client.query(
      `INSERT INTO islands
         (slug, title, category, difficulty, description_md,
          base_points, current_points, flag_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'published')
       ON CONFLICT (slug) DO UPDATE SET
         title          = EXCLUDED.title,
         category       = EXCLUDED.category,
         difficulty     = EXCLUDED.difficulty,
         description_md = EXCLUDED.description_md,
         base_points    = EXCLUDED.base_points,
         flag_hash      = EXCLUDED.flag_hash,
         status         = EXCLUDED.status
       RETURNING (xmax = 0) AS inserted`,
      [slug, title, category, difficulty, description, basePoints, flagHash],
    );
    if (result.rows[0]?.inserted) inserted += 1;
    else updated += 1;

    distribution[difficulty] = (distribution[difficulty] ?? 0) + 1;
    process.stdout.write(`  · ${category}/${difficulty}/${slug} — ${title}\n`);
  }

  const { rows: countRows } = await client.query(
    `SELECT difficulty, COUNT(*)::int AS n FROM islands GROUP BY 1 ORDER BY 1`,
  );

  console.log('');
  console.log(`Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  console.log('Distribution from this run:');
  for (const [k, v] of Object.entries(distribution)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log('Final island counts in DB:');
  for (const r of countRows) {
    console.log(`  ${r.difficulty}: ${r.n}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error('seed-islands failed:', err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});

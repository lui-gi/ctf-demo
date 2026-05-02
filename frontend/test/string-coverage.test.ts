import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strings } from '@/theme/strings';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * String coverage test.
 *
 * Goal: catch hardcoded English copy in components. Components must pull
 * user-facing strings from `theme/strings.ts`.
 *
 * Strategy:
 *   1. Walk `src/` for `.tsx` files (skip `theme/`, `lib/markdown.tsx`,
 *      and the strings file itself).
 *   2. Extract JSX text nodes — i.e. text that sits between `>` and `<`
 *      that isn't a `{...}` expression.
 *   3. Allow short tokens (single words/punctuation), aria attributes,
 *      and tokens explicitly registered in `ALLOWED`.
 *   4. Anything else is flagged.
 */

const SRC = join(__dirname, '..', 'src');

const SKIP_FILES = new Set<string>([
  // strings.ts is the source of truth
  join(SRC, 'theme', 'strings.ts'),
  // markdown utility — its body contains markdown-fence sigils that confuse
  // the JSX-text heuristic.
  join(SRC, 'lib', 'markdown.tsx'),
]);
const SKIP_DIRS = new Set<string>([
  join(SRC, 'theme'),
]);

// Tokens explicitly allowed inline (pirate-themed brand fragments,
// simple unicode glyphs, single-word labels that are not user-facing copy).
const ALLOWED = new Set<string>([
  '⚓',
  '×',
  '←',
  '$',
  '·',
  '—',
  '?',
  ':',
  '#',
  '/',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (SKIP_DIRS.has(p)) continue;
      walk(p, out);
    } else if (extname(p) === '.tsx') {
      if (SKIP_FILES.has(p)) continue;
      out.push(p);
    }
  }
  return out;
}

// Extract literal text appearing as JSX children between `>` and `<`,
// skipping anything containing `{` (a JS expression).
function extractJsxText(source: string): string[] {
  const out: string[] = [];
  // Naive but effective for the team's component style.
  const re = />([^<>{}\n][^<>{}\n]*)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const raw = m[1].trim();
    if (raw.length === 0) continue;
    out.push(raw);
  }
  return out;
}

// Common TS type-keywords that the JSX-text regex sometimes captures
// from arrow-function signatures like `): void | Promise<void> => ...`.
const TS_TYPE_KEYWORDS = new Set([
  'void', 'null', 'undefined', 'boolean', 'number', 'string',
  'never', 'any', 'unknown', 'Promise', 'Record', 'Array',
]);

function looksLikeTsTypeUnion(text: string): boolean {
  // Pattern: `keyword | OtherType` or `OtherType | keyword`.
  if (!text.includes('|')) return false;
  const parts = text.split('|').map((p) => p.trim());
  return parts.some((p) => TS_TYPE_KEYWORDS.has(p));
}

function isLikelyUserCopy(text: string): boolean {
  if (ALLOWED.has(text)) return false;
  // Single short token without spaces — usually punctuation or symbol
  if (text.length <= 2) return false;
  // Numbers / variables look-alikes
  if (/^[\d\s.,:;_-]+$/.test(text)) return false;
  // Allow content that is purely punctuation / symbols
  if (!/[a-z]/i.test(text)) return false;
  // Filter TS function-signature fragments leaked by the JSX-text regex.
  if (looksLikeTsTypeUnion(text)) return false;
  // Sentence-shaped strings (>= 2 words OR ends with sentence-ending punctuation)
  const wordCount = text.split(/\s+/).length;
  return wordCount >= 2 || /[.!?…]$/.test(text);
}

describe('strings coverage', () => {
  it('every UI string in components is also referenced from theme/strings.ts', () => {
    const allString = JSON.stringify(strings);
    const files = walk(SRC);
    const offenders: { file: string; text: string }[] = [];

    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      const texts = extractJsxText(src);
      for (const t of texts) {
        if (!isLikelyUserCopy(t)) continue;
        // If the offending text matches a substring inside the strings table
        // verbatim, it's allowed (e.g. label split onto multiple lines).
        if (allString.includes(t)) continue;
        offenders.push({ file: f.replace(SRC, ''), text: t });
      }
    }

    if (offenders.length > 0) {
      const formatted = offenders
        .slice(0, 30)
        .map((o) => `  ${o.file}: ${JSON.stringify(o.text)}`)
        .join('\n');
      throw new Error(
        `Hardcoded UI copy found (${offenders.length}). Move these into theme/strings.ts:\n${formatted}`,
      );
    }
    expect(offenders).toEqual([]);
  });

  it('strings table contains the load-bearing copy after the vocabulary pivot', () => {
    // Chrome verbs went plain (vocabulary pivot 2026-05-02).
    expect(strings.nav.logout).toBe('Logout');
    expect(strings.auth.signArticlesSubmit).toBe('Sign Up');
    expect(strings.auth.boardSubmit).toBe('Login');
    // User-locked: Submit Flag / Show Hint stay plain in chrome.
    expect(strings.island.submitButton).toBe('Submit Flag');
    // Narrative copy stays themed.
    expect(strings.island.wrong).toBe("That ain't no Treasure, sailor.");
    expect(strings.island.correct(50, 'Black Pearl')).toBe(
      'Aye! Treasure secured. +50 to Black Pearl.',
    );
    expect(strings.island.cooldown(7)).toBe('The cannons are reloading… 7s');
    // Whisper button verb is "Show Hint" (locked); the mechanic stays Whispers.
    expect(strings.island.revealWhisper(10)).toBe('Show Hint (-10 pts)');
    expect(strings.charts.empty).toBe('The Charts are blank. No Crew has set sail.');
    expect(strings.charts.frozenBanner).toBe(
      '⚓ The Voyage is frozen. No more Treasures may be claimed.',
    );
    expect(strings.charts.firstBlood('Sea of Salt', 'Black Pearl')).toBe(
      '🩸 First blood on Sea of Salt! Black Pearl draws the line.',
    );
    expect(strings.common.notFound).toBe("These waters aren't on any map.");
    expect(strings.common.loading).toBe('Charting course…');
    // Difficulty mapping for DifficultyPill — themed + plain.
    expect(strings.voyage.difficultyPlainLabels.port).toBe('Easy');
    expect(strings.voyage.difficultyPlainLabels.open_sea).toBe('Medium');
    expect(strings.voyage.difficultyPlainLabels.cursed_depths).toBe('Hard');
    expect(strings.voyage.categoryPlainNames.cursed_ports).toBe('Web Exploitation');
    expect(strings.voyage.categoryPlainNames.keymaster).toBe('Password Cracking');
  });
});

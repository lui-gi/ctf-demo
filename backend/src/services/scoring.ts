/**
 * Dynamic decay scoring engine — pure functions, easy to unit test.
 *
 * Formula (per spec §5):
 *   current = max(floor_pct * base, base * (1 - decay_rate * solves))
 *
 * - floor_pct       = 0.40
 * - decay_rate      = 0.02 for open_sea + cursed_depths
 * - decay_rate      = 0.01 for port (decays slower)
 *
 * Whisper penalty (cumulative %, applied to awarded points):
 *   1 → 10, 2 → 20, 3 → 35
 *
 * First-blood bonus +25 only on cursed_depths and only for the first crew.
 */

export type Difficulty = 'port' | 'open_sea' | 'cursed_depths';

export const FLOOR_PCT = 0.40;
export const FIRST_BLOOD_BONUS = 25;

export function decayRateFor(difficulty: Difficulty): number {
  return difficulty === 'port' ? 0.01 : 0.02;
}

/**
 * Compute the per-solve point value of an Island given how many crews have already solved it.
 * `solves` is the number of correct submissions BEFORE this one.
 */
export function computeCurrentPoints(basePoints: number, solves: number, difficulty: Difficulty): number {
  if (basePoints <= 0) return 0;
  if (solves < 0) solves = 0;
  const decay = decayRateFor(difficulty);
  const raw = basePoints * (1 - decay * solves);
  const floor = FLOOR_PCT * basePoints;
  return Math.floor(Math.max(floor, raw));
}

/**
 * Cumulative whisper penalty as a fraction (0 → 1) of the awarded points to subtract.
 *
 * Spec §5: "-10% / -20% / -35% per whisper" + "revealing all three caps the maximum
 * award at ~35% of current points". The spec-literal reading (Option B, locked by
 * Quartermaster on 2026-05-01): the per-whisper percentages are ADDITIVE penalties.
 *
 *   N=0 → penalty 0%   → award = current * 1.00
 *   N=1 → penalty 10%  → award = current * 0.90
 *   N=2 → penalty 30%  → award = current * 0.70   (10 + 20)
 *   N=3 → penalty 65%  → award = current * 0.35   (10 + 20 + 35)  — matches the cap
 *
 * Calibration rationale: a 3-whisper Crew receiving 35% (not 65%) of current preserves
 * the Cursed Depths separation that the event is calibrated around — top crews who
 * solve unaided are clearly distinguished from crews who burn all three Whispers.
 */
const WHISPER_PENALTY_TABLE: Record<0 | 1 | 2 | 3, number> = {
  0: 0,
  1: 0.10,
  2: 0.30,
  3: 0.65,
};

export function whisperPenaltyFraction(revealedCount: number): number {
  const clamped = Math.max(0, Math.min(3, Math.floor(revealedCount))) as 0 | 1 | 2 | 3;
  return WHISPER_PENALTY_TABLE[clamped];
}

/**
 * Given the current decayed points and how many whispers a crew revealed, compute
 * the award. Floors to integer.
 */
export function computeAward(currentPoints: number, whispersRevealed: number): number {
  const penalty = whisperPenaltyFraction(whispersRevealed);
  return Math.max(0, Math.floor(currentPoints * (1 - penalty)));
}

export interface FirstBloodInput {
  difficulty: Difficulty;
  alreadyHasFirstBlood: boolean;
}

/**
 * Returns the first-blood bonus to add (0 or FIRST_BLOOD_BONUS).
 * Per spec §5: only Cursed Depths Islands; only for the first crew.
 */
export function firstBloodBonus(input: FirstBloodInput): number {
  if (input.difficulty !== 'cursed_depths') return 0;
  if (input.alreadyHasFirstBlood) return 0;
  return FIRST_BLOOD_BONUS;
}

export interface AwardCalc {
  basePoints: number;
  solvesBefore: number;
  difficulty: Difficulty;
  whispersRevealed: number;
  alreadyHasFirstBlood: boolean;
}

export interface AwardResult {
  currentPoints: number;
  baseAward: number;
  firstBlood: number;
  total: number;
}

/** Full per-submission award calculation. */
export function calculateAward(input: AwardCalc): AwardResult {
  const currentPoints = computeCurrentPoints(input.basePoints, input.solvesBefore, input.difficulty);
  const baseAward = computeAward(currentPoints, input.whispersRevealed);
  const fb = firstBloodBonus({
    difficulty: input.difficulty,
    alreadyHasFirstBlood: input.alreadyHasFirstBlood,
  });
  return {
    currentPoints,
    baseAward,
    firstBlood: fb,
    total: baseAward + fb,
  };
}

import { describe, it, expect } from 'vitest';
import {
  computeCurrentPoints,
  computeAward,
  whisperPenaltyFraction,
  firstBloodBonus,
  calculateAward,
  decayRateFor,
  FLOOR_PCT,
  FIRST_BLOOD_BONUS,
} from '../src/services/scoring.js';

describe('scoring — decay rates per difficulty', () => {
  it('port decays at 0.01', () => {
    expect(decayRateFor('port')).toBe(0.01);
  });
  it('open_sea decays at 0.02', () => {
    expect(decayRateFor('open_sea')).toBe(0.02);
  });
  it('cursed_depths decays at 0.02', () => {
    expect(decayRateFor('cursed_depths')).toBe(0.02);
  });
});

describe('scoring — computeCurrentPoints', () => {
  it('returns base when zero solves', () => {
    expect(computeCurrentPoints(500, 0, 'cursed_depths')).toBe(500);
  });

  it('applies open_sea decay 2% per solve', () => {
    // 300 * (1 - 0.02 * 5) = 270
    expect(computeCurrentPoints(300, 5, 'open_sea')).toBe(270);
  });

  it('applies port decay 1% per solve (slower)', () => {
    // 100 * (1 - 0.01 * 10) = 90
    expect(computeCurrentPoints(100, 10, 'port')).toBe(90);
  });

  it('respects the 40% floor on cursed_depths even after huge solve count', () => {
    // 1000 * (1 - 0.02 * 100) = -1000 → clamped to 400
    const v = computeCurrentPoints(1000, 100, 'cursed_depths');
    expect(v).toBe(Math.floor(FLOOR_PCT * 1000));
    expect(v).toBe(400);
  });

  it('respects the 40% floor on port', () => {
    const v = computeCurrentPoints(100, 9999, 'port');
    expect(v).toBe(40);
  });

  it('treats negative solves as zero', () => {
    expect(computeCurrentPoints(500, -3, 'open_sea')).toBe(500);
  });

  it('returns 0 for zero base points', () => {
    expect(computeCurrentPoints(0, 5, 'open_sea')).toBe(0);
  });
});

describe('scoring — whisper penalty fractions (spec-literal: -10/-20/-35 additive)', () => {
  it('0 whispers → 0%', () => expect(whisperPenaltyFraction(0)).toBe(0));
  it('1 whisper → 10% penalty', () => expect(whisperPenaltyFraction(1)).toBeCloseTo(0.10));
  it('2 whispers → 30% penalty (10 + 20)', () => expect(whisperPenaltyFraction(2)).toBeCloseTo(0.30));
  it('3 whispers → 65% penalty (10 + 20 + 35), capping award at 35% of current', () =>
    expect(whisperPenaltyFraction(3)).toBeCloseTo(0.65));
  it('clamps above 3', () => expect(whisperPenaltyFraction(99)).toBeCloseTo(0.65));
  it('clamps below 0', () => expect(whisperPenaltyFraction(-1)).toBe(0));
});

describe('scoring — computeAward', () => {
  it('full award when no whispers revealed', () => {
    expect(computeAward(500, 0)).toBe(500);
  });

  it('1 whisper leaves 90% award', () => {
    expect(computeAward(500, 1)).toBe(450);
  });

  it('2 whispers leaves 70% award', () => {
    expect(computeAward(500, 2)).toBe(350);
  });

  it('3 whispers leaves 35% award (the cap)', () => {
    expect(computeAward(500, 3)).toBe(175);
  });

  it('floors to integer', () => {
    expect(computeAward(333, 1)).toBe(Math.floor(333 * 0.9));
  });
});

describe('scoring — first blood', () => {
  it('awards +25 only on cursed_depths first solve', () => {
    expect(firstBloodBonus({ difficulty: 'cursed_depths', alreadyHasFirstBlood: false })).toBe(FIRST_BLOOD_BONUS);
  });

  it('does NOT award first blood on port', () => {
    expect(firstBloodBonus({ difficulty: 'port', alreadyHasFirstBlood: false })).toBe(0);
  });

  it('does NOT award first blood on open_sea', () => {
    expect(firstBloodBonus({ difficulty: 'open_sea', alreadyHasFirstBlood: false })).toBe(0);
  });

  it('does NOT re-award first blood once claimed', () => {
    expect(firstBloodBonus({ difficulty: 'cursed_depths', alreadyHasFirstBlood: true })).toBe(0);
  });
});

describe('scoring — full calculateAward', () => {
  it('first blood on cursed_depths gives base + 25', () => {
    const r = calculateAward({
      basePoints: 500,
      solvesBefore: 0,
      difficulty: 'cursed_depths',
      whispersRevealed: 0,
      alreadyHasFirstBlood: false,
    });
    expect(r.currentPoints).toBe(500);
    expect(r.baseAward).toBe(500);
    expect(r.firstBlood).toBe(25);
    expect(r.total).toBe(525);
  });

  it('subsequent solver on cursed_depths after 4 solves loses no first-blood', () => {
    const r = calculateAward({
      basePoints: 500,
      solvesBefore: 4,
      difficulty: 'cursed_depths',
      whispersRevealed: 0,
      alreadyHasFirstBlood: true,
    });
    // 500 * (1 - 0.02*4) = 460
    expect(r.currentPoints).toBe(460);
    expect(r.baseAward).toBe(460);
    expect(r.firstBlood).toBe(0);
    expect(r.total).toBe(460);
  });

  it('open_sea solver with 2 whispers revealed', () => {
    const r = calculateAward({
      basePoints: 300,
      solvesBefore: 5,
      difficulty: 'open_sea',
      whispersRevealed: 2,
      alreadyHasFirstBlood: false,
    });
    // 300 * (1 - 0.02 * 5) = 270 current; 2 whispers → 30% penalty → 270 * 0.70 = 189
    expect(r.currentPoints).toBe(270);
    expect(r.baseAward).toBe(189);
    expect(r.firstBlood).toBe(0);
    expect(r.total).toBe(189);
  });

  it('port solver still gets no first blood even on first solve', () => {
    const r = calculateAward({
      basePoints: 100,
      solvesBefore: 0,
      difficulty: 'port',
      whispersRevealed: 0,
      alreadyHasFirstBlood: false,
    });
    expect(r.firstBlood).toBe(0);
    expect(r.total).toBe(100);
  });

  it('cursed_depths solver after first-blood awarded — only one crew gets +25', () => {
    const fb1 = calculateAward({
      basePoints: 700, solvesBefore: 0, difficulty: 'cursed_depths',
      whispersRevealed: 0, alreadyHasFirstBlood: false,
    });
    const fb2 = calculateAward({
      basePoints: 700, solvesBefore: 1, difficulty: 'cursed_depths',
      whispersRevealed: 0, alreadyHasFirstBlood: true,
    });
    expect(fb1.firstBlood).toBe(25);
    expect(fb2.firstBlood).toBe(0);
    expect(fb1.total - fb1.baseAward).toBe(25);
    expect(fb2.total).toBe(fb2.baseAward);
  });
});

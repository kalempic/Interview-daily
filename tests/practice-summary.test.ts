import { describe, expect, it } from 'vitest';
import { practiceStreak, summarizePractice } from '../src/practice-summary';

const now = new Date(Date.UTC(2026, 10, 3, 15, 0, 0));

function daysAgo(days: number): Date {
  return new Date(Date.UTC(2026, 10, 3 - days, 12, 0, 0));
}

describe('practiceStreak', () => {
  it('is zero with no dates', () => {
    expect(practiceStreak([], now)).toBe(0);
  });

  it('counts today and the days that touch it', () => {
    expect(practiceStreak([daysAgo(0)], now)).toBe(1);
    expect(practiceStreak([daysAgo(0), daysAgo(1), daysAgo(2)], now)).toBe(3);
  });

  it('keeps a streak that last landed yesterday', () => {
    expect(practiceStreak([daysAgo(1), daysAgo(2)], now)).toBe(2);
  });

  it('breaks when the latest day is older than yesterday', () => {
    expect(practiceStreak([daysAgo(3), daysAgo(4)], now)).toBe(0);
  });

  it('stops at a gap', () => {
    expect(practiceStreak([daysAgo(0), daysAgo(2)], now)).toBe(1);
  });
});

describe('summarizePractice', () => {
  it('uses the newest attempt for the open drill', () => {
    const older = { drillId: 'react-rendering', createdAt: daysAgo(2), answer: 'older' };
    const newer = { drillId: 'react-rendering', createdAt: daysAgo(0), answer: 'newer' };
    const other = { drillId: 'star-disagreement', createdAt: daysAgo(1), answer: 'star' };
    const summary = summarizePractice([newer, other, older], 'react-rendering', now);

    expect(summary.total).toBe(3);
    expect(summary.drills).toBe(2);
    expect(summary.streak).toBe(3);
    expect(summary.latestForDrill).toBe(newer);
  });

  it('returns null when this drill has no saved answer', () => {
    const summary = summarizePractice([{ drillId: 'star-disagreement', createdAt: daysAgo(0) }], 'react-rendering', now);
    expect(summary.latestForDrill).toBeNull();
    expect(summary.drills).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { practiceStreak, summarizePractice } from '../src/practice-summary';

const now = new Date(Date.UTC(2026, 10, 3, 15, 0, 0));

function daysAgo(days: number): Date {
  return new Date(Date.UTC(2026, 10, 3 - days, 12, 0, 0));
}

describe('practice record', () => {
  it('keeps a streak through yesterday and stops at a gap', () => {
    expect(practiceStreak([daysAgo(1), daysAgo(2)], now)).toBe(2);
    expect(practiceStreak([daysAgo(0), daysAgo(2)], now)).toBe(1);
  });

  it('uses the newest saved answer for the open drill', () => {
    const older = { drillId: 'react-rendering', createdAt: daysAgo(2), answer: 'older' };
    const newer = { drillId: 'react-rendering', createdAt: daysAgo(0), answer: 'newer' };
    const other = { drillId: 'star-disagreement', createdAt: daysAgo(1), answer: 'star' };
    const summary = summarizePractice([newer, other, older], 'react-rendering', now);

    expect(summary.latestForDrill).toBe(newer);
    expect(summary.drills).toBe(2);
    expect(summary.streak).toBe(3);
  });
});

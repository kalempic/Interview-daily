import { describe, expect, it } from 'vitest';
import { spokenScore } from '../src/spoken-score';

describe('spokenScore', () => {
  it('reads a fraction as words', () => {
    expect(spokenScore('4/4')).toBe('4 of 4');
    expect(spokenScore('0/4')).toBe('0 of 4');
  });

  it('names an unscored attempt', () => {
    expect(spokenScore('—')).toBe('Not scored');
  });
});

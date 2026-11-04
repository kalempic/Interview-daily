import { describe, expect, it } from 'vitest';
import { corpus } from '../src/content';
import { buildFeedback, selectDailyDrill } from '../src/rag';

const noteForDrill: Record<string, string> = {
  'react-rendering': 'rendering-and-memo',
  'accessible-names': 'accessible-interfaces',
  'testing-behavior': 'component-tests',
  'form-validation': 'forms-and-ui-states',
  'empty-error-states': 'forms-and-ui-states',
  'star-disagreement': 'star-method',
};

describe('shipped corpus', () => {
  it('loads the drills and notes', () => {
    expect(corpus.drills.length).toBeGreaterThanOrEqual(6);
    expect(corpus.notes.length).toBeGreaterThanOrEqual(5);
    expect(corpus.noteChunks.length).toBeGreaterThanOrEqual(15);
    for (const drill of corpus.drills) {
      expect(drill.question.length).toBeGreaterThan(40);
      expect(drill.rubric.length).toBeGreaterThanOrEqual(4);
      expect(drill.checks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('scores each strong answer against its own rubric and cites a related note', () => {
    for (const drill of corpus.drills) {
      const feedback = buildFeedback({
        drill,
        answer: drill.strongAnswer,
        noteChunks: corpus.noteChunks,
      });
      expect(feedback.scored, drill.id).toBe(true);
      expect(feedback.missing, `${drill.id} missing: ${feedback.missing.join(' | ')}`).toEqual([]);
      expect(feedback.scoreLabel, drill.id).toBe(`${drill.rubric.length}/${drill.rubric.length}`);
      expect(
        feedback.snippets.some((snippet) => snippet.docId === noteForDrill[drill.id]),
        `${drill.id} citations: ${feedback.hitHeadings.join(', ')}`,
      ).toBe(true);
    }
  });

  it('does not score an answer that is only a word or two', () => {
    const feedback = buildFeedback({
      drill: corpus.drills[0],
      answer: 'memo',
      noteChunks: corpus.noteChunks,
    });
    expect(feedback.scored).toBe(false);
    expect(feedback.scoreLabel).toBe('—');
    expect(feedback.covered).toEqual([]);
    expect(feedback.missing).toEqual([]);
  });

  it('keeps the same drill on one date and moves on the next day', () => {
    const day = new Date(2026, 0, 1);
    const next = new Date(2026, 0, 2);
    expect(selectDailyDrill(corpus.drills, day).id).toBe(selectDailyDrill(corpus.drills, day).id);
    expect(selectDailyDrill(corpus.drills, next).id).not.toBe(selectDailyDrill(corpus.drills, day).id);
  });
});

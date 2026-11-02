import { describe, expect, it } from 'vitest';
import { corpus } from '../src/content';
import { buildFeedback, toPlainText } from '../src/rag';

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
      for (const snippet of feedback.snippets) {
        const source = corpus.noteChunks.find(
          (chunk) => chunk.docId === snippet.docId && chunk.heading === snippet.heading,
        );
        expect(source, snippet.heading).toBeDefined();
        const probe = snippet.text.endsWith('…') ? snippet.text.slice(0, -1) : snippet.text;
        expect(toPlainText(source!.text).startsWith(probe)).toBe(true);
      }
    }
  });
});

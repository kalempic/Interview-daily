import { describe, expect, it } from 'vitest';
import {
  buildFeedback,
  chunkByHeadings,
  loadCorpusFromFiles,
  parseDocument,
  retrieve,
  scoreRubric,
  selectDailyDrill,
  toPlainText,
  tokenize,
  type Drill,
} from '../src/rag';

const noteRaw = `---
id: rendering-and-memo
title: React rendering and memo
kind: note
track: Frontend
---

Intro paragraph about renders.

## What React.memo compares

React.memo shallow-compares props and can skip the child render when every prop is the same.

## Unstable props

New object or function props defeat memo. Memo is for expensive children with stable props.
`;

const otherRaw = `---
id: star-method
title: STAR answers
kind: note
track: Behavioral
---

## Situation and result

Name a specific situation, the action you took, and a concrete result. Do not invent metrics.
`;

const drillRaw = `---
id: react-rendering
title: When React re-renders
kind: drill
track: Frontend
minutes: 8
---

## Question

When does a function component re-render, and when does React.memo skip that work?

## What interviewers check

- You explain the cause of a render.
- You know the limits of memo.

## Strong answer

A component re-renders when its state updates, when its parent re-renders, or when a context it reads changes. React.memo shallow-compares props and can skip the child render. The child's own state updates still re-render it. New object or function props defeat memo, so memo is for expensive children with stable props.

## Rubric

- Says a component re-renders when its state, parent, or a context it reads changes
- Explains that React.memo shallow-compares props and can skip the child render
- Notes that the child's own state updates still re-render it
- Warns that new object or function props defeat memo, so memo is for expensive children with stable props
`;

function loaded() {
  return loadCorpusFromFiles([
    { path: 'content/notes/rendering-and-memo.md', raw: noteRaw },
    { path: 'content/notes/star-method.md', raw: otherRaw },
    { path: 'content/drills/01-react-rendering.md', raw: drillRaw },
  ]);
}

describe('tokenize', () => {
  it('keeps technical tokens and drops stopwords', () => {
    expect(tokenize('React.memo shallow-compares the props')).toEqual([
      'react.memo',
      'shallow-compare',
      'prop',
    ]);
    expect(tokenize('aria-labelledby')).toEqual(['aria-labelledby']);
  });
});

describe('parseDocument', () => {
  it('reads drill frontmatter and rubric bullets', () => {
    const { drill } = parseDocument(drillRaw, 'content/drills/01-react-rendering.md');
    expect(drill?.id).toBe('react-rendering');
    expect(drill?.minutes).toBe(8);
    expect(drill?.rubric).toHaveLength(4);
    expect(drill?.checks).toHaveLength(2);
    expect(drill?.question).toMatch(/React\.memo/);
  });

  it('accepts Windows newlines in frontmatter', () => {
    const raw = '---\r\nid: demo\r\ntitle: Demo title\r\nkind: note\r\n---\r\n\r\n## One\r\n\r\nHello from the note body.\r\n';
    const { note } = parseDocument(raw, 'content/notes/demo.md');
    expect(note?.title).toBe('Demo title');
    expect(note?.chunks[0]?.heading).toBe('One');
  });

  it('rejects a drill that has no rubric', () => {
    const raw = '---\nid: x\ntitle: Missing pieces\nkind: drill\n---\n\n## Question\n\nWhy?\n';
    expect(() => parseDocument(raw, 'content/drills/x.md')).toThrow(/Rubric|Strong answer|What interviewers check/);
  });
});

describe('chunkByHeadings', () => {
  it('splits a note on headings and keeps the parent path', () => {
    const chunks = chunkByHeadings(
      '## Alpha\n\nText about alpha tokens.\n\n### Beta\n\nText about beta tokens.\n',
      { id: 'doc', title: 'Rendering', kind: 'note' },
    );
    expect(chunks.map((chunk) => chunk.heading)).toEqual(['Alpha', 'Beta']);
    expect(chunks[1]?.headingPath).toBe('Rendering / Alpha / Beta');
    expect(chunks[0]?.docId).toBe('doc');
  });
});

describe('selectDailyDrill', () => {
  const drills = ['a', 'b', 'c'].map((id) => ({ id }) as Drill);

  it('is stable for a date and walks forward one drill per day', () => {
    const first = selectDailyDrill(drills, new Date(2026, 0, 1));
    expect(selectDailyDrill(drills, new Date(2026, 0, 1)).id).toBe(first.id);
    const ids = [0, 1, 2].map((offset) => selectDailyDrill(drills, new Date(2026, 0, 1 + offset)).id);
    expect(new Set(ids).size).toBe(3);
  });

  it('throws when there is nothing to schedule', () => {
    expect(() => selectDailyDrill([])).toThrow(/No drills/);
  });
});

describe('retrieve', () => {
  it('ranks the chunk that shares terms with the query', () => {
    const corpus = loaded();
    const hits = retrieve('React.memo shallow-compares props and can skip the child render', corpus.noteChunks, 3);
    expect(hits[0]?.chunk.docId).toBe('rendering-and-memo');
    expect(hits[0]?.chunk.heading).toMatch(/React\.memo/);
    expect(hits.some((hit) => hit.chunk.docId === 'star-method')).toBe(false);
  });

  it('returns nothing when the query shares no terms', () => {
    const corpus = loaded();
    expect(retrieve('xylophone quantum platter', corpus.noteChunks)).toEqual([]);
  });
});

describe('scoreRubric and buildFeedback', () => {
  it('marks overlapping rubric points covered and the rest missing', () => {
    const drill = loaded().drills[0];
    expect(drill).toBeDefined();
    const score = scoreRubric(
      drill!.rubric,
      'React.memo shallow-compares props and can skip the child render when the props are unchanged.',
    );
    expect(score.tooShort).toBe(false);
    expect(score.covered.some((item) => item.includes('React.memo'))).toBe(true);
    expect(score.missing.length).toBeGreaterThan(0);
  });

  it('does not score a one-word answer or reveal the rubric for it', () => {
    const corpus = loaded();
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

  it('cites note excerpts and copies them from the source chunk', () => {
    const corpus = loaded();
    const feedback = buildFeedback({
      drill: corpus.drills[0],
      answer: corpus.drills[0].strongAnswer,
      noteChunks: corpus.noteChunks,
    });
    expect(feedback.scored).toBe(true);
    expect(feedback.scoreLabel).toBe('4/4');
    expect(feedback.missing).toEqual([]);
    expect(feedback.snippets.length).toBeGreaterThan(0);
    expect(feedback.snippets.length).toBeLessThanOrEqual(3);
    expect(feedback.snippets.every((snippet) => snippet.docId !== 'react-rendering')).toBe(true);

    for (const snippet of feedback.snippets) {
      const source = corpus.noteChunks.find(
        (chunk) => chunk.docId === snippet.docId && chunk.heading === snippet.heading,
      );
      expect(source).toBeDefined();
      const plain = toPlainText(source!.text);
      const probe = snippet.text.endsWith('…') ? snippet.text.slice(0, -1) : snippet.text;
      expect(plain.startsWith(probe)).toBe(true);
    }
  });

  it('ignores drill chunks even if they overlap the answer', () => {
    const corpus = loaded();
    const drillChunk = {
      ...corpus.noteChunks[0],
      id: 'drill-chunk',
      docId: 'react-rendering',
      docTitle: 'When React re-renders',
      kind: 'drill' as const,
      heading: 'Strong answer',
      text: corpus.drills[0].strongAnswer,
    };
    const feedback = buildFeedback({
      drill: corpus.drills[0],
      answer: corpus.drills[0].strongAnswer,
      noteChunks: [drillChunk, ...corpus.noteChunks],
    });
    expect(feedback.snippets.every((snippet) => snippet.docId !== 'react-rendering')).toBe(true);
  });
});

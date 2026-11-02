import { loadCorpusFromFiles, type Corpus } from './rag';

const modules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const corpus: Corpus = loadCorpusFromFiles(
  Object.entries(modules).map(([path, raw]) => ({
    path,
    raw: String(raw),
  })),
);

if (corpus.drills.length === 0 || corpus.notes.length === 0) {
  throw new Error('InterviewDaily could not load drills and notes from /content.');
}

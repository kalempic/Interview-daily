export type DocKind = 'drill' | 'note';

export type Chunk = {
  id: string;
  docId: string;
  docTitle: string;
  kind: DocKind;
  heading: string;
  headingPath: string;
  text: string;
};

export type Drill = {
  id: string;
  title: string;
  track: string;
  minutes: number;
  question: string;
  checks: string[];
  strongAnswer: string;
  rubric: string[];
  path: string;
};

export type NoteDoc = {
  id: string;
  title: string;
  track: string;
  body: string;
  chunks: Chunk[];
  path: string;
};

export type Corpus = {
  drills: Drill[];
  notes: NoteDoc[];
  noteChunks: Chunk[];
};

export type ScoredChunk = {
  chunk: Chunk;
  score: number;
};

export type Snippet = {
  docId: string;
  docTitle: string;
  heading: string;
  text: string;
};

export type Feedback = {
  scoreLabel: string;
  covered: string[];
  missing: string[];
  snippets: Snippet[];
  hitHeadings: string[];
  headline: string;
  detail: string;
  scored: boolean;
};

export type RubricScore = {
  covered: string[];
  missing: string[];
  tooShort: boolean;
};

const MIN_ANSWER_TOKENS = 8;
const MIN_SIMILARITY = 0.05;
const SNIPPET_CHARS = 420;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'so', 'of', 'to',
  'in', 'on', 'for', 'with', 'as', 'at', 'by', 'from', 'into', 'over', 'after',
  'before', 'about', 'than', 'that', 'this', 'these', 'those', 'it', 'its', 'be',
  'is', 'are', 'was', 'were', 'been', 'being', 'do', 'does', 'did', 'doing',
  'can', 'could', 'should', 'would', 'will', 'may', 'might', 'must', 'just',
  'not', 'no', 'nor', 'you', 'your', 'yours', 'we', 'our', 'they', 'their',
  'them', 'i', 'me', 'my', 'he', 'she', 'when', 'while', 'where', 'what',
  'which', 'who', 'how', 'why', 'there', 'here', 'have', 'has', 'had', 'having',
  'also', 'such', 'only', 'own', 'still', 'very', 'more', 'most', 'other',
  'another', 'some', 'any', 'each', 'both', 'few', 'same', 'out', 'up', 'off',
  'too', 'using', 'use', 'used', 'via', 'per', 'within', 'without', 'across',
  'because', 'onto', 'let', 'lets', 'get', 'got', 'gets', 'make', 'made',
  'makes', 'say', 'says', 'said', 'set', 'sets', 'end', 'ends', 'explain', 'explains', 'explained', 'note',
  'notes', 'warn', 'warns', 'warned', 'mention', 'mentions', 'describe',
  'describes', 'include', 'includes', 'including', 'includ', 'keep', 'keeps', 'stay',
  'stays', 'really', 'actually', 'basically', 'something', 'anything',
  'everything', 'someone', 'always', 'never', 'often', 'able',
]);

export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z0-9][a-z0-9.+#-]*/g) ?? [];
  const tokens: string[] = [];
  for (const raw of matches) {
    const trimmed = raw.replace(/[.+#-]+$/g, '');
    if (trimmed.length < 2) continue;
    const token = stem(trimmed);
    if (token.length < 2 || STOPWORDS.has(token)) continue;
    tokens.push(token);
  }
  return tokens;
}

function stem(token: string): string {
  if (token.length > 6 && token.endsWith('ing')) {
    const base = token.slice(0, -3);
    if (base.length >= 4) return base;
  }
  if (token.length > 5 && token.endsWith('ed')) {
    const base = token.slice(0, -2);
    if (base.length >= 4) return base;
  }
  if (token.length > 4 && token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return token;
}

export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ' '))
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDocument(raw: string, path: string): { drill?: Drill; note?: NoteDoc } {
  const cleaned = raw.replace(/^\uFEFF/, '');
  const { data, body } = parseFrontmatter(cleaned);
  const kind = data.kind || inferKind(path);
  if (!data.id) throw new Error(`${path}: frontmatter id is required`);
  if (!data.title) throw new Error(`${path}: frontmatter title is required`);

  if (kind === 'note') {
    const chunks = chunkByHeadings(body, {
      id: data.id,
      title: data.title,
      kind: 'note',
    });
    return {
      note: {
        id: data.id,
        title: data.title,
        track: data.track || 'General',
        body: body.trim(),
        chunks,
        path,
      },
    };
  }

  if (kind === 'drill') {
    const question = sectionByHeading(body, 'Question');
    const checks = listItems(sectionByHeading(body, 'What interviewers check'));
    const strongAnswer = sectionByHeading(body, 'Strong answer');
    const rubric = listItems(sectionByHeading(body, 'Rubric'));
    if (!question) throw new Error(`${path}: missing Question section`);
    if (!strongAnswer) throw new Error(`${path}: missing Strong answer section`);
    if (checks.length === 0) throw new Error(`${path}: What interviewers check needs a list`);
    if (rubric.length === 0) throw new Error(`${path}: Rubric needs a list`);
    const minutes = Number(data.minutes);
    return {
      drill: {
        id: data.id,
        title: data.title,
        track: data.track || 'General',
        minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 5,
        question,
        checks,
        strongAnswer,
        rubric,
        path,
      },
    };
  }

  throw new Error(`${path}: kind must be "drill" or "note"`);
}

export function chunkByHeadings(
  body: string,
  meta: { id: string; title: string; kind: DocKind },
): Chunk[] {
  const lines = body.split(/\r?\n/);
  const chunks: Chunk[] = [];
  const stack: { level: number; text: string }[] = [{ level: 1, text: meta.title }];
  let heading = meta.title;
  let buf: string[] = [];

  const flush = () => {
    const text = buf.join('\n').trim();
    buf = [];
    if (!text) return;
    chunks.push({
      id: `${meta.id}#${chunks.length}`,
      docId: meta.id,
      docTitle: meta.title,
      kind: meta.kind,
      heading,
      headingPath: stack.map((item) => item.text).join(' / '),
      text,
    });
  };

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (match) {
      flush();
      const level = match[1].length;
      heading = match[2].trim();
      while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, text: heading });
      continue;
    }
    buf.push(line);
  }
  flush();
  return chunks;
}

export function loadCorpusFromFiles(files: { path: string; raw: string }[]): Corpus {
  const drills: Drill[] = [];
  const notes: NoteDoc[] = [];
  const ordered = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of ordered) {
    const parsed = parseDocument(file.raw, file.path);
    if (parsed.drill) drills.push(parsed.drill);
    if (parsed.note) notes.push(parsed.note);
  }

  return {
    drills,
    notes,
    noteChunks: notes.flatMap((note) => note.chunks),
  };
}

export function selectDailyDrill(drills: Drill[], date = new Date()): Drill {
  if (drills.length === 0) throw new Error('No drills are loaded');
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const day = Math.floor(utc / 86_400_000);
  const index = ((day % drills.length) + drills.length) % drills.length;
  return drills[index];
}

export function retrieve(query: string, chunks: Chunk[], limit = 3): ScoredChunk[] {
  if (limit <= 0 || chunks.length === 0) return [];
  const docs = chunks.map((chunk) => tokenize(`${chunk.heading} ${chunk.heading} ${chunk.text}`));
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const df = new Map<string, number>();
  for (const tokens of docs) {
    for (const token of new Set(tokens)) df.set(token, (df.get(token) ?? 0) + 1);
  }

  const n = docs.length;
  const idf = (token: string) => Math.log((n + 1) / ((df.get(token) ?? 0) + 1)) + 1;
  const queryVec = weight(queryTokens, idf);
  const queryNorm = norm(queryVec);
  if (queryNorm === 0) return [];

  const ranked = chunks.map((chunk, index) => {
    const vec = weight(docs[index], idf);
    const denom = queryNorm * norm(vec);
    const score = denom === 0 ? 0 : dot(queryVec, vec) / denom;
    return { chunk, score };
  });

  ranked.sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));

  const picked: ScoredChunk[] = [];
  const seen = new Set<string>();
  for (const item of ranked) {
    if (item.score < MIN_SIMILARITY) break;
    const key = `${item.chunk.docId}::${item.chunk.heading}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(item);
    if (picked.length === limit) break;
  }
  return picked;
}

export function scoreRubric(rubric: string[], answer: string): RubricScore {
  const answerTokens = tokenize(answer);
  const tooShort = answerTokens.length < MIN_ANSWER_TOKENS;
  const covered: string[] = [];
  const missing: string[] = [];

  for (const bullet of rubric) {
    if (tooShort) {
      missing.push(bullet);
      continue;
    }
    const terms = unique(tokenize(bullet));
    const hits = terms.filter((term) => answerTokens.some((token) => tokensLooselyMatch(term, token)));
    if (terms.length > 0 && hits.length >= hitsNeeded(terms.length)) covered.push(bullet);
    else missing.push(bullet);
  }

  return { covered, missing, tooShort };
}

export function buildFeedback(input: {
  drill: Drill;
  answer: string;
  noteChunks: Chunk[];
  limit?: number;
}): Feedback {
  const limit = input.limit ?? 3;
  const score = scoreRubric(input.drill.rubric, input.answer);
  const hits = retrieve(
    `${input.drill.title}\n${input.drill.question}\n${input.answer}`,
    input.noteChunks.filter((chunk) => chunk.kind === 'note'),
    limit,
  );
  const snippets = hits.map((hit) => ({
    docId: hit.chunk.docId,
    docTitle: hit.chunk.docTitle,
    heading: hit.chunk.heading,
    text: excerpt(toPlainText(hit.chunk.text), SNIPPET_CHARS),
  }));
  const hitHeadings = snippets.map((snippet) => `${snippet.docTitle} — ${snippet.heading}`);

  if (score.tooShort) {
    return {
      scoreLabel: '—',
      covered: [],
      missing: [],
      snippets,
      hitHeadings,
      headline: 'Too short to score.',
      detail: snippets.length
        ? 'Write a few sentences. Some notes matched the question, but there is no score yet.'
        : 'Write a few sentences. There is no score yet.',
      scored: false,
    };
  }

  const coveredCount = score.covered.length;
  const total = input.drill.rubric.length;
  const headline =
    coveredCount === total
      ? `You covered all ${total} key points.`
      : `You covered ${coveredCount} of ${total} key points.`;
  const detail =
    score.missing.length === 0
      ? 'That covers the whole rubric. The sample answer is below if you want to compare.'
      : coveredCount === 0
        ? 'None of the rubric lines matched. The missing list is what to add, and the notes below are the source.'
        : 'The missing lines are what to add next. The notes below are where those points come from.';

  return {
    scoreLabel: `${coveredCount}/${total}`,
    covered: score.covered,
    missing: score.missing,
    snippets,
    hitHeadings,
    headline,
    detail,
    scored: true,
  };
}

function hitsNeeded(count: number): number {
  if (count <= 2) return count;
  return Math.max(1, Math.ceil(count * 0.3));
}

function tokensLooselyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a))) return true;
  const shared = Math.min(a.length, b.length, 8);
  return shared >= 6 && a.slice(0, shared) === b.slice(0, shared);
}

function unique(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

function weight(tokens: string[], idf: (token: string) => number): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
  const vec = new Map<string, number>();
  const length = tokens.length || 1;
  for (const [token, count] of tf) vec.set(token, (count / length) * idf(token));
  return vec;
}

function dot(a: Map<string, number>, b: Map<string, number>): number {
  let sum = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [key, value] of small) {
    const other = large.get(key);
    if (other) sum += value * other;
  }
  return sum;
}

function norm(vec: Map<string, number>): number {
  let sum = 0;
  for (const value of vec.values()) sum += value * value;
  return Math.sqrt(sum);
}

function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > 180) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > 0 ? space : max)}…`;
}

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    data[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, '');
  }
  return { data, body: raw.slice(match[0].length) };
}

function sectionByHeading(body: string, heading: string): string {
  const re = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'im');
  const match = re.exec(body);
  if (!match) return '';
  const rest = body.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function listItems(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => /^\s*[-*]\s+(.+)$/.exec(line)?.[1]?.trim() ?? '')
    .filter((item) => item.length > 0);
}

function inferKind(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  if (normalized.includes('/drills/')) return 'drill';
  if (normalized.includes('/notes/')) return 'note';
  return '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

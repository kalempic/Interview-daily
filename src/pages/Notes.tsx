import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/MarkdownView';
import { Field, Fine, Kicker, Lede, Screen } from '../components/ui';
import { corpus } from '../content';
import { usePageTitle } from '../usePageTitle';

export function NotesPage() {
  const { id } = useParams();
  const note = corpus.notes.find((item) => item.id === id);
  usePageTitle(note ? note.title : 'Notes');

  if (id && !note) {
    return (
      <Screen>
        <h1>Note not found</h1>
        <p>This note is not in the corpus.</p>
        <p>
          <Link to="/notes">Back to notes</Link>
        </p>
      </Screen>
    );
  }

  if (note) {
    return (
      <article>
        <Kicker>
          <Link to="/notes">Notes</Link>
          <span aria-hidden="true"> · </span>
          {note.track}
        </Kicker>
        <h1>{note.title}</h1>
        <MarkdownView markdown={note.body} />
      </article>
    );
  }

  return <NoteList />;
}

function NoteList() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const notes = useMemo(() => {
    const terms = normalized.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return corpus.notes;
    return corpus.notes.filter((note) => {
      const haystack = `${note.title}\n${note.track}\n${note.body}`.toLowerCase();
      return terms.every((term) => new RegExp(`(?:^|\\W)${escapeRegExp(term)}(?:\\W|$)`).test(haystack));
    });
  }, [normalized]);

  return (
    <Screen>
      <Kicker>Study notes</Kicker>
      <h1>Notes</h1>
      <Lede>These notes are the source of the passages you see after Get feedback.</Lede>
      <Field label="Search" htmlFor="note-search">
        <input
          id="note-search"
          type="search"
          value={query}
          placeholder="Try memo, focus, empty, or STAR"
          aria-describedby="note-search-status"
          onChange={(event) => setQuery(event.target.value)}
        />
      </Field>
      <Fine id="note-search-status" role="status">
        {normalized
          ? notes.length === 0
            ? `No notes match “${query.trim()}”. Try a topic such as memo, focus, or STAR.`
            : `${notes.length} matching ${notes.length === 1 ? 'note' : 'notes'}.`
          : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}.`}
      </Fine>

      {notes.length === 0 ? null : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id}>
              <Link to={`/notes/${note.id}`}>
                <span className="note-title">{note.title}</span>
                <span className="note-track">{note.track}</span>
              </Link>
              <p>{excerpt(note.body)}</p>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function excerpt(body: string): string {
  const first = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part.length > 0 && !part.startsWith('#'));
  const plain = (first ?? '').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
  if (plain.length <= 180) return plain;
  const cut = plain.slice(0, 180);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > 40 ? space : 180)}…`;
}

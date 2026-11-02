import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarkdownView } from '../components/MarkdownView';
import { corpus } from '../content';
import { usePageTitle } from '../usePageTitle';

export function NotesPage() {
  const { id } = useParams();
  const note = corpus.notes.find((item) => item.id === id);
  usePageTitle(note ? note.title : 'Notes');

  if (id && !note) {
    return (
      <div>
        <h1>Note not found</h1>
        <p>This note is not in the corpus.</p>
        <p>
          <Link to="/notes">Back to notes</Link>
        </p>
      </div>
    );
  }

  if (note) {
    return (
      <article>
        <p className="kicker">
          <Link to="/notes">Notes</Link>
          <span aria-hidden="true"> · </span>
          {note.track}
        </p>
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
    <div>
      <p className="kicker">Study notes</p>
      <h1>Notes</h1>
      <p className="lede">These notes are the source of the passages you see after Get feedback.</p>
      <label className="picker" htmlFor="note-search">
        <span>Search</span>
        <input
          id="note-search"
          type="search"
          value={query}
          placeholder="Try memo, focus, empty, or STAR"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {notes.length === 0 ? (
        <p>No notes match “{query.trim()}”. Try a topic such as memo, focus, or STAR.</p>
      ) : (
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
    </div>
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

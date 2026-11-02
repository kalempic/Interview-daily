import { Link } from 'react-router-dom';
import type { SavedAttempt } from '../attempts';
import { useAuth } from '../auth';
import { summarizePractice } from '../practice-summary';
import { usePractice } from '../practice';

export function PracticeRecord({
  drillId,
  onRestore,
}: {
  drillId: string;
  onRestore: (answer: string) => void;
}) {
  const { user, configured } = useAuth();
  const { attempts, status } = usePractice();

  if (!configured) return null;

  if (!user) {
    return (
      <section className="card record">
        <h2>Your record</h2>
        <p>Sign in and this drill keeps your last answer. The next time you open it, the score and the words you wrote are already here.</p>
        <Link className="button" to="/signin">
          Sign in to keep answers
        </Link>
      </section>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return <p className="status">Loading your saved answers…</p>;
  }

  if (status === 'error') {
    return (
      <p className="banner" role="alert">
        Could not load your saved answers. Check your connection, and confirm that Firestore rules are deployed for this project.
      </p>
    );
  }

  const summary = summarizePractice(attempts, drillId);
  const latest = summary.latestForDrill;

  return (
    <section className="card record" aria-label="Your record">
      <h2>Your record</h2>
      {summary.total === 0 ? (
        <p>No saved answers on this account yet. Write a short paragraph and get feedback. That attempt stays on this drill.</p>
      ) : (
        <>
          <p className="record-stats">
            <span>{summary.total === 1 ? '1 saved answer' : `${summary.total} saved answers`}</span>
            <span>{summary.drills === 1 ? '1 drill' : `${summary.drills} drills`}</span>
            {summary.streak > 0 ? (
              <span>{summary.streak === 1 ? '1-day streak' : `${summary.streak}-day streak`}</span>
            ) : null}
          </p>
          {latest ? (
            <LastAnswer attempt={latest} onRestore={onRestore} />
          ) : (
            <p>
              Nothing saved for this drill yet. Your other answers are in <Link to="/history">History</Link>.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function LastAnswer({ attempt, onRestore }: { attempt: SavedAttempt; onRestore: (answer: string) => void }) {
  return (
    <div>
      <p className="fine">
        Last answer on this drill · {attempt.scoreLabel} · {formatDay(attempt.createdAt)}
      </p>
      <p className="record-answer">{attempt.answer}</p>
      <button type="button" className="button" onClick={() => onRestore(attempt.answer)}>
        Put this answer back in the box
      </button>
    </div>
  );
}

function formatDay(date: Date | null): string {
  if (!date) return 'just now';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

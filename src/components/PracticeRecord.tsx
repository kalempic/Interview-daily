import { Link } from 'react-router-dom';
import type { SavedAttempt } from '../attempts';
import { useAuth } from '../auth';
import { summarizePractice } from '../practice-summary';
import { usePractice } from '../practice';
import { Banner, Button, ButtonLink, Card, Fine, Status } from './ui';

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
      <Card className="record">
        <h2>Your record</h2>
        <p>Sign in and this drill keeps your last answer. The next time you open it, the score and the words you wrote are already here.</p>
        <ButtonLink to="/signin">Sign in to keep answers</ButtonLink>
      </Card>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <Status>Loading your saved answers…</Status>
    );
  }

  if (status === 'error') {
    return (
      <Banner>
        Could not load your saved answers. Check your connection, and confirm that Firestore rules are deployed for this project.
      </Banner>
    );
  }

  const summary = summarizePractice(attempts, drillId);
  const latest = summary.latestForDrill;

  return (
    <Card className="record" aria-labelledby="record-heading">
      <h2 id="record-heading">Your record</h2>
      {summary.total === 0 ? (
        <p>No saved answers on this account yet. Write a short paragraph and get feedback. That attempt stays on this drill.</p>
      ) : (
        <>
          <ul className="record-stats">
            <li>{summary.total === 1 ? '1 saved answer' : `${summary.total} saved answers`}</li>
            <li>{summary.drills === 1 ? '1 drill' : `${summary.drills} drills`}</li>
            {summary.streak > 0 ? (
              <li>{summary.streak === 1 ? '1-day streak' : `${summary.streak}-day streak`}</li>
            ) : null}
          </ul>
          {latest ? (
            <LastAnswer attempt={latest} onRestore={onRestore} />
          ) : (
            <p>
              Nothing saved for this drill yet. Your other answers are in <Link to="/history">History</Link>.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function LastAnswer({ attempt, onRestore }: { attempt: SavedAttempt; onRestore: (answer: string) => void }) {
  return (
    <section>
      <Fine>
        Last answer on this drill · {attempt.scoreLabel} · {formatDay(attempt.createdAt)}
      </Fine>
      <blockquote className="record-answer">{attempt.answer}</blockquote>
      <Button onClick={() => onRestore(attempt.answer)}>Put this answer back in the box</Button>
    </section>
  );
}

function formatDay(date: Date | null): string {
  if (!date) return 'just now';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

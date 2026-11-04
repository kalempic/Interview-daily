import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { corpus } from '../content';
import { usePractice } from '../practice';
import { spokenScore } from '../spoken-score';
import { Banner, ButtonLink, Kicker, PointList, Screen, Status } from '../components/ui';
import { usePageTitle } from '../usePageTitle';

export function HistoryPage() {
  usePageTitle('History');
  const { user, ready, configured } = useAuth();
  const { attempts, status } = usePractice();

  if (!ready) return <Status>Checking your session…</Status>;

  if (!configured) {
    return (
      <Screen>
        <h1>History</h1>
        <p>Past attempts live in Firestore. Add your Firebase keys to <code>.env</code> and sign in to start a history.</p>
        <p>
          <Link to="/signin">How to sign in</Link>
        </p>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <h1>History</h1>
        <p>Sign in to see attempts you have saved from this account.</p>
        <ButtonLink to="/signin">Sign in</ButtonLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <Kicker>Your account</Kicker>
      <h1>History</h1>
      {status === 'loading' || status === 'idle' ? <Status>Loading your attempts…</Status> : null}
      {status === 'error' ? (
        <Banner>
          Could not load your attempts. Check your connection, and confirm that Firestore rules are deployed for this project.
        </Banner>
      ) : null}
      {status === 'ready' && attempts.length === 0 ? (
        <p>
          No attempts yet. Answer a drill on <Link to="/today">Today</Link> and the score will show up here.
        </p>
      ) : null}
      {status === 'ready' && attempts.length > 0 ? (
        <ol className="history">
          {attempts.map((attempt) => {
            const drill = corpus.drills.find((item) => item.id === attempt.drillId);
            return (
              <li key={attempt.id}>
                <details className="attempt">
                  <summary>
                    <span className="attempt-marker" aria-hidden="true" />
                    <span className="attempt-title">{drill?.title ?? attempt.drillId}</span>
                    <span className="attempt-score">
                      <span className="sr-only">{spokenScore(attempt.scoreLabel)}</span>
                      <span aria-hidden="true">{attempt.scoreLabel}</span>
                    </span>
                    <span className="attempt-when">{formatWhen(attempt.createdAt)}</span>
                  </summary>
                  <h3 className="fine-heading">Your answer</h3>
                  <p className="answer-text">{attempt.answer}</p>
                  {attempt.covered.length > 0 ? (
                    <>
                      <h3 className="fine-heading">Covered</h3>
                      <PointList tone="covered" points={attempt.covered} />
                    </>
                  ) : null}
                  {attempt.missing.length > 0 ? (
                    <>
                      <h3 className="fine-heading">Missing</h3>
                      <PointList tone="missing" points={attempt.missing} />
                    </>
                  ) : null}
                  {attempt.hitHeadings.length > 0 ? (
                    <>
                      <h3 className="fine-heading">Notes cited</h3>
                      <ul>
                        {attempt.hitHeadings.map((heading) => (
                          <li key={heading}>{heading}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </details>
              </li>
            );
          })}
        </ol>
      ) : null}
    </Screen>
  );
}

function formatWhen(date: Date | null): string {
  if (!date) return 'Just now';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

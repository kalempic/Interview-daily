import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAttempts, type SavedAttempt } from '../attempts';
import { useAuth } from '../auth';
import { corpus } from '../content';
import { usePageTitle } from '../usePageTitle';

export function HistoryPage() {
  usePageTitle('History');
  const { user, ready, configured } = useAuth();
  const [attempts, setAttempts] = useState<SavedAttempt[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    setStatus('loading');
    loadAttempts(user.uid)
      .then((rows) => {
        if (!active) return;
        setAttempts(rows);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [ready, user]);

  if (!ready) return <p className="status">Checking your session…</p>;

  if (!configured) {
    return (
      <div>
        <h1>History</h1>
        <p>Past attempts live in Firestore. Add your Firebase keys to <code>.env</code> and sign in to start a history.</p>
        <p>
          <Link to="/signin">How to sign in</Link>
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <h1>History</h1>
        <p>Sign in to see attempts you have saved from this account.</p>
        <Link className="button" to="/signin">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="kicker">Your account</p>
      <h1>History</h1>
      {status === 'loading' || status === 'idle' ? <p className="status">Loading your attempts…</p> : null}
      {status === 'error' ? (
        <p className="banner" role="alert">
          Could not load your attempts. Check your connection, and confirm that Firestore rules are deployed for this project.
        </p>
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
                    <span className="attempt-title">{drill?.title ?? attempt.drillId}</span>
                    <span className="attempt-score">{attempt.scoreLabel}</span>
                    <span className="attempt-when">{formatWhen(attempt.createdAt)}</span>
                  </summary>
                  <h2 className="fine-heading">Your answer</h2>
                  <p className="answer-text">{attempt.answer}</p>
                  {attempt.covered.length > 0 ? (
                    <>
                      <h2 className="fine-heading">Covered</h2>
                      <ul className="points points-covered">
                        {attempt.covered.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {attempt.missing.length > 0 ? (
                    <>
                      <h2 className="fine-heading">Missing</h2>
                      <ul className="points points-missing">
                        {attempt.missing.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {attempt.hitHeadings.length > 0 ? (
                    <>
                      <h2 className="fine-heading">Notes cited</h2>
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
    </div>
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

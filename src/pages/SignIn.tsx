import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { usePageTitle } from '../usePageTitle';

export function SignInPage() {
  usePageTitle('Sign in');
  const { user, configured, signIn } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/today" replace />;

  async function onSignIn() {
    setError('');
    setPending(true);
    try {
      await signIn();
    } catch (caught) {
      setError(signInMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="signin">
      <p className="kicker">Interview practice</p>
      <h1>One question a day. Feedback from your own notes.</h1>
      <p className="lede">
        Write the answer you would say out loud. InterviewDaily checks it against the drill rubric and shows short passages from your study notes.
      </p>
      <ol className="steps">
        <li>Open today’s drill and read the question.</li>
        <li>Write an answer, then get covered and missing points.</li>
        <li>Come back to the attempt later in History.</li>
      </ol>

      {configured ? (
        <button type="button" className="button" onClick={() => void onSignIn()} disabled={pending}>
          {pending ? 'Waiting for Google…' : 'Continue with Google'}
        </button>
      ) : (
        <div className="banner quiet">
          <p>
            Google sign-in needs a Firebase project. Copy <code>.env.example</code> to <code>.env</code>, add your web app keys, and restart the dev server.
          </p>
        </div>
      )}

      {error ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}

      <p className="fine">
        <Link to="/today">Practice without an account</Link>
        <span>. Feedback still works. Attempts are saved only after you sign in.</span>
      </p>
    </div>
  );
}

function signInMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/popup-closed-by-user') return 'The Google window was closed before signing in.';
  if (code === 'auth/popup-blocked') return 'The browser blocked the Google window. Allow popups for this site and try again.';
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorized for Google sign-in. Add it in Firebase Authentication settings.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is turned off in this Firebase project. Enable the Google provider and try again.';
  if (code === 'auth/cancelled-popup-request') return 'A sign-in window is already open.';
  return 'Google sign-in failed. Check the Firebase config and try again.';
}

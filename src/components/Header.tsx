import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth';
import { usePractice } from '../practice';

export function Header() {
  const { user, signOutUser } = useAuth();
  const { attempts, status } = usePractice();
  const [signOutError, setSignOutError] = useState('');
  const label = user?.displayName || user?.email || 'Account';
  const savedLabel = attempts.length === 1 ? '1 saved' : `${attempts.length} saved`;

  async function onSignOut() {
    setSignOutError('');
    try {
      await signOutUser();
    } catch {
      setSignOutError('Could not sign out. Try again.');
    }
  }

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/today" className="wordmark">
          <Mark />
          InterviewDaily
        </Link>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/today">Today</NavLink>
          <NavLink to="/notes">Notes</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
        <div className="account">
          {user ? (
            <>
              <span className="who" title={label}>
                {label}
              </span>
              {status === 'ready' ? (
                <Link className="saved-pill" to="/history">
                  {savedLabel}
                </Link>
              ) : null}
              <button type="button" className="text-button" onClick={() => void onSignOut()}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/signin">Sign in</NavLink>
          )}
        </div>
      </div>
      {signOutError ? (
        <p className="shell banner" role="alert">
          {signOutError}
        </p>
      ) : null}
    </header>
  );
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M9 8h10.2A3.8 3.8 0 0 1 23 11.8V24H12.8A3.8 3.8 0 0 0 9 27.8V8z" fill="#f4f1ea" />
      <path
        d="M12 13.2h8M12 17h8M12 20.8h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

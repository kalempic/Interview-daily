import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { loadAttempts, type NewAttempt, type SavedAttempt } from './attempts';

type PracticeState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  attempts: SavedAttempt[];
  remember: (attempt: NewAttempt) => void;
};

const PracticeContext = createContext<PracticeState | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [attempts, setAttempts] = useState<SavedAttempt[]>([]);
  const [status, setStatus] = useState<PracticeState['status']>('idle');
  const pending = useRef<SavedAttempt[]>([]);

  useEffect(() => {
    if (!ready) return;
    pending.current = [];
    if (!user) {
      setAttempts([]);
      setStatus('idle');
      return;
    }

    let active = true;
    setStatus('loading');
    loadAttempts(user.uid)
      .then((rows) => {
        if (!active) return;
        const locals = pending.current.filter((local) => !rows.some((row) => sameAttempt(local, row)));
        setAttempts([...locals, ...rows]);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setAttempts(pending.current);
        setStatus(pending.current.length > 0 ? 'ready' : 'error');
      });

    return () => {
      active = false;
    };
  }, [ready, user]);

  const value = useMemo<PracticeState>(
    () => ({
      status,
      attempts,
      remember(attempt) {
        const saved: SavedAttempt = {
          id: `local-${crypto.randomUUID()}`,
          uid: attempt.uid,
          drillId: attempt.drillId,
          answer: attempt.answer,
          scoreLabel: attempt.scoreLabel,
          covered: attempt.covered,
          missing: attempt.missing,
          hitHeadings: attempt.hitHeadings,
          createdAt: new Date(),
        };
        pending.current = [saved, ...pending.current];
        setAttempts((current) => [saved, ...current]);
        setStatus('ready');
      },
    }),
    [status, attempts],
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice(): PracticeState {
  const value = useContext(PracticeContext);
  if (!value) throw new Error('usePractice must be used inside PracticeProvider');
  return value;
}

function sameAttempt(local: SavedAttempt, saved: SavedAttempt): boolean {
  return local.drillId === saved.drillId && local.answer === saved.answer && local.scoreLabel === saved.scoreLabel;
}

import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { saveAttempt } from '../attempts';
import { useAuth } from '../auth';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { PracticeRecord } from '../components/PracticeRecord';
import { corpus } from '../content';
import { usePractice } from '../practice';
import { buildFeedback, selectDailyDrill, type Feedback } from '../rag';
import { usePageTitle } from '../usePageTitle';

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'local';

export function TodayPage() {
  usePageTitle('Today');
  const { user, configured } = useAuth();
  const { remember } = usePractice();
  const today = useMemo(() => selectDailyDrill(corpus.drills), []);
  const [drillId, setDrillId] = useState(today.id);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');

  const drill = corpus.drills.find((item) => item.id === drillId) ?? today;
  const isToday = drill.id === today.id;
  const text = answer.trim();
  const canSubmit = text.length > 0 && text !== submitted;
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function restoreAnswer(next: string) {
    setAnswer(next);
    setSubmitted('');
    setFeedback(null);
    setSaveState('idle');
    setSaveError('');
  }

  function resetPractice(nextId: string) {
    setDrillId(nextId);
    setAnswer('');
    setSubmitted('');
    setFeedback(null);
    setSaveState('idle');
    setSaveError('');
  }

  async function persist(next: Feedback, attemptText: string) {
    if (!next.scored) {
      setSaveState('local');
      return;
    }
    if (!configured || !user) {
      setSaveState('local');
      return;
    }
    setSaveState('saving');
    setSaveError('');
    try {
      await saveAttempt({
        uid: user.uid,
        drillId: drill.id,
        answer: attemptText,
        scoreLabel: next.scoreLabel,
        covered: next.covered,
        missing: next.missing,
        hitHeadings: next.hitHeadings,
      });
      setSaveState('saved');
      remember({
        uid: user.uid,
        drillId: drill.id,
        answer: attemptText,
        scoreLabel: next.scoreLabel,
        covered: next.covered,
        missing: next.missing,
        hitHeadings: next.hitHeadings,
      });
    } catch {
      setSaveState('error');
      setSaveError('Could not save this attempt. Check your connection and Firestore rules, then try again.');
    }
  }

  function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSubmit) return;
    const next = buildFeedback({
      drill,
      answer: text,
      noteChunks: corpus.noteChunks,
    });
    setFeedback(next);
    setSubmitted(text);
    void persist(next, text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div>
      <p className="kicker">
        {isToday ? dateLabel : 'Practice set'}
        <span aria-hidden="true"> · </span>
        {drill.track}
        <span aria-hidden="true"> · </span>
        {drill.minutes} min
      </p>
      <div className="title-row">
        <h1>{drill.title}</h1>
        {isToday ? null : (
          <button type="button" className="text-button" onClick={() => resetPractice(today.id)}>
            Back to today
          </button>
        )}
      </div>

      <label className="picker">
        <span>Drill</span>
        <select value={drill.id} onChange={(event) => resetPractice(event.target.value)}>
          {corpus.drills.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id === today.id ? `Today · ${item.title}` : item.title}
            </option>
          ))}
        </select>
      </label>

      <PracticeRecord drillId={drill.id} onRestore={restoreAnswer} />

      <article className="card question-card">
        <h2>Question</h2>
        <p className="question">{drill.question}</p>
        <h3>What interviewers check</h3>
        <ul className="checks">
          {drill.checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </article>

      <form className="answer-form" onSubmit={onSubmit}>
        <label htmlFor="answer">Your answer</label>
        <textarea
          id="answer"
          name="answer"
          value={answer}
          maxLength={8000}
          spellCheck
          placeholder="Write the answer you would say out loud."
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <p className="hint">A short paragraph is enough. Press Ctrl+Enter to get feedback.</p>
        <div className="actions">
          <button type="submit" className="button" disabled={!canSubmit}>
            Get feedback
          </button>
        </div>
        {!user && configured ? (
          <p className="fine">
            Sign in if you want this attempt added to <Link to="/history">your record</Link>.
          </p>
        ) : null}
        {!configured ? <p className="fine">Feedback works on this page. Add Firebase keys when you want a saved record.</p> : null}
      </form>

      {feedback ? <FeedbackPanel feedback={feedback} strongAnswer={drill.strongAnswer} /> : null}

      {feedback && saveState === 'saving' ? <p className="fine">Saving to History…</p> : null}
      {feedback && saveState === 'saved' ? (
        <p className="fine">
          Saved to <Link to="/history">History</Link>.
        </p>
      ) : null}
      {feedback && saveState === 'local' && feedback.scored && !configured ? (
        <p className="fine">This attempt stays on this page until Firebase is configured.</p>
      ) : null}
      {feedback && saveState === 'local' && feedback.scored && configured && !user ? (
        <p className="fine">
          This attempt is not saved. <Link to="/signin">Sign in</Link> to keep it on your record.
        </p>
      ) : null}
      {feedback?.scored && text === submitted ? <p className="fine">Edit the answer to score it again.</p> : null}
      {feedback && saveState === 'local' && !feedback.scored ? (
        <p className="fine">Write a fuller answer to save this attempt.</p>
      ) : null}
      {saveState === 'error' ? (
        <div className="banner" role="alert">
          <p>{saveError}</p>
          <button type="button" className="text-button" onClick={() => feedback && void persist(feedback, submitted)}>
            Try saving again
          </button>
        </div>
      ) : null}
    </div>
  );
}

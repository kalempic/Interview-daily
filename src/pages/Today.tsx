import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { saveAttempt } from '../attempts';
import { useAuth } from '../auth';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { PracticeRecord } from '../components/PracticeRecord';
import { Actions, Banner, Button, Card, Field, Fine, Hint, Kicker, Screen, TextButton, TitleRow } from '../components/ui';
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
    requestAnimationFrame(() => {
      document.getElementById('answer')?.focus();
    });
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
    <Screen>
      <Kicker>
        {isToday ? dateLabel : 'Practice set'}
        <span aria-hidden="true"> · </span>
        {drill.track}
        <span aria-hidden="true"> · </span>
        {drill.minutes} min
      </Kicker>
      <TitleRow>
        <h1>{drill.title}</h1>
        {isToday ? null : <TextButton onClick={() => resetPractice(today.id)}>Back to today</TextButton>}
      </TitleRow>

      <Field label="Drill" htmlFor="drill">
        <select id="drill" value={drill.id} onChange={(event) => resetPractice(event.target.value)}>
          {corpus.drills.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id === today.id ? `Today · ${item.title}` : item.title}
            </option>
          ))}
        </select>
      </Field>

      <PracticeRecord drillId={drill.id} onRestore={restoreAnswer} />

      <Card as="article" className="question-card">
        <h2>Question</h2>
        <p className="question">{drill.question}</p>
        <h3>What interviewers check</h3>
        <ul className="checks">
          {drill.checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </Card>

      <form className="answer-form" onSubmit={onSubmit}>
        <label htmlFor="answer">Your answer</label>
        <textarea
          id="answer"
          name="answer"
          value={answer}
          maxLength={8000}
          spellCheck
          placeholder="Write the answer you would say out loud."
          aria-describedby="answer-hint"
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Hint id="answer-hint">
          A short paragraph is enough. Press Ctrl+Enter, or Cmd+Enter on a Mac, to get feedback. The button stays off until the answer changes.
        </Hint>
        <Actions>
          <Button type="submit" disabled={!canSubmit}>
            Get feedback
          </Button>
        </Actions>
        {!user && configured ? (
          <Fine>
            Sign in if you want this attempt added to <Link to="/history">your record</Link>.
          </Fine>
        ) : null}
        {!configured ? <Fine>Feedback works on this page. Add Firebase keys when you want a saved record.</Fine> : null}
      </form>

      {feedback ? <FeedbackPanel feedback={feedback} strongAnswer={drill.strongAnswer} /> : null}

      {feedback && saveState === 'saving' ? <Fine role="status">Saving to History…</Fine> : null}
      {feedback && saveState === 'saved' ? (
        <Fine role="status">
          Saved to <Link to="/history">History</Link>.
        </Fine>
      ) : null}
      {feedback && saveState === 'local' && feedback.scored && !configured ? (
        <Fine>This attempt stays on this page until Firebase is configured.</Fine>
      ) : null}
      {feedback && saveState === 'local' && feedback.scored && configured && !user ? (
        <Fine>
          This attempt is not saved. <Link to="/signin">Sign in</Link> to keep it on your record.
        </Fine>
      ) : null}
      {feedback?.scored && text === submitted ? <Fine>Edit the answer to score it again.</Fine> : null}
      {feedback && saveState === 'local' && !feedback.scored ? <Fine>Write a fuller answer to save this attempt.</Fine> : null}
      {saveState === 'error' ? (
        <Banner>
          <p>{saveError}</p>
          <TextButton onClick={() => feedback && void persist(feedback, submitted)}>Try saving again</TextButton>
        </Banner>
      ) : null}
    </Screen>
  );
}

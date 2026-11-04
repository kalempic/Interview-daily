import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Feedback } from '../rag';
import { spokenScore } from '../spoken-score';
import { MarkdownView } from './MarkdownView';
import { Fine, Lede, PointList, Split } from './ui';

export function FeedbackPanel({ feedback, strongAnswer }: { feedback: Feedback; strongAnswer: string }) {
  const band = !feedback.scored ? 'none' : feedback.missing.length === 0 ? 'good' : feedback.covered.length === 0 ? 'low' : 'mid';
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [feedback]);

  return (
    <section className="feedback" aria-labelledby="feedback-heading">
      <p className={`score score-${band}`}>
        <strong aria-label={spokenScore(feedback.scoreLabel)}>{feedback.scoreLabel}</strong>
        {feedback.scored ? <span> key points</span> : null}
      </p>
      <h2 id="feedback-heading" ref={headingRef} tabIndex={-1}>
        {feedback.headline}
      </h2>
      <Lede>{feedback.detail}</Lede>

      {feedback.scored ? (
        <Split>
          <section>
            <h3>Covered</h3>
            {feedback.covered.length > 0 ? (
              <PointList tone="covered" points={feedback.covered} />
            ) : (
              <p>No rubric point matched.</p>
            )}
          </section>
          <section>
            <h3>Missing</h3>
            {feedback.missing.length > 0 ? (
              <PointList tone="missing" points={feedback.missing} />
            ) : (
              <p>Nothing from the rubric is missing.</p>
            )}
          </section>
        </Split>
      ) : null}

      <h3>From your notes</h3>
      {feedback.snippets.length === 0 ? (
        <p>No note passage was close enough to cite.</p>
      ) : (
        <ul className="snippets">
          {feedback.snippets.map((snippet) => (
            <li key={`${snippet.docId}-${snippet.heading}`}>
              <blockquote>
                <p>{snippet.text}</p>
                <footer>
                  <Link to={`/notes/${snippet.docId}`}>{snippet.docTitle}</Link>
                  <span> · {snippet.heading}</span>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      )}

      {feedback.scored ? (
        <details className="strong">
          <summary>Read a strong answer</summary>
          <Fine>This is the reference answer stored on the drill. It is not a quote from your notes.</Fine>
          <MarkdownView markdown={strongAnswer} />
        </details>
      ) : null}
    </section>
  );
}

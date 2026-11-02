import { Link } from 'react-router-dom';
import type { Feedback } from '../rag';
import { MarkdownView } from './MarkdownView';

export function FeedbackPanel({ feedback, strongAnswer }: { feedback: Feedback; strongAnswer: string }) {
  const band = !feedback.scored ? 'none' : feedback.missing.length === 0 ? 'good' : feedback.covered.length === 0 ? 'low' : 'mid';

  return (
    <section className="feedback" aria-live="polite" aria-label="Feedback">
      <p className={`score score-${band}`}>
        <strong>{feedback.scoreLabel}</strong>
        {feedback.scored ? <span> key points</span> : null}
      </p>
      <h2>{feedback.headline}</h2>
      <p className="lede">{feedback.detail}</p>

      {feedback.scored ? (
        <div className="split">
          <div>
            <h3>Covered</h3>
            {feedback.covered.length > 0 ? (
              <ul className="points points-covered">
                {feedback.covered.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : (
              <p>No rubric point matched.</p>
            )}
          </div>
          <div>
            <h3>Missing</h3>
            {feedback.missing.length > 0 ? (
              <ul className="points points-missing">
                {feedback.missing.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : (
              <p>Nothing from the rubric is missing.</p>
            )}
          </div>
        </div>
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
          <p className="fine">This is the reference answer stored on the drill. It is not a quote from your notes.</p>
          <MarkdownView markdown={strongAnswer} />
        </details>
      ) : null}
    </section>
  );
}

import { corpus } from '../content';
import { APP_VERSION } from '../version';

export function Footer() {
  return (
    <footer className="site-footer">
      <p className="shell">
        InterviewDaily v{APP_VERSION}
        <span aria-hidden="true"> · </span>
        <span>{corpus.noteChunks.length} note chunks</span>
      </p>
    </footer>
  );
}

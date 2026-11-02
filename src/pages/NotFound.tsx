import { Link } from 'react-router-dom';
import { usePageTitle } from '../usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div>
      <h1>That page does not exist</h1>
      <p>The link may be out of date. Today’s drill is the place to start.</p>
      <p>
        <Link to="/today">Go to Today</Link>
      </p>
    </div>
  );
}

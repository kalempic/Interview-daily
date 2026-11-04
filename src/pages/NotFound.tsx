import { Link } from 'react-router-dom';
import { Screen } from '../components/ui';
import { usePageTitle } from '../usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <Screen>
      <h1>That page does not exist</h1>
      <p>The link may be out of date. Today’s drill is the place to start.</p>
      <p>
        <Link to="/today">Go to Today</Link>
      </p>
    </Screen>
  );
}

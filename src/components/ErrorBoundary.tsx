import { Component, type ReactNode } from 'react';
import { Button } from './ui';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="shell page">
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Reload it and try the drill again.</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </main>
    );
  }
}

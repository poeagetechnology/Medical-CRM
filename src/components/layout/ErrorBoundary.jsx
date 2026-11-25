import React from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button, EmptyState } from '../ui';

// A crash in one screen must not blank the whole app.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-8">
        <div className="card">
          <EmptyState
            icon={TriangleAlert}
            title="This screen ran into a problem"
            description="Your data is safe. Try again, or open another screen from the menu."
            action={<Button variant="primary" icon={RotateCcw} onClick={() => this.setState({ error: null })}>Try again</Button>}
          />
        </div>
      </div>
    );
  }
}

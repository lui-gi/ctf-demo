import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { strings } from '@/theme/strings';
import { Button } from '@/ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  err: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', err, info);
  }

  reset = (): void => this.setState({ err: null });

  render(): ReactNode {
    if (this.state.err) {
      return (
        <div
          role="alert"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            maxWidth: 640,
            margin: '0 auto',
          }}
        >
          <h1>{strings.common.notFoundHeading}</h1>
          <p>{strings.common.error(this.state.err.message)}</p>
          <Button variant="primary" onClick={this.reset}>
            {strings.common.retry}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

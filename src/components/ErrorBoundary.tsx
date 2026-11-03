import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a single failing page from blanking the whole dashboard.
 * Navigating to another page clears the error through `resetKey`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ENVIS page error:', error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="animate-fade-up py-10">
        <div className="card mx-auto max-w-xl p-6 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20">
            <AlertTriangle size={20} />
          </div>
          <h1 className="mt-3 text-[16px] font-semibold text-slate-100">This view could not be rendered</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
            The rest of the dashboard is still available. Try reloading the page or opening it again from the sidebar.
          </p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => window.location.reload()}>
            <RefreshCw size={13} /> Reload dashboard
          </button>
        </div>
      </div>
    );
  }
}

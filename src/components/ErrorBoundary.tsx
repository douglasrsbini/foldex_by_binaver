import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Falha inesperada na interface.',
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('[Foldex UI Error]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex h-screen w-screen items-center justify-center bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <section className="liquid-glass-surface w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mb-2 text-lg font-bold">O Foldex encontrou um problema</h1>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            A interface foi protegida. Recarregue o aplicativo para retomar o trabalho.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-95"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <RefreshCw size={15} />
            Recarregar aplicativo
          </button>
          <p className="mt-5 truncate text-[10px] text-slate-400" title={this.state.errorMessage}>
            {this.state.errorMessage}
          </p>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;

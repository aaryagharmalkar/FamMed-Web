import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-card dark:border-slate-700 dark:bg-slate-800">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{this.state.message}</p>
            <button
              className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-white focus-ring"
              onClick={this.handleReload}
              type="button"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

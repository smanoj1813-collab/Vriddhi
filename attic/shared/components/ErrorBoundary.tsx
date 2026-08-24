import React, { Component, ErrorInfo, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, 
  RotateCcw, ShieldAlert, XCircle 
} from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props & { navigate: ReturnType<typeof useNavigate> }, State> {
  constructor(props: Props & { navigate: ReturnType<typeof useNavigate> }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Send to error tracking in production
    if (import.meta.env.PROD) {
      this.sendErrorToServer(error, errorInfo);
    }
  }

  private sendErrorToServer = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silent fail
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.props.navigate("/");
    this.handleReset();
  };

  handleGoBack = () => {
    this.props.navigate(-1);
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;
      const { error, errorInfo } = this.state;

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              Something Went Wrong
            </h1>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              We apologize for the inconvenience. The application encountered an unexpected error.
            </p>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Bug className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">Error Details</p>
                  <code className="text-xs text-red-300 break-all font-mono">
                    {error?.message || "Unknown error"}
                  </code>
                </div>
              </div>
            </div>

            {/* Show stack trace in development */}
            {isDev && errorInfo && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 text-left max-h-64 overflow-auto">
                <p className="text-xs font-medium text-slate-500 mb-2">Component Stack:</p>
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap break-all">
                  {errorInfo.componentStack}
                </pre>
                {error?.stack && (
                  <>
                    <p className="text-xs font-medium text-slate-500 mt-4 mb-2">Stack Trace:</p>
                    <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoBack}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>

            {isDev && (
              <p className="text-xs text-slate-600 mt-4">
                Development Mode — Stack traces are visible
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to inject navigate hook
export const ErrorBoundary: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  return <ErrorBoundaryClass {...props} navigate={navigate} />;
};

// ==================== SECTION ERROR BOUNDARY ====================

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
  onReset?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundaryClass extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<SectionErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.sectionName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 m-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Error Loading {this.props.sectionName}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            This section failed to load. You can try refreshing it.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = (props) => {
  return <SectionErrorBoundaryClass {...props} />;
};

// ==================== ROUTE ERROR ELEMENT ====================

export const RouteErrorElement: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Page Error</h1>
        <p className="text-slate-400 mb-6">
          This page failed to load. The route may be invalid or there was a network error.
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
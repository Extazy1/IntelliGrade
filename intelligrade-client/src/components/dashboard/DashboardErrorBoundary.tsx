"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface DashboardErrorBoundaryProps {
  children: ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  timestamp: number;
}

/**
 * Catches runtime errors that occur inside the dashboard shell so we can
 * surface actionable diagnostics instead of leaving the page blank. The
 * captured error details are written to the window for inspection and rendered
 * in a minimal fallback UI so operators can report them.
 */
export class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  public state: DashboardErrorBoundaryState = {
    hasError: false,
    timestamp: Date.now(),
  };

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return {
      hasError: true,
      error,
      timestamp: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (typeof window !== "undefined") {
      (window as typeof window & {
        __INTELLIGRADE_DASHBOARD_ERROR__?: unknown;
      }).__INTELLIGRADE_DASHBOARD_ERROR__ = {
        error,
        errorInfo,
        timestamp: new Date().toISOString(),
      };
    }

    // eslint-disable-next-line no-console
    console.error("[dashboard] runtime error", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const stack = this.state.error?.stack ?? this.state.errorInfo?.componentStack;

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background p-6 text-sm text-foreground">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center">
            <h1 className="text-lg font-semibold text-destructive">
              Dashboard failed to render
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              An unexpected error occurred while rendering the dashboard. Check
              the browser console for the <code>__INTELLIGRADE_DASHBOARD_ERROR__</code>
              payload or share the stack trace below with the development team.
            </p>
          </div>
          {stack ? (
            <pre className="max-h-[40vh] w-full max-w-3xl overflow-auto rounded-lg border bg-muted p-4 text-left text-xs leading-relaxed">
              {stack}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-md border bg-primary px-4 py-2 text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Reload dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


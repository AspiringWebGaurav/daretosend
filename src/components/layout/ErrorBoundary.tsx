"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    /** Optional custom fallback — receives error and reset function */
    fallback?: (props: { error: Error; resetError: () => void }) => React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * React class-based error boundary.
 * Catches unhandled errors in the child component tree and renders
 * a graceful fallback UI with retry capability — no full page reload needed.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[DTS] ErrorBoundary caught:", error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Custom fallback
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    resetError: this.resetError,
                });
            }

            // Default fallback UI
            return (
                <div className="flex items-center justify-center min-h-[40vh] p-8">
                    <div className="flex flex-col items-center gap-5 text-center max-w-md">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-foreground">
                                Something went wrong
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                An unexpected error occurred. This has been logged for review.
                            </p>
                            {process.env.NODE_ENV === "development" && (
                                <p className="text-xs text-destructive/70 font-mono mt-2 p-2 bg-destructive/5 rounded-md break-all">
                                    {this.state.error.message}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={this.resetError}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

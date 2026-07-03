import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);

        // Report to audit_log in production (fire-and-forget)
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
                fetch(`${supabaseUrl}/rest/v1/audit_log`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                        Prefer: "return=minimal",
                    },
                    body: JSON.stringify({
                        action: "error.frontend_crash",
                        resource_type: "ui",
                        metadata: {
                            message: error.message,
                            stack: error.stack?.slice(0, 500),
                            component: errorInfo.componentStack?.slice(0, 300),
                            url: window.location.href,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                }).catch(() => { /* silent fail */ });
            }
        } catch { /* silent fail */ }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
                    <div className="mx-auto max-w-md text-center space-y-4">
                        <div className="text-6xl">😕</div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Something went wrong
                        </h1>
                        <p className="text-muted-foreground">
                            An unexpected error occurred. Please refresh the page to try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            Refresh Page
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-4 text-left rounded border p-3 text-xs text-muted-foreground">
                                <summary className="cursor-pointer font-medium">Error Details (Dev Only)</summary>
                                <pre className="mt-2 whitespace-pre-wrap break-words">
                                    {this.state.error.message}
                                    {"\n"}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

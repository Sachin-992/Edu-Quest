import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[SectionError] ${this.props.fallbackTitle || "Section"}:`, error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border border-border/30">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1">
                        {this.props.fallbackTitle || "Something went wrong"}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                        This section encountered an error. Try refreshing.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleRetry}
                        className="gap-2 rounded-xl text-xs"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default SectionErrorBoundary;

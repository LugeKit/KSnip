import { error } from "@tauri-apps/plugin-log";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";
import AppHeader from "./ui/AppHeader";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(e: Error, errorInfo: ErrorInfo) {
        error(`Uncaught error: ${e.message}, errorInfo: ${JSON.stringify(errorInfo)}`);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="relative p-1 w-screen h-screen bg-transparent antialiased">
                    <div className="flex h-full w-full flex-col bg-background border overflow-hidden text-foreground rounded-md shadow-sm">
                        <AppHeader />
                        <div className="flex flex-1 flex-col items-center justify-center p-4">
                            <div className="flex max-w-md flex-col items-center gap-4 text-center">
                                <div className="rounded-full bg-destructive/10 p-4">
                                    <AlertCircle className="h-10 w-10 text-destructive" />
                                </div>
                                <h1 className="text-2xl font-bold">Something went wrong</h1>
                                <p className="text-muted-foreground">
                                    {this.state.error?.message || "An unexpected error occurred."}
                                </p>
                                <button
                                    onClick={this.handleReload}
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reload Application
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;

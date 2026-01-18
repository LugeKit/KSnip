import { SidebarProvider } from "@/components/ui/sidebar";
import { registerGlobalShortcut } from "@/lib/utils";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { useEffect } from "react";
import AppHeader from "./components/AppHeader";
import AppSidebar from "./components/AppSidebar";

export default function MainPage() {
    useEffect(() => {
        registerGlobalShortcut("Alt+A", startSnip);
    }, [startSnip]);

    return (
        <div className="h-svh overflow-hidden bg-background border rounded-md">
            <SidebarProvider className="min-h-0">
                <AppSidebar />
                <div className="flex-1">
                    <AppHeader />
                    <main> </main>
                </div>
            </SidebarProvider>
        </div>
    );
}

function startSnip() {
    debug("[MainPage] start cut");
    const overlayWindow = new WebviewWindow("screenshot-overlay", {
        url: "index.html#screenshot",
        fullscreen: true,
        transparent: true,
        alwaysOnTop: true,
        decorations: false,
    });

    overlayWindow.once("tauri://created", () => {
        info("[MainPage] overlayWindow created");
    });

    overlayWindow.once("tauri://error", (e) => {
        error(`[MainPage] overlayWindow error: ${e.payload}`);
    });
}

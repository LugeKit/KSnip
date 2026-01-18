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
        <div className="relative h-screen w-screen antialiased p-2">
            <div className="relative h-full w-full border rounded-md overflow-hidden bg-background shadow-md">
                <SidebarProvider className="h-full">
                    <AppSidebar />
                    <div className="flex flex-col flex-1">
                        <AppHeader />
                        <main className="flex-1"> </main>
                    </div>
                </SidebarProvider>
            </div>
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

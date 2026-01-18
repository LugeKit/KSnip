import { SidebarProvider } from "@/components/ui/sidebar";
import { registerGlobalShortcut } from "@/lib/utils";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { useEffect } from "react";
import AppSidebar from "./components/AppSidebar";
import AppHeader from "./components/AppHeader";

export default function MainPage() {
    useEffect(() => {
        registerGlobalShortcut("Alt+A", startSnip);
    }, [startSnip]);

    return (
        <SidebarProvider className="bg-background">
            <AppSidebar />
            <AppHeader />
            <main> </main>
        </SidebarProvider>
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

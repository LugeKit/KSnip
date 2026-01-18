import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { registerGlobalShortcut } from "@/lib/utils";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { useCallback, useEffect } from "react";
import AppSidebar from "./components/AppSideBar";

export default function MainPage() {
    const startCut = useCallback(() => {
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
    }, []);

    useEffect(() => {
        registerGlobalShortcut("Alt+A", startCut);
    }, [startCut]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <main>
                <SidebarTrigger />
            </main>
        </SidebarProvider>
    );
}

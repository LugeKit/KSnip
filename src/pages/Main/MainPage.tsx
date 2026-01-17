import { useShortCut } from "@/hooks/useShortCut";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { useCallback } from "react";

export default function MainPage() {
    const startCut = useCallback(() => {
        debug("[MainPage] start cut");
        const overlayWindow = new WebviewWindow("screenshot-overlay", {
            url: "index.html#screenshot",
            fullscreen: true,
            transparent: true,
            decorations: false,
        });

        overlayWindow.once("tauri://created", () => {
            info("[MainPage] overlayWindow created");
        });

        overlayWindow.once("tauri://error", (e) => {
            error(`[MainPage] overlayWindow error: ${e.payload}`);
        });
    }, []);

    useShortCut("Alt+a", startCut, [startCut]);

    return (
        <main className="h-screen flex flex-col justify-center items-center text-center antialiased leading-6">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                    ksnip
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Simple Screen Capture Tool
                </p>
                <button
                    onClick={startCut}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 hover:border-blue-400 border border-transparent transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
                >
                    "Cut Me!"
                </button>
            </div>
        </main>
    );
}

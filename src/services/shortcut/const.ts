import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";

export const DEFAULT_SHORTCUT_SETTING = {
    shortcuts: {
        take_screenshot: {
            id: "take_screenshot",
            keys: ["Alt", "A"],
            enabled: true,
        },
        test: {
            id: "test",
            keys: ["Alt", "T"],
            enabled: true,
        },
        screenshot_exit: {
            id: "screenshot_exit",
            keys: ["Escape"],
            enabled: true,
        },
    },
};

export const GLOBAL_SHORTCUT_ID: Record<string, boolean> = {
    take_screenshot: true,
    test: true,
};

export const GLOBAL_SHORTCUT_FUNCTION: Record<string, () => void> = {
    take_screenshot: () => {
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
    },
};

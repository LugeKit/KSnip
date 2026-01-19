import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";

export const KEYBOARD_SETTING_PAGE_TABS = [
    {
        value: "basic",
        label: "全局热键",
    },
    {
        value: "screenshot",
        label: "截图界面",
    },
];

export const DEFAULT_SHORTCUT_SETTING = {
    shortcuts: {
        take_screenshot: {
            id: "take_screenshot",
            command_name: "截图",
            setting_page_tab_value: "basic",
            isGlobal: true,
            keys: ["Alt", "A"],
            enabled: true,
        },
        test: {
            id: "test",
            command_name: "测试",
            setting_page_tab_value: "basic",
            isGlobal: true,
            keys: ["Alt", "T"],
            enabled: true,
        },
    },
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

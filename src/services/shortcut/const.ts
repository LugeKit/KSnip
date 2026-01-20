import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { Shortcut, ShortcutSetting } from "./types";

export const DEFAULT_SHORTCUT_SETTING: ShortcutSetting = {
    shortcuts: {
        take_screenshot: new Shortcut("take_screenshot", ["Alt", "A"], true, take_screenshot),
        test: new Shortcut("test", ["Alt", "T"], false, test),
        screenshot_exit: new Shortcut("screenshot_exit", ["Escape"], true, null),
    },
};

function take_screenshot() {
    debug("take_screenshot is invoked");
    const overlayWindow = new WebviewWindow("screenshot-overlay", {
        url: "index.html#screenshot",
        fullscreen: true,
        transparent: true,
        alwaysOnTop: true,
        decorations: false,
    });

    overlayWindow.once("tauri://created", () => {
        info("overlayWindow created");
    });

    overlayWindow.once("tauri://error", (e) => {
        error(`overlayWindow create error: ${e.payload}`);
    });
}

function test() {
    debug("test");
}

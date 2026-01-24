import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { Shortcut, ShortcutSetting } from "./types";

export const SHORTCUT_SCREENSHOT_EXIT = "SHORTCUT_SCREENSHOT_EXIT";
export const SHORTCUT_TEST = "SHORTCUT_TEST";
export const SHORTCUT_TAKE_SCREENSHOT = "SHORTCUT_TAKE_SCREENSHOT";
export const SHORTCUT_SCREENSHOT_CONFIRM = "SHORTCUT_SCREENSHOT_CONFIRM";
export const SHORTCUT_CREATE_PIN = "SHORTCUT_CREATE_PIN";
export const SHORTCUT_RECORD_REGION = "SHORTCUT_RECORD_REGION";
export const SHORTCUT_RECORD_REGION_CONFIRM = "SHORTCUT_RECORD_REGION_CONFIRM";

export const DEFAULT_SHORTCUT_SETTING: ShortcutSetting = {
    shortcuts: {
        [SHORTCUT_TAKE_SCREENSHOT]: new Shortcut(
            SHORTCUT_TAKE_SCREENSHOT,
            ["Alt", "A"],
            true,
            "basic",
            "区域截图",
            take_screenshot,
        ),
        [SHORTCUT_TEST]: new Shortcut(SHORTCUT_TEST, ["Alt", "T"], false, "basic", "测试", test),
        [SHORTCUT_SCREENSHOT_EXIT]: new Shortcut(
            SHORTCUT_SCREENSHOT_EXIT,
            ["ESCAPE"],
            true,
            "screenshot",
            "退出截图",
            null,
        ),
        [SHORTCUT_SCREENSHOT_CONFIRM]: new Shortcut(
            SHORTCUT_SCREENSHOT_CONFIRM,
            ["ENTER"],
            true,
            "screenshot",
            "确认截图",
            null,
        ),
        [SHORTCUT_CREATE_PIN]: new Shortcut(SHORTCUT_CREATE_PIN, ["D"], true, "screenshot", "贴图", null),
        [SHORTCUT_RECORD_REGION]: new Shortcut(SHORTCUT_RECORD_REGION, ["R"], true, "screenshot", "区域录屏", null),
        [SHORTCUT_RECORD_REGION_CONFIRM]: new Shortcut(
            SHORTCUT_RECORD_REGION_CONFIRM,
            ["Shift", "Enter"],
            true,
            "screenshot",
            "确认区域录屏",
            null,
        ),
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

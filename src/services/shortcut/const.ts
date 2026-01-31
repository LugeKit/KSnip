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
export const SHORTCUT_TOOL_RECTANGLE = "SHORTCUT_TOOL_RECTANGLE";
export const SHORTCUT_TOOL_ARROW = "SHORTCUT_TOOL_ARROW";
export const SHORTCUT_TOOL_LINE = "SHORTCUT_TOOL_LINE";
export const SHORTCUT_TOOL_PEN = "SHORTCUT_TOOL_PEN";
export const SHORTCUT_UNDO = "SHORTCUT_UNDO";
export const SHORTCUT_REDO = "SHORTCUT_REDO";
export const SHORTCUT_TOOL_SEQUENCE = "SHORTCUT_TOOL_SEQUENCE";

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
        [SHORTCUT_RECORD_REGION]: new Shortcut(SHORTCUT_RECORD_REGION, ["R"], true, "screenshot", "区域录制", null),
        [SHORTCUT_RECORD_REGION_CONFIRM]: new Shortcut(
            SHORTCUT_RECORD_REGION_CONFIRM,
            ["Shift", "Enter"],
            true,
            "screenshot",
            "完成录制",
            null,
        ),
        [SHORTCUT_TOOL_RECTANGLE]: new Shortcut(SHORTCUT_TOOL_RECTANGLE, ["1"], true, "screenshot", "矩形工具", null),
        [SHORTCUT_TOOL_ARROW]: new Shortcut(SHORTCUT_TOOL_ARROW, ["2"], true, "screenshot", "箭头工具", null),
        [SHORTCUT_TOOL_LINE]: new Shortcut(SHORTCUT_TOOL_LINE, ["3"], true, "screenshot", "直线工具", null),
        [SHORTCUT_TOOL_PEN]: new Shortcut(SHORTCUT_TOOL_PEN, ["4"], true, "screenshot", "画笔工具", null),
        [SHORTCUT_TOOL_SEQUENCE]: new Shortcut(SHORTCUT_TOOL_SEQUENCE, ["5"], true, "screenshot", "序号工具", null),
        [SHORTCUT_UNDO]: new Shortcut(SHORTCUT_UNDO, ["CTRL", "Z"], true, "screenshot", "撤销", null),
        [SHORTCUT_REDO]: new Shortcut(SHORTCUT_REDO, ["CTRL", "R"], true, "screenshot", "前进", null),
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

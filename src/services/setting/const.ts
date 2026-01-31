import { Setting, SettingValueBoolean, SettingValuePath } from "@/services/setting/types.ts";

export const ENABLE_DEBUG_SETTING = "ENABLE_DEBUG_SETTING";
export const RECORDING_PATH_SETTING = "RECORDING_PATH_SETTING";

export const DEFAULT_SETTING: Record<string, Setting> = {
    [ENABLE_DEBUG_SETTING]: new Setting(
        ENABLE_DEBUG_SETTING,
        "开启调试功能",
        "",
        "Boolean",
        new SettingValueBoolean(false),
    ),
    [RECORDING_PATH_SETTING]: new Setting(
        RECORDING_PATH_SETTING,
        "录制文件保存路径",
        "设置区域录屏文件的保存位置",
        "Path",
        new SettingValuePath(""),
    ),
};

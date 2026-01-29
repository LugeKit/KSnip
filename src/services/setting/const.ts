import { Setting, SettingValueBoolean } from "@/services/setting/types.ts";

export const ENABLE_DEBUG_SETTING = "ENABLE_DEBUG_SETTING";

export const DEFAULT_SETTING: Record<string, Setting> = {
    [ENABLE_DEBUG_SETTING]: new Setting(
        ENABLE_DEBUG_SETTING,
        "开启调试功能",
        "",
        "Boolean",
        new SettingValueBoolean(false),
    ),
};

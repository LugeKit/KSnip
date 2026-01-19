import { debug } from "@tauri-apps/plugin-log";
import { Store } from "@tauri-apps/plugin-store";

export interface ShortcutSetting {
    shortcuts: Record<string, Shortcut>;
}

export interface Shortcut {
    id: string;
    command_name: string;
    setting_page_tab_value: string;
    isGlobal: boolean;
    keys: string[];
    enabled: boolean;
}

const SHORTCUT_SETTING_KEY = "shortcut_setting";

export async function getShortcutSetting(
    store: Store,
): Promise<ShortcutSetting> {
    const shortcutSetting =
        await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);

    debug(`[shortcut service] shortcut setting in store: ${shortcutSetting}`);

    if (!shortcutSetting) {
        const setting = defaultSetting();
        await store.set(SHORTCUT_SETTING_KEY, setting);
        await store.save();
        return setting;
    }

    return shortcutSetting;
}

export async function getShortcut(
    store: Store,
    id: string,
): Promise<Shortcut | undefined> {
    const shortcutSetting = await getShortcutSetting(store);
    debug(
        `[shortcut service] shortcut [${id}] in store: ${shortcutSetting.shortcuts[id]}`,
    );

    return shortcutSetting.shortcuts[id];
}

export async function updateShortcut(
    store: Store,
    id: string,
    shortcut: Shortcut,
): Promise<void> {
    debug(`[shortcut service] updating shortcut [${id}] in store: ${shortcut}`);

    const shortcutSetting = await getShortcutSetting(store);
    shortcutSetting.shortcuts[id] = shortcut;
    await store.set(SHORTCUT_SETTING_KEY, shortcutSetting);
    await store.save();
}

function defaultSetting(): ShortcutSetting {
    return {
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
                enabled: false,
            },
        },
    };
}

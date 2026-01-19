import { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { debug, error, warn } from "@tauri-apps/plugin-log";
import { getLocalStore } from "../store";
import { DEFAULT_SHORTCUT_SETTING, GLOBAL_SHORTCUT_FUNCTION } from "./const";

const SHORTCUT_SETTING_KEY = "shortcut_setting";

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

export async function initShortcut() {
    try {
        const store = await getLocalStore();
        let shortcutSetting = await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);
        if (!shortcutSetting) {
            shortcutSetting = DEFAULT_SHORTCUT_SETTING;
        }
        await initGlobalShortcutRegister(shortcutSetting.shortcuts);
        await store.set(SHORTCUT_SETTING_KEY, shortcutSetting);
        await store.save();
    } catch (e) {
        error(`[shortcut service] failed to init shortcut: ${e}`);
    }
}

async function initGlobalShortcutRegister(shortcuts: Record<string, Shortcut>) {
    for (const shortcut of Object.values(shortcuts)) {
        if (!shortcut.isGlobal || !shortcut.enabled) {
            continue;
        }

        const f = GLOBAL_SHORTCUT_FUNCTION[shortcut.id];
        if (!f) {
            warn(`[shortcut service] function for shortcut [${shortcut.id}] not found`);
            shortcut.enabled = false;
            continue;
        }

        try {
            await registerGlobalShortcut(shortcut.keys.join("+"), f);
        } catch (e) {
            error(`[shortcut service] failed to register global shortcut [${shortcut.keys}]: ${e}`);
            shortcut.enabled = false;
        }
    }
}

export async function getShortcutSetting(): Promise<ShortcutSetting> {
    const store = await getLocalStore();
    const shortcutSetting = await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);

    debug(`[shortcut service] load shortcut setting from store: ${JSON.stringify(shortcutSetting)}`);

    if (!shortcutSetting) {
        const setting = DEFAULT_SHORTCUT_SETTING;
        await store.set(SHORTCUT_SETTING_KEY, setting);
        await store.save();
        return setting;
    }

    return shortcutSetting;
}

export async function getShortcut(id: string): Promise<Shortcut | undefined> {
    const shortcutSetting = await getShortcutSetting();
    debug(`[shortcut service] shortcut [${id}] in store: ${JSON.stringify(shortcutSetting.shortcuts[id])}`);

    return shortcutSetting.shortcuts[id];
}

export async function updateShortcutEnabled(id: string, enabled: boolean) {
    const shortcutSetting = await getShortcutSetting();
    const shortcut = shortcutSetting.shortcuts[id];
    if (!shortcut) {
        warn(`[shortcut service] failed to update enable status: shortcut [${id}] not found`);
        return;
    }

    if (shortcut.enabled === enabled) {
        return;
    }

    // for non-global shortcut, just update the enabled status
    // the shortcut registration will only happen when the window is open
    if (!shortcut.isGlobal) {
        shortcut.enabled = enabled;
        await saveShortcut(shortcutSetting);
        return;
    }

    // from diabled -> enabled, register the global shortcut
    if (enabled) {
        const f = GLOBAL_SHORTCUT_FUNCTION[shortcut.id];
        if (!f) {
            warn(
                `[shortcut service] failed to update enable status: global shortcut function [${shortcut.id}] not found`,
            );
            return;
        }

        try {
            await registerGlobalShortcut(shortcut.keys.join("+"), f);
            shortcut.enabled = enabled;
        } catch (e) {
            error(`[shortcut service] failed to register global shortcut [${shortcut.keys}]: ${e}`);
        }
        return;
    }

    // for enabled -> disabled, unregister the global shortcut
    try {
        await unregisterGlobalShortcut(shortcut.keys.join("+"));
        shortcut.enabled = enabled;
    } catch (e) {
        error(`[shortcut service] failed to unregister global shortcut [${shortcut.keys}]: ${e}`);
    }
}

export async function updateShortcut(id: string, shortcut: Shortcut): Promise<void> {
    debug(`[shortcut service] updating shortcut [${id}] in store: ${JSON.stringify(shortcut)}`);
}

async function saveShortcut(setting: ShortcutSetting) {
    const store = await getLocalStore();
    await store.set(SHORTCUT_SETTING_KEY, setting);
    await store.save();
}

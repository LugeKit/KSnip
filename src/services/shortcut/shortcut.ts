import { isGlobalShortcutRegistration, registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { debug, error, warn } from "@tauri-apps/plugin-log";
import { getLocalStore } from "../store";
import { DEFAULT_SHORTCUT_SETTING, GLOBAL_SHORTCUT_FUNCTION, GLOBAL_SHORTCUT_ID } from "./const";

const SHORTCUT_SETTING_KEY = "shortcut_setting";

export interface ShortcutSetting {
    shortcuts: Record<string, Shortcut>;
}

export interface Shortcut {
    id: string;
    keys: string[];
    enabled: boolean;
}

export async function initShortcut() {
    try {
        const store = await getLocalStore();
        let setting = await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);
        setting = mergeWithDefault(setting);
        await initGlobalShortcutRegister(setting.shortcuts);
        await store.set(SHORTCUT_SETTING_KEY, setting);
        await store.save();
        debug(`[shortcut service] init shortcut: ${JSON.stringify(setting)}`);
    } catch (e) {
        error(`[shortcut service] failed to init shortcut: ${e}`);
    }
}

function mergeWithDefault(setting: ShortcutSetting | undefined) {
    if (!setting) {
        return DEFAULT_SHORTCUT_SETTING;
    }

    const shortcuts: Record<string, Shortcut> = {};
    for (const [id, shortcut] of Object.entries(DEFAULT_SHORTCUT_SETTING.shortcuts)) {
        const saved = setting.shortcuts[id];
        if (!saved) {
            shortcuts[id] = shortcut;
            continue;
        }

        shortcuts[id] = {
            id: saved.id,
            keys: saved.keys,
            enabled: saved.enabled,
        };
    }

    return {
        shortcuts: shortcuts,
    };
}

function isGlobalShortcut(id: string) {
    return GLOBAL_SHORTCUT_ID[id] ? true : false;
}

async function initGlobalShortcutRegister(shortcuts: Record<string, Shortcut>) {
    for (const shortcut of Object.values(shortcuts)) {
        debug(`[shortcut service] init global shortcut register: ${JSON.stringify(shortcut)}`);
        if (!isGlobalShortcut(shortcut.id) || !shortcut.enabled) {
            continue;
        }

        const f = GLOBAL_SHORTCUT_FUNCTION[shortcut.id];
        // global function not found
        if (!f) {
            warn(`[shortcut service] function for shortcut [${shortcut.id}] not found`);
            shortcut.enabled = false;
            continue;
        }

        try {
            // check if the shortcut is already registered
            if (await isGlobalShortcutRegistration(shortcut.keys)) {
                // shortcut is already registered, unregister it first
                await unregisterGlobalShortcut(shortcut.keys);
            }
            await registerGlobalShortcut(shortcut.keys, f);
        } catch (e) {
            error(`[shortcut service] failed to register global shortcut [${shortcut.keys}]: ${e}`);
            shortcut.enabled = false;
        }
    }
}

async function getShortcutSetting(): Promise<ShortcutSetting | undefined> {
    const store = await getLocalStore();
    return await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);
}

export async function getShortcut(id: string): Promise<Shortcut | null> {
    const setting = await getShortcutSetting();
    if (!setting) {
        warn(`[shortcut service] failed to get shortcut: shortcuts is null`);
        return null;
    }

    if (!setting.shortcuts[id]) {
        warn(`[shortcut service] failed to get shortcut: shortcut [${id}] not found`);
        return null;
    }

    return setting.shortcuts[id];
}

export async function updateShortcutEnabled(id: string, enabled: boolean) {
    const shortcut = await getShortcut(id);
    if (!shortcut) {
        warn(`[shortcut service] failed to update enable status: shortcut [${id}] not found`);
        return;
    }

    // for non-global shortcut, just update the enabled status
    // the shortcut registration will only happen when the window is open
    if (!isGlobalShortcut(shortcut.id)) {
        await saveShortcut({ ...shortcut, enabled });
        return;
    }

    // no need for update
    if (enabled === (await isGlobalShortcutRegistration(shortcut.keys))) {
        await saveShortcut({ ...shortcut, enabled });
        return;
    }

    // from diabled -> enabled, register the global shortcut
    if (enabled) {
        debug(`[shortcut service] enabling shortcut [${shortcut.id}]`);
        const f = GLOBAL_SHORTCUT_FUNCTION[shortcut.id];
        if (!f) {
            warn(
                `[shortcut service] failed to update enable status: global shortcut function [${shortcut.id}] not found`,
            );
            throw Error("global function can not be found");
        }

        try {
            await registerGlobalShortcut(shortcut.keys, f);
            await saveShortcut({ ...shortcut, enabled });
        } catch (e) {
            error(`[shortcut service] failed to register global shortcut [${shortcut.keys}]: ${e}`);
            throw e;
        }
        return;
    }

    // for enabled -> disabled, unregister the global shortcut
    debug(`[shortcut service] disabling shortcut [${shortcut.id}]`);
    try {
        await unregisterGlobalShortcut(shortcut.keys);
        await saveShortcut({ ...shortcut, enabled });
    } catch (e) {
        error(`[shortcut service] failed to unregister global shortcut [${shortcut.keys}]: ${e}`);
        throw e;
    }
}

export async function updateShortcut(id: string, shortcut: Shortcut): Promise<void> {
    debug(`[shortcut service] updating shortcut [${id}] in store: ${JSON.stringify(shortcut)}`);
}

async function saveShortcut(shortcut: Shortcut) {
    const store = await getLocalStore();
    const shortcuts = await getShortcutSetting();
    if (!shortcuts) {
        warn(`[shortcut service] failed to save shortcut: shortcuts is null`);
        return;
    }

    shortcuts.shortcuts[shortcut.id] = {
        id: shortcut.id,
        keys: shortcut.keys,
        enabled: shortcut.enabled,
    };
    await store.set(SHORTCUT_SETTING_KEY, shortcuts);
    await store.save();
}

import { isGlobalShortcutRegistration, registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { debug, error, warn } from "@tauri-apps/plugin-log";
import { getLocalStore } from "../store";
import { DEFAULT_SHORTCUT_SETTING, GLOBAL_SHORTCUT_FUNCTION } from "./const";

const SHORTCUT_SETTING_KEY = "shortcut_setting";

export interface ShortcutSetting {
    shortcuts: Record<string, Shortcut>;
}

export interface Shortcut {
    id: string;
    keys: string[];
    isGlobal: boolean;
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
        debug(`[shortcut service] init shortcut: ${JSON.stringify(shortcutSetting)}`);
    } catch (e) {
        error(`[shortcut service] failed to init shortcut: ${e}`);
    }
}

async function initGlobalShortcutRegister(shortcuts: Record<string, Shortcut>) {
    for (const shortcut of Object.values(shortcuts)) {
        debug(`[shortcut service] init global shortcut register: ${JSON.stringify(shortcut)}`);
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
            await registerGlobalShortcut(shortcut.keys, f);
        } catch (e) {
            error(`[shortcut service] failed to register global shortcut [${shortcut.keys}]: ${e}`);
            shortcut.enabled = false;
        }
    }
}

async function getAllShortcuts(): Promise<ShortcutSetting | undefined> {
    const store = await getLocalStore();
    return await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);
}

export async function getShortcut(id: string): Promise<Shortcut | null> {
    const shortcuts = await getAllShortcuts();
    if (!shortcuts) {
        warn(`[shortcut service] failed to get shortcut: shortcuts is null`);
        return null;
    }

    return { ...shortcuts.shortcuts[id] };
}

export async function updateShortcutEnabled(id: string, enabled: boolean) {
    const shortcut = await getShortcut(id);
    if (!shortcut) {
        warn(`[shortcut service] failed to update enable status: shortcut [${id}] not found`);
        return;
    }

    // for non-global shortcut, just update the enabled status
    // the shortcut registration will only happen when the window is open
    if (!shortcut.isGlobal) {
        await saveShortcut({ ...shortcut, enabled });
        return;
    }

    // no need for update
    if (enabled === (await isGlobalShortcutRegistration(shortcut.keys.join("+")))) {
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
        await unregisterGlobalShortcut(shortcut.keys.join("+"));
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
    const shortcuts = await getAllShortcuts();
    if (!shortcuts) {
        warn(`[shortcut service] failed to save shortcut: shortcuts is null`);
        return;
    }

    shortcuts.shortcuts[shortcut.id] = { ...shortcut };
    await store.set(SHORTCUT_SETTING_KEY, shortcuts);
    await store.save();
}

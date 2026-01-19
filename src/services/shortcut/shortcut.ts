import { isGlobalShortcutRegistration, registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { debug, error, warn } from "@tauri-apps/plugin-log";
import { getLocalStore } from "../store";
import { DEFAULT_SHORTCUT_SETTING, GLOBAL_SHORTCUT_FUNCTION } from "./const";

const SHORTCUT_SETTING_KEY = "shortcut_setting";

let cached: ShortcutSetting | null = null;

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
        if (cached) {
            warn("[shortcut service] init shortcut called multiple times");
            return;
        }

        const store = await getLocalStore();
        let shortcutSetting = await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);
        if (!shortcutSetting) {
            shortcutSetting = DEFAULT_SHORTCUT_SETTING;
        }
        await initGlobalShortcutRegister(shortcutSetting.shortcuts);
        await store.set(SHORTCUT_SETTING_KEY, shortcutSetting);
        await store.save();
        cached = shortcutSetting;
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

export function getShortcut(id: string): Shortcut | undefined {
    if (!cached) {
        warn(`[shortcut service] failed to get shortcut: cached is null`);
        return undefined;
    }

    return { ...cached.shortcuts[id] };
}

export async function updateShortcutEnabled(id: string, enabled: boolean) {
    if (!cached) {
        warn(`[shortcut service] failed to update enable status: cached is null`);
        return;
    }

    const shortcut = getShortcut(id);
    if (!shortcut) {
        warn(`[shortcut service] failed to update enable status: shortcut [${id}] not found`);
        return;
    }

    // for non-global shortcut, just update the enabled status
    // the shortcut registration will only happen when the window is open
    if (!shortcut.isGlobal) {
        shortcut.enabled = enabled;
        await saveShortcut();
        return;
    }

    // no need for update
    if (enabled === (await isGlobalShortcutRegistration(shortcut.keys.join("+")))) {
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
            cached.shortcuts[id] = { ...shortcut, enabled };
            await saveShortcut();
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
        cached.shortcuts[id] = { ...shortcut, enabled };
        await saveShortcut();
    } catch (e) {
        error(`[shortcut service] failed to unregister global shortcut [${shortcut.keys}]: ${e}`);
        throw e;
    }
}

export async function updateShortcut(id: string, shortcut: Shortcut): Promise<void> {
    debug(`[shortcut service] updating shortcut [${id}] in store: ${JSON.stringify(shortcut)}`);
}

async function saveShortcut() {
    const store = await getLocalStore();
    await store.set(SHORTCUT_SETTING_KEY, cached);
    await store.save();
}

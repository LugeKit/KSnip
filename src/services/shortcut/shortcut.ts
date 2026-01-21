import { isGlobalShortcutRegistration, registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { debug, error, warn } from "@tauri-apps/plugin-log";
import { getLocalStore } from "../store";
import { DEFAULT_SHORTCUT_SETTING } from "./const";
import { Shortcut, ShortcutSetting } from "./types";

const SHORTCUT_SETTING_KEY = "shortcut_setting";

let initPromise: Promise<void> | null = null;

export async function initShortcut() {
    if (initPromise) {
        return initPromise;
    }
    initPromise = (async () => {
        try {
            const store = await getLocalStore();
            let setting = await store.get<ShortcutSetting>(SHORTCUT_SETTING_KEY);
            setting = mergeWithDefault(setting);
            await initGlobalShortcutRegister(setting.shortcuts);
            await store.set(SHORTCUT_SETTING_KEY, setting);
            debug(`[shortcut service] init shortcut: ${JSON.stringify(setting)}`);
        } catch (e) {
            error(`[shortcut service] failed to init shortcut: ${e}`);
        }
    })();
    return initPromise;
}

function mergeWithDefault(setting: ShortcutSetting | undefined) {
    if (!setting) {
        return DEFAULT_SHORTCUT_SETTING;
    }

    const shortcuts: Record<string, Shortcut> = {};
    for (const [id, shortcut] of Object.entries(DEFAULT_SHORTCUT_SETTING.shortcuts)) {
        const saved = enrichSavedShortcut(setting.shortcuts[id]);
        if (!saved) {
            shortcuts[id] = shortcut;
            continue;
        }
        shortcuts[id] = saved;
    }

    return {
        shortcuts: shortcuts,
    };
}

async function initGlobalShortcutRegister(shortcuts: Record<string, Shortcut>) {
    for (const shortcut of Object.values(shortcuts)) {
        debug(`[shortcut service] init global shortcut register: ${JSON.stringify(shortcut)}`);
        if (!shortcut.globalF) {
            continue;
        }

        if (!shortcut.enabled) {
            try {
                if (await isGlobalShortcutRegistration(shortcut.keys)) {
                    // unregister the global shortcut
                    await unregisterGlobalShortcut(shortcut.keys);
                }
            } catch (e) {
                error(`[shortcut service] failed to unregister global shortcut [${shortcut.keys}]: ${e}`);
            }
            continue;
        }

        try {
            await safeRegister(shortcut);
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

export async function getAllShortcuts(): Promise<Record<string, Shortcut>> {
    const setting = await getShortcutSetting();
    if (!setting) {
        warn(`[shortcut service] failed to get shortcuts: shortcuts is null`);
        return {};
    }

    const shortcuts: Record<string, Shortcut> = {};
    for (const [id, shortcut] of Object.entries(setting.shortcuts)) {
        const enriched = enrichSavedShortcut(shortcut);
        if (!enriched) {
            continue;
        }
        shortcuts[id] = enriched;
    }

    return shortcuts;
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

    return enrichSavedShortcut(setting.shortcuts[id]);
}

export async function updateShortcutEnabled(id: string, enabled: boolean) {
    const shortcut = await getShortcut(id);
    if (!shortcut) {
        warn(`[shortcut service] failed to update enable status: shortcut [${id}] not found`);
        return;
    }

    const newShortcut = new Shortcut(shortcut.id, shortcut.keys, enabled, shortcut.globalF);

    // for non-global shortcut, just update the enabled status
    // the shortcut registration will only happen when the window is open
    if (!shortcut.globalF) {
        await saveShortcut(newShortcut);
        return;
    }

    // from diabled -> enabled, register the global shortcut
    if (enabled) {
        debug(`[shortcut service] enabling shortcut [${shortcut.id}]`);

        try {
            await safeRegister(shortcut);
            await saveShortcut(new Shortcut(shortcut.id, shortcut.keys, enabled, shortcut.globalF));
        } catch (e) {
            error(`[shortcut service] failed to register global shortcut [${shortcut.keys}]: ${e}`);
            throw Error("failed to enable shortcut");
        }
        return;
    }

    // for enabled -> disabled, unregister the global shortcut
    debug(`[shortcut service] disabling shortcut [${shortcut.id}]`);
    try {
        await unregisterGlobalShortcut(shortcut.keys);
        await saveShortcut(new Shortcut(shortcut.id, shortcut.keys, enabled, shortcut.globalF));
    } catch (e) {
        error(`[shortcut service] failed to unregister global shortcut [${shortcut.keys}]: ${e}`);
        throw Error("failed to disable shortcut");
    }
}

export async function updateShortcutKey(id: string, keys: string[]): Promise<void> {
    debug(`[shortcut service] updating shortcut key [${id}] to [${keys}]`);

    const shortcut = await getShortcut(id);
    if (!shortcut) {
        throw Error("shortcut not found");
    }

    const newShortcut = new Shortcut(shortcut.id, keys, shortcut.enabled, shortcut.globalF);
    // for non-global shortcut, just update the keys
    if (!shortcut.globalF) {
        await saveShortcut(newShortcut);
        return;
    }

    // for global shortcut, unregister the old one and register the new one
    try {
        await safeRegister(newShortcut);
        await saveShortcut(newShortcut);
    } catch (e) {
        error(`[shortcut service] failed to update global shortcut key [${id}] to [${keys}]: ${e}`);
        throw e;
    }
}

async function safeRegister(shortcut: Shortcut) {
    if (!shortcut || !shortcut.globalF) {
        return;
    }

    try {
        await unregisterGlobalShortcut(shortcut.keys);
    } catch (_) {}

    await registerGlobalShortcut(shortcut.keys, shortcut.globalF);
}

async function saveShortcut(shortcut: Shortcut) {
    const store = await getLocalStore();
    const setting = await getShortcutSetting();
    if (!setting) {
        warn(`[shortcut service] failed to save shortcut: shortcuts is null`);
        return;
    }

    setting.shortcuts[shortcut.id] = shortcut;
    await store.set(SHORTCUT_SETTING_KEY, setting);
}

function enrichSavedShortcut(shortcut: Shortcut) {
    if (!shortcut || !shortcut.id) {
        return null;
    }

    const defaultShortcut = DEFAULT_SHORTCUT_SETTING.shortcuts[shortcut.id];
    if (!defaultShortcut) {
        return null;
    }
    shortcut.globalF = defaultShortcut.globalF;
    return shortcut as Shortcut;
}

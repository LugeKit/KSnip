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

    const newShortcut = newShortcutByOld(shortcut, shortcut.keys, enabled);

    // for non-global shortcut, just update the enabled status
    // the shortcut registration will only happen when the window is open
    if (!shortcut.globalF) {
        await saveShortcut(newShortcut);
        return;
    }

    if (enabled == (await isGlobalShortcutRegistration(shortcut.keys))) {
        await saveShortcut(newShortcut);
        return;
    }

    // from diabled -> enabled, register the global shortcut
    if (enabled) {
        debug(`[shortcut service] enabling shortcut [${shortcut.id}]`);

        try {
            await safeRegister(shortcut);
            await saveShortcut(newShortcut);
        } catch (e) {
            throw Error(`failed to enable shortcut [${shortcut.id}], error: ${e}`);
        }
        return;
    }

    // for enabled -> disabled, unregister the global shortcut
    debug(`[shortcut service] disabling shortcut [${shortcut.id}]`);
    try {
        await unregisterGlobalShortcut(shortcut.keys);
        await saveShortcut(newShortcut);
    } catch (e) {
        throw Error(`failed to disable shortcut [${shortcut.id}], error: ${e}`);
    }
}

async function getConflictKeyInSamePage(shortcut: Shortcut): Promise<Shortcut | undefined> {
    const shortcuts = await getAllShortcuts();
    const keys = shortcut.keys.join(",");
    return Object.values(shortcuts).find((s) => s.page === shortcut.page && s.keys.join(",") === keys);
}

export async function updateShortcutKey(id: string, keys: string[]): Promise<void> {
    debug(`[shortcut service] updating shortcut key [${id}] to [${keys}]`);

    const shortcut = await getShortcut(id);
    if (!shortcut) {
        throw Error(`shortcut [${id}] not found`);
    }

    const conflicted = await getConflictKeyInSamePage(shortcut);
    if (conflicted) {
        throw Error(`shortcut key [${keys}] is already used by [${conflicted.id}]`);
    }

    const newShortcut = newShortcutByOld(shortcut, keys, shortcut.enabled);
    // for non-global shortcut, just update the keys
    if (!shortcut.globalF) {
        await saveShortcut(newShortcut);
        return;
    }

    // for global shortcut, unregister the old one and register the new one
    try {
        try {
            await unregisterGlobalShortcut(shortcut.keys);
        } catch (_) {}
        await safeRegister(newShortcut);
        await saveShortcut(newShortcut);
    } catch (e) {
        throw Error(`failed to update shortcut key [${id}] to [${keys}], error: ${e}`);
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

export async function registerWindowShortcut(id: string, f: (e: KeyboardEvent) => void | Promise<void>) {
    const shortcut = await getShortcut(id);
    if (!shortcut) {
        warn(`[shortcut service] failed to register window shortcut: shortcut [${id}] not found`);
        return () => {};
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        const keys = shortcut.keys;
        for (const key of keys) {
            if (key === "Ctrl" && e.ctrlKey) {
                continue;
            }

            if (key === "Alt" && e.altKey) {
                continue;
            }

            if ((key === "Cmd" || key === "Win") && e.metaKey) {
                continue;
            }
            if (key === e.key) {
                f(e);
                break;
            }
        }
    };

    debug(`[shortcut service] registering window shortcut [${shortcut.id}]`);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
        debug(`[shortcut service] unregistering window shortcut [${shortcut.id}]`);
        window.removeEventListener("keydown", handleKeyDown);
    };
}

function enrichSavedShortcut(shortcut: Shortcut) {
    if (!shortcut || !shortcut.id) {
        return null;
    }

    const defaultShortcut = DEFAULT_SHORTCUT_SETTING.shortcuts[shortcut.id];
    if (!defaultShortcut) {
        return null;
    }
    shortcut.name = defaultShortcut.name;
    shortcut.page = defaultShortcut.page;
    shortcut.globalF = defaultShortcut.globalF;
    return shortcut as Shortcut;
}

function newShortcutByOld(old: Shortcut, keys: string[], enabled: boolean) {
    return new Shortcut(old.id, keys, enabled, old.page, old.name, old.globalF);
}

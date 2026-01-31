import { DEFAULT_SETTING } from "@/services/setting/const.ts";
import { Setting, SettingValue, StoredSetting } from "@/services/setting/types.ts";
import { getLocalStore } from "@/services/store.ts";

const SETTING_KEY = "setting";

async function getStoredSetting(): Promise<StoredSetting | undefined> {
    const store = await getLocalStore();
    return store.get<StoredSetting>(SETTING_KEY);
}

export async function getAllSettings(): Promise<Record<string, Setting>> {
    const storedSettings = await getStoredSetting();
    const settings: Record<string, Setting> = {};

    for (const key of Object.keys(DEFAULT_SETTING)) {
        const defaultItem = DEFAULT_SETTING[key];
        // Try to get from store
        const storedItem = storedSettings?.settings?.[key];

        if (storedItem) {
            const enriched = enrichSavedSetting(storedItem);
            if (enriched) {
                settings[key] = enriched;
                continue;
            }
        }

        // Fallback to default
        settings[key] = defaultItem;
    }

    return settings;
}

export async function getSetting(id: string): Promise<Setting | undefined> {
    const allSettings = await getStoredSetting();
    const defaultSetting = DEFAULT_SETTING[id];

    if (!defaultSetting) {
        return undefined;
    }

    if (!allSettings) {
        return enrichSavedSetting(defaultSetting);
    }
    
    const storedSetting = allSettings.settings[id];
    if (storedSetting) {
        return enrichSavedSetting(storedSetting);
    }

    return enrichSavedSetting(defaultSetting);
}

export async function updateSetting(id: string, value: SettingValue): Promise<void> {
    const setting = await getSetting(id);
    if (!setting) {
        throw Error("setting not found");
    }

    setting.value = value;
    await saveSetting(setting);
}

async function saveSetting(setting: Setting): Promise<void> {
    const allSettings = await getStoredSetting();
    if (!allSettings) {
        const store = await getLocalStore();
        await store.set(SETTING_KEY, { settings: DEFAULT_SETTING });
        return await saveSetting(setting);
    }

    allSettings.settings[setting.id] = setting;
    const store = await getLocalStore();
    await store.set(SETTING_KEY, allSettings);
}

function enrichSavedSetting(setting: Setting): Setting | undefined {
    if (!setting) {
        return undefined;
    }

    const defaultValue = DEFAULT_SETTING[setting.id];
    if (!defaultValue) {
        return undefined;
    }

    return new Setting(setting.id, defaultValue.name, defaultValue.description, defaultValue.type, setting.value);
}

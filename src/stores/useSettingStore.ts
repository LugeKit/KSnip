import { getAllSettings, updateSetting as updateSettingService } from "@/services/setting/setting";
import { Setting, SettingValue } from "@/services/setting/types";
import { error } from "@tauri-apps/plugin-log";
import { create } from "zustand";

interface SettingState {
    settings: Record<string, Setting>;
    isLoading: boolean;
    init: () => Promise<void>;
    updateSetting: (id: string, value: SettingValue) => Promise<void>;
}

export const useSettingStore = create<SettingState>((set) => ({
    settings: {},
    isLoading: true,
    init: async () => {
        try {
            const settings = await getAllSettings();
            set({ settings, isLoading: false });
        } catch (e) {
            error(`[useSettingStore] init error: ${e}`);
            set({ isLoading: false });
        }
    },
    updateSetting: async (id: string, value: SettingValue) => {
        try {
            await updateSettingService(id, value);

            set((state) => {
                const setting = state.settings[id];
                if (!setting) return state;

                const newSetting = new Setting(setting.id, setting.name, setting.description, setting.type, value);

                return {
                    settings: {
                        ...state.settings,
                        [id]: newSetting,
                    },
                };
            });
        } catch (e) {
            error(`[useSettingStore] updateSetting error: ${e}`);
        }
    },
}));

/**
 * Hook to get a specific setting's value object.
 * Returns undefined if the setting is not found or store is loading.
 */
export function useSettingValue<T extends SettingValue>(id: string): T | undefined {
    return useSettingStore((state) => state.settings[id]?.value as T);
}

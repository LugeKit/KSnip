import {
    getAllShortcuts,
    initShortcut,
    updateShortcutEnabled as updateShortcutEnabledService,
    updateShortcutKey as updateShortcutKeyService,
} from "@/services/shortcut/shortcut";
import { Shortcut } from "@/services/shortcut/types";
import { error } from "@tauri-apps/plugin-log";
import { create } from "zustand";

interface ShortcutState {
    shortcuts: Record<string, Shortcut>;
    isLoading: boolean;
    init: (registerGlobal?: boolean) => Promise<void>;
    updateShortcutEnabled: (id: string, enabled: boolean) => Promise<void>;
    updateShortcutKey: (id: string, keys: string[]) => Promise<void>;
    getShortcut: (id: string) => Shortcut | undefined;
}

export const useShortcutStore = create<ShortcutState>((set, get) => ({
    shortcuts: {},
    isLoading: true,
    init: async (registerGlobal: boolean = true) => {
        try {
            await initShortcut(registerGlobal);
            const shortcuts = await getAllShortcuts();
            set({ shortcuts, isLoading: false });
        } catch (e) {
            error(`[useShortcutStore] init error: ${e}`);
            set({ isLoading: false });
        }
    },
    updateShortcutEnabled: async (id: string, enabled: boolean) => {
        try {
            await updateShortcutEnabledService(id, enabled);

            set((state) => {
                const shortcut = state.shortcuts[id];
                if (!shortcut) return state;

                const newShortcut = new Shortcut(
                    shortcut.id,
                    shortcut.keys,
                    enabled,
                    shortcut.page,
                    shortcut.name,
                    shortcut.globalF,
                );

                return {
                    shortcuts: {
                        ...state.shortcuts,
                        [id]: newShortcut,
                    },
                };
            });
        } catch (e) {
            error(`[useShortcutStore] updateShortcutEnabled error: ${e}`);
        }
    },
    updateShortcutKey: async (id: string, keys: string[]) => {
        try {
            await updateShortcutKeyService(id, keys);

            set((state) => {
                const shortcut = state.shortcuts[id];
                if (!shortcut) return state;

                const newShortcut = new Shortcut(
                    shortcut.id,
                    keys,
                    shortcut.enabled,
                    shortcut.page,
                    shortcut.name,
                    shortcut.globalF,
                );

                return {
                    shortcuts: {
                        ...state.shortcuts,
                        [id]: newShortcut,
                    },
                };
            });
        } catch (e) {
            error(`[useShortcutStore] updateShortcutKey error: ${e}`);
        }
    },
    getShortcut: (id: string) => {
        return get().shortcuts[id];
    },
}));

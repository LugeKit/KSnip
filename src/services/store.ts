import { load, Store } from "@tauri-apps/plugin-store";

export async function getLocalStore(): Promise<Store> {
    const store = await load("config.json", {
        autoSave: false,
        defaults: {},
    });

    return store;
}

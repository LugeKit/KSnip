import {load, Store} from "@tauri-apps/plugin-store";

export async function getLocalStore(): Promise<Store> {
    return await load("config.json", {
        autoSave: true,
        defaults: {},
    });
}

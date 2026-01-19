import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { debug } from "@tauri-apps/plugin-log";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function registerGlobalShortcut(keys: string[], callback: () => void | Promise<void>) {
    debug(`[util] registering global shortcut: ${keys}`);
    await register(keys.join("+"), async (event) => {
        if (event.state === "Pressed") {
            await callback();
        }
    });
}

export async function unregisterGlobalShortcut(keys: string) {
    debug(`[util] unregistering global shortcut: ${keys}`);
    await unregister(keys);
}

export async function checkGlobalShortcutRegistration(keys: string) {
    return await isRegistered(keys);
}

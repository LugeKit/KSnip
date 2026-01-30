import { isShortcutPressed } from "@/services/shortcut/shortcut";
import { useShortcutStore } from "@/stores/useShortcutStore";
import { debug, info } from "@tauri-apps/plugin-log";
import { useEffect } from "react";

export function useWindowShortcut(id: string, callback: (e: KeyboardEvent) => void) {
    const shortcut = useShortcutStore((state) => state.shortcuts[id]);

    useEffect(() => {
        if (!shortcut) {
            // Shortcut might not be loaded yet
            return;
        }

        if (!shortcut.enabled) {
            info(`[useWindowShortcut] not registering window shortcut [${id}] as it is disabled`);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isShortcutPressed(shortcut, e)) {
                callback(e);
            }
        };

        debug(`[useWindowShortcut] registering window shortcut [${id}]`);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            debug(`[useWindowShortcut] unregistering window shortcut [${id}]`);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [id, callback, shortcut]);
}

import { debug, error } from "@tauri-apps/plugin-log";
import { useEffect, useRef } from "react";

/**
 * useShortCut is a custom hook to register a global keydown event listener
 * @param keys The key to listen for (e.g., "Escape", "Enter")
 * @param callback The callback function to execute when the key is pressed
 * @param deps The dependencies for the useEffect hook
 */
export function useWindowShortcut(
    keys: string[],
    callback: () => void | Promise<void>,
) {
    const callbackRef = useRef(callback);
    useEffect(() => {
        debug(`[shortcut] reassign window shortcut callback for ${keys}`);
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        debug(`[shortcut] registering window shortcut: ${keys}`);
        if (keys.length === 0) {
            return;
        }

        const lowerKeys = keys.map((key) => key.toLowerCase());

        const handleKeyDown = async (e: KeyboardEvent) => {
            for (let i = 0; i < lowerKeys.length - 1; i++) {
                switch (lowerKeys[i]) {
                    case "option":
                    case "alt":
                        if (!e.altKey) {
                            return;
                        }
                        break;
                    case "ctrl":
                        if (!e.ctrlKey) {
                            return;
                        }
                        break;
                    case "shift":
                        if (!e.shiftKey) {
                            return;
                        }
                        break;
                    case "cmd":
                    case "win":
                        if (!e.metaKey) {
                            return;
                        }
                        break;
                    default:
                        return;
                }
            }

            if (e.key.toLowerCase() !== lowerKeys[lowerKeys.length - 1]) {
                return;
            }

            try {
                await callbackRef.current();
            } catch (e) {
                error(
                    `[shortcut] failed to execute window shortcut callback ${keys}, error: ${e}`,
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [keys]);
}

import { useEffect } from "react";

/**
 * useShortCut is a custom hook to register a global keydown event listener
 * @param keys The key to listen for (e.g., "Escape", "Enter")
 * @param callback The callback function to execute when the key is pressed
 * @param deps The dependencies for the useEffect hook
 */
export const useWindowShortcut = (
    keys: string[],
    callback: () => void,
    deps: any[] = [],
) => {
    useEffect(() => {
        if (keys.length === 0) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            for (let i = 0; i < keys.length - 1; i++) {
                switch (keys[i]) {
                    case "Option":
                    case "Alt":
                        if (!e.altKey) {
                            return;
                        }
                        break;
                    case "Control":
                        if (!e.ctrlKey) {
                            return;
                        }
                        break;
                    case "Shift":
                        if (!e.shiftKey) {
                            return;
                        }
                        break;
                    case "Cmd":
                    case "Win":
                        if (!e.metaKey) {
                            return;
                        }
                        break;
                    default:
                        return;
                }
            }

            if (e.key !== keys[keys.length - 1]) {
                return;
            }

            callback();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [keys, ...deps]);
};

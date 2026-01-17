import { useEffect } from "react";

/**
 * useShortCut is a custom hook to register a global keydown event listener
 * @param key The key to listen for (e.g., "Escape", "Enter")
 * @param callback The callback function to execute when the key is pressed
 * @param deps The dependencies for the useEffect hook
 */
export const useShortCut = (
    key: string,
    callback: () => void,
    deps: any[] = [],
) => {
    useEffect(() => {
        const keyArray = key.split("+");
        const handleKeyDown = (e: KeyboardEvent) => {
            if (keyArray.length === 2) {
                if (keyArray[0] === "Alt" && !e.altKey) {
                    return;
                }

                if (keyArray[1] !== e.key) {
                    return;
                }
            }

            if (keyArray.length === 1 && e.key !== keyArray[0]) {
                return;
            }

            callback();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [key, ...deps]);
};

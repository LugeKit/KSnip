import { registerWindowShortcut } from "@/services/shortcut/shortcut";
import { useEffect } from "react";

export function useWindowShortcut(id: string, callback: (e: KeyboardEvent) => void) {
    useEffect(() => {
        const registerShortcut = async () => {
            return await registerWindowShortcut(id, callback);
        };
        const clear = registerShortcut();
        return () => {
            clear.then((clear) => clear());
        };
    }, [id, callback]);
}

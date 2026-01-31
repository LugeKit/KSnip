import { useSettingStore } from "@/stores/useSettingStore";
import { useShortcutStore } from "@/stores/useShortcutStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error, info } from "@tauri-apps/plugin-log";
import { useEffect } from "react";
import MainPage from "./pages/Main/MainPage";
import OverlayPage from "./pages/Overlay/OverlayPage";
import PinPage from "./pages/Pin/PinPage";

export default function App() {
    const initSettings = useSettingStore((state) => state.init);
    const initShortcuts = useShortcutStore((state) => state.init);

    useEffect(() => {
        const init = async () => {
            const appWindow = getCurrentWindow();
            const label = appWindow.label;
            info(`[App] init window label: ${label}`);
            const isMain = label === "main";

            initShortcuts(isMain)
                .then(() => info(`[App] init shortcut success (isMain: ${isMain})`))
                .catch((e) => error(`[App] failed in init shortcut: ${e}`));

            initSettings()
                .then(() => info(`[App] init settings success`))
                .catch((e) => error(`[App] failed in init settings: ${e}`));

            window.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.key.toLowerCase() === "r") {
                    e.preventDefault();
                }
            });
        };
        init();
    }, []);

    let hash = window.location.hash;
    info(`[App] current location hash: ${hash}`);

    if (hash.length > 0) {
        hash = hash.split("?")[0];
    }

    switch (hash) {
        case "#screenshot":
            return <OverlayPage />;
        case "#pin":
            return <PinPage />;
        default:
            return <MainPage />;
    }
}

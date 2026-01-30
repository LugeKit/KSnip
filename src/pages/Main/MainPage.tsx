import { SidebarProvider } from "@/components/ui/sidebar";
import { useSettingStore } from "@/stores/useSettingStore";
import { error, info } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";
import AppHeader from "../../components/ui/AppHeader";
import AppSidebar, { MenuKey } from "./components/AppSidebar";
import SettingComponent from "./components/Setting";
import ShortcutSetting from "./components/ShortcutSetting";
import { useShortcutStore } from "@/stores/useShortcutStore";

export default function MainPage() {
    const [activeMenu, setActiveMenu] = useState<MenuKey>(MenuKey.Settings);
    const initSettings = useSettingStore((state) => state.init);
    const initShortcuts = useShortcutStore((state) => state.init);

    useEffect(() => {
        initShortcuts()
            .then(() => info(`[MainPage] init shortcut success`))
            .catch((e) => error(`[MainPage] failed in init shortcut: ${e}`));
        initSettings();
    }, []);

    return (
        <div className="relative h-screen w-screen antialiased p-1">
            <div className="relative h-full w-full border rounded-md overflow-hidden bg-background shadow-md">
                <SidebarProvider className="h-full">
                    <AppSidebar activeMenu={activeMenu} onMenuClick={(menuKey) => setActiveMenu(menuKey)} />
                    <div className="flex flex-col flex-1">
                        <AppHeader />
                        <main className="flex-1">
                            {activeMenu === MenuKey.Settings && <SettingComponent />}
                            {activeMenu === MenuKey.Shortcuts && <ShortcutSetting />}
                        </main>
                    </div>
                </SidebarProvider>
            </div>
        </div>
    );
}

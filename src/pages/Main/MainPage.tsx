import { SidebarProvider } from "@/components/ui/sidebar";
import { initShortcut } from "@/services/shortcut/shortcut";
import { error, info } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";
import AppHeader from "../../components/ui/AppHeader";
import AppSidebar, { MenuKey } from "./components/AppSidebar";
import Setting from "./components/Setting";
import ShortcutSetting from "./components/ShortcutSetting";

export default function MainPage() {
    const [activeMenu, setActiveMenu] = useState<MenuKey>(MenuKey.Settings);

    useEffect(() => {
        initShortcut()
            .then(() => info(`[MainPage] init shortcut success`))
            .catch((e) => error(`[MainPage] failed in init shortcut: ${e}`));
    }, []);

    return (
        <div className="relative h-screen w-screen antialiased p-1">
            <div className="relative h-full w-full border rounded-md overflow-hidden bg-background shadow-md">
                <SidebarProvider className="h-full">
                    <AppSidebar activeMenu={activeMenu} onMenuClick={(menuKey) => setActiveMenu(menuKey)} />
                    <div className="flex flex-col flex-1">
                        <AppHeader />
                        <main className="flex-1">
                            {activeMenu === MenuKey.Settings && <Setting />}
                            {activeMenu === MenuKey.Shortcuts && <ShortcutSetting />}
                        </main>
                    </div>
                </SidebarProvider>
            </div>
        </div>
    );
}

import { SidebarProvider } from "@/components/ui/sidebar";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import AppHeader from "../../components/ui/AppHeader";
import AppSidebar, { MenuKey } from "./components/AppSidebar";
import SettingComponent from "./components/Setting";
import ShortcutSetting from "./components/ShortcutSetting";

export default function MainPage() {
    const [activeMenu, setActiveMenu] = useState<MenuKey>(MenuKey.Settings);

    useEffect(() => {
        const unlisten = listen("open-settings", () => {
            setActiveMenu(MenuKey.Settings);
        });
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    return (
        <div className="relative h-screen w-screen antialiased p-1">
            <div className="flex relative h-full w-full border rounded-md overflow-hidden bg-background shadow-md">
                <SidebarProvider className="h-full">
                    <AppSidebar activeMenu={activeMenu} onMenuClick={(menuKey) => setActiveMenu(menuKey)} />
                    <div className="flex flex-col flex-1">
                        <AppHeader />
                        <main className="flex-1 overflow-hidden">
                            {activeMenu === MenuKey.Settings && <SettingComponent />}
                            {activeMenu === MenuKey.Shortcuts && <ShortcutSetting />}
                        </main>
                    </div>
                </SidebarProvider>
            </div>
        </div>
    );
}

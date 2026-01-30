import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ENABLE_DEBUG_SETTING } from "@/services/setting/const";
import { SettingValueBoolean } from "@/services/setting/types";
import { getLocalStore } from "@/services/store";
import { useSettingValue } from "@/stores/useSettingStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { Heart, Minus, RectangleEllipsis, X } from "lucide-react";
import { useMemo } from "react";

export default function AppHeader() {
    const appWindow = useMemo(() => getCurrentWindow(), []);
    const debugSetting = useSettingValue<SettingValueBoolean>(ENABLE_DEBUG_SETTING);
    const isDebug = debugSetting?.value ?? false;

    return (
        <div className="relative top-0 left-0 h-(--header-height) w-full flex justify-end bg-sidebar">
            <div className="absolute left-0 top-0 w-full h-full border-b border-border" />
            <div className="absolute inset-0" data-tauri-drag-region onDoubleClick={() => appWindow.toggleMaximize()} />
            <ButtonGroup className="relative z-1 h-full [&>button]:aspect-square [&>button]:h-full">
                {isDebug && (
                    <Button
                        variant={"ghost"}
                        onClick={async () => {
                            const store = await getLocalStore();
                            store.clear();
                        }}
                    >
                        <Heart />
                    </Button>
                )}
                <Button variant={"ghost"} onClick={() => appWindow.minimize()}>
                    <Minus />
                </Button>
                <Button
                    variant={"ghost"}
                    onClick={() => {
                        appWindow.toggleMaximize().catch((e) => {
                            error(`[AppHeader] toggleMaximize error: ${e}`);
                        });
                    }}
                >
                    <RectangleEllipsis />
                </Button>
                <Button variant={"ghost"} className="hover:text-red-500" onClick={() => appWindow.close()}>
                    <X />
                </Button>
            </ButtonGroup>
        </div>
    );
}

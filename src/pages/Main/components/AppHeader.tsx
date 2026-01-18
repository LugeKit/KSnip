import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { Minus, RectangleEllipsis, X } from "lucide-react";
import { useMemo } from "react";

export default function AppHeader() {
    const appWindow = useMemo(() => getCurrentWindow(), []);

    return (
        <div className="absolute top-0 left-0 h-12 w-full flex items-center justify-end bg-sidebar">
            <div
                className="absolute inset-0"
                data-tauri-drag-region
                onDoubleClick={() => appWindow.toggleMaximize()}
            />
            <ButtonGroup className="relative z-1 h-full items-center">
                <Button
                    variant={"ghost"}
                    size={"icon-lg"}
                    onClick={() => appWindow.minimize()}
                >
                    <Minus />
                </Button>
                <Button
                    variant={"ghost"}
                    size={"icon-lg"}
                    onClick={() => {
                        appWindow.toggleMaximize().catch((e) => {
                            error(`[AppHeader] toggleMaximize error: ${e}`);
                        });
                    }}
                >
                    <RectangleEllipsis />
                </Button>
                <Button
                    variant={"ghost"}
                    size={"icon-lg"}
                    className="hover:text-red-500"
                    onClick={() => appWindow.close()}
                >
                    <X />
                </Button>
            </ButtonGroup>
        </div>
    );
}

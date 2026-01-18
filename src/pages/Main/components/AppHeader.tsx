import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { Minus, RectangleEllipsis, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function AppHeader() {
    const appWindow = useMemo(() => getCurrentWindow(), []);
    const [isMaximized, setMaxmized] = useState(false);

    return (
        <div className="absolute top-0 left-0 w-full flex justify-end">
            <div className="absolute inset-0" data-tauri-drag-region />
            <ButtonGroup className="relative z-1 h-full">
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
                        setMaxmized(!isMaximized);
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
                    onClick={() => appWindow.close()}
                >
                    <X />
                </Button>
            </ButtonGroup>
        </div>
    );
}

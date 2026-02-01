import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SHORTCUT_TAKE_SCREENSHOT } from "@/services/shortcut/const";
import { useShortcutStore } from "@/stores/useShortcutStore";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Github } from "lucide-react";
import { useEffect, useState } from "react";

export default function About() {
    const [version, setVersion] = useState("");
    const shortcut = useShortcutStore((state) => state.getShortcut(SHORTCUT_TAKE_SCREENSHOT));

    useEffect(() => {
        getVersion().then(setVersion).catch(console.error);
    }, []);

    // Format the shortcut keys for display
    const keys = shortcut?.keys || ["Alt", "A"];

    return (
        <div className="flex flex-col h-full w-full p-8 space-y-8 overflow-y-auto items-center justify-center text-center">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">k-snip</h1>
            </div>

            <div className="flex items-center space-x-2 bg-muted/50 p-4 rounded-lg border">
                <span className="text-sm font-medium">截图快捷键:</span>
                <div className="flex space-x-1">
                    {keys.map((key, index) => (
                        <Kbd key={index}>{key}</Kbd>
                    ))}
                </div>
            </div>

            <Separator className="max-w-xs" />

            <div className="space-y-4">
                <div className="text-sm text-muted-foreground">当前版本: v{version}</div>

                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => openUrl("https://github.com/lugekit/ksnip")}
                >
                    <Github className="size-4" />
                    访问 GitHub
                </Button>
            </div>

            <div className="mt-auto pt-8 text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} k-snip. All rights reserved.</p>
            </div>
        </div>
    );
}

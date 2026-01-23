import { Checkbox } from "@/components/ui/checkbox";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllShortcuts, updateShortcutEnabled } from "@/services/shortcut/shortcut";
import { warn } from "@tauri-apps/plugin-log";
import { useEffect, useMemo, useState } from "react";

type ShortcutState = {
    keys: string[];
    enabled: boolean;
};

type ShortcutItem = {
    id: string;
    name: string;
} & ShortcutState;

export default function ShortcutSetting() {
    const tabsData = useMemo(() => {
        return [
            {
                page: "basic",
                label: "全局热键",
            },
            {
                page: "screenshot",
                label: "截图界面",
            },
        ];
    }, []);

    const [shortcutItems, setShortcutItems] = useState<Record<string, ShortcutItem[]>>({});

    useEffect(() => {
        const loadShortcuts = async () => {
            const allShortcuts = await getAllShortcuts();
            const shortcutsByPage = Object.values(allShortcuts).reduce(
                (prev, cur) => {
                    prev[cur.page] = [...(prev[cur.page] || []), cur];
                    return prev;
                },
                {} as Record<string, ShortcutItem[]>,
            );
            setShortcutItems(shortcutsByPage);
        };

        loadShortcuts();
    }, []);

    const onChecked = (page: string) => async (id: string, enabled: boolean) => {
        try {
            await updateShortcutEnabled(id, enabled);
            setShortcutItems((prev) => ({
                ...prev,
                [page]: prev[page].map((item) => (item.id === id ? { ...item, enabled } : item)),
            }));
        } catch (e) {
            warn(`[ShortcutSetting] failed to update shortcut to enabled[${enabled}]: ${id}, error: ${e}`);
        }
    };

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsHeaders headers={tabsData} />
                <div className="w-full border-border border-b left-0 mt-2 mb-2" />
                {Object.entries(shortcutItems).map(([page, shortcuts]) => {
                    return (
                        <TabsContent key={page} value={page}>
                            <div className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5">
                                <Table>
                                    <TabsContentHeader />
                                    <TabsContentBody shortcuts={shortcuts} onChecked={onChecked(page)} />
                                </Table>
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}

function TabsHeaders({ headers }: { headers: { page: string; label: string }[] }) {
    return (
        <TabsList className="gap-2">
            {headers.map((header) => (
                <TabsTrigger key={header.page} value={header.page}>
                    {header.label}
                </TabsTrigger>
            ))}
        </TabsList>
    );
}

function TabsContentHeader() {
    return (
        <TableHeader>
            <TableRow>
                <TableHead className="font-bold w-1/2">功能</TableHead>
                <TableHead className="font-bold text-center whitespace-nowrap">快捷键</TableHead>
            </TableRow>
        </TableHeader>
    );
}

function TabsContentBody({
    shortcuts,
    onChecked,
}: {
    shortcuts: ShortcutItem[];
    onChecked: (id: string, enabled: boolean) => void;
}) {
    return (
        <TableBody>
            {shortcuts.map((shortcut) => (
                <TableRow key={shortcut.id}>
                    {/* 功能列 */}
                    <TableCell>{shortcut.name}</TableCell>
                    {/* 快捷键列 */}
                    <TableCell className="text-center">
                        <ShortcutCell shortcut={shortcut} />
                    </TableCell>
                    {/* 启用列 */}
                    <TableCell className="text-right">
                        <Checkbox
                            className="data-[state=checked]:bg-transparent data-[state=checked]:text-black border-black mr-1"
                            checked={shortcut.enabled}
                            onCheckedChange={(checked) => onChecked(shortcut.id, !!checked)}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
}

function ShortcutCell({ shortcut }: { shortcut: ShortcutItem }) {
    const [keys, setKeys] = useState<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const input_keys = [];
            if (e.metaKey) {
                input_keys.push("Meta");
            }

            if (e.ctrlKey) {
                input_keys.push("Ctrl");
            }

            if (e.shiftKey) {
                input_keys.push("Shift");
            }

            if (e.altKey) {
                input_keys.push("Alt");
            }

            if (e.key.length === 1) {
                input_keys.push(e.key);
            }
            setKeys(input_keys);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <Popover
            onOpenChange={(open) => {
                if (open) {
                    return;
                }

                setTimeout(() => {
                    setKeys([]);
                }, 100);
            }}
        >
            <PopoverTrigger asChild>
                <KbdGroup className="hover:bg-muted-foreground p-1 rounded-md">
                    {shortcut.keys.map((key) => (
                        <Kbd className="bg-white" key={shortcut.id + key}>
                            {key}
                        </Kbd>
                    ))}
                </KbdGroup>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-[10rem] p-4">
                <div className="flex items-center justify-center w-full h-full">
                    {keys.length === 0 && <span className="text-muted-foreground">请输入快捷键...</span>}
                    {keys.length > 0 && (
                        <KbdGroup>
                            {keys.map((key) => (
                                <Kbd className="text-l bg-muted p-4 min-w-12 text-center font-medium" key={key}>
                                    {key}
                                </Kbd>
                            ))}
                        </KbdGroup>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

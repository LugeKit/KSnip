import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    SHORTCUT_CREATE_PIN,
    SHORTCUT_RECORD_REGION,
    SHORTCUT_RECORD_REGION_CONFIRM,
    SHORTCUT_SCREENSHOT_CONFIRM,
    SHORTCUT_SCREENSHOT_EXIT,
    SHORTCUT_TAKE_SCREENSHOT,
    SHORTCUT_TEST,
} from "@/services/shortcut/const";
import { getAllShortcuts, getShortcut, updateShortcutEnabled, updateShortcutKey } from "@/services/shortcut/shortcut";
import { debug, error, warn } from "@tauri-apps/plugin-log";
import { CheckIcon, X } from "lucide-react";
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
                shortcutIds: [SHORTCUT_TAKE_SCREENSHOT, SHORTCUT_TEST],
            },
            {
                page: "screenshot",
                label: "截图界面",
                shortcutIds: [
                    SHORTCUT_SCREENSHOT_EXIT,
                    SHORTCUT_SCREENSHOT_CONFIRM,
                    SHORTCUT_CREATE_PIN,
                    SHORTCUT_RECORD_REGION,
                    SHORTCUT_RECORD_REGION_CONFIRM,
                ],
            },
        ];
    }, []);

    const [shortcutItems, setShortcutItems] = useState<Record<string, ShortcutItem[]>>({});

    useEffect(() => {
        const loadShortcuts = async () => {
            const allShortcuts = await getAllShortcuts();
            const shortcutsByPage: Record<string, ShortcutItem[]> = {};

            tabsData.forEach((tab) => {
                const items = tab.shortcutIds.map((id) => allShortcuts[id]).filter((item) => item !== undefined);
                shortcutsByPage[tab.page] = items;
            });

            setShortcutItems(shortcutsByPage);
        };

        loadShortcuts();
    }, [tabsData]);

    const onShortcutChanged = (page: string) => async (id: string) => {
        try {
            const shortcut = await getShortcut(id);
            if (!shortcut) {
                return;
            }

            setShortcutItems((prev) => ({
                ...prev,
                [page]: prev[page].map((item) =>
                    item.id === id ? { ...item, enabled: shortcut.enabled, keys: shortcut.keys } : item,
                ),
            }));
        } catch (e) {
            warn(`[ShortcutSetting] failed to get shortcut: ${id}, error: ${e}`);
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
                                    <TabsContentBody
                                        shortcuts={shortcuts}
                                        onShortcutChanged={onShortcutChanged(page)}
                                    />
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
                <TableHead className="font-bold w-[200px]">功能</TableHead>
                <TableHead className="font-bold text-center whitespace-nowrap">快捷键</TableHead>
                <TableHead className="font-bold text-center whitespace-nowrap w-[60px]">启用</TableHead>
            </TableRow>
        </TableHeader>
    );
}

function TabsContentBody({
    shortcuts,
    onShortcutChanged,
}: {
    shortcuts: ShortcutItem[];
    onShortcutChanged: (id: string) => void;
}) {
    const onChecked = async (id: string, enabled: boolean) => {
        try {
            await updateShortcutEnabled(id, enabled);
            onShortcutChanged(id);
        } catch (e) {
            warn(`[ShortcutSetting] failed to update shortcut to enabled[${enabled}]: ${id}, error: ${e}`);
        }
    };

    return (
        <TableBody>
            {shortcuts.map((shortcut) => (
                <TableRow key={shortcut.id}>
                    {/* 功能列 */}
                    <TableCell>{shortcut.name}</TableCell>
                    {/* 快捷键列 */}
                    <TableCell className="text-center">
                        <ShortcutCell shortcut={shortcut} onShortcutChanged={onShortcutChanged} />
                    </TableCell>
                    {/* 启用列 */}
                    <TableCell className="text-center">
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

function ShortcutCell({
    shortcut,
    onShortcutChanged,
}: {
    shortcut: ShortcutItem;
    onShortcutChanged: (id: string) => void;
}) {
    const [keys, setKeys] = useState<string[]>([]);
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            debug(`[ShortcutSetting] keydown: ${e.key}`);
            const input_keys = [];
            if (e.metaKey) {
                input_keys.push("META");
            }

            if (e.ctrlKey) {
                input_keys.push("CTRL");
            }

            if (e.shiftKey) {
                input_keys.push("SHIFT");
            }

            if (e.altKey) {
                input_keys.push("ALT");
            }

            if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
                input_keys.push(e.key);
            }
            setKeys(input_keys);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const onConfirm = async () => {
        try {
            await updateShortcutKey(shortcut.id, keys);
            onShortcutChanged(shortcut.id);
            setOpen(false);
        } catch (e) {
            error(`[ShortcutSetting] failed to update shortcut key [${shortcut.id}] to [${keys}], error: ${e}`);
        }
    };

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setKeys([]);
            }, 100);
        }
    }, [open]);

    return (
        <Popover open={open}>
            <PopoverTrigger asChild onClick={() => setOpen(true)}>
                <KbdGroup className="hover:bg-muted-foreground p-1 rounded-md">
                    {shortcut.keys.map((key) => (
                        <Kbd className="bg-white" key={shortcut.id + key}>
                            {key.toUpperCase()}
                        </Kbd>
                    ))}
                </KbdGroup>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-40 h-25 p-4" onFocusOutside={() => setOpen(false)}>
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="h-16 flex items-center justify-center w-full">
                        {keys.length === 0 && (
                            <span className="text-muted-foreground text-sm text-center font-medium">
                                请输入快捷键...
                            </span>
                        )}
                        {keys.length > 0 && (
                            <KbdGroup>
                                {keys.map((key) => (
                                    <Kbd className="text-l bg-muted p-4 min-w-12 text-center font-medium" key={key}>
                                        {key.toUpperCase()}
                                    </Kbd>
                                ))}
                            </KbdGroup>
                        )}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                        <Badge
                            variant="secondary"
                            className="hover:bg-muted-foreground"
                            onClick={() => {
                                setOpen(false);
                            }}
                        >
                            <X />
                        </Badge>
                        {keys.length > 0 && (
                            <Badge variant="default" className="hover:bg-muted-foreground" onClick={onConfirm}>
                                <CheckIcon />
                            </Badge>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

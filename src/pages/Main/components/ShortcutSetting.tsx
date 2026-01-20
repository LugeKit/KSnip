import { Checkbox } from "@/components/ui/checkbox";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllShortcuts, updateShortcutEnabled } from "@/services/shortcut/shortcut";
import { debug, warn } from "@tauri-apps/plugin-log";
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
                value: "basic",
                label: "全局热键",
                shortcuts: [
                    {
                        id: "take_screenshot",
                        name: "区域截图",
                    },
                    {
                        id: "test",
                        name: "测试",
                    },
                ],
            },
            {
                value: "screenshot",
                label: "截图界面",
                shortcuts: [
                    {
                        id: "screenshot_exit",
                        name: "取消截图",
                    },
                ],
            },
        ];
    }, []);

    const [shortcutStates, setShortcutStates] = useState<Record<string, ShortcutState>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadShortcuts = async () => {
            const allRawShortcuts = tabsData.flatMap((tab) => tab.shortcuts);
            const allShortcutStates = await getAllShortcuts();
            const states: Record<string, ShortcutState> = allRawShortcuts.reduce(
                (acc, raw) => {
                    const state = allShortcutStates[raw.id];
                    if (state) {
                        acc[raw.id] = {
                            keys: state.keys,
                            enabled: state.enabled,
                        };
                    }
                    return acc;
                },
                {} as Record<string, ShortcutState>,
            );

            debug(`[ShortcutSetting] loaded shortcuts: ${JSON.stringify(states)}`);
            setShortcutStates(states);
            setIsLoaded(true);
        };

        loadShortcuts();
    }, [tabsData]);

    const onChecked = async (id: string, enabled: boolean) => {
        try {
            await updateShortcutEnabled(id, enabled);
            setShortcutStates((prev) => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    enabled,
                },
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
                {tabsData.map((tab) => {
                    const shortcuts = tab.shortcuts.map((s) => ({
                        id: s.id,
                        name: s.name,
                        keys: shortcutStates[s.id]?.keys || [],
                        enabled: shortcutStates[s.id]?.enabled || false,
                    }));

                    return (
                        <TabsContent key={tab.value} value={tab.value}>
                            <div className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5">
                                <Table>
                                    <TabsContentHeader />
                                    {isLoaded ? (
                                        <TabsContentBody shortcuts={shortcuts} onToggle={onChecked} />
                                    ) : (
                                        <TableBody>
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">
                                                    加载中...
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    )}
                                </Table>
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}

function TabsHeaders({ headers }: { headers: { value: string; label: string }[] }) {
    return (
        <TabsList className="gap-2">
            {headers.map((header) => (
                <TabsTrigger key={header.value} value={header.value}>
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
    onToggle,
}: {
    shortcuts: ShortcutItem[];
    onToggle: (id: string, enabled: boolean) => void;
}) {
    return (
        <TableBody>
            {shortcuts.map((shortcut) => (
                <TableRow key={shortcut.id}>
                    {/* 功能列 */}
                    <TableCell>{shortcut.name}</TableCell>
                    {/* 快捷键列 */}
                    <TableCell className="text-center">
                        <KbdGroup className="hover:bg-muted-foreground p-1 rounded-md">
                            {shortcut.keys.map((key) => (
                                <Kbd className="bg-white" key={shortcut.id + key}>
                                    {key}
                                </Kbd>
                            ))}
                        </KbdGroup>
                    </TableCell>
                    {/* 启用列 */}
                    <TableCell className="text-right">
                        <Checkbox
                            className="data-[state=checked]:bg-transparent data-[state=checked]:text-black border-black mr-1"
                            checked={shortcut.enabled}
                            onCheckedChange={(checked) => onToggle(shortcut.id, !!checked)}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
}

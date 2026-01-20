import { Checkbox } from "@/components/ui/checkbox";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getShortcut, updateShortcutEnabled } from "@/services/shortcut/shortcut";
import { warn } from "@tauri-apps/plugin-log";
import { useEffect, useMemo, useState } from "react";

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
                shortcuts: [],
            },
        ];
    }, []);

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsHeaders headers={tabsData} />
                <div className="w-full border-border border-b left-0 mt-2 mb-2" />
                {tabsData.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <div className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5">
                            <Table>
                                <TabsContentHeader />
                                <TabsContentBody raw_shortcuts={tab.shortcuts} />
                            </Table>
                        </div>
                    </TabsContent>
                ))}
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

function TabsContentBody({ raw_shortcuts }: { raw_shortcuts: { id: string; name: string }[] }) {
    const [shortcuts, setShortcuts] = useState<{ id: string; name: string; keys: string[]; enabled: boolean }[]>([]);

    const mergeShortcuts = async (raw_shortcuts: { id: string; name: string }[]) => {
        const merged = await Promise.all(
            raw_shortcuts.map(async (raw_shortcut) => {
                const shortcut = await getShortcut(raw_shortcut.id);
                if (!shortcut) {
                    warn(`[ShortcutSetting] failed to get shortcut: ${raw_shortcut.id}`);
                    return undefined;
                }
                return {
                    ...shortcut,
                    name: raw_shortcut.name,
                };
            }),
        );
        return merged.filter((shortcut) => shortcut !== undefined);
    };

    useEffect(() => {
        mergeShortcuts(raw_shortcuts).then((merged_shortcuts) => {
            setShortcuts(merged_shortcuts);
        });
    }, [raw_shortcuts]);

    const onChecked = async (id: string, enabled: boolean) => {
        try {
            await updateShortcutEnabled(id, enabled);
            setShortcuts(
                shortcuts.map((shortcut) => {
                    if (shortcut.id === id) {
                        return {
                            ...shortcut,
                            enabled,
                        };
                    }
                    return shortcut;
                }),
            );
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
                            onCheckedChange={(checked) => onChecked(shortcut.id, !!checked)}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
}

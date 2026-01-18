import { Checkbox } from "@/components/ui/checkbox";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { debug } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";

export default function ShortcutSettings() {
    const tabs = [
        {
            value: "basic",
            label: "全局热键",
            shortcuts: [
                {
                    command: "截图",
                    shortcut: ["Alt", "A"],
                    enabled: true,
                },
                {
                    command: "test",
                    shortcut: ["Cmd", "A"],
                    enabled: false,
                },
            ],
        },
        {
            value: "screenshot",
            label: "截图界面",
            shortcuts: [],
        },
    ];

    const tabsState = tabs.map((tab) => {
        return {
            ...tab,
            shortcuts: tab.shortcuts.map((shortcut) => {
                const [enabled, setEnabled] = useState(shortcut.enabled);

                useEffect(() => {
                    debug(
                        `[ShortcutSettings] command: ${shortcut.command}, enabled: ${enabled}`,
                    );
                }, [enabled]);

                return {
                    ...shortcut,
                    enabled,
                    setEnabled,
                };
            }),
        };
    });

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                    {tabsState.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className="w-full border-border border-b left-0 mt-2 mb-2" />
                {tabsState.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <div className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold w-2/3 flex-1">
                                            功能
                                        </TableHead>
                                        <TableHead className="font-bold whitespace-nowrap">
                                            快捷键
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tab.shortcuts.map((shortcut) => (
                                        <TableRow key={shortcut.command}>
                                            <TableCell>
                                                {shortcut.command}
                                            </TableCell>
                                            <TableCell>
                                                <KbdGroup className="hover:bg-muted-foreground p-1 rounded-md">
                                                    {shortcut.shortcut.map(
                                                        (key) => (
                                                            <Kbd className="bg-white">
                                                                {key}
                                                            </Kbd>
                                                        ),
                                                    )}
                                                </KbdGroup>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Checkbox
                                                    className="data-[state=checked]:bg-transparent data-[state=checked]:text-black mr-1"
                                                    checked={shortcut.enabled}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        shortcut.setEnabled(
                                                            checked ===
                                                                "indeterminate"
                                                                ? true
                                                                : checked,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

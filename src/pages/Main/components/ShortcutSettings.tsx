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

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className="w-full border-border border-b left-0 mt-2" />
                {tabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <div className="[&_tr]:border-b-0 [&_tr]:hover:bg-transparent">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold w-3/4">
                                            功能
                                        </TableHead>
                                        <TableHead className="font-bold w-1/4 whitespace-nowrap">
                                            快捷键
                                        </TableHead>
                                        <TableHead className="font-bold w-1/4 text-right">
                                            启用
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
                                                <KbdGroup>
                                                    {shortcut.shortcut.map(
                                                        (key) => (
                                                            <Kbd>{key}</Kbd>
                                                        ),
                                                    )}
                                                </KbdGroup>
                                            </TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={shortcut.enabled}
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

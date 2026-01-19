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
import {
    getShortcutSetting,
    Shortcut,
    ShortcutSetting as ShortcutSettingData,
} from "@/services/shortcut";
import { getLocalStore } from "@/services/store";
import { debug } from "@tauri-apps/plugin-log";
import { useEffect, useMemo, useState } from "react";

interface ShortcutSettingTabHeaderData {
    value: string;
    label: string;
}

interface ShortcutSettingTabBodyData {
    value: string;
    shortcuts: Shortcut[];
}

export default function ShortcutSetting() {
    const [setting, setSetting] = useState<ShortcutSettingData | null>(null);
    const loadShortcutSetting = async () => {
        try {
            const store = await getLocalStore();
            const shortcutSetting = await getShortcutSetting(store);
            setSetting(shortcutSetting);
        } catch (e) {
            debug(`[ShortcutSetting] load shortcut setting failed: ${e}`);
        }
    };

    useEffect(() => {
        loadShortcutSetting();
    }, []);

    const [tabsBody, setTabsBody] = useState<ShortcutSettingTabBodyData[]>([]);
    useEffect(() => {
        if (!setting) return;

        const tabsBodyMap = new Map<string, ShortcutSettingTabBodyData>();
        for (const shortcut of Object.values(setting.shortcuts)) {
            const value = shortcut.setting_page_tab_value;
            const shortcuts = tabsBodyMap.get(value)?.shortcuts || [];
            if (shortcuts.length === 0) {
                tabsBodyMap.set(value, { value: value, shortcuts: shortcuts });
            }
            shortcuts.push(shortcut);
        }

        setTabsBody(Array.from(tabsBodyMap.values()));
    }, [setting]);

    const tabHeaders = useMemo(() => {
        return [
            {
                value: "basic",
                label: "全局热键",
            },
            {
                value: "screenshot",
                label: "截图界面",
            },
        ];
    }, []);

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsHeaders headers={tabHeaders} />
                <div className="w-full border-border border-b left-0 mt-2 mb-2" />
                {tabsBody.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <div className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5">
                            <Table>
                                <TabsContentHeader />
                                <TabsContentBody shortcuts={tab.shortcuts} />
                            </Table>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

function TabsHeaders({ headers }: { headers: ShortcutSettingTabHeaderData[] }) {
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
                <TableHead className="font-bold text-center whitespace-nowrap">
                    快捷键
                </TableHead>
                <TableHead className="text-right">
                    <Checkbox className="mr-1 border-black" checked={false} />
                </TableHead>
            </TableRow>
        </TableHeader>
    );
}

function TabsContentBody({ shortcuts }: { shortcuts: Shortcut[] }) {
    return (
        <TableBody>
            {shortcuts.map((shortcut) => (
                <TableRow key={shortcut.id}>
                    {/* 功能列 */}
                    <TableCell>{shortcut.command_name}</TableCell>
                    {/* 快捷键列 */}
                    <TableCell className="text-center">
                        <KbdGroup className="hover:bg-muted-foreground p-1 rounded-md">
                            {shortcut.keys.map((key) => (
                                <Kbd className="bg-white">{key}</Kbd>
                            ))}
                        </KbdGroup>
                    </TableCell>
                    {/* 启用列 */}
                    <TableCell className="text-right">
                        <Checkbox
                            className="data-[state=checked]:bg-transparent data-[state=checked]:text-black border-black mr-1"
                            checked={shortcut.enabled}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
}

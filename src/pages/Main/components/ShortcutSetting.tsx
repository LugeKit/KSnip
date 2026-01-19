import { Checkbox } from "@/components/ui/checkbox";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KEYBOARD_SETTING_PAGE_TABS } from "@/services/shortcut/const";
import {
    getShortcutSetting,
    Shortcut,
    ShortcutSetting as ShortcutSettingData,
    updateShortcutEnabled,
} from "@/services/shortcut/shortcut";
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
            const shortcutSetting = await getShortcutSetting();
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
        return KEYBOARD_SETTING_PAGE_TABS;
    }, []);

    const onShortcutEnableChecked = async (id: string, checked: boolean) => {
        try {
            await updateShortcutEnabled(id, checked);
            await loadShortcutSetting();
        } catch (e) {
            debug(`[ShortcutSetting] failed in shortcut enabled checked: ${e}`);
        }
    };

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
                                <TabsContentBody shortcuts={tab.shortcuts} onChecked={onShortcutEnableChecked} />
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
                <TableHead className="font-bold text-center whitespace-nowrap">快捷键</TableHead>
                <TableHead className="text-right">
                    <Checkbox className="mr-1 border-black" checked={false} />
                </TableHead>
            </TableRow>
        </TableHeader>
    );
}

function TabsContentBody({
    shortcuts,
    onChecked,
}: {
    shortcuts: Shortcut[];
    onChecked: (id: string, checked: boolean) => void;
}) {
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
                            onClick={() => onChecked(shortcut.id, !shortcut.enabled)}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
}

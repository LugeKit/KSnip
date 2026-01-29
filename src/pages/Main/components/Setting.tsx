import Border from "@/components/ui/Border.tsx";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs.tsx";
import { TabsHeader, TabsHeaderData } from "@/pages/Main/components/Tab.tsx";
import { ENABLE_DEBUG_SETTING } from "@/services/setting/const";
import { getSetting, updateSetting } from "@/services/setting/setting";
import { Setting, SettingValue, SettingValueBoolean } from "@/services/setting/types";
import { debug, error } from "@tauri-apps/plugin-log";
import { useEffect, useMemo, useState } from "react";

type SettingData = {
    settingIds: string[];
} & TabsHeaderData;

export default function SettingComponent() {
    const defaultValue = useMemo(() => "overall", []);

    const settingPages: SettingData[] = useMemo(() => {
        return [
            {
                label: "全局设置",
                page: "overall",
                settingIds: [],
            },
            {
                label: "调试设置",
                page: "debug",
                settingIds: [ENABLE_DEBUG_SETTING],
            },
        ];
    }, []);

    const [settingItems, setSettingItems] = useState<Record<string, Setting[]>>({});

    const refreshAllSettings = async () => {
        const newSettingItems: Record<string, Setting[]> = {};

        for (const settingPage of settingPages) {
            const itemsByPage = await Promise.all(
                settingPage.settingIds.map(async (id) => {
                    return await getSetting(id);
                }),
            );
            newSettingItems[settingPage.page] = itemsByPage.filter((item) => item !== undefined);
        }

        setSettingItems(newSettingItems);
    };

    useEffect(() => {
        refreshAllSettings();
    }, []);

    const onValueChanged = (page: string) => {
        return async (id: string, newValue: SettingValue) => {
            debug(`[SettingComponent] onValueChanged id: ${id}, newValue: ${JSON.stringify(newValue)}`);
            try {
                await updateSetting(id, newValue);
                const newSettingItem = await getSetting(id);
                if (!newSettingItem) {
                    return;
                }

                setSettingItems((prev) => ({
                    ...prev,
                    [page]: prev[page].map((item) => (item.id === id ? newSettingItem : item)),
                }));
            } catch (e) {
                error(`[SettingComponent] onValueChanged ${id}, newValue: ${JSON.stringify(newValue)}, error: ${e}`);
            }
        };
    };

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue={defaultValue} className="w-full">
                <TabsHeader headers={settingPages} />
                <Border />
                {Object.entries(settingItems).map(([page, items]) => {
                    return (
                        <TabsContent
                            key={page}
                            value={page}
                            className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5"
                        >
                            <Table>
                                <TabsContentHeader />
                                <TableBody>
                                    {items.map((item) => {
                                        return <SettingTableRow item={item} onValueChanged={onValueChanged(page)} />;
                                    })}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}

function TabsContentHeader() {
    return (
        <TableHeader>
            <TableRow>
                <TableHead className="font-bold w-[200px]">功能</TableHead>
            </TableRow>
        </TableHeader>
    );
}

function SettingTableRow({
    item,
    onValueChanged,
}: {
    item: Setting;
    onValueChanged: (id: string, newValue: SettingValue) => void;
}) {
    return (
        <TableRow>
            <TableCell>{item.name}</TableCell>
            {item.type === "Boolean" && (
                <BooleanSetting
                    id={item.id}
                    value={item.value as SettingValueBoolean}
                    onValueChanged={onValueChanged}
                />
            )}
        </TableRow>
    );
}

function BooleanSetting({
    id,
    value,
    onValueChanged,
}: {
    id: string;
    value: SettingValueBoolean;
    onValueChanged: (id: string, newValue: SettingValueBoolean) => void;
}) {
    return (
        <TableCell className="text-right">
            <Checkbox
                className="data-[state=checked]:bg-transparent data-[state=checked]:text-black border-black mr-4"
                checked={value.value}
                onCheckedChange={(checked) => onValueChanged(id, new SettingValueBoolean(!!checked))}
            />
        </TableCell>
    );
}

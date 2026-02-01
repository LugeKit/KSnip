import Border from "@/components/ui/Border.tsx";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SettingTabsContent, TabsHeader, TabsHeaderData } from "@/pages/Main/components/Tab.tsx";
import { ENABLE_DEBUG_SETTING, RECORDING_PATH_SETTING } from "@/services/setting/const";
import { Setting, SettingValue, SettingValueBoolean, SettingValuePath } from "@/services/setting/types";
import { useSettingStore } from "@/stores/useSettingStore";
import { open } from "@tauri-apps/plugin-dialog";
import { debug, error } from "@tauri-apps/plugin-log";
import { CircleAlert, FolderOpen } from "lucide-react";
import { useMemo } from "react";

type SettingData = {
    settingIds: string[];
} & TabsHeaderData;

export default function SettingComponent() {
    const defaultValue = useMemo(() => "overall", []);
    const { settings, updateSetting } = useSettingStore();

    const settingPages: SettingData[] = useMemo(() => {
        return [
            {
                label: "全局设置",
                page: "overall",
                settingIds: [RECORDING_PATH_SETTING],
            },
            {
                label: "调试设置",
                page: "debug",
                settingIds: [ENABLE_DEBUG_SETTING],
            },
        ];
    }, []);

    const settingItems = useMemo(() => {
        const newSettingItems: Record<string, Setting[]> = {};

        for (const settingPage of settingPages) {
            newSettingItems[settingPage.page] = settingPage.settingIds
                .map((id) => settings[id])
                .filter((item) => item !== undefined);
        }

        return newSettingItems;
    }, [settings, settingPages]);

    const onValueChanged = async (id: string, newValue: SettingValue) => {
        debug(`[SettingComponent] onValueChanged id: ${id}, newValue: ${JSON.stringify(newValue)}`);
        try {
            await updateSetting(id, newValue);
        } catch (e) {
            error(`[SettingComponent] onValueChanged ${id}, newValue: ${JSON.stringify(newValue)}, error: ${e}`);
        }
    };

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue={defaultValue} className="w-full max-h-full">
                <TabsHeader headers={settingPages} />
                <Border />
                {Object.entries(settingItems).map(([page, items]) => {
                    return (
                        <SettingTabsContent key={page} value={page}>
                            <Table>
                                <TabsContentHeader />
                                <TableBody>
                                    {items.map((item) => {
                                        return <SettingTableRow item={item} onValueChanged={onValueChanged} />;
                                    })}
                                </TableBody>
                            </Table>
                        </SettingTabsContent>
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
        <TableRow className="h-14">
            <TableCell>
                <div className="flex items-center gap-2">
                    {item.name}
                    {item.description && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CircleAlert className="h-4 w-4 cursor-help text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </TableCell>
            {item.type === "Boolean" && (
                <BooleanSetting
                    id={item.id}
                    value={item.value as SettingValueBoolean}
                    onValueChanged={onValueChanged}
                />
            )}
            {item.type === "Path" && (
                <PathSetting id={item.id} value={item.value as SettingValuePath} onValueChanged={onValueChanged} />
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
                className="data-[state=checked]:bg-transparent data-[state=checked]:text-black border-black mr-4 align-middle"
                checked={value.value}
                onCheckedChange={(checked) => onValueChanged(id, new SettingValueBoolean(!!checked))}
            />
        </TableCell>
    );
}

function PathSetting({
    id,
    value,
    onValueChanged,
}: {
    id: string;
    value: SettingValuePath;
    onValueChanged: (id: string, newValue: SettingValuePath) => void;
}) {
    const openDialog = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: value.path || undefined,
            });

            if (selected && typeof selected === "string") {
                onValueChanged(id, new SettingValuePath(selected));
            }
        } catch (e) {
            error(`[PathSetting] failed to open dialog: ${e}`);
        }
    };

    return (
        <TableCell className="text-right">
            <div className="flex items-center gap-2">
                <Input
                    className="w-full"
                    placeholder="默认（文档文件夹）"
                    value={value.path}
                    onChange={(e) => onValueChanged(id, new SettingValuePath(e.target.value))}
                />
                <Button variant="outline" size="icon" onClick={openDialog}>
                    <FolderOpen className="h-4 w-4" />
                </Button>
            </div>
        </TableCell>
    );
}

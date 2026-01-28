import {Tabs, TabsContent} from "@/components/ui/tabs.tsx";
import {TabsHeader, TabsHeaderData} from "@/pages/Main/components/Tab.tsx";
import Border from "@/components/ui/Border.tsx";
import {useMemo, useState} from "react";

type SettingData = {
    settingIds: string[]
} & TabsHeaderData;

type SettingItem = {
    id: string;
    settingValue: SettingValue;
}

type SettingValue = {
    type: string;
    value: any;
}

export default function Setting() {
    const defaultValue = useMemo(() => "overall", []);

    const settings: SettingData[] = useMemo(() => {
        return [
            {
                label: "全局设置",
                page: "overall",
                settingIds: []
            },
            {
                label: "调试设置",
                page: "debug",
                settingIds: []
            }
        ]
    }, []);

    const [settingItems, _] = useState<Record<string, SettingItem[]>>({})

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue={defaultValue} className="w-full">
                <TabsHeader headers={settings}/>
                <Border/>
                {Object.entries(settingItems).map(([page, items]) => {
                    return (
                        <TabsContent key={page} value={page}
                                     className="[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5"
                        >
                            {items.map(() => {
                                return <Border/>
                            })}

                        </TabsContent>
                    )
                })}
            </Tabs>
        </div>
    )
}

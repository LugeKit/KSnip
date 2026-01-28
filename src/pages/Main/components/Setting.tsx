import {Tabs} from "@/components/ui/tabs.tsx";
import {TabsHeader, TabsHeaderData} from "@/pages/Main/components/Tab.tsx";
import Border from "@/components/ui/Border.tsx";
import {useMemo} from "react";

type SettingData = {
    settings: string[]
} & TabsHeaderData;

export default function Setting() {
    const settings: SettingData[] = useMemo(() => {
        return [
            {
                label: "全局设置",
                page: "overall",
                settings: []
            },
            {
                label: "调试设置",
                page: "debug",
                settings: []
            }
        ]
    }, [])

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsHeader headers={settings}/>
                <Border/>
            </Tabs>
        </div>
    )
}

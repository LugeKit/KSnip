import {Tabs} from "@/components/ui/tabs.tsx";
import {TabsHeaders} from "@/pages/Main/components/Tab.tsx";
import Border from "@/components/ui/Border.tsx";
import {useMemo} from "react";


export default function Setting() {
    const headers = useMemo(() => {
        return [
            {
                label: "全局设置",
                page: "overall"
            },
            {
                label: "调试设置",
                page: "debug"
            }
        ]
    }, [])

    return (
        <div className="relative top-0 right-0 w-full h-full p-4">
            <Tabs defaultValue="basic" className="w-full">
                <TabsHeaders headers={headers}/>
                <Border/>
            </Tabs>
        </div>
    )
}

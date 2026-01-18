import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ShortcutSettings() {
    return (
        <div className="relative top-0 right-0 w-full h-full">
            <Tabs defaultValue="basic" className="w-full m-4">
                <TabsList className="gap-6">
                    <TabsTrigger value="basic">基础</TabsTrigger>
                    <TabsTrigger value="screenshot">截图界面</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="w-full border-border border-b left-0" />
        </div>
    );
}

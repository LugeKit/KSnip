import {TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";

export type TabsHeaderData = {
    page: string;
    label: string;
}

export function TabsHeader({headers}: { headers: TabsHeaderData[] }) {
    return (
        <TabsList className="gap-2">
            {headers.map((header) => (
                <TabsTrigger key={header.page} value={header.page}>
                    {header.label}
                </TabsTrigger>
            ))}
        </TabsList>
    );
}

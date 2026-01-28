import {TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";

type TabsHeader = {
    page: string;
    label: string;
}

export function TabsHeaders({headers}: { headers: TabsHeader[] }) {
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

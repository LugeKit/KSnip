import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { cn } from "@/lib/utils";
import * as React from "react";

export type TabsHeaderData = {
    page: string;
    label: string;
};

export function TabsHeader({ headers }: { headers: TabsHeaderData[] }) {
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

export function SettingTabsContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof TabsContent>) {
    return (
        <TabsContent
            className={cn(
                "[&_tr]:hover:bg-transparent bg-muted rounded-md pl-5 pr-5 overflow-y-auto min-h-0 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
                className,
            )}
            {...props}
        >
            {children}
        </TabsContent>
    );
}

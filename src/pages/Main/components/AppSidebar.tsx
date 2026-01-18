import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Keyboard, Settings } from "lucide-react";

export default function AppSidebar() {
    const items = [
        {
            title: "设置",
            icon: Settings,
            url: "#settings",
        },
        {
            title: "快捷键",
            icon: Keyboard,
            url: "#shortcuts",
        }
    ];

    return (
        <Sidebar>
            <SidebarHeader />
            <SidebarContent>
                <SidebarMenu>
                    {items.map((item) => {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <a href={item.url}>
                                        <item.icon />
                                        {<span>{item.title}</span>}
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Keyboard, Scissors, Settings } from "lucide-react";

export default function AppSidebar() {
    const { toggleSidebar } = useSidebar();
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
        },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={toggleSidebar} asChild>
                            <a>
                                <Scissors className="size-4" />
                                <span className="font-bold">k-snip</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <div className="border-b ml-3 mr-3" />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
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
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}

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

export enum MenuKey {
    Settings = "settings",
    Shortcuts = "shortcuts",
}

interface AppSidebarProps {
    onMenuClick: (menuKey: MenuKey) => void;
}

export default function AppSidebar({ onMenuClick }: AppSidebarProps) {
    const { toggleSidebar } = useSidebar();
    const items = [
        {
            title: "设置",
            icon: Settings,
            onClick: () => onMenuClick(MenuKey.Settings),
        },
        {
            title: "快捷键",
            icon: Keyboard,
            onClick: () => onMenuClick(MenuKey.Shortcuts),
        },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={toggleSidebar} asChild>
                            <a className="select-none cursor-pointer">
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
                                        <SidebarMenuButton
                                            onClick={item.onClick}
                                            asChild
                                        >
                                            <a className="select-none cursor-pointer">
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

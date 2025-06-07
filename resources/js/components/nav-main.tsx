import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const hasSubMenu = item.items && item.items.length > 0;
                    if (!hasSubMenu) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    className={[
                                        'h-10',
                                        item.href === page.url
                                            ? 'bg-gradient-to-r from-blue-950 to-blue-800 text-white hover:text-white'
                                            : 'bg-gradient-to-r transition duration-300 hover:from-blue-950 hover:to-blue-800 hover:text-white',
                                    ]}
                                    asChild
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }
                    return (
                        <Collapsible key={item.title} asChild className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger
                                    asChild
                                    className={[
                                        'h-10',
                                        item.href === page.url
                                            ? 'bg-gradient-to-r from-blue-950 to-blue-800 text-white hover:text-white'
                                            : 'bg-gradient-to-r transition duration-300 hover:from-blue-950 hover:to-blue-800 hover:!text-white',
                                    ]}
                                >
                                    <SidebarMenuButton tooltip={item.title}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    className={
                                                        subItem.href === page.url
                                                            ? 'bg-gradient-to-r from-blue-950 to-blue-800 text-white hover:text-white'
                                                            : 'bg-gradient-to-r transition duration-200 hover:from-blue-950 hover:to-blue-800 hover:text-white'
                                                    }
                                                >
                                                    <Link href={subItem.href} prefetch>
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

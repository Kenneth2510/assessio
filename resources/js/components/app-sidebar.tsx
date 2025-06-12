import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { canAny } from '@/lib/can';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, SquarePen, UserCog, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        ...(canAny(['users.index'])
            ? [
                  {
                      title: 'User Management',
                      icon: Users,
                      items: [
                          {
                              title: 'Admin',
                              href: '/user-management/admin',
                              icon: UserCog,
                          },
                          {
                              title: 'Instructors',
                              href: '/user-management/instructor',
                              icon: UserCog,
                          },
                          {
                              title: 'Learners',
                              href: '/user-management/learner',
                              icon: UserCog,
                          },
                      ],
                  },
              ]
            : []),
        ...(canAny(['quizzes.index'])
            ? [
                  {
                      title: 'Quiz Management',
                      href: '/quiz-management',
                      icon: SquarePen,
                  },
              ]
            : []),
        ...(canAny(['quiz-participation.index'])
            ? [
                  {
                      title: 'Quizzes',
                      href: '/quiz-access',
                      icon: SquarePen,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, MessageCircle, Settings2, Users } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { catalogos, usuarios, whatsapp } from '@/routes/admin';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

const elementosNav: NavItem[] = [
    {
        title: 'Panel',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const elementosAdmin: NavItem[] = [
    {
        title: 'WhatsApp',
        href: whatsapp(),
        icon: MessageCircle,
    },
    {
        title: 'Catálogos',
        href: catalogos(),
        icon: Settings2,
    },
    {
        title: 'Usuarios',
        href: usuarios(),
        icon: Users,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const esAdmin = auth.user.rol === 'Administrador';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={elementosNav} />
                {esAdmin && <NavMain items={elementosAdmin} label="Administración" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

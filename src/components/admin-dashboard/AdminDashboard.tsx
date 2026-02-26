
'use client';

import { Suspense } from "react";
import { HomeIcon, Users, ShoppingCart, Megaphone } from "lucide-react";
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader, PageHeaderTitle } from "@/components/PageHeader";
import { withAuth } from "@/components/withAuth";
import { AuthDropdown } from "@/components/AuthDropdown";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import Dashboard from "../dashboard/Dashboard";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useLanguage } from "../LanguageProvider";

function AdminDashboardInternal() {
    const { t } = useLanguage();
  return (
    <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar>
            <SidebarHeader className="bg-red-gradient justify-center">
                <h2 className="text-xl font-bold p-2 text-primary-foreground">ZoomCut</h2>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/">
                    <SidebarMenuButton isActive>
                        <HomeIcon />
                        {t('sidebar_dashboard')}
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/subscribers">
                    <SidebarMenuButton>
                        <Users />
                        {t('sidebar_subscribers')}
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/orders">
                    <SidebarMenuButton>
                        <ShoppingCart />
                        {t('sidebar_orders')}
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/updates">
                    <SidebarMenuButton>
                        <Megaphone />
                        {t('sidebar_updates')}
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <div className="flex flex-col sm:gap-4 sm:py-4 md:pl-[--sidebar-width-icon] rtl:md:pr-[--sidebar-width-icon] rtl:md:pl-0 lg:pl-[--sidebar-width] rtl:lg:pr-[--sidebar-width] rtl:lg:pl-0">
            <PageHeader>
            <SidebarTrigger className="sm:hidden" />
            <PageHeaderTitle>{t('header_admin_dashboard')}</PageHeaderTitle>
            <div className="ml-auto flex items-center gap-2">
                <LanguageSwitcher />
                <AuthDropdown />
            </div>
            </PageHeader>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Suspense fallback={<DashboardLoading />}>
                    <Dashboard />
                </Suspense>
            </main>
        </div>
        </div>
    </SidebarProvider>
  );
}

export const AdminDashboard = withAuth(AdminDashboardInternal, { roles: ['admin'] });

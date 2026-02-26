
'use client';

import { withAuth } from "@/components/withAuth";
import { Megaphone, HomeIcon, Users, ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader, PageHeaderTitle } from "@/components/PageHeader";
import { AuthDropdown } from "@/components/AuthDropdown";
import { Suspense } from "react";
import { DashboardLoading } from "../dashboard/DashboardLoading";
import { UpdatesPageContent } from "./UpdatesPageContent";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useLanguage } from "../LanguageProvider";

function UpdatesPageInternal() {
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
                    <SidebarMenuButton>
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
                    <SidebarMenuButton isActive>
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
                <PageHeaderTitle>{t('header_updates')}</PageHeaderTitle>
                <div className="ml-auto flex items-center gap-2">
                    <LanguageSwitcher />
                    <AuthDropdown />
                </div>
            </PageHeader>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Suspense fallback={<DashboardLoading />}>
                    <UpdatesPageContent />
                </Suspense>
            </main>
        </div>
    </div>
    </SidebarProvider>
  );
}

export const UpdatesPage = withAuth(UpdatesPageInternal, { roles: ['admin'] });

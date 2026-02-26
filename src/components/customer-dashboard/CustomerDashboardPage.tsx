
'use client';

import { Suspense } from "react";
import { withAuth } from "@/components/withAuth";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { CustomerDashboard } from "./CustomerDashboard";
import { CustomerHeader } from "./CustomerHeader";

function CustomerDashboardPageInternal() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <CustomerHeader />
        <div className="container mx-auto flex-1 p-4 sm:p-6 md:p-8 max-w-6xl">
            <main>
                <Suspense fallback={<DashboardLoading />}>
                    <CustomerDashboard />
                </Suspense>
            </main>
        </div>
    </div>
  );
}

export const CustomerDashboardPage = withAuth(CustomerDashboardPageInternal, { roles: ['customer'] });

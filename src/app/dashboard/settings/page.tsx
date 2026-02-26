
'use client';

import { CustomerHeader } from "@/components/customer-dashboard/CustomerHeader";
import { SettingsPage } from "@/components/customer-dashboard/SettingsPage";
import { withAuth } from "@/components/withAuth";

function Settings() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <CustomerHeader />
            <div className="container mx-auto flex-1 p-4 sm:p-6 md:p-8 max-w-6xl">
                <main>
                    <SettingsPage />
                </main>
            </div>
        </div>
    )
}

export default withAuth(Settings, { roles: ['customer'] });

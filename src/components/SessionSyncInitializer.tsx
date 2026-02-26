
'use client';

import * as React from 'react';
import DashboardSessionSync from '@/lib/session-sync';

export function SessionSyncInitializer({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        // Ensure this only runs on the client
        if (typeof window !== 'undefined') {
            const sessionSync = new DashboardSessionSync();
            sessionSync.initialize();
        }
    }, []);

    return <>{children}</>;
}

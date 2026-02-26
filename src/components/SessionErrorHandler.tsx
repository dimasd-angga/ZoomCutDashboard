'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';

export function SessionErrorHandler() {
    const { toast } = useToast();

    React.useEffect(() => {
        const handleSessionError = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { error, status, data } = customEvent.detail || {};

            let title = 'Session Error';
            let description = error || 'Failed to create session';

            // Customize message based on error type
            if (status === 409 && data?.allowedDevices) {
                title = 'Device Limit Reached';
                description = `You can only be logged in on ${data.allowedDevices} device(s) at a time. Please log out from another device first.`;
            }

            toast({
                variant: 'destructive',
                title,
                description,
                duration: 5000,
            });
        };

        window.addEventListener('session-error', handleSessionError);

        return () => {
            window.removeEventListener('session-error', handleSessionError);
        };
    }, [toast]);

    return null;
}


import { getSubscriptions as getLemonSqueezySubscriptions } from "@/lib/lemonsqueezy";
import { storeAnalyticsData } from "@/lib/firebase";
import { NextResponse } from 'next/server';
import type { Subscription } from "@/lib/types";

export async function GET() {
    try {
        const subscriptionsResponse = await getLemonSqueezySubscriptions();
        const allSubscriptions = (subscriptionsResponse?.data || []).map(s => ({ id: String(s.id), ...s.attributes })) as Subscription[];

        // Group subscriptions by customer ID
        const subsByCustomer = allSubscriptions.reduce((acc, sub) => {
            const customerId = sub.customer_id;
            if (!acc[customerId]) {
                acc[customerId] = [];
            }
            acc[customerId].push(sub);
            return acc;
        }, {} as Record<string, Subscription[]>);

        // Find the most relevant subscription for each customer
        const definitiveSubscriptions = Object.values(subsByCustomer).map(customerSubs => {
            // Sort by creation date, newest first
            const sortedSubs = customerSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            // Prefer the newest 'active' subscription
            const activeSub = sortedSubs.find(s => s.status === 'active');
            if (activeSub) {
                return activeSub;
            }

            // Otherwise, just return the most recently created one
            return sortedSubs[0];
        });

        if (definitiveSubscriptions.length > 0) {
            await storeAnalyticsData('subscriptions', definitiveSubscriptions);
        }

        return NextResponse.json({ data: definitiveSubscriptions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

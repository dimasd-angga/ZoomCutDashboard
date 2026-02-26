
import { cancelSubscription as lsCancelSubscription } from "@/lib/lemonsqueezy";
import { deleteSubscription, deleteCustomer } from "@/lib/firebase";
import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const subscriptionId = params.id;

    if (!subscriptionId) {
        return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    try {
        // If it's a trial subscription, it won't exist in Lemon Squeezy.
        // We can just delete it from Firestore directly.
        if (String(subscriptionId).startsWith('trial_')) {
             await deleteSubscription(subscriptionId);
             await deleteCustomer(subscriptionId); 
        } else {
            // For real subscriptions, cancel in Lemon Squeezy first.
            // The webhook from Lemon Squeezy will then trigger the update/deletion in Firestore.
            // However, we can also proactively delete here for a faster UI update.
            await lsCancelSubscription(subscriptionId);
            await deleteSubscription(subscriptionId);
        }

        return NextResponse.json({ message: "Subscription cancelled successfully" }, { status: 200 });

    } catch (error: any) {
        // Check if the error is because the subscription is not found (already cancelled/deleted)
        if (error.cause?.errors?.[0]?.status === 404) {
             // If not found in LS, it might be a trial user or already deleted.
             // We can proceed to delete from Firestore.
             try {
                await deleteSubscription(subscriptionId);
                await deleteCustomer(subscriptionId);
                return NextResponse.json({ message: "Subscription not found in Lemon Squeezy, deleted from local DB." }, { status: 200 });
             } catch (dbError: any) {
                return NextResponse.json({ error: dbError.message }, { status: 500 });
             }
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

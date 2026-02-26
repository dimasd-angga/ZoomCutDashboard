
import { getOrders } from "@/lib/lemonsqueezy";
import { storeAnalyticsData } from "@/lib/firebase";
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const orders = await getOrders();
        const orderData = (orders?.data || []).map(o => ({ id: String(o.id), ...o.attributes }));

        if (orderData.length > 0) {
            await storeAnalyticsData('orders', orderData);
        }
        
        return NextResponse.json({ data: orderData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { getCustomers } from "@/lib/lemonsqueezy";
import { storeAnalyticsData } from "@/lib/firebase";
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const customers = await getCustomers();
        const customerData = (customers?.data || []).map(c => ({ id: String(c.id), ...c.attributes }));

        if (customerData.length > 0) {
            await storeAnalyticsData('customers', customerData);
        }

        return NextResponse.json({ data: customerData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

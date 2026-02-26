
import { getProducts } from "@/lib/lemonsqueezy";
import { storeAnalyticsData } from "@/lib/firebase";
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const products = await getProducts();
        const productData = (products?.data || []).map(p => ({ id: String(p.id), ...p.attributes }));

        if(productData.length > 0) {
            await storeAnalyticsData('products', productData);
        }

        return NextResponse.json({ data: productData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import type { Subscriber, Order, Product, Subscription } from '@/lib/types';
import { KeyMetrics } from './KeyMetrics';
import { SubscriberTable } from '../subscribers/SubscriberTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OrderTable } from '../orders/OrderTable';
import { SubscriptionHistoryChart } from './SubscriptionHistoryChart';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';

export function DashboardPage({ subscribers, orders, products, subscriptions }: { subscribers: Subscriber[], orders: Order[], products: Product[], subscriptions: Subscription[] }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-6">
      <KeyMetrics subscribers={subscribers} orders={orders} subscriptions={subscriptions} />
      <div className="grid gap-4 md:grid-cols-1">
        <SubscriptionHistoryChart subscriptions={subscriptions} />
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card className="bg-sidebar">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('recent_subscribers_title')}</CardTitle>
                    <CardDescription>
                        {t('recent_subscribers_desc')}
                    </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto rtl:mr-auto rtl:ml-0 gap-1">
                    <Link href="/subscribers">
                        {t('view_all_button')}
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <SubscriberTable isDashboard={true} />
            </CardContent>
        </Card>
        <Card className="bg-sidebar">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('recent_orders_title')}</CardTitle>
                    <CardDescription>
                        {t('recent_orders_desc')}
                    </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto rtl:mr-auto rtl:ml-0 gap-1">
                    <Link href="/orders">
                        {t('view_all_button')}
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <OrderTable isDashboard={true}/>
            </CardContent>
        </Card>
       </div>
    </div>
  );
}

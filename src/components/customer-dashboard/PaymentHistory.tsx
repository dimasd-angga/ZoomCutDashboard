'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, ExternalLink, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '../EmptyState';
import { useLanguage } from '../LanguageProvider';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


const statusVariantMap: Record<Order['status'], "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
  'on-hold': "secondary",
};


export function PaymentHistory({ orders }: { orders: Order[] }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
        <Card className="bg-card">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex w-full cursor-pointer items-center">
                    <CardHeader className="flex w-full flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <History className="h-6 w-6" />
                            <div>
                                <CardTitle>{t('payment_history')}</CardTitle>
                                <CardDescription>{t('recent_payments')}</CardDescription>
                            </div>
                        </div>
                        <ChevronsUpDown className="h-4 w-4" />
                    </CardHeader>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                  <div className="rounded-md border">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>{t('date')}</TableHead>
                                  <TableHead>{t('plan')}</TableHead>
                                  <TableHead>{t('status')}</TableHead>
                                  <TableHead>{t('total')}</TableHead>
                                  <TableHead className="text-right">{t('receipt')}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {orders.length > 0 ? (
                                  orders.map((order) => (
                                      <TableRow key={order.identifier}>
                                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                          <TableCell>{order.first_order_item?.product_name ?? 'N/A'}</TableCell>
                                          <TableCell>
                                              <Badge variant={statusVariantMap[order.status] ?? 'secondary'}>{order.status_formatted}</Badge>
                                          </TableCell>
                                          <TableCell>{order.total_formatted}</TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="outline" size="icon" asChild>
                                                  <a href={order.urls.receipt} target="_blank" rel="noopener noreferrer">
                                                      <ExternalLink className="h-4 w-4" />
                                                  </a>
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={5} className="h-24 text-center">
                                       <EmptyState 
                                            icon={<History className="h-10 w-10" />}
                                            title={t('no_orders_found')}
                                            description={t('no_orders_match_filter')}
                                       />
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
    );
}

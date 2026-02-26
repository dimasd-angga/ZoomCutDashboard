
'use client';

import * as React from 'react';
import { Subscription } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
  BarChart,
  Bar,
} from '@/components/ui/chart';
import { XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, isSameMonth, isAfter, isBefore } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useLanguage } from '../LanguageProvider';

type Status = 'Trial' | 'Trial Ended' | 'Basic' | 'Premium' | 'Canceled';

const chartConfig: ChartConfig = {
  Trial: { label: 'Trial', color: '#f59e0b' }, // Orange
  'Trial Ended': { label: 'Trial Ended', color: '#6b7280' }, // Gray
  Basic: { label: 'Basic', color: '#3b82f6' }, // Blue
  Premium: { label: 'Premium', color: '#8b5cf6' }, // Purple
  Canceled: { label: 'Canceled', color: '#ef4444' }, // Red
};

const getSubscriptionStatusForDate = (subscription: Subscription, date: Date): Status | null => {
    if (!subscription.created_at) {
        return null;
    }
    const createdAt = parseISO(subscription.created_at);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Skip if subscription was created after this month
    if (isAfter(startOfMonth(createdAt), monthEnd)) {
        return null;
    }

    // Parse optional dates
    const trialEndsAt = subscription.trial_ends_at ? parseISO(subscription.trial_ends_at) : null;
    const endsAt = subscription.ends_at ? parseISO(subscription.ends_at) : null;

    // Skip if subscription ended before this month
    if (endsAt && isBefore(endsAt, monthStart)) {
        return null;
    }

    // 1. Canceled - user actively cancelled (whether during trial or after)
    if (subscription.cancelled && endsAt && isSameMonth(date, endsAt)) {
        return 'Canceled';
    }

    // 2. Trial Ended - trial naturally expired without user action (not cancelled)
    // This would be a case where trial_ends_at exists, subscription is not active,
    // but it was NOT cancelled by the user (system automatically ended it)
    if (trialEndsAt && !subscription.cancelled && subscription.status !== 'active' && 
        subscription.status !== 'on_trial' && isSameMonth(date, trialEndsAt)) {
        return 'Trial Ended';
    }

    // 3. On Trial - currently in trial period
    if (subscription.status === 'on_trial' || 
        (trialEndsAt && isBefore(monthStart, trialEndsAt) && !subscription.cancelled)) {
        return 'Trial';
    }

    // 4. Active subscriptions (Basic or Premium)
    if (subscription.status === 'active') {
        // Determine if Basic or Premium based on product name
        if (subscription.product_name.toLowerCase().includes('premium')) {
            return 'Premium';
        } else {
            return 'Basic';
        }
    }

    return null;
}

export function SubscriptionHistoryChart({ subscriptions }: { subscriptions: Subscription[] }) {
  console.log({subscriptions})  
  const { t } = useLanguage();
  const [activeRange, setActiveRange] = React.useState<number | 'custom'>(12);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
        const to = new Date();
        const from = subMonths(to, 11);
        return { from, to };
    });

    const chartData = React.useMemo(() => {
        const from = dateRange?.from ? startOfMonth(dateRange.from) : startOfMonth(subMonths(new Date(), 11));
        const to = dateRange?.to ? endOfMonth(dateRange.to) : endOfMonth(new Date());
        
        const dates = eachMonthOfInterval({ start: from, end: to });

        return dates.map(date => {
            const counts: Record<Status, number> = {
                'Trial': 0,
                'Trial Ended': 0,
                'Basic': 0,
                'Premium': 0,
                'Canceled': 0
            };

            subscriptions.forEach(sub => {
                const status = getSubscriptionStatusForDate(sub, date);
                if (status) {
                    counts[status]++;
                }
            });
            
            return {
                date: format(date, 'MMM yyyy'),
                Trial: counts.Trial === 0 ? 0.1 : counts.Trial,
                'Trial Ended': counts['Trial Ended'] === 0 ? 0.1 : counts['Trial Ended'],
                Basic: counts.Basic === 0 ? 0.1 : counts.Basic,
                Premium: counts.Premium === 0 ? 0.1 : counts.Premium,
                Canceled: counts.Canceled === 0 ? 0.1 : counts.Canceled,
            };
        });

    }, [subscriptions, dateRange]);
    
    const handleSetRange = (months: number) => {
        const to = new Date();
        const from = subMonths(to, months - 1);
        setDateRange({ from, to });
        setActiveRange(months);
    }

    const handleCustomRange = (range: DateRange | undefined) => {
        setDateRange(range);
        setActiveRange('custom');
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sales_chart_title')}</CardTitle>
        <CardDescription>{t('sales_chart_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 flex-wrap">
            {[3, 6, 12].map(r => (
                 <Button 
                    key={r} 
                    variant={activeRange === r ? "default" : "outline"} 
                    onClick={() => handleSetRange(r)}
                    className={activeRange === r ? "bg-primary text-primary-foreground" : ""}
                 >
                    {t(r === 3 ? 'time_range_3_months' : r === 6 ? 'time_range_6_months' : 'time_range_1_year', { count: r })}
                </Button>
            ))}
            <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeRange === 'custom' ? "default" : "outline"}
                className={cn(
                  "justify-start text-left font-normal w-[280px]",
                  !dateRange && "text-muted-foreground",
                  activeRange === 'custom' && "bg-primary text-primary-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL yyyy")} -{" "}
                      {format(dateRange.to, "LLL yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL yyyy")
                  )
                ) : (
                  <span>Custom range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleCustomRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart data={chartData} barCategoryGap="10%">
                <CartesianGrid vertical={false} />
                 <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                    content={<ChartTooltipContent 
                        indicator="dot"
                        labelFormatter={(value, payload) => {
                            return payload?.[0]?.payload.date;
                        }}
                        formatter={(value, name, item) => {
                            // Show actual count (0) in tooltip, not the 0.1 display value  
                            const actualValue = item.value === 0.1 ? 0 : item.value;
                             return (
                               <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                                    <div className="flex justify-between flex-1">
                                         <span>{item.name}</span>
                                        <span className="font-bold ml-4">{actualValue}</span>
                                    </div>
                               </div>
                            )
                        }}
                    />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                 {Object.keys(chartConfig).map((key) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={chartConfig[key as keyof typeof chartConfig].color}
                        radius={4}
                    />
                ))}
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

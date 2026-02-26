

'use client';

import * as React from 'react';
import type { Subscriber, SubscriberStatus, SubscriptionWithCustomer } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, ArrowUpDown, RefreshCw, Users, ServerCrash, Calendar as CalendarIcon, Download } from 'lucide-react';
import { DeleteSubscriberDialog } from '@/components/subscribers/DeleteSubscriberDialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useAppContext } from '../AppContext';
import { EmptyState } from '../EmptyState';
import { useLanguage } from '../LanguageProvider';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { ExportDialog } from '../dashboard/ExportDialog';

const statusVariantMap: Record<SubscriberStatus, "default" | "secondary" | "destructive" | "outline" | "active" | "on_trial" | "paused"> = {
  active: "active",
  on_trial: "on_trial",
  cancelled: "destructive",
  expired: "destructive",
  past_due: "destructive",
  unpaid: "destructive",
  paused: "paused",
};

const ITEMS_PER_PAGE = 10;

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function SubscriberTable({ isDashboard = false }: { isDashboard?: boolean }) {
  const { subscriptionsWithCustomers, fetchData, error } = useAppContext();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<SubscriberStatus[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof SubscriptionWithCustomer; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc'});
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [selectedSubscription, setSelectedSubscription] = React.useState<SubscriptionWithCustomer | null>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [isExportDialogOpen, setExportDialogOpen] = React.useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    toast({
      title: t('toast_syncing_subscribers_title'),
      description: t('toast_syncing_subscribers_desc'),
    });
    try {
        await fetchData();
        toast({
            title: t('toast_sync_complete_title'),
            description: t('toast_subscribers_updated_desc'),
        });
    } catch(e) {
        // Error toast is handled in AppContext
    } finally {
        setIsSyncing(false);
    }
  }

  const handleSort = (key: keyof SubscriptionWithCustomer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredSubscriptions = React.useMemo(() => {
    let filtered = subscriptionsWithCustomers.filter((subscription) =>
      (subscription.user_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (subscription.user_email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );

    if (statusFilter.length > 0) {
      filtered = filtered.filter((subscription) => statusFilter.includes(subscription.status));
    }
    
    if (dateRange?.from && dateRange?.to) {
        filtered = filtered.filter(subscription => {
            if (!subscription.created_at) return false;
            const subDate = new Date(subscription.created_at);
            return subDate >= dateRange.from! && subDate <= dateRange.to!;
        });
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [subscriptionsWithCustomers, searchTerm, statusFilter, sortConfig, dateRange]);

  const itemsPerPage = isDashboard ? 5 : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenDialog = (subscription: SubscriptionWithCustomer) => {
    setSelectedSubscription(subscription);
    setDialogOpen(true);
  };
  
  const handleDelete = async (subscriptionId: string | number) => {
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}`, { method: 'DELETE' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to delete subscription');
        }
        
        toast({
          title: "Subscription Cancelled",
          description: "The subscription has been successfully cancelled and removed.",
        });
        await fetchData();
        setDialogOpen(false);
      } catch (err: any) {
         toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to cancel the subscription.",
        });
      }
    };

  const tableContent = (
    <>
    <div className="space-y-4">
    {!isDashboard && (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <Input
          placeholder={t('subscribers_search_placeholder')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <div className="flex gap-2 flex-wrap justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {t('status')} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{t('filter_by_status')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(statusVariantMap) as SubscriberStatus[]).map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={() => {
                  setStatusFilter((prev) =>
                    prev.includes(status)
                      ? prev.filter((s) => s !== status)
                      : [...prev, status]
                  );
                  setCurrentPage(1);
                }}
              >
                {formatStatus(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            {isSyncing ? t('syncing_button') : t('refresh_and_sync_button')}
        </Button>
         <Button onClick={() => setExportDialogOpen(true)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
        </Button>
        </div>
      </div>
    )}
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('user_name')}>
                            {t('subscribers_table_name')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('product_name')}>
                            {t('plan')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                     <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('variant_name')}>
                            Variant <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('status')}>
                            {t('status')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('created_at')}>
                            {t('date')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                    {!isDashboard && <TableHead>{t('subscribers_table_actions')}</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedSubscriptions.length > 0 ? (
                    paginatedSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                            <TableCell className="font-medium">
                                <div>{subscription.user_name}</div>
                                <div className="text-xs text-muted-foreground">{subscription.user_email}</div>
                            </TableCell>
                            <TableCell>{subscription.product_name}</TableCell>
                            <TableCell>{subscription.variant_name}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariantMap[subscription.status] ?? 'secondary'}>{subscription.status_formatted}</Badge>
                            </TableCell>
                            <TableCell>{subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                            {!isDashboard && (
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenDialog(subscription)} className="text-destructive">
                                            Delete Subscriber
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            )}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6}>
                          {error ? (
                            <EmptyState 
                                icon={<ServerCrash className="h-10 w-10" />}
                                title={t('subscribers_load_failed_title')}
                                description={t('subscribers_load_failed_desc')}
                            />
                          ) : (
                            <EmptyState
                                icon={<Users className="h-10 w-10" />}
                                title={t('subscribers_none_found_title')}
                                description={t('subscribers_none_found_desc')}
                            />
                          )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
    {!isDashboard && (
    <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
            {t('table_showing_of', { count: Math.min(paginatedSubscriptions.length, filteredSubscriptions.length), total: filteredSubscriptions.length, type: t('table_type_subscribers') })}
        </div>
        <div className="flex items-center space-x-2">
            <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
            >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || totalPages === 0}
            >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
                {t('table_page_of', { current: currentPage, total: totalPages > 0 ? totalPages : 1 })}
            </span>
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    </div>
    )}
    <DeleteSubscriberDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        subscription={selectedSubscription}
        onDelete={handleDelete}
    />
    </div>
     <ExportDialog
        isOpen={isExportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={subscriptionsWithCustomers}
        fileName="subscribers_export"
        dateKey="created_at"
      />
    </>
  );

  if(isDashboard) {
    return tableContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('subscribers_card_title')}</CardTitle>
        <CardDescription>
          {t('subscribers_card_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  )
}

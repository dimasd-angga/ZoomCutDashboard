
'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  RefreshCw,
  ShoppingCart,
  ServerCrash,
  Calendar as CalendarIcon,
  Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '../AppContext';
import { EmptyState } from '../EmptyState';
import { useLanguage } from '../LanguageProvider';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { ExportDialog } from '../dashboard/ExportDialog';

const ITEMS_PER_PAGE = 10;

const statusVariantMap: Record<Order['status'], "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
  'on-hold': "secondary",
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};


export function OrderTable({ isDashboard = false }: { isDashboard?:boolean }) {
  const { orders, fetchData, error } = useAppContext();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [isExportDialogOpen, setExportDialogOpen] = React.useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    toast({
      title: t('toast_syncing_orders_title'),
      description: t('toast_syncing_orders_desc'),
    });
    try {
      await fetchData();
      toast({
          title: t('toast_sync_complete_title'),
          description: t('toast_orders_updated_desc'),
      });
    } catch (e) {
       // Error toast is handled in AppContext
    } finally {
      setIsSyncing(false);
    }
  }

  const filteredOrders = React.useMemo(() => {
    let filtered = orders.filter((order) =>
      (order.user_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (order.user_email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );

    if (statusFilter.length > 0) {
      filtered = filtered.filter((order) => statusFilter.includes(order.status));
    }
    
    if (dateRange?.from && dateRange?.to) {
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
        });
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, dateRange]);
  
  const itemsPerPage = isDashboard ? 5 : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableContent = (
    <>
    <div className="space-y-4">
    {!isDashboard && (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <Input
          placeholder={t('orders_search_placeholder')}
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
            {(Object.keys(statusVariantMap) as (keyof typeof statusVariantMap)[]).map((status) => (
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
              <TableHead>{t('orders_table_customer')}</TableHead>
              <TableHead>{t('orders_table_order')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead className="text-right">{t('orders_table_price')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                <TableRow key={order.identifier}>
                    <TableCell className="font-medium">
                    <div>{order.user_name}</div>
                    <div className="text-xs text-muted-foreground">{order.user_email}</div>
                    </TableCell>
                    <TableCell>
                    {order.first_order_item?.product_name ?? 'N/A'}
                    </TableCell>
                    <TableCell>
                    <Badge variant={statusVariantMap[order.status] ?? 'secondary'}>{order.status_formatted}</Badge>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{order.total_formatted}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5}>
                        {error ? (
                            <EmptyState 
                                icon={<ServerCrash className="h-10 w-10" />}
                                title={t('orders_load_failed_title')}
                                description={t('orders_load_failed_desc')}
                            />
                        ) : (
                            <EmptyState
                                icon={<ShoppingCart className="h-10 w-10" />}
                                title={t('orders_none_found_title')}
                                description={t('orders_none_found_desc')}
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
          {t('table_showing_of', { count: Math.min(paginatedOrders.length, filteredOrders.length), total: filteredOrders.length, type: t('table_type_orders') })}
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
    </div>
     <ExportDialog
        isOpen={isExportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={orders}
        fileName="orders_export"
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
            <CardTitle>{t('orders_card_title')}</CardTitle>
            <CardDescription>{t('orders_card_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
            {tableContent}
        </CardContent>
    </Card>
  )
}

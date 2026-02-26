'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function KeyMetricsLoading() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-sidebar">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[80px] mb-2" />
                        <Skeleton className="h-3 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function ChartLoading() {
    return (
        <Card className="bg-sidebar">
            <CardHeader>
                <CardTitle><Skeleton className="h-7 w-64" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-80" /></CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex gap-2 mb-4">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    );
}

export function TableLoading({ columns = 4, rows = 5}: { columns?: number, rows?: number }) {
    return (
         <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {[...Array(columns)].map((_, i) => (
                            <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(rows)].map((_, i) => (
                        <TableRow key={i}>
                            {[...Array(columns)].map((_, j) => (
                                <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <KeyMetricsLoading />
      <ChartLoading />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-sidebar">
            <CardHeader>
                <CardTitle><Skeleton className="h-7 w-52" /></CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <TableLoading columns={5}/>
            </CardContent>
        </Card>
        <Card className="bg-sidebar">
            <CardHeader>
                <CardTitle><Skeleton className="h-7 w-48" /></CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <TableLoading columns={5} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

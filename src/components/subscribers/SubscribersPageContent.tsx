
'use client';
import { SubscriberTable } from "@/components/subscribers/SubscriberTable";
import { useAppContext } from "@/components/AppContext";
import { TableLoading } from "../dashboard/DashboardLoading";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function SubscribersPageContent() {
    const { loading } = useAppContext();

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                             <Skeleton className="h-10 w-full max-w-sm" />
                             <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-36" />
                                 <Skeleton className="h-10 w-24" />
                             </div>
                        </div>
                        <TableLoading columns={6} rows={10} />
                         <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-40" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <SubscriberTable />
        </div>
    );
}

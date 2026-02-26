
'use client';

import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
        {/* Welcome Header Skeleton */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
             <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                {/* Subscription Details Skeleton */}
                <Card className="bg-card w-full h-full flex flex-col">
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-6 w-6 rounded-full" />
                           <div>
                                <Skeleton className="h-6 w-40 mb-2" />
                                <Skeleton className="h-4 w-48" />
                           </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-6 flex-grow">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>
                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-4 mt-auto">
                        <Skeleton className="h-11 w-full rounded-md" />
                        <Skeleton className="h-11 w-full rounded-md" />
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-1 flex h-full">
                 {/* System Messages Skeleton */}
                <Card className="bg-card h-full w-full flex flex-col">
                    <CardHeader className="pb-4 flex-row items-start justify-between">
                         <div>
                            <Skeleton className="h-6 w-40 mb-1.5" />
                            <Skeleton className="h-4 w-32" />
                         </div>
                         <Skeleton className="h-5 w-8 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-3 flex-grow pt-0 h-0">
                        <div className="space-y-3 h-full">
                            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-8">
            {/* Payment History Skeleton */}
             <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6" />
                        <div>
                            <Skeleton className="h-6 w-40 mb-1.5" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-32 rounded-md" />
                </CardHeader>
                <CardContent>
                   <div className="rounded-md border">
                       <div className="p-4 space-y-2">
                           <div className="flex justify-between items-center p-2">
                                <Skeleton className="h-5 w-1/6" />
                                <Skeleton className="h-5 w-1/6" />
                                <Skeleton className="h-5 w-1/6" />
                                <Skeleton className="h-5 w-1/6" />
                                <Skeleton className="h-5 w-1/6" />
                           </div>
                           <div className="flex justify-between items-center p-2 rounded-lg">
                               <Skeleton className="h-8 w-full" />
                           </div>
                           <div className="flex justify-between items-center p-2 rounded-lg">
                               <Skeleton className="h-8 w-full" />
                           </div>
                           <div className="flex justify-between items-center p-2 rounded-lg">
                               <Skeleton className="h-8 w-full" />
                           </div>
                       </div>
                   </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

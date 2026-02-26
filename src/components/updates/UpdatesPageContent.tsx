'use client';
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { UpdatesTable } from "./UpdatesTable";
import { useAppContext } from "@/components/AppContext";
import { TableLoading } from "../dashboard/DashboardLoading";
import { AddUpdateDialog } from "./AddUpdateDialog";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '../LanguageProvider';

export function UpdatesPageContent() {
    const { loading } = useAppContext();
    const [isDialogOpen, setDialogOpen] = React.useState(false);
    const { t } = useLanguage();

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-48" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent>
                        <TableLoading columns={4} rows={5} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('publish_new_update_button')}
                </Button>
            </div>
            <UpdatesTable />
            <AddUpdateDialog isOpen={isDialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}


'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/components/AppContext';
import { EmptyState } from '../EmptyState';
import { Megaphone, ServerCrash } from 'lucide-react';
import type { SystemUpdate } from '@/lib/types';
import { Badge } from '../ui/badge';
import { useLanguage } from '../LanguageProvider';

export function UpdatesTable() {
  const { systemUpdates, error } = useAppContext();
  const { t } = useLanguage();
  
  const sortedUpdates = React.useMemo(() => {
    return [...systemUpdates].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }, [systemUpdates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('updates_table_title')}</CardTitle>
        <CardDescription>{t('updates_table_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('updates_table_type')}</TableHead>
                <TableHead>{t('updates_table_title_version')}</TableHead>
                <TableHead>{t('updates_table_description')}</TableHead>
                <TableHead>{t('updates_table_date_published')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUpdates.length > 0 ? (
                sortedUpdates.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell>
                        <Badge variant={update.type === 'app_update' ? 'default' : 'secondary'}>
                            {update.type === 'app_update' ? t('update_type_app_update') : t('update_type_message')}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                        {update.type === 'app_update' ? update.version : update.title}
                    </TableCell>
                    <TableCell>{update.description}</TableCell>
                    <TableCell>{update.createdAt.toDate().toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    {error ? (
                      <EmptyState
                        icon={<ServerCrash className="h-10 w-10" />}
                        title={t('updates_load_failed_title')}
                        description={t('updates_load_failed_desc')}
                      />
                    ) : (
                      <EmptyState
                        icon={<Megaphone className="h-10 w-10" />}
                        title={t('updates_none_found_title')}
                        description={t('updates_none_found_desc')}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

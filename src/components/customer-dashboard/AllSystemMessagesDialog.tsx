
'use client';

import * as React from 'react';
import type { SystemUpdate } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Badge } from '../ui/badge';

interface AllSystemMessagesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  updates: SystemUpdate[];
  onDownloadClick?: (update: SystemUpdate) => void;
}

function UpdateCard({ update, onDownloadClick }: { update: SystemUpdate; onDownloadClick?: (update: SystemUpdate) => void }) {
    const isAppUpdate = update.type === 'app_update';

    return (
        <div className="p-4 rounded-lg border bg-card text-card-foreground">
            <div className="flex justify-between items-start mb-2">
                <div>
                     <Badge variant={isAppUpdate ? 'default' : 'secondary'} className="mb-2">
                        {isAppUpdate ? 'App Update' : 'Message'}
                    </Badge>
                    <h3 className="font-semibold">{isAppUpdate ? `Version ${update.version}` : update.title}</h3>
                    <p className="text-xs text-muted-foreground">{update.createdAt.toDate().toLocaleDateString()}</p>
                </div>
                 {isAppUpdate && (update.link || update.installerLink) && (
                    <Button size="sm" onClick={() => onDownloadClick?.(update)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                )}
            </div>
            <p className="text-sm text-muted-foreground">{update.description}</p>
        </div>
    )
}

export function AllSystemMessagesDialog({ isOpen, onOpenChange, updates, onDownloadClick }: AllSystemMessagesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>All System Messages</DialogTitle>
          <DialogDescription>A complete history of all updates and notifications.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
          <div className="space-y-4">
            {updates.map(update => (
              <UpdateCard key={update.id} update={update} onDownloadClick={onDownloadClick} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

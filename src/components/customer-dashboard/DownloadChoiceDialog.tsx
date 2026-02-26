'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Download, Package } from 'lucide-react';
import Link from 'next/link';

interface DownloadChoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cepLink?: string;
  installerLink?: string;
  version?: string;
}

export function DownloadChoiceDialog({ 
  isOpen, 
  onOpenChange, 
  cepLink, 
  installerLink,
  version 
}: DownloadChoiceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Download Type</DialogTitle>
          <DialogDescription>
            Select how you want to download ZoomCut {version ? `v${version}` : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          {installerLink && (
            <Button 
              className="w-full h-auto py-4 px-4 flex-col items-start gap-2" 
              variant="default"
              asChild
            >
              <Link href={installerLink} target='_blank' className="w-full">
                <div className="flex items-center gap-2 w-full">
                  <Package className="h-5 w-5 flex-shrink-0" />
                  <span className="font-semibold">Windows Installer (Recommended)</span>
                </div>
                <p className="text-xs text-muted-foreground font-normal text-left w-full">
                  Easy setup with GUI installer. Includes both installer and uninstaller.
                </p>
              </Link>
            </Button>
          )}
          
          {cepLink && (
            <Button 
              className="w-full h-auto py-4 px-4 flex-col items-start gap-2" 
              variant="outline"
              asChild
            >
              <Link href={cepLink} target='_blank' className="w-full">
                <div className="flex items-center gap-2 w-full">
                  <Download className="h-5 w-5 flex-shrink-0" />
                  <span className="font-semibold">CEP Package</span>
                </div>
                <p className="text-xs text-muted-foreground font-normal text-left w-full">
                  Manual installation. Extract to Adobe CEP extensions folder.
                </p>
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

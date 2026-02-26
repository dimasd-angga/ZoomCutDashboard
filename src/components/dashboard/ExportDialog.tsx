
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useLanguage } from '../LanguageProvider';

interface ExportDialogProps<T> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: T[];
  fileName: string;
  dateKey: keyof T;
}

const convertToCSV = (data: any[], headers: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

const downloadCSV = (csvString: string, fileName: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export function ExportDialog<T extends { [key: string]: any }>({ 
    isOpen, 
    onOpenChange, 
    data, 
    fileName,
    dateKey
}: ExportDialogProps<T>) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const { t } = useLanguage();

  const handleExport = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
        alert('Please select a valid date range.');
        return;
    }
    
    const filteredData = data.filter(item => {
        const itemDate = new Date(item[dateKey]);
        return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
    });
    
    if (filteredData.length === 0) {
        alert('No data available for the selected date range.');
        return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvString = convertToCSV(filteredData, headers);
    downloadCSV(csvString, `${fileName}_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Data to CSV</DialogTitle>
          <DialogDescription>
            Please select a date range for the data you wish to export.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
            <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel_button')}</Button>
          <Button onClick={handleExport} disabled={!dateRange || !dateRange.from || !dateRange.to}>
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

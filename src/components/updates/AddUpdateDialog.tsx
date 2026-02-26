
'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addSystemUpdate } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '../AppContext';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SystemUpdate } from '@/lib/types';
import { useLanguage } from '../LanguageProvider';

const updateSchema = z.object({
  type: z.enum(['app_update', 'message']),
  version: z.string().optional(),
  title: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
}).refine(data => {
    if (data.type === 'app_update') {
        return !!data.version && data.version.trim().length > 0;
    }
    return true;
}, {
    message: 'Version is required for an app update.',
    path: ['version'],
}).refine(data => {
    if (data.type === 'message') {
        return !!data.title && data.title.trim().length > 0;
    }
    return true;
}, {
    message: 'Title is required for a message.',
    path: ['title'],
});


type UpdateFormData = z.infer<typeof updateSchema>;

interface AddUpdateDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddUpdateDialog({ isOpen, onOpenChange }: AddUpdateDialogProps) {
  const { toast } = useToast();
  const { fetchData } = useAppContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { t } = useLanguage();
  
  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      type: 'app_update',
      version: '',
      title: '',
      description: '',
      link: '',
    },
  });

  const updateType = form.watch('type');

  const onSubmit: SubmitHandler<UpdateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
          type: data.type,
          description: data.description,
          version: data.type === 'app_update' ? data.version : undefined,
          title: data.type === 'message' ? data.title : undefined,
          link: data.link || undefined,
      };
      await addSystemUpdate(payload as Omit<SystemUpdate, 'id' | 'createdAt'>);
      toast({
        title: t('toast_update_published_title'),
        description: t('toast_update_published_desc'),
      });
      form.reset();
      await fetchData();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to publish the update.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
            <DialogTitle>{t('add_update_title')}</DialogTitle>
            <DialogDescription>{t('add_update_desc')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>{t('update_type_label')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="app_update" />
                                </FormControl>
                                <FormLabel className="font-normal">{t('update_type_app_update')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                <RadioGroupItem value="message" />
                                </FormControl>
                                <FormLabel className="font-normal">{t('update_type_message')}</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {updateType === 'app_update' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="version"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('version_label')}</FormLabel>
                                <FormControl>
                                    <Input placeholder="2.1.0" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('download_link_label')}</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/download" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                 {updateType === 'message' && (
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('message_title_label')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('message_title_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('description_label')}</FormLabel>
                    <FormControl>
                        <Textarea placeholder={t('description_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel_button')}</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t('publishing_button') : t('publish_update_button')}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

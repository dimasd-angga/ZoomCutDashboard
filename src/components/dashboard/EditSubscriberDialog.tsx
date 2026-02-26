
'use client';

import type { Subscriber, SubscriberStatus } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as React from 'react';
import { Subscription } from '@/lib/types';

const subscriberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  status: z.enum(['active', 'on_trial', 'cancelled', 'expired', 'unpaid', 'past_due', 'paused']),
});

type SubscriberFormData = Omit<z.infer<typeof subscriberSchema>, 'plan'>;

interface EditSubscriberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subscriber: Subscriber | null;
  onSave: (subscriber: Subscriber) => void;
  isReadOnly: boolean;
}

export function EditSubscriberDialog({
  isOpen,
  onOpenChange,
  subscriber,
  onSave,
  isReadOnly,
}: EditSubscriberDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubscriberFormData>({
    resolver: zodResolver(subscriberSchema),
  });

  React.useEffect(() => {
    if (isOpen && subscriber) {
      reset({
        name: subscriber.name,
        email: subscriber.email,
        // @ts-ignore
        status: subscriber.status,
      });
    }
  }, [isOpen, subscriber, reset]);

  const onSubmit = (data: SubscriberFormData) => {
    if (!subscriber) return;
    onSave({
      ...subscriber,
      ...data,
      // @ts-ignore
      status: data.status,
    });
  };

  const dialogTitle = isReadOnly
    ? 'Subscriber Details'
    : 'Edit Subscriber';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {isReadOnly ? 'Viewing subscriber details.' : `Make changes to the subscriber's profile here. Click save when you're done.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <div className="col-span-3">
                <Input id="name" {...register('name')} readOnly={isReadOnly} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
               <div className="col-span-3">
                <Input id="email" type="email" {...register('email')} readOnly={isReadOnly} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
               <div className="col-span-3">
                <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="on_trial">On Trial</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="past_due">Past Due</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            {!isReadOnly && <Button type="submit">Save changes</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

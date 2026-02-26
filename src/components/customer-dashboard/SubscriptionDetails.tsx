'use client';
import * as React from 'react';
import type { Subscriber, Subscription, SystemUpdate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, Zap, Wallet, XCircle, Settings, ExternalLink, Download, CheckCircle } from 'lucide-react';
import { differenceInDays, format, isBefore } from 'date-fns';
import { ChangePlanDialog } from './ChangePlanDialog';
import { cn } from '@/lib/utils';
import { useAppContext } from '../AppContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { useLanguage } from '../LanguageProvider';
import { useToast } from '@/hooks/use-toast';

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string; }) {
    return (
        <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
            <div className="text-primary">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="font-semibold">{value}</p>
            </div>
        </div>
    )
}

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function SubscriptionDetails({ subscription, customer }: { subscription?: Subscription, customer: Subscriber }) {
  const [isChangePlanOpen, setChangePlanOpen] = React.useState(false);
  const { systemUpdates, fetchData } = useAppContext();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const latestAppUpdate = React.useMemo(() => {
    return systemUpdates
        .filter((update: SystemUpdate) => update.type === 'app_update' && update.link)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0];
  }, [systemUpdates]);

  const isTrial = subscription?.status === 'on_trial';
  const isTrialExpired = isTrial && subscription?.trial_ends_at && isBefore(new Date(subscription.trial_ends_at), new Date());
  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';
  const isExpired = subscription?.status === 'expired' || isTrialExpired;
  const isInactive = isCancelled || isExpired;
  const isSubscriptionActive = isActive || (isTrial && !isTrialExpired);


  if (!subscription || isInactive) {
      const status = subscription ? (isTrialExpired ? 'Trial Ended' : (subscription.status_formatted || formatStatus(subscription.status))) : t('no_active_subscription');

      return (
          <>
            <Card className="bg-card w-full h-full flex flex-col">
                 <CardHeader className="flex flex-row justify-between items-start">
                    <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6" />
                    <div>
                        <CardTitle>{t('current_subscription')}</CardTitle>
                    </div>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        {status}
                    </Badge>
                </CardHeader>
                <CardContent className="space-y-6 flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InfoCard icon={<Zap className="h-6 w-6" />} title={t('plan')} value={subscription?.product_name ?? t('no_active_subscription')} />
                        <InfoCard icon={<Wallet className="h-6 w-6" />} title={t('status')} value={status} />
                        <InfoCard icon={<Calendar className="h-6 w-6" />} title={t('plan')} value={'0 ' + t('days_left')} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 mt-auto">
                    <Button className="flex-1" size="lg" onClick={() => setChangePlanOpen(true)}>
                        <Zap className="mr-2 h-4 w-4" /> {t('change_plan')}
                    </Button>
                </CardFooter>
            </Card>
            <ChangePlanDialog 
                isOpen={isChangePlanOpen}
                onOpenChange={setChangePlanOpen}
                customer={customer}
                currentSubscription={subscription}
            />
        </>
      )
  }
  
  const { status, product_name, variant_name, trial_ends_at, renews_at, ends_at, urls } = subscription;
  const statusFormatted = subscription.status_formatted || formatStatus(status);

  const getPlanDetails = () => {
    if (isTrial) {
        return { icon: <Zap className="h-6 w-6 text-yellow-500" />, color: 'yellow' };
    }
    if (product_name?.toLowerCase().includes('basic')) {
        return { icon: <CheckCircle className="h-6 w-6 text-green-500" />, color: 'green' };
    }
    if (product_name?.toLowerCase().includes('premium') || product_name?.toLowerCase().includes('pro')) {
        return { icon: <Crown className="h-6 w-6 text-red-500" />, color: 'red' };
    }
    return { icon: <XCircle className="h-6 w-6" />, color: 'default' };
  }

  const planDetails = getPlanDetails();
  
  const getStatusBadgeClass = () => {
    switch (status) {
        case 'active':
            return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'on_trial':
             return isTrialExpired ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        default:
            return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  }

  const daysLeft = trial_ends_at && isTrial ? differenceInDays(new Date(trial_ends_at), new Date()) : 0;
  const isRealSubscription = urls?.customer_portal && urls.customer_portal !== '#';
  // Show manage link for all subscriptions
  const hasManageLink = isSubscriptionActive;
  const manageUrl = urls?.customer_portal && urls.customer_portal !== '#' ? urls.customer_portal : `https://app.lemonsqueezy.com/my-orders`;

  const getDateCard = () => {
    if (isTrial && !isTrialExpired && trial_ends_at) {
        return <InfoCard icon={<Calendar className="h-6 w-6" />} title={t('trial_ends')} value={`${daysLeft > 0 ? daysLeft : 0} days left`} />
    }
    if (isActive && renews_at) {
        return <InfoCard icon={<Calendar className="h-6 w-6" />} title={t('next_payment')} value={format(new Date(renews_at), 'PPP')} />
    }
    if (isCancelled && ends_at) {
         return <InfoCard icon={<Calendar className="h-6 w-6" />} title={t('access_ends')} value={format(new Date(ends_at), 'PPP')} />
    }
    if (isExpired && ends_at) {
        return <InfoCard icon={<Calendar className="h-6 w-6" />} title={t('plan_ended')} value={format(new Date(ends_at), 'PPP')} />
    }
    // Fallback for expired trial or other inactive states
    if (isInactive) {
        return <InfoCard icon={<Calendar className="h-6 w-6" />} title={t('plan_ended')} value="0 Days Left" />
    }
    return null;
  }

  return (
    <>
        <Card className="bg-card w-full h-full flex flex-col">
        <CardHeader className="flex flex-row justify-between items-start">
            <div className="flex items-center gap-3">
            {planDetails.icon}
            <div>
                <CardTitle>{t('current_subscription')}</CardTitle>
            </div>
            </div>
            <Badge className={cn(getStatusBadgeClass())}>
                {isTrialExpired ? 'Trial Ended' : statusFormatted}
            </Badge>
        </CardHeader>
        <CardContent className="space-y-6 flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoCard icon={<Zap className="h-6 w-6" />} title={t('plan')} value={product_name} />
                <InfoCard icon={<Wallet className="h-6 w-6" />} title={t('status')} value={isTrialExpired ? 'Trial Ended' : statusFormatted} />
                {getDateCard()}
            </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 mt-auto">
            <Button className="flex-1" size="lg" onClick={() => setChangePlanOpen(true)}>
                <Zap className="mr-2 h-4 w-4" /> {t('change_plan')}
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="flex-1">
                        {t('manage')} <Settings className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {hasManageLink && (
                         <DropdownMenuItem asChild>
                             <a href={manageUrl} target="_blank" rel="noopener noreferrer">
                                <Settings className="mr-2 h-4 w-4" /> {t('manage_subscription')} <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
                            </a>
                        </DropdownMenuItem>
                    )}
                    {latestAppUpdate && isSubscriptionActive && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <a href={latestAppUpdate.link} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" /> {t('download_latest_update')}
                                </a>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </CardFooter>
        </Card>
        <ChangePlanDialog
            isOpen={isChangePlanOpen}
            onOpenChange={setChangePlanOpen}
            customer={customer}
            currentSubscription={subscription}
        />
    </>
  );
}

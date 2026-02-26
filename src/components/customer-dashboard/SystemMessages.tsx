
'use client';
import * as React from 'react';
import type { Subscription, SystemUpdate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Bell, Download, PartyPopper, Lock } from 'lucide-react';
import { differenceInDays, isBefore } from 'date-fns';
import { Button } from '../ui/button';
import { useAppContext } from '../AppContext';
import Link from 'next/link';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { DownloadChoiceDialog } from './DownloadChoiceDialog';
import { useLanguage } from '../LanguageProvider';

function Message({ icon, title, description, action }: { icon: React.ReactNode, title: string; description: string; action?: React.ReactNode}) {
    return (
        <div className="bg-muted/50 p-3 rounded-lg flex gap-3 items-start">
            <div className="text-primary pt-1">{icon}</div>
            <div>
                <p className="font-semibold text-primary-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mb-2">{description}</p>
                {action}
            </div>
        </div>
    )
}

export function SystemMessages({ subscription }: { subscription?: Subscription }) {
    const { systemUpdates } = useAppContext();
    const { t } = useLanguage();
    const [isDownloadDialogOpen, setDownloadDialogOpen] = React.useState(false);
    const [selectedUpdate, setSelectedUpdate] = React.useState<SystemUpdate | null>(null);

    const getDaysUntilExpiry = () => {
        if (!subscription) return null;
        if (subscription.status === 'on_trial' && subscription.trial_ends_at) {
            return differenceInDays(new Date(subscription.trial_ends_at), new Date());
        }
        if (subscription.status === 'active' && subscription.renews_at) {
            return differenceInDays(new Date(subscription.renews_at), new Date());
        }
        return null;
    }

    const daysUntilExpiry = getDaysUntilExpiry();
    const sortedUpdates = systemUpdates.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    const updatesToShow = sortedUpdates.slice(0, 1); 
    
    const isTrialJustActivated = subscription?.status === 'on_trial' && subscription.trial_activated_at && differenceInDays(new Date(), new Date(subscription.trial_activated_at)) < 1;
    const isTrialExpired = subscription?.status === 'on_trial' && subscription.trial_ends_at && isBefore(new Date(subscription.trial_ends_at), new Date());
    const isSubscriptionActive = subscription && (subscription.status === 'active' || (subscription.status === 'on_trial' && !isTrialExpired));

    const handleDownloadClick = (update: SystemUpdate) => {
        setSelectedUpdate(update);
        setDownloadDialogOpen(true);
    };

    const renderUpdate = (update: SystemUpdate) => {
        if (update.type === 'app_update') {
            // Only show app updates if subscription is active
            if (!isSubscriptionActive) {
                return (
                    <Message 
                        key={update.id}
                        icon={<Lock className="h-5 w-5" />}
                        title="Plugin update available"
                        description="Subscribe to a plan to download the latest version."
                    />
                );
            }
            return (
                 <Message 
                    key={update.id}
                    icon={<Download className="h-5 w-5" />}
                    title={t('app_update_available_message', { version: update.version || '' })}
                    description={update.description}
                    action={
                        (update.link || update.installerLink) ? (
                            <Button size="sm" onClick={() => handleDownloadClick(update)}>
                                <Download className="mr-2 h-4 w-4" />
                                {t('download_now_button')}
                            </Button>
                        ) : undefined
                    }
                />
            )
        }
        if (update.type === 'message') {
             return (
                 <Message 
                    key={update.id}
                    icon={<Bell className="h-5 w-5" />}
                    title={update.title ?? t('new_message_title')}
                    description={update.description}
                />
            )
        }
        return null;
    }

    const hasRenewalMessage = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    const hasUpdates = updatesToShow.length > 0;
    const totalMessages = (hasRenewalMessage ? 1 : 0) + systemUpdates.length + (isTrialJustActivated ? 1 : 0) + (isTrialExpired ? 1 : 0);

    return (
        <>
            <Card className="bg-card h-full w-full flex flex-col">
                <CardHeader className="pb-4 flex-row items-start justify-between">
                    <div>
                        <CardTitle>{t('system_messages_title')}</CardTitle>
                        <CardDescription>{t('system_messages_desc')}</CardDescription>
                    </div>
                    {totalMessages > 0 && <Badge variant="destructive">{totalMessages}</Badge>}
                </CardHeader>
                <CardContent className="space-y-3 flex-grow pt-0 h-0">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-3">
                        {isTrialJustActivated && (
                            <Message
                                icon={<PartyPopper className="h-5 w-5" />}
                                title={t('trial_activated_title')}
                                description={t('trial_activated_desc')}
                            />
                        )}
                        {isTrialExpired && (
                             <Message
                                icon={<Lock className="h-5 w-5" />}
                                title={t('trial_expired_message_title')}
                                description={t('trial_expired_message_desc')}
                            />
                        )}
                        {hasRenewalMessage && (
                            <Message 
                                icon={<Bell className="h-5 w-5" />}
                                title={t('subscription_renews_message', { days: daysUntilExpiry })}
                                description={t('subscription_renews_desc')}
                            />
                        )}

                        {hasUpdates && updatesToShow.map(update => renderUpdate(update))}

                        {!subscription && !hasUpdates && !isTrialExpired &&(
                            <Message 
                                icon={<Bell className="h-5 w-5" />}
                                title={t('welcome_to_zoomcut_title')}
                                description={t('welcome_to_zoomcut_desc')}
                            />
                        )}
                        
                        {subscription && !hasUpdates && !hasRenewalMessage && !isTrialJustActivated && !isTrialExpired && (
                            <Message 
                                icon={<Bell className="h-5 w-5" />}
                                title={t('no_new_messages_title')}
                                description={t('no_new_messages_desc')}
                            />
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
            <DownloadChoiceDialog
                isOpen={isDownloadDialogOpen}
                onOpenChange={setDownloadDialogOpen}
                cepLink={selectedUpdate?.link}
                installerLink={selectedUpdate?.installerLink}
                version={selectedUpdate?.version}
            />
        </>
    );
}

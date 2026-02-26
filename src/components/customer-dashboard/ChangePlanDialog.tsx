
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getProducts, getVariants, createCheckout } from '@/lib/lemonsqueezy';
import type { Product, Subscriber, Subscription, Variant } from '@/lib/types';
import { Loader2, AlertCircle, CheckCircle, XCircle, Crown, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NewCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../LanguageProvider';

interface Plan {
    product: Product;
    variants: {
        monthly: Variant | undefined;
        yearly: Variant | undefined;
    };
    features: string[];
    missingFeatures: string[];
    isPopular: boolean;
}

const productFeatures: Record<string, { features: string[], missingFeatures: string[] }> = {
    'ZoomCut Pro': {
        features: ['Silence Cut Feature', 'Auto Zoom Feature', 'Professional Easy Ease effects', 'Smart Motion Blur', 'Anchor point selection'],
        missingFeatures: []
    }
};

function PlanCard({
    plan,
    customer,
    currentSubscription,
    onSelectPlan,
    isUserSubscribed,
}: {
    plan: Plan,
    customer: Subscriber,
    currentSubscription?: Subscription,
    onSelectPlan: (variant: Variant) => Promise<void>
    isUserSubscribed: boolean;
}) {
    const { t } = useLanguage();
    
    const getInitialBillingCycle = () => {
        if (currentSubscription) {
            const currentVariantId = String(currentSubscription.variant_id);
            if (plan.variants.yearly && String(plan.variants.yearly.id) === currentVariantId) {
                return 'yearly';
            }
             if (plan.variants.monthly && String(plan.variants.monthly.id) === currentVariantId) {
                return 'monthly';
            }
        }
        return 'monthly';
    };

    const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>(getInitialBillingCycle());
    const [isLoading, setIsLoading] = React.useState(false);

    const selectedVariant = billingCycle === 'monthly' ? plan.variants.monthly : plan.variants.yearly;
    
    const isCurrentActivePlan = currentSubscription && ['active', 'on_trial'].includes(currentSubscription.status) && selectedVariant && String(currentSubscription.variant_id) === String(selectedVariant.id);
    const isCancelledReactivation = currentSubscription && currentSubscription.status === 'cancelled' && selectedVariant && String(currentSubscription.variant_id) === String(selectedVariant.id);


    const getButtonText = () => {
        if (isCurrentActivePlan) return t('your_current_plan_button');
        if (isCancelledReactivation) return t('reactivate_plan_button');
        return t('switch_to_plan_button');
    }

    const handleSelect = async () => {
        if (!selectedVariant) return;
        setIsLoading(true);
        await onSelectPlan(selectedVariant);
        setIsLoading(false);
    }
    
    const getPrice = () => {
        if (plan.product.price_formatted.includes(' - ')) {
            const [monthlyPrice, yearlyPrice] = plan.product.price_formatted.split(' - ');
            return billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
        }
        return plan.product.price_formatted;
    }


    return (
        <Card className={cn(
            "flex flex-col w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl relative overflow-hidden",
        )}>
            <CardHeader className="text-center pt-10">
                <CardTitle className="text-2xl font-bold">{plan.product.name.replace('ZoomCut ', '')}</CardTitle>
                 <div className="flex items-center justify-center gap-2 mt-2 text-sm">
                    <span className={cn({ 'text-primary': billingCycle === 'monthly'})}>{t('monthly_billing')}</span>
                    <Switch
                        checked={billingCycle === 'yearly'}
                        onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                        aria-label="Toggle billing cycle"
                    />
                    <span className={cn({ 'text-primary': billingCycle === 'yearly'})}>{t('yearly_billing')}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <div className="text-center mb-6 h-16">
                    {selectedVariant ? (
                        <>
                            <p className="text-4xl font-extrabold text-red-500">{getPrice()}</p>
                            <p className="text-xs text-muted-foreground">{t(billingCycle === 'monthly' ? 'per_month' : 'per_year')}</p>
                        </>
                    ): (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-lg text-muted-foreground">{t('not_available')}</p>
                        </div>
                    )}
                </div>
                <ul className="space-y-3 text-sm">
                    {plan.features.map(feature => (
                        <li key={feature} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span>{t(`feature_${feature.toLowerCase().replace(/ /g, '_')}`)}</span>
                        </li>
                    ))}
                    {plan.missingFeatures.map(feature => (
                         <li key={feature} className="flex items-center gap-3 text-muted-foreground">
                            <XCircle className="h-5 w-5 text-red-700 flex-shrink-0" />
                            <span>{t(`feature_${feature.toLowerCase().replace(/ /g, '_')}`)}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-4">
                <Button 
                    className="w-full text-md py-5"
                    disabled={isLoading || !selectedVariant || isUserSubscribed}
                    onClick={handleSelect}
                >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {getButtonText()}
                </Button>
            </CardFooter>
        </Card>
    )
}


interface ChangePlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Subscriber;
  currentSubscription?: Subscription;
}

export function ChangePlanDialog({ isOpen, onOpenChange, customer, currentSubscription }: ChangePlanDialogProps) {
    const { t } = useLanguage();
    const [plans, setPlans] = React.useState<Plan[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { toast } = useToast();
    
    const isUserSubscribed = !!(currentSubscription && ['active'].includes(currentSubscription.status));
    
    React.useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setError(null);
        Promise.all([getProducts(), getVariants()])
            .then(([productsRes, variantsRes]) => {
                const productData = (productsRes?.data || []).map(p => ({ id: String(p.id), ...p.attributes }));
                const variantsData = (variantsRes?.data || []);

                const groupedPlans = productData.reduce((acc, product) => {
                    if (product.status !== 'published' || !product.name.includes('Pro')) return acc;
                    const features = productFeatures[product.name] || { features: [], missingFeatures: [] };
                    acc[product.id] = {
                        product,
                        variants: {
                           monthly: variantsData.find(v => String(v.attributes.product_id) === String(product.id) && v.attributes.interval === 'month'),
                           yearly: variantsData.find(v => String(v.attributes.product_id) === String(product.id) && v.attributes.interval === 'year'),
                        },
                        ...features,
                        isPopular: false,
                    };
                    return acc;
                }, {} as Record<string, Plan>);
                
                setPlans(Object.values(groupedPlans));
            })
            .catch(() => {
                setError(t('change_plan_load_error'));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isOpen, t]);

    const handleSelectPlan = async (variant: Variant) => {
        if (!customer) {
            setError(t('customer_data_not_found_error'));
            return;
        }

        setError(null);

        try {
             const checkoutPayload: NewCheckout = {
                checkoutData: {
                    email: customer.email,
                    name: customer.name,
                    custom: {
                        firebase_uid: customer.id,
                    },
                },
                productOptions: {
                    redirectUrl: window.location.origin + '/dashboard',
                },
                variant_currency: 'USD',
            };

            const checkoutResponse = await createCheckout(variant.id, checkoutPayload);

            const checkoutUrl = checkoutResponse.data?.data.attributes.url
            if (!checkoutUrl) {
                throw new Error(t('checkout_url_error'));
            }
            
            window.location.href = checkoutUrl;

        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: t('toast_checkout_error_title'),
                description: err.message || t('toast_checkout_error_desc'),
            });
            setError(err.message);
        }
    };
    
    const planCount = plans.length;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "p-0",
                planCount === 1 && "max-w-md",
                planCount >= 2 && "max-w-4xl",
            )}>
                <div className="bg-background text-foreground p-8 rounded-lg">
                    <DialogHeader className="text-center mb-8">
                        <DialogTitle className="text-4xl font-bold">{t('change_plan_title')}</DialogTitle>
                        <DialogDescription className="text-lg text-muted-foreground">
                            {isUserSubscribed 
                                ? t('change_plan_desc_subscribed')
                                : t('change_plan_desc_unsubscribed')
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center text-center text-red-500 h-64">
                            <AlertCircle className="h-12 w-12 mb-4" />
                            <p className="text-lg font-semibold">{t('change_plan_load_failed_title')}</p>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {!loading && !error && (
                        <>
                            {isUserSubscribed && (
                                <Alert className="mb-6">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        {t('active_subscription_alert')}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className={cn(
                                "grid justify-center items-stretch gap-6 max-w-3xl mx-auto",
                                planCount === 1 && "grid-cols-1",
                                planCount > 1 && "md:grid-cols-2",
                            )}>
                                {plans.map((plan) => (
                                    <PlanCard 
                                        key={plan.product.id}
                                        plan={plan}
                                        customer={customer}
                                        currentSubscription={currentSubscription}
                                        onSelectPlan={handleSelectPlan}
                                        isUserSubscribed={isUserSubscribed}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <DialogFooter className="mt-8">
                            <p className="text-xs text-muted-foreground text-center w-full">
                            {t('terms_of_service_agreement')}
                        </p>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

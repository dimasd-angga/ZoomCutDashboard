
'use client';
import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useAppContext } from '../AppContext';
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { CustomerDashboardLoading } from './CustomerDashboardLoading';
import { useLanguage } from '../LanguageProvider';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;


function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.467-11.303-8H6.393v8.344C9.879,41.044,16.48,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.536,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    )
}

export function SettingsPage() {
    const { user, userProviders, updateUserProfile, linkGoogleAccount, sendPasswordResetEmail, resetPassword, authError, loading: authLoading } = useAuth();
    const { customer, fetchData, loading: customerLoading } = useAppContext();
    const { t } = useLanguage();
    const [isSubmittingName, setIsSubmittingName] = React.useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
    const [isLinking, setIsLinking] = React.useState(false);
    const [isSendingReset, setIsSendingReset] = React.useState(false);
    const { toast } = useToast();

    const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile, formState: { errors: profileErrors, isDirty: isProfileDirty } } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    });
    
    const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    React.useEffect(() => {
        if (customer) {
            resetProfile({
                name: customer.name || '',
                email: customer.email || '',
            });
            resetPasswordForm();
        }
    }, [customer, resetProfile, resetPasswordForm]);
    
    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsSubmittingName(true);
        try {
            await updateUserProfile(data.name);
            await fetchData();
            toast({ title: t('toast_profile_updated_title'), description: t('toast_profile_updated_desc') });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsSubmittingName(false);
        }
    };
    
    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsSubmittingPassword(true);
        try {
            await resetPassword(data.currentPassword, data.newPassword);
            toast({ title: t('toast_password_changed_title'), description: t('toast_password_changed_desc') });
            resetPasswordForm();
        } catch (error: any) {
            toast({ variant: 'destructive', title: t('toast_password_failed_title'), description: error.message });
        } finally {
            setIsSubmittingPassword(false);
        }
    }

    const handleLinkGoogle = async () => {
        setIsLinking(true);
        try {
            await linkGoogleAccount();
            toast({ title: t('toast_google_linked_title'), description: t('toast_google_linked_desc') });
        } catch (error: any) {
             toast({ variant: 'destructive', title: t('toast_linking_failed_title'), description: error.message });
        } finally {
            setIsLinking(false);
        }
    }
    
    const handleCreatePassword = async () => {
        if (!user?.email) return;
        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail();
             toast({ title: t('toast_password_creation_sent_title'), description: t('toast_password_creation_sent_desc') });
        } catch (error: any) {
             toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsSendingReset(false);
        }
    }

    const hasPasswordProvider = userProviders.includes('password');
    const hasGoogleProvider = userProviders.includes('google.com');
    
    if (authLoading || customerLoading) {
        return <CustomerDashboardLoading />;
    }
    
    if (!customer) {
        return <div>Could not load customer data.</div>
    }

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <Button variant="outline" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('back_to_dashboard')}
                    </Link>
                </Button>
            </div>
            
            <h1 className="text-3xl font-bold">{t('settings_title')}</h1>
            
            {authError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{authError}</AlertDescription></Alert>}

            <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('personal_information_title')}</CardTitle>
                        <CardDescription>{t('personal_information_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('name_label')}</Label>
                            <Input id="name" {...registerProfile('name')} />
                            {profileErrors.name && <p className="text-destructive text-sm mt-1">{profileErrors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('email_label')}</Label>
                            <Input id="email" {...registerProfile('email')} readOnly disabled />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmittingName || !isProfileDirty}>
                            {isSubmittingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('save_changes_button')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
            
            <Separator />
            
            {hasPasswordProvider && (
                 <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('change_password_title')}</CardTitle>
                            <CardDescription>{t('change_password_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">{t('current_password_label')}</Label>
                                <Input id="currentPassword" type="password" {...registerPassword('currentPassword')} />
                                {passwordErrors.currentPassword && <p className="text-destructive text-sm mt-1">{passwordErrors.currentPassword.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">{t('new_password_label')}</Label>
                                <Input id="newPassword" type="password" {...registerPassword('newPassword')} />
                                {passwordErrors.newPassword && <p className="text-destructive text-sm mt-1">{passwordErrors.newPassword.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{t('confirm_new_password_label')}</Label>
                                <Input id="confirmPassword" type="password" {...registerPassword('confirmPassword')} />
                                {passwordErrors.confirmPassword && <p className="text-destructive text-sm mt-1">{passwordErrors.confirmPassword.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmittingPassword}>
                                {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('update_password_button')}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            )}

             <Card>
                <CardHeader>
                    <CardTitle>{t('sign_in_methods_title')}</CardTitle>
                    <CardDescription>{t('sign_in_methods_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{t('email_password_label')}</p>
                                <p className="text-sm text-muted-foreground">
                                    {hasPasswordProvider ? t('connected_status') : t('not_connected_status')}
                                </p>
                            </div>
                        </div>
                        {hasPasswordProvider ? (
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">{t('enabled_status')}</span>
                            </div>
                        ) : (
                            <Button onClick={handleCreatePassword} disabled={isSendingReset}>
                                {isSendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t('create_password_button')}
                            </Button>
                        )}
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <GoogleIcon className="h-6 w-6" />
                            <div>
                                <p className="font-semibold">{t('google_label')}</p>
                                <p className="text-sm text-muted-foreground">
                                   {hasGoogleProvider ? t('connected_status') : t('not_connected_status')}
                                </p>
                            </div>
                        </div>
                        {hasGoogleProvider ? (
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">{t('enabled_status')}</span>
                            </div>
                        ) : (
                            <Button variant="outline" onClick={handleLinkGoogle} disabled={isLinking}>
                                {isLinking ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                )}
                                {t('connect_with_google_button')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

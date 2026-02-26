
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function ForgotPasswordPage() {
  const { sendPasswordResetLink, loading, authError } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = React.useState('');
  const [emailSent, setEmailSent] = React.useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetLink(email);
      setEmailSent(true);
    } catch (err) {
      // error is handled and displayed by the auth hook
      setEmailSent(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-muted/40">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('forgot_password_title')}</CardTitle>
          <CardDescription>{t('forgot_password_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
            {authError && !emailSent && (
              <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>{t('error_title')}</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
             {emailSent ? (
                <Alert className="mb-4 border-green-500/30 bg-green-900/10 text-green-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertTitle>{t('email_sent_title')}</AlertTitle>
                    <AlertDescription>
                        {t('email_sent_desc', { email: email })}
                    </AlertDescription>
                </Alert>
            ) : (
                <form onSubmit={handleResetRequest} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('email_label')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" variant="default" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('sending_button')}
                            </>
                        ) : t('send_reset_link_button')}
                    </Button>
                </form>
            )}
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground justify-center">
          {t('remember_password_prompt')}&nbsp;
          <Link href="/login" className="text-primary hover:underline">
            {t('back_to_login_link')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

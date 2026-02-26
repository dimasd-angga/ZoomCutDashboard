
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

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

export default function LoginPage() {
  const { user, userRole, loading, login, loginWithGoogle, authError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isUpdatingSession, setIsUpdatingSession] = React.useState(false);
  const attachAttemptRef = React.useRef<string | null>(null);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // error is handled and displayed by the auth hook
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      // error is handled and displayed by the auth hook
    }
  };


  React.useEffect(() => {
    // Don't redirect if we're still updating the session with deviceId
    if (!loading && user && !isUpdatingSession) {
        if (userRole === 'admin') {
            router.push('/');
        } else if (userRole === 'customer') {
            router.push('/dashboard');
        } else if (userRole === null) {
            router.push('/register/activating');
        }
    }
  }, [user, userRole, loading, router, isUpdatingSession]);

  React.useEffect(() => {
    const queryDeviceId = searchParams.get('deviceId');
    const pluginDeviceKey = 'plugin_deviceId';

    if (queryDeviceId) {
      try {
        sessionStorage.setItem(pluginDeviceKey, queryDeviceId);
      } catch {}
      try {
        localStorage.setItem(pluginDeviceKey, queryDeviceId);
      } catch {}
    }
  }, [searchParams]);

  // Separate effect to handle session update when user is already logged in
  React.useEffect(() => {
    const queryDeviceId = searchParams.get('deviceId');
    
    if (queryDeviceId && user && !loading) {
      setIsUpdatingSession(true);
      
      const updateSession = async () => {
        try {
          const sessionId = localStorage.getItem('firebase_session_id');
          if (!sessionId) {
            console.warn('No sessionId found, cannot attach deviceId');
            setIsUpdatingSession(false);
            return;
          }

          const attachKey = `${sessionId}:${queryDeviceId}`;
          if (attachAttemptRef.current === attachKey) {
            setIsUpdatingSession(false);
            return;
          }

          attachAttemptRef.current = attachKey;

          const token = await user.getIdToken();
          
          const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              sessionId,
              email: user.email,
              token,
              deviceId: queryDeviceId,
              deviceLabel: navigator?.platform || 'unknown-device',
              userAgent: navigator?.userAgent || 'unknown',
              source: 'plugin',
            }),
          });

          if (response.ok) {
            console.log('✅ Attached deviceId to existing session for plugin');
          } else {
            const errorText = await response.text();
            console.error('Failed to attach deviceId:', errorText);
            attachAttemptRef.current = null;
          }
        } catch (error) {
          console.error('Failed to attach deviceId to session:', error);
          attachAttemptRef.current = null;
        } finally {
          setIsUpdatingSession(false);
        }
      };
      
      updateSession();
    }
  }, [user, loading, searchParams]);


  return (
    <div className="flex items-center justify-center h-screen w-screen bg-muted/40">
      <Card className="w-full max-w-md mx-auto relative">
        <LanguageSwitcher className="absolute top-4 right-4" />
        <CardHeader className="text-center pt-12">
          <CardTitle className="text-2xl">{t('login_title')}</CardTitle>
          <CardDescription>{t('login_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>{t('login_failed_title')}</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <Button
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2" />
                )}
                {t('continue_with_google')}
            </Button>
            <div className="relative mb-4">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">
                    {t('or_separator')}
                </span>
            </div>
          <form onSubmit={handleLogin} className="space-y-4">
            
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
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('password_label')}</Label>
                     <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                    >
                        {t('forgot_password_link')}
                    </Link>
                </div>
              
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" variant="default" disabled={loading}>
              {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('logging_in_button')}
                  </>
                ) : t('login_button')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground justify-center">
          {t('no_account_prompt')}&nbsp;
          <Link href="/register" className="text-primary hover:underline">
            {t('register_link')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

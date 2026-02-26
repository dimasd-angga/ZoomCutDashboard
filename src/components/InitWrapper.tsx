
'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

const ENV_VARS = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
  LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY,
};

const REQUIRED_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'LEMON_SQUEEZY_API_KEY'
];


const checkEnvVars = (): string[] => {
  const missingKeys: string[] = [];
  REQUIRED_KEYS.forEach((key) => {
    if (ENV_VARS[key as keyof typeof ENV_VARS] === undefined) {
      missingKeys.push(key);
    }
  });
  return missingKeys;
};

export function InitWrapper({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<'loading' | 'error' | 'success'>('loading');
  const [missingKeys, setMissingKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const missing = checkEnvVars();
      if (missing.length > 0) {
        setMissingKeys(missing);
        setStatus('error');
      } else {
        setStatus('success');
      }
    }, 500); 
    
    return () => clearTimeout(timer);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The application cannot start because some required environment variables are missing.
            </p>
            <p className="mb-2 font-semibold">Missing Keys:</p>
            <ul className="list-disc space-y-1 rounded-md bg-muted p-4 pl-8 text-sm">
              {missingKeys.map((key) => (
                <li key={key}>
                  <code>{key}</code>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-muted-foreground">
              Please add these keys to your <code>.env</code> file and restart the application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}


'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { addSystemUpdate, storeAnalyticsData } from '@/lib/firebase';
import { Loader2, CheckCircle, UserCheck, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type ActivationStep = 'verifying' | 'creating' | 'done';

const activationSteps: Record<ActivationStep, { text: string; icon: React.ReactNode }> = {
    verifying: { text: 'Verifying your account...', icon: <UserCheck className="h-5 w-5" /> },
    creating: { text: 'Activating your 7-day free trial...', icon: <LinkIcon className="h-5 w-5" /> },
    done: { text: 'All set! Redirecting you now...', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
};


export default function ActivatingPage() {
  const { user, userRole, loading: authLoading, needsTrialActivation } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState<ActivationStep>('verifying');

  React.useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to be confirmed
    }

    // If auth is loaded and user has a role, redirect them.
    if (userRole) {
      setCurrentStep('done');
      setProgress(100);
      const redirectPath = userRole === 'admin' ? '/' : '/dashboard';
      setTimeout(() => router.replace(redirectPath), 1000);
      return;
    }
    
    // If the user needs trial activation, show progress.
    if (needsTrialActivation) {
      setCurrentStep('creating');
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 90));
      }, 200);

      return () => clearInterval(progressInterval);
    }
    
  }, [authLoading, userRole, needsTrialActivation, router]);

    return (
       <div className="flex h-screen w-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Activating Your Free Trial</CardTitle>
            <CardDescription>Please wait while we get everything ready for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress} className="h-2 w-full" />
            <ul className="space-y-4 text-sm text-muted-foreground">
                {Object.keys(activationSteps).map((stepKey, index) => {
                    const step = activationSteps[stepKey as ActivationStep];
                    const currentIndex = Object.keys(activationSteps).indexOf(currentStep);
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                         <li key={stepKey} className="flex items-center gap-3">
                            {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                             isCurrent ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : 
                             <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                            }
                            <span className={isCurrent ? 'text-primary-foreground font-semibold' : ''}>
                                {step.text}
                            </span>
                        </li>
                    )
                })}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-xs text-muted-foreground">
                This should only take a moment.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
}

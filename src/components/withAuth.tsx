
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { roles?: ('admin' | 'customer')[] } = {}
) {
  return function WithAuth(props: P) {
    const { user, userRole, loading, needsTrialActivation } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
      if (loading) {
        return; // Wait for the auth state to be fully resolved
      }

      const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
      const isActivatingPage = pathname === '/register/activating';

      if (!user) {
        // If there's no user and we're not on an auth page, redirect to login.
        if (!isAuthPage) {
          router.replace('/login');
        }
        return;
      }

      // User is logged in.
      if (needsTrialActivation) {
          if (!isActivatingPage) {
              router.replace('/register/activating');
          }
          return;
      }
      
      // If user is on an auth page but is fully authenticated, redirect them away.
      if (isAuthPage) {
           if (userRole === 'admin') router.replace('/');
           else if (userRole === 'customer') router.replace('/dashboard');
           return;
      }
      
      // Role-based access control
      if (options.roles && options.roles.length > 0 && userRole) {
        if (!options.roles.includes(userRole)) {
            // User is trying to access a page they don't have permission for.
            if (userRole === 'admin') router.replace('/');
            else if (userRole === 'customer') router.replace('/dashboard');
        }
      }

    }, [user, userRole, loading, needsTrialActivation, router, pathname]);
    
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

    // Show a full-page loader only when initially determining auth state on a protected page.
    if (loading && !isAuthPage) {
         return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          );
    }
    
    if (!user && !isAuthPage) {
        return null; // Don't render component, useEffect is handling redirect
    }

    if (user && isAuthPage) {
        return null; // Don't render component, useEffect is handling redirect
    }

    if (needsTrialActivation && !isActivatingPage) {
        return null; // Don't render component, useEffect is handling redirect
    }

    if (options.roles && userRole && !options.roles.includes(userRole)) {
        return null; // Don't render component, useEffect is handling redirect
    }

    return <Component {...props} />;
  };
}

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { AppProvider } from '@/components/AppContext';
import { InitWrapper } from '@/components/InitWrapper';
import { LanguageProvider } from '@/components/LanguageProvider';
import { SessionSyncInitializer } from '@/components/SessionSyncInitializer';
import { SessionErrorHandler } from '@/components/SessionErrorHandler';

export const metadata: Metadata = {
  title: 'ZoomCut',
  description: 'Manage your ZoomCut subscriptions.',
  icons: {
    icon: '/icon.ico',
    shortcut: '/icon.ico',
    apple: '/icon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="httpshttps://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-body antialiased">
          <InitWrapper>
              <AuthProvider>
                  <AppProvider>
                    <SessionSyncInitializer>
                      {children}
                    </SessionSyncInitializer>
                  </AppProvider>
              </AuthProvider>
          </InitWrapper>
          <SessionErrorHandler />
          <Toaster />
        </body>
      </html>
    </LanguageProvider>
  );
}

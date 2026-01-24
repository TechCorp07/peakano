'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/config/routes';
import { AppLayout } from '@/components/layout';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard Layout
 * Wraps all protected routes and handles authentication check
 * Uses dark theme for authenticated app interface
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Demo mode: Skip auth redirect for testing
  // Uncomment below when backend auth is ready
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push(ROUTES.LOGIN);
  //   }
  // }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth (brief for demo mode)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117]" data-theme="app">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#8B949E]">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

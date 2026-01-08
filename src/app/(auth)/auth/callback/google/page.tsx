'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { useCompleteGoogleOAuthMutation } from '@/features/auth/authApi';
import { ROUTES } from '@/config/routes';

/**
 * Cookie utility for auth state persistence
 */
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Google OAuth Callback Content
 * Handles the OAuth code exchange and authentication
 */
function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const [completeGoogleOAuth] = useCompleteGoogleOAuthMutation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Handle error from Google
    if (errorParam) {
      setStatus('error');
      setErrorMessage(
        errorParam === 'access_denied'
          ? 'You cancelled the Google sign-in process.'
          : 'An error occurred during Google sign-in. Please try again.'
      );
      return;
    }

    // Handle missing code
    if (!code) {
      setStatus('error');
      setErrorMessage('Invalid callback. Missing authorization code.');
      return;
    }

    // Complete the OAuth flow
    const completeAuth = async () => {
      try {
        const result = await completeGoogleOAuth({ code, state: state || undefined }).unwrap();

        // Set cookie for middleware route protection
        setCookie('accessToken', result.accessToken, 7);

        setStatus('success');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(ROUTES.DASHBOARD);
        }, 1500);
      } catch (err: unknown) {
        const error = err as { data?: { message?: string } };
        setErrorMessage(error.data?.message || 'Failed to complete authentication. Please try again.');
        setStatus('error');
      }
    };

    completeAuth();
  }, [code, state, errorParam, completeGoogleOAuth, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#00CC52]/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#00CC52] animate-spin" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">
              Completing Sign In
            </h1>
            <p className="text-slate-500 text-sm">
              Please wait while we complete your authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">
              Authentication Failed
            </h1>
            <p className="text-slate-500 text-sm">
              {errorMessage}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={ROUTES.LOGIN}
              className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              Try Again
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-lg border border-slate-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Create Account Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#00CC52]/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-[#00CC52]" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">
            Welcome!
          </h1>
          <p className="text-slate-500 text-sm">
            You have successfully signed in with Google. Redirecting to your dashboard...
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <div className="w-8 h-8 border-2 border-[#00CC52]/30 border-t-[#00CC52] rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

/**
 * Google OAuth Callback Page
 */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#00CC52]/30 border-t-[#00CC52] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}

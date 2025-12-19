'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react';

import { useVerifyEmailMutation } from '@/features/auth/authApi';
import { ROUTES } from '@/config/routes';

/**
 * Verify Email Content Component
 */
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail({ token }).unwrap();
        setStatus('success');
      } catch (err: unknown) {
        const error = err as { data?: { message?: string } };
        setErrorMessage(error.data?.message || 'Failed to verify email. The link may have expired.');
        setStatus('error');
      }
    };

    verify();
  }, [token, verifyEmail]);

  // Loading state
  if (isLoading || status === 'verifying') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#00CC52]/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#00CC52] animate-pulse" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">
              Verifying Your Email
            </h1>
            <p className="text-slate-500 text-sm">
              Please wait while we verify your email address...
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-[#00CC52]/30 border-t-[#00CC52] rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // No token state
  if (status === 'no-token') {
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
              Invalid Link
            </h1>
            <p className="text-slate-500 text-sm">
              This verification link is invalid or missing.
            </p>
          </div>

          <Link
            href={ROUTES.LOGIN}
            className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight className="h-5 w-5" />
          </Link>
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
              Verification Failed
            </h1>
            <p className="text-slate-500 text-sm">
              {errorMessage}
            </p>
          </div>

          <Link
            href={ROUTES.LOGIN}
            className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight className="h-5 w-5" />
          </Link>
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

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">
            Email Verified!
          </h1>
          <p className="text-slate-500 text-sm">
            Your email address has been successfully verified. You now have full access to the platform.
          </p>
        </div>

        <Link
          href={ROUTES.DASHBOARD}
          className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-4 text-center text-xs text-slate-500">
          You can now start learning medical imaging annotation.
        </p>
      </div>
    </div>
  );
}

/**
 * Verify Email Page
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#00CC52]/30 border-t-[#00CC52] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

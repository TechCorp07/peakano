'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Check } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { OwlPasswordHelper } from '@/components/ui/owl-password-helper';

import { useResetPasswordMutation } from '@/features/auth/authApi';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas';
import { ROUTES } from '@/config/routes';

/**
 * Reset Password Form Component
 */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasInteractedWithPassword, setHasInteractedWithPassword] = useState(false);

  // Initialize form with React Hook Form + Zod validation
  const methods = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = methods;

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Password validation checks
  const hasMinLength = password?.length >= 8;
  const hasUppercase = /[A-Z]/.test(password || '');
  const hasLowercase = /[a-z]/.test(password || '');
  const hasNumber = /\d/.test(password || '');

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    setError(null);

    try {
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }).unwrap();
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || 'An error occurred. Please try again.');
    }
  };

  // No token state
  if (!token) {
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
              This password reset link is invalid or has expired.
            </p>
          </div>

          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            Request New Link
            <ArrowRight className="h-5 w-5" />
          </Link>

          <div className="mt-6 text-center">
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
              Password Reset Successful
            </h1>
            <p className="text-slate-500 text-sm">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>

          <Link
            href={ROUTES.LOGIN}
            className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            Sign In
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Form Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0F172A] mb-1">
            Reset Your Password
          </h2>
          <p className="text-slate-500 text-sm">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#00CC52]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00CC52]/20 transition-all duration-200 pr-12`}
                  onFocus={() => setHasInteractedWithPassword(true)}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}

              {/* Password Requirements */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className={`flex items-center gap-2 text-xs ${hasMinLength ? 'text-[#00CC52]' : 'text-slate-400'}`}>
                  <Check className={`h-3 w-3 ${hasMinLength ? '' : 'opacity-40'}`} />
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-xs ${hasUppercase ? 'text-[#00CC52]' : 'text-slate-400'}`}>
                  <Check className={`h-3 w-3 ${hasUppercase ? '' : 'opacity-40'}`} />
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${hasLowercase ? 'text-[#00CC52]' : 'text-slate-400'}`}>
                  <Check className={`h-3 w-3 ${hasLowercase ? '' : 'opacity-40'}`} />
                  One lowercase letter
                </div>
                <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-[#00CC52]' : 'text-slate-400'}`}>
                  <Check className={`h-3 w-3 ${hasNumber ? '' : 'opacity-40'}`} />
                  One number
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#00CC52]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00CC52]/20 transition-all duration-200 pr-12`}
                  onFocus={() => setHasInteractedWithPassword(true)}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}

              {/* Owl Password Helper */}
              <OwlPasswordHelper
                password={password || ''}
                confirmPassword={confirmPassword || ''}
                show={hasInteractedWithPassword}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </FormProvider>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Reset Password Page
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#00CC52]/30 border-t-[#00CC52] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

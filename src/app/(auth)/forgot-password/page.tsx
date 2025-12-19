'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { useForgotPasswordMutation } from '@/features/auth/authApi';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas';
import { ROUTES } from '@/config/routes';

/**
 * Forgot Password Page
 * Matches login page form styling
 */
export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with React Hook Form + Zod validation
  const methods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);

    try {
      await forgotPassword({ email: data.email }).unwrap();
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || 'An error occurred. Please try again.');
    }
  };

  // Success state
  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#00CC52]/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[#00CC52]" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">
              Check Your Email
            </h1>
            <p className="text-slate-500 text-sm">
              We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </p>
          </div>

          {/* Back to Login */}
          <Link
            href={ROUTES.LOGIN}
            className="w-full bg-[#00CC52] hover:bg-[#00AA44] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Login
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
            Forgot Password?
          </h2>
          <p className="text-slate-500 text-sm">
            No worries! Enter your email and we&apos;ll send you a reset link.
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

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 focus:border-[#00CC52]'
                } focus:outline-none focus:ring-2 focus:ring-[#00CC52]/20 transition-all duration-200`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
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
                  Send Reset Link
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth } from '@/features/auth/hooks';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';
import { ROUTES } from '@/config/routes';

/**
 * PeakPoint Logo with Text
 */
function PeakPointLogoWithText() {
  return (
    <div className="flex items-center gap-2">
      {/* Logo Icon */}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#00FF66] to-[#00CC52]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      {/* Logo Text */}
      <span className="text-2xl font-bold">
        <span className="text-[#00CC52]">peak</span>
        <span className="text-[#0F172A]">point</span>
        <span className="text-slate-400 text-sm font-normal ml-1">SERVICES</span>
      </span>
    </div>
  );
}

/**
 * Feature Badge Component
 */
function FeatureBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8FFF0] text-[#0F172A] text-sm font-medium w-fit">
      <CheckCircle className="w-4 h-4 text-[#00CC52] flex-shrink-0" />
      <span className="whitespace-nowrap">{text}</span>
    </div>
  );
}

/**
 * Login Page
 * Matches MVP design at training.peakpoint.africa/login
 */
export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with React Hook Form + Zod validation
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
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
  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    const result = await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (!result.success) {
      setError(result.error || 'An error occurred during login');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16 p-4">
      {/* Left Side - Welcome Section */}
      <div className="flex-1 text-center lg:text-left">
        {/* Logo */}
        <div className="flex justify-center lg:justify-start mb-8">
          <PeakPointLogoWithText />
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl lg:text-4xl font-bold text-[#0F172A] mb-4">
          Welcome Back!
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Continue your journey to becoming a certified MRI Data Annotator
        </p>

        {/* Feature Badges */}
        <div className="flex flex-col items-center sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start gap-3">
          <FeatureBadge text="Multi-stage assessment system" />
          <FeatureBadge text="Proctored testing environment" />
          <FeatureBadge text="Real-time performance analytics" />
          <FeatureBadge text="DICOM image viewer integration" />
        </div>
      </div>

      {/* Right Side - Login Form Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">
              Login to Your Account
            </h2>
            <p className="text-slate-500 text-sm">
              Enter your credentials to continue
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
                  Username or Email
                </label>
                <input
                  id="email"
                  type="email"
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

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    href={ROUTES.FORGOT_PASSWORD}
                    className="text-sm text-[#00CC52] hover:text-[#00AA44] font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 focus:border-[#00CC52]'
                    } focus:outline-none focus:ring-2 focus:ring-[#00CC52]/20 transition-all duration-200 pr-12`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#00CC52] focus:ring-[#00CC52] focus:ring-offset-0"
                    {...register('rememberMe')}
                  />
                  <span className="text-sm text-slate-600">Remember me for 30 days</span>
                </label>
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
                    Login
                    <span className="ml-1">→</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Don&apos;t have an account?</span>
                </div>
              </div>

              {/* Create New Account Button */}
              <Link
                href={ROUTES.REGISTER}
                className="w-full block text-center border-2 border-[#00CC52] text-[#00CC52] hover:bg-[#00CC52]/5 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                Create New Account
              </Link>
            </form>
          </FormProvider>

          {/* Terms & Privacy */}
          <p className="mt-6 text-center text-xs text-slate-500">
            By logging in, you agree to our{' '}
            <Link href="/terms" className="text-[#00CC52] hover:text-[#00AA44] font-medium">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#00CC52] hover:text-[#00AA44] font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

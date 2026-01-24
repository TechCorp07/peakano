'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth } from '@/features/auth/hooks';
import { useAppSelector } from '@/store/hooks';
import { useLazyInitiateGoogleOAuthQuery } from '@/features/auth/authApi';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';
import { ROUTES } from '@/config/routes';
import { siteConfig } from '@/config/site';

/**
 * Google Icon SVG Component
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/**
 * PeakPoint Logo with Text
 */
function PeakPointLogoWithText() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={siteConfig.logo}
        alt={siteConfig.name}
        width={48}
        height={48}
        className="w-12 h-12 object-contain"
      />
      <span className="text-2xl font-bold text-[#0F172A]">{siteConfig.name}</span>
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
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { login, isLoading } = useAuth();
  const [initiateGoogleOAuth, { isLoading: isGoogleLoading }] = useLazyInitiateGoogleOAuthQuery();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo mode: Auto-redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = async () => {
    try {
      const result = await initiateGoogleOAuth().unwrap();
      // Redirect to Google OAuth page
      window.location.href = result.url;
    } catch {
      setError('Failed to initiate Google login. Please try again.');
    }
  };

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
                disabled={isLoading || isGoogleLoading}
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

              {/* Or Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-lg border border-slate-200 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5" />
                    Sign in with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
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
            <Link href={ROUTES.TERMS_AND_CONDITIONS} className="text-[#00CC52] hover:text-[#00AA44] font-medium">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href={ROUTES.PRIVACY_POLICY} className="text-[#00CC52] hover:text-[#00AA44] font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

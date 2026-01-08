'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Rocket, Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { OwlPasswordHelper } from '@/components/ui/owl-password-helper';

import { useAuth } from '@/features/auth/hooks';
import { useLazyInitiateGoogleOAuthQuery } from '@/features/auth/authApi';
import {
  accountStepSchema,
  personalStepSchema,
  professionalStepSchema,
  consentStepSchema,
  type AccountStepData,
  type PersonalStepData,
  type ProfessionalStepData,
  type ConsentStepData,
} from '@/features/auth/schemas';
import { ROUTES } from '@/config/routes';

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

// Types
type StepNumber = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1: Account
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  // Step 2: Personal
  phoneNumber: string;
  dateOfBirth: string;
  nationalId: string;
  gender: string;
  province: string;
  cityTown: string;
  // Step 3: Professional
  employmentStatus: string;
  currentEmployer: string;
  yearsOfExperience: string;
  educationLevel: string;
  institutionAttended: string;
  licenseNumber: string;
  hasMriExperience: boolean;
  // Step 4: Consent
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

// Zimbabwe provinces
const PROVINCES = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];

/**
 * PeakPoint Logo with Text
 */
function PeakPointLogoWithText() {
  return (
    <div className="flex items-center gap-2">
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
      <span className="text-2xl font-bold">
        <span className="text-[#00CC52]">peak</span>
        <span className="text-[#0F172A]">point</span>
        <span className="text-slate-400 text-sm font-normal ml-1">SERVICES</span>
      </span>
    </div>
  );
}

/**
 * Step Indicator Component
 */
function StepIndicator({ currentStep }: { currentStep: StepNumber }) {
  const steps = [
    { number: 1, label: 'Account' },
    { number: 2, label: 'Personal' },
    { number: 3, label: 'Professional' },
    { number: 4, label: 'Review' },
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step.number <= currentStep
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step.number}
            </div>
            <span className={`mt-2 text-xs font-medium ${
              step.number <= currentStep ? 'text-[#0F172A]' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                step.number < currentStep ? 'bg-[#00CC52]' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Register Page - Multi-step form
 * Matches MVP design at training.peakpoint.africa/register
 */
export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const [initiateGoogleOAuth, { isLoading: isGoogleLoading }] = useLazyInitiateGoogleOAuthQuery();
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInteractedWithPassword, setHasInteractedWithPassword] = useState(false);

  /**
   * Handle Google OAuth registration
   */
  const handleGoogleSignUp = async () => {
    try {
      const result = await initiateGoogleOAuth().unwrap();
      // Redirect to Google OAuth page
      window.location.href = result.url;
    } catch {
      setError('Failed to initiate Google sign up. Please try again.');
    }
  };

  // Form data stored across steps
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    nationalId: '',
    gender: '',
    province: '',
    cityTown: '',
    employmentStatus: '',
    currentEmployer: '',
    yearsOfExperience: '',
    educationLevel: '',
    institutionAttended: '',
    licenseNumber: '',
    hasMriExperience: false,
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  // Step 1 form
  const step1Form = useForm<AccountStepData>({
    resolver: zodResolver(accountStepSchema),
    defaultValues: {
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    },
  });

  // Step 2 form
  const step2Form = useForm<PersonalStepData>({
    resolver: zodResolver(personalStepSchema),
    defaultValues: {
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      nationalId: formData.nationalId,
      gender: formData.gender as PersonalStepData['gender'] || undefined,
      province: formData.province,
      cityTown: formData.cityTown,
    },
  });

  // Step 3 form
  const step3Form = useForm<ProfessionalStepData>({
    resolver: zodResolver(professionalStepSchema),
    defaultValues: {
      employmentStatus: formData.employmentStatus as ProfessionalStepData['employmentStatus'] || undefined,
      currentEmployer: formData.currentEmployer,
      yearsOfExperience: formData.yearsOfExperience as ProfessionalStepData['yearsOfExperience'] || undefined,
      educationLevel: formData.educationLevel as ProfessionalStepData['educationLevel'] || undefined,
      institutionAttended: formData.institutionAttended,
      licenseNumber: formData.licenseNumber,
      hasMriExperience: formData.hasMriExperience,
    },
  });

  // Step 4 form
  const step4Form = useForm<ConsentStepData>({
    resolver: zodResolver(consentStepSchema),
    defaultValues: {
      agreeToTerms: formData.agreeToTerms,
      agreeToPrivacy: formData.agreeToPrivacy,
    },
  });

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await step1Form.trigger();
      if (isValid) {
        const data = step1Form.getValues();
        setFormData((prev) => ({ ...prev, ...data }));
      }
    } else if (currentStep === 2) {
      isValid = await step2Form.trigger();
      if (isValid) {
        const data = step2Form.getValues();
        setFormData((prev) => ({ ...prev, ...data }));
      }
    } else if (currentStep === 3) {
      isValid = await step3Form.trigger();
      if (isValid) {
        const data = step3Form.getValues();
        setFormData((prev) => ({ ...prev, ...data }));
      }
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as StepNumber);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepNumber);
    }
  };

  const handleSubmit = async () => {
    const isValid = await step4Form.trigger();
    if (!isValid) return;

    const consentData = step4Form.getValues();
    const finalData = { ...formData, ...consentData };

    setError(null);

    const result = await registerUser({
      email: finalData.email,
      password: finalData.password,
      confirmPassword: finalData.confirmPassword,
      firstName: finalData.firstName,
      lastName: finalData.lastName,
    });

    if (!result.success) {
      setError(result.error || 'An error occurred during registration');
    }
  };

  // Input class helper
  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-lg border ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-slate-200 focus:border-[#00CC52]'
    } focus:outline-none focus:ring-2 focus:ring-[#00CC52]/20 transition-all duration-200`;

  const selectClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-lg border ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-slate-200 focus:border-[#00CC52]'
    } focus:outline-none focus:ring-2 focus:ring-[#00CC52]/20 transition-all duration-200 bg-white`;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <PeakPointLogoWithText />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">
          MRI Data Annotation Technical Training Platform
        </h1>
        <p className="text-slate-500 mb-6">Create your candidate account</p>

        {/* Google Sign Up Option */}
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-lg border border-slate-200 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon className="w-5 h-5" />
                Sign up with Google
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#F8FAFC] text-slate-500">or register with email</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Account Information */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">Account Information</h2>
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    className={inputClass(!!step1Form.formState.errors.username)}
                    {...step1Form.register('username')}
                  />
                  <p className="text-xs text-slate-500">
                    Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
                  </p>
                  {step1Form.formState.errors.username && (
                    <p className="text-sm text-red-500">{step1Form.formState.errors.username.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    className={inputClass(!!step1Form.formState.errors.email)}
                    {...step1Form.register('email')}
                  />
                  {step1Form.formState.errors.email && (
                    <p className="text-sm text-red-500">{step1Form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* First Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    className={inputClass(!!step1Form.formState.errors.firstName)}
                    {...step1Form.register('firstName')}
                  />
                  {step1Form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{step1Form.formState.errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    className={inputClass(!!step1Form.formState.errors.lastName)}
                    {...step1Form.register('lastName')}
                  />
                  {step1Form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{step1Form.formState.errors.lastName.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className={`${inputClass(!!step1Form.formState.errors.password)} pr-12`}
                      onFocus={() => setHasInteractedWithPassword(true)}
                      {...step1Form.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {step1Form.formState.errors.password && (
                    <p className="text-sm text-red-500">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className={`${inputClass(!!step1Form.formState.errors.confirmPassword)} pr-12`}
                      onFocus={() => setHasInteractedWithPassword(true)}
                      {...step1Form.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{step1Form.formState.errors.confirmPassword.message}</p>
                  )}
                  {/* Owl Password Helper */}
                  <OwlPasswordHelper
                    password={step1Form.watch('password') || ''}
                    confirmPassword={step1Form.watch('confirmPassword') || ''}
                    show={hasInteractedWithPassword}
                  />
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-sm text-slate-600 space-y-1">
                <p>Your password can&apos;t be too similar to your other personal information.</p>
                <p>Your password must contain at least 8 characters.</p>
                <p>Your password can&apos;t be a commonly used password.</p>
                <p>Your password can&apos;t be entirely numeric.</p>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">Personal Information</h2>
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+263771234567 or 0771234567"
                    className={inputClass(!!step2Form.formState.errors.phoneNumber)}
                    {...step2Form.register('phoneNumber')}
                  />
                  {step2Form.formState.errors.phoneNumber && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={inputClass(!!step2Form.formState.errors.dateOfBirth)}
                    {...step2Form.register('dateOfBirth')}
                  />
                  {step2Form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* National ID */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    National ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="63-123456A63"
                    className={inputClass(!!step2Form.formState.errors.nationalId)}
                    {...step2Form.register('nationalId')}
                  />
                  {step2Form.formState.errors.nationalId && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.nationalId.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass(!!step2Form.formState.errors.gender)}
                    {...step2Form.register('gender')}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  {step2Form.formState.errors.gender && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.gender.message}</p>
                  )}
                </div>

                {/* Province */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass(!!step2Form.formState.errors.province)}
                    {...step2Form.register('province')}
                  >
                    <option value="">Select your province</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {step2Form.formState.errors.province && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.province.message}</p>
                  )}
                </div>

                {/* City/Town */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    City/Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your city or town"
                    className={inputClass(!!step2Form.formState.errors.cityTown)}
                    {...step2Form.register('cityTown')}
                  />
                  {step2Form.formState.errors.cityTown && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.cityTown.message}</p>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Professional Background */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">Professional Background</h2>
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Employment Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Employment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass(!!step3Form.formState.errors.employmentStatus)}
                    {...step3Form.register('employmentStatus')}
                  >
                    <option value="">Select employment status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                  </select>
                  {step3Form.formState.errors.employmentStatus && (
                    <p className="text-sm text-red-500">{step3Form.formState.errors.employmentStatus.message}</p>
                  )}
                </div>

                {/* Current Employer */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Current Employer
                  </label>
                  <input
                    type="text"
                    placeholder="Hospital or institution name (optional)"
                    className={inputClass(false)}
                    {...step3Form.register('currentEmployer')}
                  />
                </div>

                {/* Years of Experience */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass(!!step3Form.formState.errors.yearsOfExperience)}
                    {...step3Form.register('yearsOfExperience')}
                  >
                    <option value="">Select years of experience</option>
                    <option value="no_experience">No Experience</option>
                    <option value="less_than_1">Less than 1 year</option>
                    <option value="1_to_3">1-3 years</option>
                    <option value="3_to_5">3-5 years</option>
                    <option value="5_to_10">5-10 years</option>
                    <option value="more_than_10">More than 10 years</option>
                  </select>
                  {step3Form.formState.errors.yearsOfExperience && (
                    <p className="text-sm text-red-500">{step3Form.formState.errors.yearsOfExperience.message}</p>
                  )}
                </div>

                {/* Education Level */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass(!!step3Form.formState.errors.educationLevel)}
                    {...step3Form.register('educationLevel')}
                  >
                    <option value="">Select your education level</option>
                    <option value="high_school">High School</option>
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelors">Bachelor&apos;s Degree</option>
                    <option value="masters">Master&apos;s Degree</option>
                    <option value="doctorate">Doctorate</option>
                  </select>
                  {step3Form.formState.errors.educationLevel && (
                    <p className="text-sm text-red-500">{step3Form.formState.errors.educationLevel.message}</p>
                  )}
                </div>

                {/* Institution Attended */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Institution Attended
                  </label>
                  <input
                    type="text"
                    placeholder="University or college name (optional)"
                    className={inputClass(false)}
                    {...step3Form.register('institutionAttended')}
                  />
                </div>

                {/* License Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    License Number
                  </label>
                  <input
                    type="text"
                    placeholder="Your license/registration number (if applicable)"
                    className={inputClass(false)}
                    {...step3Form.register('licenseNumber')}
                  />
                </div>
              </div>

              {/* MRI Experience Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasMriExperience"
                  className="w-4 h-4 rounded border-slate-300 text-[#00CC52] focus:ring-[#00CC52]"
                  {...step3Form.register('hasMriExperience')}
                />
                <label htmlFor="hasMriExperience" className="text-sm text-slate-600">
                  I have previous MRI experience
                </label>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Review & Consent */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-6">Review & Consent</h2>

            {/* Review Summary */}
            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-[#0F172A] mb-4">Please review your information</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-[#0F172A]">Account:</h4>
                  <ul className="ml-4 text-slate-600">
                    <li>• Name: {formData.firstName} {formData.lastName}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#0F172A]">Personal:</h4>
                  <ul className="ml-4 text-slate-600">
                    <li>• Location: {formData.cityTown}, {formData.province}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[#0F172A]">Professional:</h4>
                  <ul className="ml-4 text-slate-600">
                    <li>• Employment: {formData.employmentStatus?.replace('_', ' ')}</li>
                    <li>• Experience: {formData.yearsOfExperience?.replace(/_/g, ' ')}</li>
                    <li>• Education: {formData.educationLevel?.replace('_', ' ')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <form className="space-y-4">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  className="w-4 h-4 mt-1 rounded border-slate-300 text-[#00CC52] focus:ring-[#00CC52]"
                  {...step4Form.register('agreeToTerms')}
                />
                <label htmlFor="agreeToTerms" className="text-sm text-slate-600">
                  I have read and agree to the{' '}
                  <Link href="/terms-and-conditions" className="text-[#00CC52] hover:underline">
                    Terms and Conditions
                  </Link>
                  {' '}<span className="text-red-500">*</span>
                </label>
              </div>
              {step4Form.formState.errors.agreeToTerms && (
                <p className="text-sm text-red-500 ml-6">{step4Form.formState.errors.agreeToTerms.message}</p>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToPrivacy"
                  className="w-4 h-4 mt-1 rounded border-slate-300 text-[#00CC52] focus:ring-[#00CC52]"
                  {...step4Form.register('agreeToPrivacy')}
                />
                <label htmlFor="agreeToPrivacy" className="text-sm text-slate-600">
                  I consent to the processing of my personal data as described in the{' '}
                  <Link href="/privacy-policy" className="text-[#00CC52] hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}<span className="text-red-500">*</span>
                </label>
              </div>
              {step4Form.formState.errors.agreeToPrivacy && (
                <p className="text-sm text-red-500 ml-6">{step4Form.formState.errors.agreeToPrivacy.message}</p>
              )}
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">What you&apos;re agreeing to:</p>
                  <ul className="space-y-1">
                    <li>• Account creation and Platform use terms</li>
                    <li>• Collection and processing of your personal data</li>
                    <li>• Proctored testing with webcam monitoring</li>
                    <li>• Compliance with the Data Protection Act</li>
                  </ul>
                  <p className="mt-3 text-blue-700">
                    <strong>Note:</strong> A separate proctoring consent will be required before taking each test.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00CC52] text-white font-medium hover:bg-[#00AA44] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00CC52] text-white font-medium hover:bg-[#00AA44] transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <Rocket className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-500">
            Already have an account?{' '}
            <Link href={ROUTES.LOGIN} className="text-[#00CC52] hover:text-[#00AA44] font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

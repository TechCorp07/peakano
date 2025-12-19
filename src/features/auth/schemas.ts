import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema - Multi-step form
 * Step 1: Account Information
 * Step 2: Personal Information
 * Step 3: Professional Background
 * Step 4: Review & Consent
 */

// Step 1: Account Information
export const accountStepSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(150, 'Username must be 150 characters or fewer')
      .regex(/^[\w.@+-]+$/, 'Letters, digits and @/./+/-/_ only'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type AccountStepData = z.infer<typeof accountStepSchema>;

// Step 2: Personal Information
export const personalStepSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationalId: z
    .string()
    .min(1, 'National ID is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  province: z.string().min(1, 'Province is required'),
  cityTown: z.string().min(1, 'City/Town is required'),
});

export type PersonalStepData = z.infer<typeof personalStepSchema>;

// Step 3: Professional Background
export const professionalStepSchema = z.object({
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'student']),
  currentEmployer: z.string().optional(),
  yearsOfExperience: z.enum(['no_experience', 'less_than_1', '1_to_3', '3_to_5', '5_to_10', 'more_than_10']),
  educationLevel: z.enum(['high_school', 'certificate', 'diploma', 'bachelors', 'masters', 'doctorate']),
  institutionAttended: z.string().optional(),
  licenseNumber: z.string().optional(),
  hasMriExperience: z.boolean(),
});

export type ProfessionalStepData = z.infer<typeof professionalStepSchema>;

// Step 4: Review & Consent
export const consentStepSchema = z.object({
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms and Conditions',
  }),
  agreeToPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must consent to the Privacy Policy',
  }),
});

export type ConsentStepData = z.infer<typeof consentStepSchema>;

// Combined full registration schema
export const registerSchema = z
  .object({
    // Account (Step 1)
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(150, 'Username must be 150 characters or fewer')
      .regex(/^[\w.@+-]+$/, 'Letters, digits and @/./+/-/_ only'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // Personal (Step 2)
    phoneNumber: z.string().min(1, 'Phone number is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    nationalId: z.string().min(1, 'National ID is required'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    province: z.string().min(1, 'Province is required'),
    cityTown: z.string().min(1, 'City/Town is required'),
    // Professional (Step 3)
    employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'student']),
    currentEmployer: z.string().optional(),
    yearsOfExperience: z.enum(['no_experience', 'less_than_1', '1_to_3', '3_to_5', '5_to_10', 'more_than_10']),
    educationLevel: z.enum(['high_school', 'certificate', 'diploma', 'bachelors', 'masters', 'doctorate']),
    institutionAttended: z.string().optional(),
    licenseNumber: z.string().optional(),
    hasMriExperience: z.boolean().default(false),
    // Consent (Step 4)
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms and Conditions',
    }),
    agreeToPrivacy: z.boolean().refine((val) => val === true, {
      message: 'You must consent to the Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Update profile form validation schema
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  avatarUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

/**
 * Change password form validation schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;


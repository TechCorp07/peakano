'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, User, Lock, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth, usePermissions } from '@/features/auth/hooks';
import { useUpdateProfileMutation, useChangePasswordMutation, useResendVerificationMutation } from '@/features/auth/authApi';
import {
    updateProfileSchema,
    changePasswordSchema,
    type UpdateProfileFormData,
    type ChangePasswordFormData,
} from '@/features/auth/schemas';
import { ROUTES } from '@/config/routes';

/**
 * Profile Settings Page
 * Allows users to update their profile and change password
 */
export default function ProfileSettingsPage() {
    const { user } = useAuth();
    const { isAdmin, isInstructor } = usePermissions();

    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
    const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();

    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile form
    const profileMethods = useForm<UpdateProfileFormData>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            avatarUrl: user?.avatarUrl || '',
        },
    });

    // Password form
    const passwordMethods = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onProfileSubmit = async (data: UpdateProfileFormData) => {
        setProfileError(null);
        setProfileSuccess(false);

        try {
            await updateProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: data.avatarUrl || undefined,
            }).unwrap();
            setProfileSuccess(true);
        } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            setProfileError(error.data?.message || 'Failed to update profile');
        }
    };

    const onPasswordSubmit = async (data: ChangePasswordFormData) => {
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            }).unwrap();
            setPasswordSuccess(true);
            passwordMethods.reset();
        } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            setPasswordError(error.data?.message || 'Failed to change password');
        }
    };

    const handleResendVerification = async () => {
        try {
            await resendVerification().unwrap();
            setVerificationSent(true);
        } catch {
            // Error handling - could add toast notification here
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={ROUTES.PROFILE}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Profile Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings</p>
                </div>
            </div>

            {/* Email Verification Banner */}
            {!user?.emailVerified && (
                <Alert>
                    <AlertDescription className="flex items-center justify-between">
                        <span>Your email is not verified. Please check your inbox for the verification link.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isResending || verificationSent}
                        >
                            {verificationSent ? 'Email Sent!' : 'Resend Email'}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Profile Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>
                            Update your personal details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormProvider {...profileMethods}>
                            <form onSubmit={profileMethods.handleSubmit(onProfileSubmit)} className="space-y-4">
                                {profileSuccess && (
                                    <Alert className="border-green-200 bg-green-50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-700">
                                            Profile updated successfully!
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {profileError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{profileError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First name</Label>
                                        <Input
                                            id="firstName"
                                            error={!!profileMethods.formState.errors.firstName}
                                            {...profileMethods.register('firstName')}
                                        />
                                        {profileMethods.formState.errors.firstName && (
                                            <p className="text-sm text-destructive">
                                                {profileMethods.formState.errors.firstName.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last name</Label>
                                        <Input
                                            id="lastName"
                                            error={!!profileMethods.formState.errors.lastName}
                                            {...profileMethods.register('lastName')}
                                        />
                                        {profileMethods.formState.errors.lastName && (
                                            <p className="text-sm text-destructive">
                                                {profileMethods.formState.errors.lastName.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Email cannot be changed
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                                    <Input
                                        id="avatarUrl"
                                        placeholder="https://example.com/avatar.jpg"
                                        error={!!profileMethods.formState.errors.avatarUrl}
                                        {...profileMethods.register('avatarUrl')}
                                    />
                                    {profileMethods.formState.errors.avatarUrl && (
                                        <p className="text-sm text-destructive">
                                            {profileMethods.formState.errors.avatarUrl.message}
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" isLoading={isUpdatingProfile}>
                                    Save Changes
                                </Button>
                            </form>
                        </FormProvider>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormProvider {...passwordMethods}>
                            <form onSubmit={passwordMethods.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                {passwordSuccess && (
                                    <Alert className="border-green-200 bg-green-50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-700">
                                            Password changed successfully!
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {passwordError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{passwordError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            error={!!passwordMethods.formState.errors.currentPassword}
                                            {...passwordMethods.register('currentPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordMethods.formState.errors.currentPassword && (
                                        <p className="text-sm text-destructive">
                                            {passwordMethods.formState.errors.currentPassword.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            error={!!passwordMethods.formState.errors.newPassword}
                                            {...passwordMethods.register('newPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordMethods.formState.errors.newPassword && (
                                        <p className="text-sm text-destructive">
                                            {passwordMethods.formState.errors.newPassword.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            error={!!passwordMethods.formState.errors.confirmPassword}
                                            {...passwordMethods.register('confirmPassword')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordMethods.formState.errors.confirmPassword && (
                                        <p className="text-sm text-destructive">
                                            {passwordMethods.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" isLoading={isChangingPassword}>
                                    Change Password
                                </Button>
                            </form>
                        </FormProvider>
                    </CardContent>
                </Card>
            </div>

            {/* Permissions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Your Permissions
                    </CardTitle>
                    <CardDescription>
                        Your current role and permissions in the system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Role</h4>
                            <p className="text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                        <div>
                            <h4 className="font-medium">Permissions</h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {user?.permissions.map((permission) => (
                                    <span
                                        key={permission}
                                        className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                                    >
                                        {permission}
                                    </span>
                                ))}
                                {(!user?.permissions || user.permissions.length === 0) && (
                                    <p className="text-sm text-muted-foreground">No specific permissions assigned</p>
                                )}
                            </div>
                        </div>
                        {(isAdmin || isInstructor) && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    {isAdmin ? 'You have administrator access.' : 'You have instructor access.'}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

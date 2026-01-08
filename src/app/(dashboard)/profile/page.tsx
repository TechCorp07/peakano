'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Award, BarChart3, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks';
import { useUpdateProfileMutation } from '@/features/auth/authApi';
import {
    updateProfileSchema,
    type UpdateProfileFormData,
} from '@/features/auth/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROUTES } from '@/config/routes';

/**
 * Profile Page
 * Shows user profile overview with inline profile editing
 */
export default function ProfilePage() {
    const { user } = useAuth();
    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Profile form
    const profileMethods = useForm<UpdateProfileFormData>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            avatarUrl: user?.avatarUrl || '',
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

    return (
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-24 w-24 rounded-full object-cover"
                        />
                    ) : (
                        <User className="h-12 w-12 text-primary" />
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">
                        {user?.firstName} {user?.lastName}
                    </h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                            {user?.role}
                        </span>
                        {user?.emailVerified ? (
                            <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                                Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
                                Email not verified
                            </span>
                        )}
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={ROUTES.PROFILE_SETTINGS}>
                        Change Password
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Information Card - Editable */}
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
                                    <Alert className="border-green-500/50 bg-green-500/10">
                                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                                        <AlertDescription className="text-green-400">
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

                {/* Account Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                                <dd className="mt-1 font-mono text-sm">{user?.id || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Organization</dt>
                                <dd className="mt-1 text-sm">{user?.organizationId || 'None'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
                                <dd className="mt-1 text-sm">
                                    {user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Account Status</dt>
                                <dd className="mt-1 text-sm">
                                    {user?.isActive ? (
                                        <span className="text-green-400">Active</span>
                                    ) : (
                                        <span className="text-red-400">Inactive</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>

            {/* Progress and Certificates Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Learning Progress
                        </CardTitle>
                        <CardDescription>
                            View your course progress and statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" disabled>
                            Coming in Phase 6
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Certificates
                        </CardTitle>
                        <CardDescription>
                            View and download your earned certificates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" disabled>
                            Coming in Phase 7
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

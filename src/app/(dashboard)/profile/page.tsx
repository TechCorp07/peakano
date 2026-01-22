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
        <div className="p-6 lg:p-8 space-y-10">
            {/* Profile Header */}
            <div className="flex items-start gap-8 p-6 bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-500/30">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-28 w-28 rounded-2xl object-cover"
                        />
                    ) : (
                        <User className="h-14 w-14 text-indigo-400" />
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-400 uppercase tracking-wider mb-1">
                        Profile
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#E6EDF3]">
                        {user?.firstName} {user?.lastName}
                    </h1>
                    <p className="text-base text-muted-foreground mt-1">{user?.email}</p>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-4 py-1.5 text-sm font-semibold text-indigo-400 capitalize border border-indigo-500/30">
                            {user?.role}
                        </span>
                        {user?.emailVerified ? (
                            <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-1.5 text-sm font-semibold text-amber-400 border border-amber-500/30">
                                Email not verified
                            </span>
                        )}
                    </div>
                </div>
                <Button asChild variant="outline" className="border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                    <Link href={ROUTES.PROFILE_SETTINGS}>
                        Change Password
                    </Link>
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
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
                <Card className="border-blue-500/20 bg-gradient-to-br from-[#161B22] to-[#1a1f29] shadow-lg shadow-blue-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-400">
                            <BarChart3 className="h-5 w-5" />
                            Learning Progress
                        </CardTitle>
                        <CardDescription>
                            View your course progress and statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10" disabled>
                            Coming in Phase 6
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-gradient-to-br from-[#161B22] to-[#1a1f29] shadow-lg shadow-amber-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-400">
                            <Award className="h-5 w-5" />
                            Certificates
                        </CardTitle>
                        <CardDescription>
                            View and download your earned certificates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10" disabled>
                            Coming in Phase 7
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

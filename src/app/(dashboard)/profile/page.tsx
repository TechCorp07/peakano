'use client';

import Link from 'next/link';
import { User, Settings, Award, BarChart3 } from 'lucide-react';

import { useAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';

/**
 * Profile Page
 * Shows user profile overview with links to settings and other sections
 */
export default function ProfilePage() {
    const { user } = useAuth();

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
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                Verified
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                Email not verified
                            </span>
                        )}
                    </div>
                </div>
                <Button asChild>
                    <Link href={ROUTES.PROFILE_SETTINGS}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
            </div>

            {/* Profile Sections */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Account Settings
                        </CardTitle>
                        <CardDescription>
                            Manage your profile and security settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={ROUTES.PROFILE_SETTINGS}>
                                Go to Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

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
                                    <span className="text-green-600">Active</span>
                                ) : (
                                    <span className="text-red-600">Inactive</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}

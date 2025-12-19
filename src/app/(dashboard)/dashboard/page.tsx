'use client';

import { useAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard Page
 * Main landing page for authenticated users
 */
export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your training progress
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>

      {/* Stats Cards - Placeholder for Phase 3 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Courses Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start learning today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Annotations Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Practice makes perfect
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Complete assessments to see
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certificates Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Complete courses to earn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-20 flex-col gap-2">
            <span className="text-lg">📚</span>
            <span>Browse Courses</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <span className="text-lg">🔬</span>
            <span>Start Annotation</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <span className="text-lg">📝</span>
            <span>Take Assessment</span>
          </Button>
        </CardContent>
      </Card>

      {/* User Info - For testing */}
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Current user information (for testing)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium">Email:</dt>
              <dd className="text-muted-foreground">{user?.email || 'N/A'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Role:</dt>
              <dd className="text-muted-foreground">{user?.role || 'N/A'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">ID:</dt>
              <dd className="text-muted-foreground font-mono text-xs">{user?.id || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

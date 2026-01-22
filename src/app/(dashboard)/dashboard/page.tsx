'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Image,
  ClipboardCheck,
  Award,
  TrendingUp,
  ArrowRight,
  Play,
  Target,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useGetDashboardDataQuery,
  useGetDashboardStatsQuery,
  useGetRecentActivityQuery,
} from '@/features/dashboard';

// Mock data for fallback when backend is unavailable
const mockDashboardStats = {
  coursesEnrolled: 3,
  coursesChange: '+1 this week',
  annotationsCompleted: 24,
  annotationsChange: '+5 this week',
  averageScore: 87,
  scoreChange: '+3% improvement',
  certificatesEarned: 1,
  certificatesChange: '2 in progress',
};

const mockRecentActivity = [
  {
    id: '1',
    title: 'Completed Pelvic MRI annotation',
    time: '2 hours ago',
    type: 'annotation' as const,
  },
  {
    id: '2',
    title: 'Passed Module 1 Assessment',
    time: 'Yesterday',
    type: 'assessment' as const,
  },
  {
    id: '3',
    title: 'Started Pelvic MRI Fundamentals course',
    time: '3 days ago',
    type: 'course' as const,
  },
];

const mockQuickActions = [
  {
    id: '1',
    title: 'Continue Learning',
    description: 'Resume MRI Fundamentals',
    type: 'continue',
  },
  {
    id: '2',
    title: 'Practice Annotation',
    description: '3 cases available',
    type: 'practice',
  },
  {
    id: '3',
    title: 'Take Assessment',
    description: 'Module 2 quiz ready',
    type: 'assessment',
  },
];

const mockProgress = [
  { name: 'MRI Fundamentals', progress: 60, color: 'from-primary to-blue-400' },
  { name: 'Brain Anatomy', progress: 35, color: 'from-purple-500 to-violet-400' },
  { name: 'Annotation Skills', progress: 80, color: 'from-emerald-500 to-green-400' },
];

/**
 * Dashboard Page (Dark Theme)
 * Main landing page for authenticated users
 */
export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard data from backend
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useGetDashboardDataQuery();
  const { data: statsData, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery();
  const { data: activityData, isLoading: activityLoading } = useGetRecentActivityQuery({ limit: 5 });

  // Determine if using mock data
  const isUsingMockData = !!dashboardError || !!statsError;
  const isLoading = dashboardLoading || statsLoading;

  // Use API data or fallback to mock
  const dashStats = useMemo(() => {
    if (statsData) return statsData;
    if (dashboardData?.stats) return dashboardData.stats;
    return mockDashboardStats;
  }, [statsData, dashboardData]);

  const recentActivityItems = useMemo(() => {
    if (activityData) return activityData;
    if (dashboardData?.recentActivity) return dashboardData.recentActivity;
    return mockRecentActivity;
  }, [activityData, dashboardData]);

  const quickActionsData = useMemo(() => {
    if (dashboardData?.quickActions) return dashboardData.quickActions;
    return mockQuickActions;
  }, [dashboardData]);

  const progressData = useMemo(() => {
    if (dashboardData?.progress) return dashboardData.progress;
    return mockProgress;
  }, [dashboardData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'annotation':
        return <Image className="h-4 w-4" />;
      case 'assessment':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getQuickActionConfig = (type: string) => {
    switch (type) {
      case 'continue':
        return {
          icon: <Play className="h-5 w-5" />,
          href: ROUTES.COURSES,
          color: 'text-cyan-400',
          bgColor: 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20',
          borderColor: 'border-cyan-500/40',
        };
      case 'practice':
        return {
          icon: <Target className="h-5 w-5" />,
          href: ROUTES.STUDIES,
          color: 'text-violet-400',
          bgColor: 'bg-gradient-to-br from-violet-500/30 to-purple-500/20',
          borderColor: 'border-violet-500/40',
        };
      case 'assessment':
        return {
          icon: <ClipboardCheck className="h-5 w-5" />,
          href: ROUTES.ASSESSMENTS,
          color: 'text-emerald-400',
          bgColor: 'bg-gradient-to-br from-emerald-500/30 to-green-500/20',
          borderColor: 'border-emerald-500/40',
        };
      default:
        return {
          icon: <Play className="h-5 w-5" />,
          href: ROUTES.COURSES,
          color: 'text-cyan-400',
          bgColor: 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20',
          borderColor: 'border-cyan-500/40',
        };
    }
  };

  const stats = [
    {
      label: 'Courses Enrolled',
      value: String(dashStats.coursesEnrolled ?? dashStats.coursesEnrolled ?? '3'),
      change: dashStats.coursesChange ?? '+1 this week',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-[#1e3a5f] to-[#0f2744]',
      borderColor: 'border-white/40',
      glowColor: 'hover:shadow-blue-900/50',
      accentColor: 'bg-gradient-to-b from-cyan-400 to-cyan-600',
    },
    {
      label: 'Annotations Completed',
      value: String(dashStats.annotationsCompleted ?? '24'),
      change: dashStats.annotationsChange ?? '+5 this week',
      icon: <Image className="h-5 w-5" />,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-[#1e3a5f] to-[#0f2744]',
      borderColor: 'border-white/40',
      glowColor: 'hover:shadow-blue-900/50',
      accentColor: 'bg-gradient-to-b from-teal-400 to-teal-600',
    },
    {
      label: 'Average Score',
      value: `${dashStats.averageScore ?? 87}%`,
      change: dashStats.scoreChange ?? '+3% improvement',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-[#1e3a5f] to-[#0f2744]',
      borderColor: 'border-white/40',
      glowColor: 'hover:shadow-blue-900/50',
      accentColor: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
    },
    {
      label: 'Certificates Earned',
      value: String(dashStats.certificatesEarned ?? '1'),
      change: dashStats.certificatesChange ?? '2 in progress',
      icon: <Award className="h-5 w-5" />,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-[#1e3a5f] to-[#0f2744]',
      borderColor: 'border-white/40',
      glowColor: 'hover:shadow-blue-900/50',
      accentColor: 'bg-gradient-to-b from-amber-400 to-amber-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Demo Mode Notice */}
      {isUsingMockData && (
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200">
            Demo mode: Showing sample data. Connect backend for live data.
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">
            Dashboard
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#E6EDF3] tracking-tight">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-base text-[#8B949E] mt-2 max-w-lg">
            Here&apos;s an overview of your training progress and learning journey
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
              stat.borderColor,
              stat.glowColor,
              stat.bgColor
            )}
          >
            {/* Left accent bar */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl", stat.accentColor)} />
            
            <div className="flex items-center justify-between mb-5 pl-2">
              <span className="text-base font-bold text-white uppercase tracking-wide">{stat.label}</span>
              <div className="p-3 rounded-xl bg-white/15">
                <span className="text-white">{stat.icon}</span>
              </div>
            </div>
            <div className="text-5xl font-black tracking-tight text-white pl-2">{stat.value}</div>
            <p className="text-base text-white/80 mt-3 font-semibold pl-2">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border border-[#30363D]/50 shadow-xl shadow-black/30">
            <div className="px-6 py-5 border-b border-[#30363D]/50 bg-gradient-to-r from-primary/10 to-transparent">
              <h2 className="text-xl font-bold text-[#E6EDF3] tracking-tight">Quick Actions</h2>
              <p className="text-base text-[#8B949E] mt-1">
                Pick up where you left off
              </p>
            </div>
            <div className="p-6 grid gap-5 md:grid-cols-3">
              {quickActionsData.map((action) => {
                const config = getQuickActionConfig(action.type);
                return (
                  <Link key={action.id} href={config.href}>
                    <div className={cn(
                      "p-6 rounded-xl transition-all duration-300 group cursor-pointer hover:scale-[1.03] hover:shadow-xl",
                      "bg-gradient-to-br from-[#0D1117] to-[#161B22]",
                      "border-2",
                      config.borderColor,
                      "hover:shadow-lg"
                    )}>
                      <div className={cn('p-3.5 rounded-xl w-fit mb-4', config.bgColor)}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <h3 className={cn("font-bold text-lg transition-colors", config.color)}>
                        {action.title}
                      </h3>
                      <p className="text-base text-[#8B949E] mt-2">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
            <div className="px-6 py-5 border-b border-indigo-500/20 flex items-center justify-between bg-gradient-to-r from-indigo-500/15 to-transparent">
              <h2 className="text-xl font-bold text-[#E6EDF3] tracking-tight">Recent Activity</h2>
              <Link href="#" className="text-base text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                View all
              </Link>
            </div>
            <div className="p-3">
              {recentActivityItems.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-[#E6EDF3] font-medium truncate">{activity.title}</p>
                    <p className="text-sm text-[#8B949E] mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
            <div className="px-6 py-5 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/15 to-transparent">
              <h2 className="text-xl font-bold text-[#E6EDF3] tracking-tight">Current Progress</h2>
            </div>
            <div className="p-5 space-y-5">
              {progressData.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-base mb-2">
                    <span className="text-[#E6EDF3] font-medium">{item.name}</span>
                    <span className={cn(
                      "font-bold",
                      item.progress >= 70 ? "text-emerald-400" : item.progress >= 40 ? "text-amber-400" : "text-purple-400"
                    )}>{item.progress}%</span>
                  </div>
                  <div className="h-3 bg-[#21262D] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", item.color)}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Browse Studies Link */}
          <Link href={ROUTES.STUDIES}>
            <div className="bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl border-2 border-primary/40 p-5 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#E6EDF3]">Browse DICOM Studies</h3>
                  <p className="text-base text-[#8B949E] mt-1">View and annotate medical images</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

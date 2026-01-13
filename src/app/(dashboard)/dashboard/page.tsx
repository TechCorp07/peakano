'use client';

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
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

/**
 * Dashboard Page (Dark Theme)
 * Main landing page for authenticated users
 */
export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Courses Enrolled',
      value: '3',
      change: '+1 this week',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Annotations Completed',
      value: '24',
      change: '+5 this week',
      icon: <Image className="h-5 w-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'Average Score',
      value: '87%',
      change: '+3% improvement',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Certificates Earned',
      value: '1',
      change: '2 in progress',
      icon: <Award className="h-5 w-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const quickActions = [
    {
      title: 'Continue Learning',
      description: 'Resume MRI Fundamentals',
      icon: <Play className="h-5 w-5" />,
      href: ROUTES.COURSES,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Practice Annotation',
      description: '3 cases available',
      icon: <Target className="h-5 w-5" />,
      href: ROUTES.STUDIES,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      title: 'Take Assessment',
      description: 'Module 2 quiz ready',
      icon: <ClipboardCheck className="h-5 w-5" />,
      href: ROUTES.ASSESSMENTS,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const recentActivity = [
    {
      title: 'Completed Pelvic MRI annotation',
      time: '2 hours ago',
      icon: <Image className="h-4 w-4" />,
    },
    {
      title: 'Passed Module 1 Assessment',
      time: 'Yesterday',
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      title: 'Started Pelvic MRI Fundamentals course',
      time: '3 days ago',
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-[#8B949E] mt-1">
            Here&apos;s an overview of your training progress
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#161B22] rounded-lg border border-[#30363D] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#8B949E]">{stat.label}</span>
              <div className={cn('p-2 rounded-md', stat.bgColor)}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-[#E6EDF3]">{stat.value}</div>
            <p className="text-xs text-[#6E7681] mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-[#161B22] rounded-lg border border-[#30363D]">
            <div className="px-4 py-3 border-b border-[#30363D]">
              <h2 className="font-semibold text-[#E6EDF3]">Quick Actions</h2>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Pick up where you left off
              </p>
            </div>
            <div className="p-4 grid gap-3 md:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-lg hover:border-[#30363D] transition-colors group cursor-pointer">
                    <div className={cn('p-2 rounded-md w-fit mb-3', action.bgColor)}>
                      <span className={action.color}>{action.icon}</span>
                    </div>
                    <h3 className="font-medium text-[#E6EDF3] text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-[#6E7681] mt-1">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-[#161B22] rounded-lg border border-[#30363D]">
            <div className="px-4 py-3 border-b border-[#30363D] flex items-center justify-between">
              <h2 className="font-semibold text-[#E6EDF3]">Recent Activity</h2>
              <Link href="#" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="p-2">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-white/5"
                >
                  <div className="p-1.5 rounded bg-[#21262D] text-[#8B949E]">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E6EDF3] truncate">{activity.title}</p>
                    <p className="text-xs text-[#6E7681]">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-[#161B22] rounded-lg border border-[#30363D]">
            <div className="px-4 py-3 border-b border-[#30363D]">
              <h2 className="font-semibold text-[#E6EDF3]">Current Progress</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#8B949E]">MRI Fundamentals</span>
                  <span className="text-[#E6EDF3] font-medium">60%</span>
                </div>
                <div className="h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#8B949E]">Brain Anatomy</span>
                  <span className="text-[#E6EDF3] font-medium">35%</span>
                </div>
                <div className="h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: '35%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#8B949E]">Annotation Skills</span>
                  <span className="text-[#E6EDF3] font-medium">80%</span>
                </div>
                <div className="h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: '80%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Browse Studies Link */}
          <Link href={ROUTES.STUDIES}>
            <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg border border-primary/30 p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#E6EDF3]">Browse DICOM Studies</h3>
                  <p className="text-xs text-[#8B949E] mt-1">View and annotate medical images</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

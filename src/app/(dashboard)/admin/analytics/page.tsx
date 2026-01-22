"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  ClipboardCheck,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Image,
  GraduationCap,
  Award,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useGetOverviewStatsQuery,
  useGetActivityDataQuery,
  useGetTopCoursesQuery,
  useGetTopAnnotatorsQuery,
  useGetRecentActivityQuery,
  useLazyExportAnalyticsQuery,
  type TimeRange,
  type OverviewStats,
  type ActivityDataPoint,
  type TopCourse,
  type TopAnnotator,
  type RecentActivity,
} from "@/features/analytics";

// Mock analytics data for fallback
const mockOverviewStats: OverviewStats = {
  totalUsers: 2847,
  totalUsersChange: 12.5,
  activeCourses: 48,
  activeCoursesChange: 3,
  annotationsCompleted: 15892,
  annotationsChange: 28.3,
  imagesProcessed: 4521,
  imagesChange: 15.7,
};

const mockActivityData: ActivityDataPoint[] = [
  { date: "2024-01-01", day: "Mon", annotations: 245, users: 89 },
  { date: "2024-01-02", day: "Tue", annotations: 312, users: 102 },
  { date: "2024-01-03", day: "Wed", annotations: 287, users: 95 },
  { date: "2024-01-04", day: "Thu", annotations: 398, users: 118 },
  { date: "2024-01-05", day: "Fri", annotations: 356, users: 110 },
  { date: "2024-01-06", day: "Sat", annotations: 178, users: 45 },
  { date: "2024-01-07", day: "Sun", annotations: 142, users: 38 },
];

const mockTopCourses: TopCourse[] = [
  { id: "1", name: "MRI Fundamentals", enrollments: 456, completion: 78, rating: 4.8 },
  { id: "2", name: "Cervical Imaging", enrollments: 324, completion: 82, rating: 4.9 },
  { id: "3", name: "Annotation Basics", enrollments: 289, completion: 91, rating: 4.7 },
  { id: "4", name: "Advanced Pelvic MRI", enrollments: 198, completion: 65, rating: 4.6 },
  { id: "5", name: "Quality Standards", enrollments: 167, completion: 88, rating: 4.8 },
];

const mockTopAnnotators: TopAnnotator[] = [
  { id: "1", name: "Dr. Sarah Chen", annotations: 1247, accuracy: 98.2 },
  { id: "2", name: "Dr. James Wilson", annotations: 1089, accuracy: 97.8 },
  { id: "3", name: "Dr. Emily Park", annotations: 956, accuracy: 99.1 },
  { id: "4", name: "Dr. Michael Brown", annotations: 834, accuracy: 96.5 },
  { id: "5", name: "Dr. Lisa Martinez", annotations: 756, accuracy: 97.2 },
];

const mockRecentActivity: RecentActivity[] = [
  { id: "1", user: "Dr. Sarah Chen", userId: "u1", action: "Completed annotation", target: "MRI-2024-0156", targetId: "t1", time: "5 min ago", timestamp: new Date().toISOString() },
  { id: "2", user: "John Instructor", userId: "u2", action: "Created course", target: "Advanced Techniques", targetId: "t2", time: "12 min ago", timestamp: new Date().toISOString() },
  { id: "3", user: "Alice Johnson", userId: "u3", action: "Enrolled in", target: "MRI Fundamentals", targetId: "t3", time: "28 min ago", timestamp: new Date().toISOString() },
  { id: "4", user: "Dr. James Wilson", userId: "u4", action: "Submitted review", target: "MRI-2024-0142", targetId: "t4", time: "45 min ago", timestamp: new Date().toISOString() },
  { id: "5", user: "Bob Smith", userId: "u5", action: "Completed quiz", target: "Cervical Imaging", targetId: "t5", time: "1 hour ago", timestamp: new Date().toISOString() },
];

// StatCard component
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: string;
}) {
  const colorClasses = {
    cyan: {
      border: "border-cyan-500/30",
      accent: "bg-gradient-to-b from-cyan-400 to-cyan-600",
      icon: "from-cyan-500/30 to-cyan-600/20",
      text: "text-cyan-400",
    },
    teal: {
      border: "border-teal-500/30",
      accent: "bg-gradient-to-b from-teal-400 to-teal-600",
      icon: "from-teal-500/30 to-teal-600/20",
      text: "text-teal-400",
    },
    emerald: {
      border: "border-emerald-500/30",
      accent: "bg-gradient-to-b from-emerald-400 to-emerald-600",
      icon: "from-emerald-500/30 to-emerald-600/20",
      text: "text-emerald-400",
    },
    blue: {
      border: "border-blue-500/30",
      accent: "bg-gradient-to-b from-blue-400 to-blue-600",
      icon: "from-blue-500/30 to-blue-600/20",
      text: "text-blue-400",
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.cyan;

  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 p-6 hover:shadow-xl transition-all duration-300 group",
      colors.border
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl", colors.accent)} />
      <div className="flex items-center justify-between pl-3">
        <div>
          <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className="text-4xl font-black text-[#E6EDF3] tracking-tight">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
            <span className={cn("text-sm font-semibold", trend === "up" ? "text-emerald-400" : "text-rose-400")}>
              {change}
            </span>
            <span className="text-xs text-[#6E7681]">vs last period</span>
          </div>
        </div>
        <div className={cn("p-4 rounded-xl bg-gradient-to-br shadow-lg", colors.icon)}>
          <Icon className={cn("h-7 w-7", colors.text)} />
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // RTK Query hooks with time range filter
  const {
    data: overviewStats,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetOverviewStatsQuery({ timeRange });

  const {
    data: activityData,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useGetActivityDataQuery({ timeRange });

  const {
    data: topCourses,
    isLoading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useGetTopCoursesQuery({ timeRange, limit: 5 });

  const {
    data: topAnnotators,
    isLoading: annotatorsLoading,
    error: annotatorsError,
    refetch: refetchAnnotators,
  } = useGetTopAnnotatorsQuery({ timeRange, limit: 5 });

  const {
    data: recentActivity,
    isLoading: activityListLoading,
    error: activityListError,
    refetch: refetchRecentActivity,
  } = useGetRecentActivityQuery({ limit: 5 });

  const [triggerExport, { isLoading: isExporting }] = useLazyExportAnalyticsQuery();

  // Check if using mock data
  const isUsingMockData = overviewError || (!overviewLoading && !overviewStats);

  // Get data with fallback to mocks
  const stats = useMemo(() => overviewStats || mockOverviewStats, [overviewStats]);
  const activity = useMemo(() => activityData || mockActivityData, [activityData]);
  const courses = useMemo(() => topCourses || mockTopCourses, [topCourses]);
  const annotators = useMemo(() => topAnnotators || mockTopAnnotators, [topAnnotators]);
  const activities = useMemo(() => recentActivity || mockRecentActivity, [recentActivity]);

  // Format overview stats for display
  const overviewCards = useMemo(() => [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: `${stats.totalUsersChange >= 0 ? '+' : ''}${stats.totalUsersChange}%`,
      trend: stats.totalUsersChange >= 0 ? "up" : "down",
      icon: Users,
      color: "cyan",
    },
    {
      label: "Active Courses",
      value: stats.activeCourses.toLocaleString(),
      change: `${stats.activeCoursesChange >= 0 ? '+' : ''}${stats.activeCoursesChange}`,
      trend: stats.activeCoursesChange >= 0 ? "up" : "down",
      icon: BookOpen,
      color: "teal",
    },
    {
      label: "Annotations Completed",
      value: stats.annotationsCompleted.toLocaleString(),
      change: `${stats.annotationsChange >= 0 ? '+' : ''}${stats.annotationsChange}%`,
      trend: stats.annotationsChange >= 0 ? "up" : "down",
      icon: ClipboardCheck,
      color: "emerald",
    },
    {
      label: "Images Processed",
      value: stats.imagesProcessed.toLocaleString(),
      change: `${stats.imagesChange >= 0 ? '+' : ''}${stats.imagesChange}%`,
      trend: stats.imagesChange >= 0 ? "up" : "down",
      icon: Image,
      color: "blue",
    },
  ], [stats]);

  const maxAnnotations = Math.max(...activity.map((d) => d.annotations));

  const handleRefreshAll = useCallback(() => {
    refetchOverview();
    refetchActivity();
    refetchCourses();
    refetchAnnotators();
    refetchRecentActivity();
  }, [refetchOverview, refetchActivity, refetchCourses, refetchAnnotators, refetchRecentActivity]);

  const handleExport = useCallback(async () => {
    try {
      const result = await triggerExport({ format: 'csv', timeRange });
      if (result.data) {
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  }, [triggerExport, timeRange]);

  const isLoading = overviewLoading || activityLoading || coursesLoading || annotatorsLoading;

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30">
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                Administration
              </p>
              <h1 className="text-4xl font-black text-[#E6EDF3] tracking-tight">Analytics Dashboard</h1>
            </div>
          </div>
          <p className="text-lg text-[#8B949E] font-medium mt-2">
            Platform performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#161B22] border-2 border-slate-700/50 rounded-xl p-1">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  timeRange === range
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-[#8B949E] hover:text-[#E6EDF3]"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="h-11 bg-[#0D1117] border-2 border-slate-700/50 text-[#8B949E] hover:text-cyan-400 hover:border-cyan-500/50 rounded-xl"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Button
            variant="ghost"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="h-11 text-[#8B949E] hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      {isUsingMockData && (
        <Alert className="mb-8 border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-transparent rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-400 text-sm font-medium">
            Demo mode: Backend unavailable. Showing sample analytics data.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {overviewLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-3 text-[#8B949E]">Loading analytics...</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {overviewCards.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend as "up" | "down"}
            color={stat.color}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#E6EDF3]">
                {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : timeRange === '90d' ? 'Quarterly' : 'Yearly'} Activity
              </h3>
              <p className="text-sm text-[#6E7681]">Annotations and active users</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600" />
                <span className="text-xs text-[#8B949E]">Annotations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-teal-600" />
                <span className="text-xs text-[#8B949E]">Users</span>
              </div>
            </div>
          </div>
          {activityLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="flex items-end gap-4 h-48">
              {activity.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end h-40">
                    <div
                      className="flex-1 bg-gradient-to-t from-cyan-500/80 to-cyan-400/60 rounded-t-lg transition-all hover:from-cyan-400 hover:to-cyan-300"
                      style={{ height: `${maxAnnotations > 0 ? (day.annotations / maxAnnotations) * 100 : 0}%` }}
                    />
                    <div
                      className="flex-1 bg-gradient-to-t from-teal-500/80 to-teal-400/60 rounded-t-lg transition-all hover:from-teal-400 hover:to-teal-300"
                      style={{ height: `${maxAnnotations > 0 ? (day.users / maxAnnotations) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#6E7681] font-medium">{day.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-[#E6EDF3]">Recent Activity</h3>
            <Activity className="h-5 w-5 text-[#6E7681]" />
          </div>
          {activityListLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activityItem) => (
                <div key={activityItem.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                    <span className="text-xs font-bold text-cyan-400">
                      {activityItem.user.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E6EDF3]">
                      <span className="font-semibold">{activityItem.user}</span>{" "}
                      <span className="text-[#8B949E]">{activityItem.action}</span>{" "}
                      <span className="text-cyan-400 font-medium">{activityItem.target}</span>
                    </p>
                    <p className="text-xs text-[#6E7681] flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {activityItem.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Courses */}
        <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                <GraduationCap className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-[#E6EDF3]">Top Courses</h3>
            </div>
          </div>
          {coursesLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, index) => (
                <div key={course.id} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-[#8B949E]">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#E6EDF3] truncate">{course.name}</p>
                    <div className="flex items-center gap-3 text-xs text-[#6E7681] mt-0.5">
                      <span>{course.enrollments} enrolled</span>
                      <span>•</span>
                      <span>{course.completion}% completion</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-semibold">{course.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Annotators */}
        <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-[#E6EDF3]">Top Annotators</h3>
            </div>
          </div>
          {annotatorsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {annotators.map((annotator, index) => (
                <div key={annotator.id} className="flex items-center gap-4">
                  <span className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-amber-500/20 text-amber-400" :
                    index === 1 ? "bg-slate-400/20 text-slate-300" :
                    index === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-slate-800 text-[#8B949E]"
                  )}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#E6EDF3] truncate">{annotator.name}</p>
                    <p className="text-xs text-[#6E7681] mt-0.5">
                      {annotator.annotations.toLocaleString()} annotations
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{annotator.accuracy}%</p>
                    <p className="text-xs text-[#6E7681]">accuracy</p>
                  </div>
                </div>
              ))}
            </div>
          )}        </div>
      </div>
    </div>
  );
}
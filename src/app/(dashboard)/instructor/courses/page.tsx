"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Users,
  Star,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  ChevronRight,
  Search,
  Filter,
  GraduationCap,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useGetInstructorCoursesQuery,
  useGetInstructorStatsQuery,
  useDeleteCourseMutation,
  type InstructorCourse,
  type InstructorStats,
} from "@/features/lms/lmsApi";

// Mock data for fallback when API is unavailable
const mockCourses: InstructorCourse[] = [
  {
    id: "1",
    title: "MRI Fundamentals for Beginners",
    description: "Introduction to MRI physics, protocols, and basic image interpretation",
    status: "published",
    enrollments: 245,
    rating: 4.8,
    reviews: 89,
    modules: 12,
    duration: "8 hours",
    lastUpdated: "2024-01-15",
    revenue: 12250,
  },
  {
    id: "2",
    title: "Advanced Cervical Imaging Techniques",
    description: "Deep dive into cervical spine pathology and advanced imaging protocols",
    status: "published",
    enrollments: 128,
    rating: 4.9,
    reviews: 42,
    modules: 8,
    duration: "6 hours",
    lastUpdated: "2024-01-10",
    revenue: 8960,
  },
  {
    id: "3",
    title: "Annotation Quality Standards",
    description: "Best practices for medical image annotation and quality assurance",
    status: "draft",
    enrollments: 0,
    rating: 0,
    reviews: 0,
    modules: 6,
    duration: "4 hours",
    lastUpdated: "2024-01-18",
    revenue: 0,
  },
];

const mockStats: InstructorStats = {
  totalCourses: 3,
  totalEnrollments: 373,
  averageRating: 4.85,
  totalRevenue: 21210,
};

// StatCard component
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  iconColor: string;
  accentColor: string;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl group">
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl", accentColor)} />
      <div className="flex items-center gap-5 pl-3">
        <div className={cn("p-4 rounded-xl bg-gradient-to-br shadow-lg", iconColor)}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-sm text-[#8B949E] font-medium uppercase tracking-wide">{label}</p>
          <p className="text-4xl font-black text-[#E6EDF3] tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-[#6E7681] mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

export default function InstructorCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // API calls with mock fallback
  const {
    data: apiCourses,
    isLoading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useGetInstructorCoursesQuery({ status: statusFilter });

  const {
    data: apiStats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetInstructorStatsQuery();

  const [deleteCourse] = useDeleteCourseMutation();

  // Use API data or fall back to mock
  const isUsingMockData = !!coursesError || !!statsError;
  const courses = coursesError ? mockCourses : (apiCourses || []);
  const stats = statsError ? mockStats : (apiStats || mockStats);
  const isLoading = coursesLoading || statsLoading;

  // Handle course deletion
  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteCourse(courseId).unwrap();
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      // When using API, status is already filtered server-side
      const matchesStatus = !isUsingMockData || statusFilter === "all" || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchQuery, statusFilter, isUsingMockData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
          <p className="text-[#8B949E]">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      {/* Demo Mode Notice */}
      {isUsingMockData && (
        <Alert className="bg-amber-500/10 border-amber-500/30 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200 flex items-center justify-between">
            <span>Demo mode: Showing sample courses. Connect backend for live data.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchCourses()}
              className="text-amber-400 hover:text-amber-300"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30">
              <GraduationCap className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-black text-[#E6EDF3] tracking-tight">Course Management</h1>
          </div>
          <p className="text-lg text-[#8B949E] font-medium">Create and manage your educational content</p>
        </div>
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-blue-500/25 h-12 px-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={stats.totalCourses}
          subtext="Active courses"
          iconColor="from-blue-500/40 to-blue-600/30"
          accentColor="bg-gradient-to-b from-blue-400 to-blue-600"
        />
        <StatCard
          icon={Users}
          label="Total Enrollments"
          value={stats.totalEnrollments}
          subtext="Students enrolled"
          iconColor="from-teal-500/40 to-teal-600/30"
          accentColor="bg-gradient-to-b from-teal-400 to-teal-600"
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={stats.averageRating.toFixed(2)}
          subtext="Out of 5.0"
          iconColor="from-amber-500/40 to-amber-600/30"
          accentColor="bg-gradient-to-b from-amber-400 to-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtext="Lifetime earnings"
          iconColor="from-emerald-500/40 to-emerald-600/30"
          accentColor="bg-gradient-to-b from-emerald-400 to-emerald-600"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E7681]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#161B22] border-2 border-slate-700/50 rounded-xl text-[#E6EDF3] placeholder-[#6E7681] focus:border-blue-500/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#6E7681]" />
          {["all", "published", "draft"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all text-sm capitalize",
                statusFilter === status
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-[#161B22] text-[#8B949E] border border-slate-700/50 hover:border-slate-600/60"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl group"
          >
            {/* Left accent bar */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl",
                course.status === "published"
                  ? "bg-gradient-to-b from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-b from-amber-400 to-amber-600"
              )}
            />

            <div className="flex items-center justify-between pl-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[#E6EDF3] group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold uppercase",
                      course.status === "published"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    )}
                  >
                    {course.status}
                  </span>
                </div>
                <p className="text-sm text-[#8B949E] mb-4 max-w-2xl">{course.description}</p>

                <div className="flex items-center gap-6 text-sm text-[#6E7681]">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {course.enrollments} enrolled
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {course.rating > 0 ? `${course.rating} (${course.reviews})` : "No ratings"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {course.modules} modules
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-blue-400 hover:bg-blue-500/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-teal-400 hover:bg-teal-500/10"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-amber-400 hover:bg-amber-500/10"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-rose-400 hover:bg-rose-500/10"
                  onClick={() => handleDelete(course.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Link href={`/instructor/courses/${course.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#8B949E] hover:text-[#E6EDF3]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-[#6E7681] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#E6EDF3] mb-2">No courses found</h3>
          <p className="text-[#8B949E]">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}

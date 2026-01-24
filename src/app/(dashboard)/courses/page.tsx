// @ts-nocheck
'use client';

/**
 * Learning Hub - Courses Page
 * Browse educational courses on medical imaging interpretation and annotation
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Clock,
  BookOpen,
  Star,
  ChevronRight,
  Play,
  Lock,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  mockCourses,
  learningPaths,
  type Course,
} from '@/lib/mock/learningData';
import {
  useGetCoursesQuery,
  useGetLearningPathsQuery,
  useGetContinueLearningQuery,
} from '@/features/lms';

type LevelFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Fetch data from backend
  const { data: coursesData, isLoading: coursesLoading, error: coursesError, refetch } = useGetCoursesQuery({
    search: searchTerm || undefined,
    level: levelFilter !== 'all' ? levelFilter : undefined,
    category: selectedPath || undefined,
  });
  const { data: pathsData } = useGetLearningPathsQuery();
  const { data: continueData } = useGetContinueLearningQuery();

  // Determine if using mock data
  const isUsingMockData = !!coursesError;
  
  // Use API data or fallback to mock - use any to handle type differences
  const courses = useMemo((): any[] => {
    if (coursesData?.items) return coursesData.items;
    return mockCourses;
  }, [coursesData]);

  const paths = useMemo(() => {
    if (pathsData) return pathsData;
    return learningPaths;
  }, [pathsData]);

  // Get enrolled courses for progress summary
  const enrolledCourses = courses.filter((c: any) => c.isEnrolled);
  const completedCourses = enrolledCourses.filter((c: any) => c.progress === 100);
  const totalHoursLearned = enrolledCourses.reduce((acc: number, c: any) => {
    const hours = parseInt(c.duration) || 0;
    return acc + (hours * (c.progress || 0) / 100);
  }, 0);

  // Get course to continue
  const continueCoursePick = continueData?.course || enrolledCourses.find((c: any) => c.progress && c.progress > 0 && c.progress < 100);

  // Filter courses (when using mock data, apply filters client-side)
  const filteredCourses = useMemo(() => {
    if (!isUsingMockData) return courses; // API handles filtering
    
    return courses.filter((course: any) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      const matchesPath = !selectedPath || course.category === selectedPath;
      return matchesSearch && matchesLevel && matchesPath;
    });
  }, [courses, searchTerm, levelFilter, selectedPath, isUsingMockData]);

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#0a1628] to-[#0D1117] p-6 lg:p-8">
      {/* Demo Mode Notice */}
      {isUsingMockData && (
        <Alert className="bg-amber-500/10 border-amber-500/30 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200 flex items-center justify-between">
            <span>Demo mode: Showing sample courses. Connect backend for live data.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-amber-400 hover:text-amber-300"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-5 bg-gradient-to-br from-blue-500/25 to-indigo-500/15 rounded-2xl border-2 border-blue-500/40 shadow-xl shadow-blue-500/20">
              <GraduationCap className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <p className="text-base font-bold text-blue-400 uppercase tracking-wider mb-1">
                Education
              </p>
              <h1 className="text-4xl lg:text-5xl font-black text-[#E6EDF3] tracking-tight">Learning Hub</h1>
              <p className="text-lg text-[#8B949E] mt-2">
                Master medical imaging annotation through expert-guided courses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-6 py-3 bg-gradient-to-br from-blue-500/15 to-indigo-500/10 rounded-2xl border-2 border-blue-500/30 shadow-lg">
              <p className="text-sm font-medium text-blue-300">Your Progress</p>
              <p className="text-3xl font-black text-blue-400">{completedCourses.length}/{enrolledCourses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary Bar */}
      <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-blue-500/40 p-8 mb-10 shadow-2xl shadow-blue-500/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-52 h-4 bg-[#21262D] rounded-full overflow-hidden border border-blue-500/20">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all shadow-lg shadow-blue-500/50"
                  style={{ width: `${(completedCourses.length / Math.max(enrolledCourses.length, 1)) * 100}%` }}
                />
              </div>
              <span className="text-lg text-[#E6EDF3] font-semibold">
                {completedCourses.length} of {enrolledCourses.length} courses completed
              </span>
            </div>
            <div className="h-8 w-px bg-blue-500/30" />
            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-500/15 to-indigo-500/10 rounded-xl border-2 border-blue-500/30">
              <Clock className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-bold text-blue-400">
                {Math.round(totalHoursLearned)} hrs learned
              </span>
            </div>
          </div>
          <Button variant="outline" size="lg" className="border-2 border-blue-500/40 text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 hover:border-blue-400/60 font-semibold text-base px-6">
            My Progress
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
          <h2 className="text-3xl font-bold text-[#E6EDF3] tracking-tight">Learning Paths</h2>
          <span className="text-base text-blue-400 bg-blue-500/15 px-4 py-1.5 rounded-full border border-blue-500/30 font-medium">Choose your focus</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {paths.map((path, index) => {
            const colors = [
              { border: 'border-blue-500/40', shadow: 'shadow-blue-500/25', bg: 'from-blue-500/20', hover: 'hover:border-blue-400/60', text: 'text-blue-400', accent: 'bg-gradient-to-b from-blue-400 to-blue-600' },
              { border: 'border-teal-500/40', shadow: 'shadow-teal-500/25', bg: 'from-teal-500/20', hover: 'hover:border-teal-400/60', text: 'text-teal-400', accent: 'bg-gradient-to-b from-teal-400 to-teal-600' },
              { border: 'border-cyan-500/40', shadow: 'shadow-cyan-500/25', bg: 'from-cyan-500/20', hover: 'hover:border-cyan-400/60', text: 'text-cyan-400', accent: 'bg-gradient-to-b from-cyan-400 to-cyan-600' },
              { border: 'border-sky-500/40', shadow: 'shadow-sky-500/25', bg: 'from-sky-500/20', hover: 'hover:border-sky-400/60', text: 'text-sky-400', accent: 'bg-gradient-to-b from-sky-400 to-sky-600' },
            ];
            const color = colors[index % colors.length];
            return (
              <button
                key={path.id}
                onClick={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
                className={cn(
                  "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.03] hover:shadow-2xl overflow-hidden",
                  "bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22]",
                  selectedPath === path.id
                    ? `bg-gradient-to-br ${color.bg} to-transparent ${color.border} ${color.shadow} shadow-xl`
                    : `${color.border} ${color.hover} ${color.shadow}`
                )}
              >
                {/* Left accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl", color.accent)} />
                <span className="text-5xl mb-4 block pl-2">{path.icon}</span>
                <h3 className={cn("font-bold text-xl mb-2 pl-2", selectedPath === path.id ? color.text : "text-[#E6EDF3]")}>{path.name}</h3>
                <p className="text-base text-[#8B949E] font-medium pl-2">{path.courseCount} courses</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Learning */}
      {continueCoursePick && (
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
            <h2 className="text-3xl font-bold text-[#E6EDF3] tracking-tight">Continue Learning</h2>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-transparent rounded-2xl border-2 border-blue-500/40 p-8 shadow-2xl shadow-blue-500/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-blue-500/25 to-indigo-500/15 rounded-xl border border-blue-500/30">
                  <Play className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-[#E6EDF3] mb-1">{continueCoursePick.title}</h3>
                  <p className="text-base text-[#8B949E]">
                    Module 3: White Matter Lesions &bull; <span className="text-blue-400 font-semibold">{continueCoursePick.progress}% complete</span>
                  </p>
                  <div className="w-64 h-2.5 bg-[#21262D] rounded-full mt-3 overflow-hidden border border-blue-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/50"
                      style={{ width: `${continueCoursePick.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <Link href={`/courses/${continueCoursePick.id}`}>
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold px-8 shadow-xl shadow-blue-500/25">
                  Continue Learning
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Course Catalog */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
            <h2 className="text-3xl font-bold text-[#E6EDF3] tracking-tight">Course Catalog</h2>
            <span className="text-base text-blue-400 bg-blue-500/15 px-4 py-1.5 rounded-full border border-blue-500/30 font-semibold">{filteredCourses.length} courses</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-80 h-12 border-2 border-blue-500/30 focus:border-blue-400/50 focus:ring-blue-500/50 text-base bg-[#161B22] rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-4 mb-10">
          <Filter className="h-5 w-5 text-blue-400" />
          {(['all', 'Beginner', 'Intermediate', 'Advanced'] as LevelFilter[]).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-base font-semibold transition-all border-2",
                levelFilter === level
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/15 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/20"
                  : "bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white hover:bg-[#30363D] hover:border-blue-500/30"
              )}
            >
              {level === 'all' ? 'All Levels' : level}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-[#30363D] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#E6EDF3]">No courses found</h3>
            <p className="text-sm text-[#8B949E] mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const hasPrerequisites = course.prerequisites && course.prerequisites.length > 0;
  const prerequisitesMet = !hasPrerequisites; // Simplified for demo

  const levelColors = {
    Beginner: { border: 'border-blue-500/40', shadow: 'hover:shadow-blue-500/25', hover: 'hover:border-blue-400/60', accent: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    Intermediate: { border: 'border-teal-500/40', shadow: 'hover:shadow-teal-500/25', hover: 'hover:border-teal-400/60', accent: 'bg-gradient-to-r from-teal-500 to-cyan-500' },
    Advanced: { border: 'border-emerald-500/40', shadow: 'hover:shadow-emerald-500/25', hover: 'hover:border-emerald-400/60', accent: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
  };
  const colorSet = levelColors[course.level as keyof typeof levelColors] || levelColors.Beginner;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group",
      "bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22]",
      colorSet.border,
      colorSet.shadow,
      colorSet.hover
    )}>
      {/* Colored accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1.5", colorSet.accent)} />
      
      {/* Course Thumbnail/Preview Area */}
      <div className="h-48 bg-gradient-to-br from-[#1a2035] via-[#21262D] to-[#161B22] flex items-center justify-center relative">
        <div className="text-6xl opacity-60">
          {course.category === 'neuro' ? '🧠' :
           course.category === 'msk' ? '🦴' :
           course.category === 'cardiac' ? '💗' :
           course.category === 'annotation' ? '✏️' : '📚'}
        </div>
        {course.isEnrolled && course.progress !== undefined && course.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#21262D]">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}
        {!prerequisitesMet && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock className="h-10 w-10 text-[#8B949E]" />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={cn(
            "px-3 py-1 rounded-lg text-sm font-semibold",
            course.level === 'Beginner' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            course.level === 'Intermediate' && "bg-teal-500/20 text-teal-400 border border-teal-500/30",
            course.level === 'Advanced' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          )}>
            {course.level}
          </span>
          {course.isEnrolled && (
            <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Enrolled
            </span>
          )}
        </div>

        <h3 className="font-bold text-lg text-[#E6EDF3] mb-2 group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-[#8B949E] line-clamp-2 mb-4">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-[#8B949E] mb-4">
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            {course.rating} ({course.ratingCount})
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {course.modules} modules
          </span>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-blue-500/20">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/20 flex items-center justify-center text-sm text-blue-400 font-semibold border border-blue-500/30">
            {course.instructor.charAt(0)}
          </div>
          <div className="text-sm">
            <span className="text-[#E6EDF3] font-medium">{course.instructor}</span>
            <span className="text-[#6E7681]"> &bull; {course.instructorTitle}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/courses/${course.id}`}>
          <Button
            size="lg"
            className={cn(
              "w-full h-12 text-base font-semibold",
              prerequisitesMet
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/25"
                : "bg-[#21262D] text-[#8B949E] cursor-not-allowed"
            )}
            disabled={!prerequisitesMet}
          >
            {!prerequisitesMet ? (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Complete Prerequisites
              </>
            ) : course.isEnrolled ? (
              <>
                <Play className="h-5 w-5 mr-2" />
                Continue Course
              </>
            ) : (
              'Start Course'
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}

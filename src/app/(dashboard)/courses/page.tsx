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
  Users,
  ChevronRight,
  Play,
  Lock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  mockCourses,
  learningPaths,
  type Course,
} from '@/lib/mock/learningData';

type LevelFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Get enrolled courses for progress summary
  const enrolledCourses = mockCourses.filter(c => c.isEnrolled);
  const completedCourses = enrolledCourses.filter(c => c.progress === 100);
  const totalHoursLearned = enrolledCourses.reduce((acc, c) => {
    const hours = parseInt(c.duration) || 0;
    return acc + (hours * (c.progress || 0) / 100);
  }, 0);

  // Get course to continue
  const continueCoursePick = enrolledCourses.find(c => c.progress && c.progress > 0 && c.progress < 100);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return mockCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      const matchesPath = !selectedPath || course.category === selectedPath;
      return matchesSearch && matchesLevel && matchesPath;
    });
  }, [searchTerm, levelFilter, selectedPath]);

  return (
    <div className="min-h-screen bg-[#0D1117] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E6EDF3]">Learning Hub</h1>
            <p className="text-sm text-[#8B949E]">
              Master medical imaging annotation through guided courses
            </p>
          </div>
        </div>
      </div>

      {/* Progress Summary Bar */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedCourses.length / Math.max(enrolledCourses.length, 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm text-[#8B949E]">
                {completedCourses.length} of {enrolledCourses.length} courses completed
              </span>
            </div>
            <div className="h-4 w-px bg-[#30363D]" />
            <span className="text-sm text-[#8B949E]">
              <Clock className="h-4 w-4 inline mr-1" />
              {Math.round(totalHoursLearned)} hrs learned
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-[#8B949E] hover:text-white">
            My Progress
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">Learning Paths</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {learningPaths.map((path) => (
            <button
              key={path.id}
              onClick={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
              className={cn(
                "p-4 rounded-lg border transition-all text-left",
                selectedPath === path.id
                  ? "bg-primary/10 border-primary"
                  : "bg-[#161B22] border-[#30363D] hover:border-[#58A6FF]/50"
              )}
            >
              <span className="text-2xl mb-2 block">{path.icon}</span>
              <h3 className="font-medium text-[#E6EDF3] mb-1">{path.name}</h3>
              <p className="text-xs text-[#8B949E]">{path.courseCount} courses</p>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Learning */}
      {continueCoursePick && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#E6EDF3] mb-4">Continue Learning</h2>
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg border border-primary/30 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#E6EDF3]">{continueCoursePick.title}</h3>
                  <p className="text-sm text-[#8B949E]">
                    Module 3: White Matter Lesions &bull; {continueCoursePick.progress}% complete
                  </p>
                  <div className="w-48 h-1.5 bg-[#21262D] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${continueCoursePick.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <Link href={`/courses/${continueCoursePick.id}`}>
                <Button className="bg-primary hover:bg-primary/90">
                  Continue Learning
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Course Catalog */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#E6EDF3]">Course Catalog</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E7681]" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 bg-[#0D1117] border-[#30363D] text-[#E6EDF3] placeholder:text-[#6E7681]"
              />
            </div>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-4 w-4 text-[#8B949E]" />
          {(['all', 'Beginner', 'Intermediate', 'Advanced'] as LevelFilter[]).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                levelFilter === level
                  ? "bg-primary text-white"
                  : "bg-[#21262D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
              )}
            >
              {level === 'all' ? 'All Levels' : level}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
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

  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] overflow-hidden hover:border-[#58A6FF]/50 transition-colors group">
      {/* Course Thumbnail/Preview Area */}
      <div className="h-36 bg-gradient-to-br from-[#21262D] to-[#161B22] flex items-center justify-center relative">
        <div className="text-4xl opacity-50">
          {course.category === 'neuro' ? '🧠' :
           course.category === 'msk' ? '🦴' :
           course.category === 'cardiac' ? '💗' :
           course.category === 'annotation' ? '✏️' : '📚'}
        </div>
        {course.isEnrolled && course.progress !== undefined && course.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#21262D]">
            <div
              className="h-full bg-primary"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}
        {!prerequisitesMet && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock className="h-8 w-8 text-[#8B949E]" />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            course.level === 'Beginner' && "bg-green-500/20 text-green-400",
            course.level === 'Intermediate' && "bg-yellow-500/20 text-yellow-400",
            course.level === 'Advanced' && "bg-red-500/20 text-red-400"
          )}>
            {course.level}
          </span>
          {course.isEnrolled && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
              Enrolled
            </span>
          )}
        </div>

        <h3 className="font-semibold text-[#E6EDF3] mb-1 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-[#8B949E] line-clamp-2 mb-3">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-[#8B949E] mb-3">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            {course.rating} ({course.ratingCount})
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {course.modules} modules
          </span>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#30363D]">
          <div className="w-6 h-6 rounded-full bg-[#30363D] flex items-center justify-center text-xs text-[#8B949E]">
            {course.instructor.charAt(0)}
          </div>
          <div className="text-xs">
            <span className="text-[#E6EDF3]">{course.instructor}</span>
            <span className="text-[#6E7681]"> &bull; {course.instructorTitle}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/courses/${course.id}`}>
          <Button
            className={cn(
              "w-full",
              prerequisitesMet
                ? "bg-primary hover:bg-primary/90"
                : "bg-[#21262D] text-[#8B949E] cursor-not-allowed"
            )}
            disabled={!prerequisitesMet}
          >
            {!prerequisitesMet ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Complete Prerequisites
              </>
            ) : course.isEnrolled ? (
              <>
                <Play className="h-4 w-4 mr-2" />
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

'use client';

/**
 * Course Detail Page
 * View course curriculum and start lessons
 */

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Star,
  Users,
  Play,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Pencil,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  mockCourses,
  mockModules,
  type Course,
  type Module,
  type Lesson,
} from '@/lib/mock/learningData';

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = use(params);
  const [expandedModules, setExpandedModules] = useState<string[]>(['mod-1', 'mod-2', 'mod-3']);

  const course = mockCourses.find(c => c.id === courseId);
  const modules = mockModules.filter(m => m.courseId === courseId);

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0D1117] p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#E6EDF3] mb-2">Course not found</h1>
          <Link href="/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter(l => l.isCompleted).length,
    0
  );

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Back Navigation */}
      <div className="border-b border-[#30363D] bg-[#161B22]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/courses"
            className="inline-flex items-center text-sm text-[#8B949E] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-[#161B22] border-b border-[#30363D]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-3">
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

              <h1 className="text-3xl font-bold text-[#E6EDF3] mb-3">{course.title}</h1>
              <p className="text-[#8B949E] mb-6">{course.description}</p>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#30363D] flex items-center justify-center text-lg text-[#8B949E]">
                  {course.instructor.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E6EDF3]">{course.instructor}</p>
                  <p className="text-xs text-[#8B949E]">{course.instructorTitle}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-[#8B949E]">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-[#E6EDF3] font-medium">{course.rating}</span>
                  ({course.ratingCount} ratings)
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.enrolledCount.toLocaleString()} enrolled
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
            </div>

            {/* Right: Action Card */}
            <div className="lg:col-span-2">
              <div className="bg-[#0D1117] rounded-lg border border-[#30363D] p-6">
                {course.isEnrolled && course.progress !== undefined ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[#8B949E]">Your Progress</span>
                        <span className="text-[#E6EDF3] font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#6E7681] mt-2">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 mb-3">
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Button>
                    <Button variant="outline" className="w-full border-[#30363D] text-[#8B949E] hover:text-white">
                      <Award className="h-4 w-4 mr-2" />
                      View Certificate
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#8B949E] mb-4">
                      Start learning today and master {course.title.toLowerCase()}.
                    </p>
                    <Button className="w-full bg-primary hover:bg-primary/90 mb-3">
                      Enroll Now - Free
                    </Button>
                    <p className="text-xs text-center text-[#6E7681]">
                      Full lifetime access
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Curriculum */}
          <div className="lg:col-span-2">
            {/* What You'll Learn */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#E6EDF3] mb-4">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-[#161B22] rounded-lg border border-[#30363D]"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#E6EDF3]">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div>
              <h2 className="text-xl font-semibold text-[#E6EDF3] mb-4">Curriculum</h2>
              <div className="space-y-3">
                {modules.length > 0 ? (
                  modules.map((module) => (
                    <ModuleAccordion
                      key={module.id}
                      module={module}
                      isExpanded={expandedModules.includes(module.id)}
                      onToggle={() => toggleModule(module.id)}
                    />
                  ))
                ) : (
                  // Placeholder modules for courses without detailed curriculum
                  Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-[#161B22] rounded-lg border border-[#30363D] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#21262D] flex items-center justify-center text-sm text-[#8B949E]">
                            {i + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-[#E6EDF3]">Module {i + 1}</h3>
                            <p className="text-xs text-[#8B949E]">Coming soon</p>
                          </div>
                        </div>
                        <Lock className="h-4 w-4 text-[#6E7681]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Course Includes */}
              <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-5">
                <h3 className="font-semibold text-[#E6EDF3] mb-4">This course includes:</h3>
                <ul className="space-y-3 text-sm text-[#8B949E]">
                  <li className="flex items-center gap-3">
                    <Play className="h-4 w-4 text-primary" />
                    {course.duration} of video content
                  </li>
                  <li className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {course.modules} comprehensive modules
                  </li>
                  <li className="flex items-center gap-3">
                    <Pencil className="h-4 w-4 text-primary" />
                    Hands-on annotation exercises
                  </li>
                  <li className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Quizzes after each module
                  </li>
                  <li className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-primary" />
                    Certificate of completion
                  </li>
                </ul>
              </div>

              {/* Prerequisites */}
              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-5">
                  <h3 className="font-semibold text-[#E6EDF3] mb-4">Prerequisites</h3>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq) => {
                      const prereqCourse = mockCourses.find(c => c.id === prereq);
                      return (
                        <li key={prereq}>
                          <Link
                            href={`/courses/${prereq}`}
                            className="flex items-center gap-2 text-sm text-[#58A6FF] hover:underline"
                          >
                            <BookOpen className="h-4 w-4" />
                            {prereqCourse?.title || prereq}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleAccordion({
  module,
  isExpanded,
  onToggle,
}: {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const completedCount = module.lessons.filter(l => l.isCompleted).length;
  const isComplete = completedCount === module.lessons.length;

  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[#21262D]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm",
            isComplete
              ? "bg-green-500/20 text-green-500"
              : module.isLocked
              ? "bg-[#21262D] text-[#6E7681]"
              : "bg-primary/20 text-primary"
          )}>
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : module.isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              module.order
            )}
          </div>
          <div className="text-left">
            <h3 className="font-medium text-[#E6EDF3]">{module.title}</h3>
            <p className="text-xs text-[#8B949E]">
              {completedCount}/{module.lessons.length} lessons
              {isComplete && ' - Completed'}
              {module.isLocked && ' - Locked'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-[#8B949E] transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-[#30363D]">
          {module.lessons.map((lesson) => (
            <LessonItem key={lesson.id} lesson={lesson} isLocked={module.isLocked} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonItem({ lesson, isLocked }: { lesson: Lesson; isLocked?: boolean }) {
  const getIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'practice':
        return <Pencil className="h-4 w-4" />;
      case 'reading':
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        "px-4 py-3 flex items-center justify-between border-b border-[#30363D] last:border-b-0",
        isLocked ? "opacity-50" : "hover:bg-[#21262D]/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-6 h-6 rounded flex items-center justify-center",
          lesson.isCompleted
            ? "bg-green-500/20 text-green-500"
            : "bg-[#21262D] text-[#8B949E]"
        )}>
          {lesson.isCompleted ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isLocked ? (
            <Lock className="h-3 w-3" />
          ) : (
            getIcon()
          )}
        </div>
        <div>
          <p className={cn(
            "text-sm",
            lesson.isCompleted ? "text-[#8B949E]" : "text-[#E6EDF3]"
          )}>
            {lesson.title}
          </p>
          <p className="text-xs text-[#6E7681]">
            {lesson.duration}
            {lesson.score !== undefined && ` - Score: ${lesson.score}%`}
          </p>
        </div>
      </div>
      {!isLocked && !lesson.isCompleted && (
        <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
          Start
        </Button>
      )}
    </div>
  );
}

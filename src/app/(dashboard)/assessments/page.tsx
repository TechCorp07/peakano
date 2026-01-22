'use client';

/**
 * Assessment Center Page
 * Track progress and take skill assessments
 */

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Trophy,
  Flame,
  Target,
  Clock,
  Lightbulb,
  Award,
  Zap,
  ClipboardCheck,
  Medal,
  ArrowRight,
  HelpCircle,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  mockAssessments,
  mockUserStats,
  type Assessment,
} from '@/lib/mock/learningData';
import {
  useGetAssessmentsQuery,
  useGetAssessmentStatsQuery,
} from '@/features/assessments';

type AssessmentFilter = 'all' | 'quick-practice' | 'skill-test' | 'certification';

export default function AssessmentsPage() {
  const [filter, setFilter] = useState<AssessmentFilter>('all');

  // Fetch data from backend
  const { data: assessmentsData, isLoading: assessmentsLoading, error: assessmentsError, refetch } = useGetAssessmentsQuery({
    type: filter !== 'all' ? filter : undefined,
  });
  const { data: statsData, isLoading: statsLoading } = useGetAssessmentStatsQuery();

  // Determine if using mock data
  const isUsingMockData = !!assessmentsError;
  const isLoading = assessmentsLoading || statsLoading;

  // Use API data or fallback to mock
  const assessments = useMemo(() => {
    if (assessmentsData?.assessments) return assessmentsData.assessments;
    return mockAssessments;
  }, [assessmentsData]);

  const userStats = useMemo(() => {
    if (statsData) return statsData;
    return mockUserStats;
  }, [statsData]);

  const filteredAssessments = useMemo(() => {
    if (!isUsingMockData) return assessments; // API handles filtering
    return filter === 'all'
      ? assessments
      : assessments.filter((a: Assessment) => a.type === filter);
  }, [assessments, filter, isUsingMockData]);

  const quickPractice = assessments.filter((a: Assessment) => a.type === 'quick-practice');
  const skillTests = assessments.filter((a: Assessment) => a.type === 'skill-test');
  const certifications = assessments.filter((a: Assessment) => a.type === 'certification');

  // Find the recommended assessment
  const recommendedAssessment = assessments.find((a: Assessment) => a.id === userStats.recommendedAssessment) ||
    assessments.find((a: Assessment) => a.bestScore && a.bestScore < 80 && !a.isCompleted);

  // Find skill that needs work
  const weakestSkill = [...userStats.skills].sort((a, b) => a.score - b.score)[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] p-6 lg:p-8">
      {/* Demo Mode Notice */}
      {isUsingMockData && (
        <Alert className="bg-amber-500/10 border-amber-500/30 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200 flex items-center justify-between">
            <span>Demo mode: Showing sample assessments. Connect backend for live data.</span>
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
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-slate-500/20 to-slate-600/10 rounded-2xl border border-slate-500/30 shadow-lg shadow-slate-500/10">
            <BarChart3 className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Progress Tracking
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#E6EDF3] tracking-tight">Assessment Center</h1>
            <p className="text-base text-[#8B949E] mt-1">
              Track your progress, certify your skills, and unlock achievements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center px-4 py-2 bg-[#161B22] rounded-xl border border-teal-500/20">
            <p className="text-2xl font-bold text-teal-400">{userStats.completedCount}</p>
            <p className="text-xs text-[#8B949E]">Completed</p>
          </div>
          <div className="text-center px-4 py-2 bg-[#161B22] rounded-xl border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">{userStats.streak}</p>
            <p className="text-xs text-[#8B949E]">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Skill Overview */}
      <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border-2 border-slate-500/30 p-8 mb-8 shadow-xl shadow-slate-500/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Overall Score */}
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg className="w-36 h-36 -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  stroke="#21262D"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${userStats.overallProficiency * 4.02} 402`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-teal-400">{userStats.overallProficiency}%</span>
                <span className="text-sm text-teal-300 font-medium">{userStats.level}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#E6EDF3] mb-4 tracking-tight">Overall Proficiency</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-base text-amber-400">
                  <Trophy className="h-5 w-5" />
                  <span className="font-medium">Rank: {userStats.rank}</span>
                </div>
                <div className="flex items-center gap-3 text-base text-orange-400">
                  <Flame className="h-5 w-5" />
                  <span className="font-medium">{userStats.streak} day streak</span>
                </div>
                <div className="flex items-center gap-3 text-base text-emerald-400">
                  <ClipboardCheck className="h-5 w-5" />
                  <span className="font-medium">{userStats.completedCount}/{userStats.totalCount} assessments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Skill Breakdown */}
          <div>
            <h3 className="text-base font-bold text-[#E6EDF3] mb-5 uppercase tracking-wide">Skill Breakdown</h3>
            <div className="space-y-4">
              {userStats.skills.map((skill, index) => {
                const barColors = [
                  "bg-gradient-to-r from-blue-500 to-blue-400",
                  "bg-gradient-to-r from-amber-500 to-orange-400",
                  "bg-gradient-to-r from-emerald-500 to-teal-400",
                  "bg-gradient-to-r from-cyan-500 to-sky-400",
                ];
                return (
                  <div key={skill.skill} className="flex items-center gap-4">
                    <span className="text-sm text-[#8B949E] w-36 truncate font-medium">{skill.skill}</span>
                    <div className="flex-1 h-3 bg-[#21262D] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          barColors[index % barColors.length]
                        )}
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                    <span className="text-base text-[#E6EDF3] font-bold w-12">{skill.score}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended For You */}
      {recommendedAssessment && weakestSkill && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent rounded-2xl border-2 border-amber-500/30 p-6 mb-8 shadow-xl shadow-amber-500/10">
          <div className="flex items-start gap-5">
            <div className="p-4 bg-gradient-to-br from-amber-500/30 to-orange-500/20 rounded-2xl border border-amber-500/30 shadow-lg">
              <Lightbulb className="h-7 w-7 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-400 mb-2 tracking-tight">Recommended for You</h3>
              <p className="text-base text-[#8B949E] mb-4">
                Based on your performance, we recommend improving your {weakestSkill.skill.toLowerCase()} skills.
              </p>
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-[#0D1117] to-[#161B22] rounded-xl border-2 border-amber-500/20 p-5 flex-1 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Target className="h-5 w-5 text-amber-400" />
                        <span className="font-bold text-lg text-[#E6EDF3]">{weakestSkill.skill} Practice</span>
                      </div>
                      <p className="text-sm text-[#8B949E]">
                        Your score: <span className="text-amber-400 font-semibold">{weakestSkill.score}%</span> &bull; Target: <span className="text-emerald-400 font-semibold">85%</span>
                      </p>
                    </div>
                    <Button size="default" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold px-6">
                      Start Practice
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 mb-8">
        {([
          { value: 'all', label: 'All', icon: null },
          { value: 'quick-practice', label: 'Quick Practice', icon: Zap },
          { value: 'skill-test', label: 'Skill Tests', icon: ClipboardCheck },
          { value: 'certification', label: 'Certifications', icon: Medal },
        ] as const).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-base font-semibold transition-all flex items-center gap-2 border-2",
              filter === tab.value
                ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                : "bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white hover:bg-[#30363D] hover:border-slate-500/50"
            )}
          >
            {tab.icon && <tab.icon className="h-5 w-5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assessment Sections */}
      {(filter === 'all' || filter === 'quick-practice') && quickPractice.length > 0 && (
        <AssessmentSection
          title="Quick Practice"
          subtitle="5-10 minute exercises"
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          assessments={filter === 'all' ? quickPractice : filteredAssessments.filter(a => a.type === 'quick-practice')}
          variant="grid"
        />
      )}

      {(filter === 'all' || filter === 'skill-test') && skillTests.length > 0 && (
        <AssessmentSection
          title="Skill Assessments"
          subtitle="20-30 minute comprehensive tests"
          icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
          assessments={filter === 'all' ? skillTests : filteredAssessments.filter(a => a.type === 'skill-test')}
          variant="list"
        />
      )}

      {(filter === 'all' || filter === 'certification') && certifications.length > 0 && (
        <AssessmentSection
          title="Certifications"
          subtitle="Official proficiency certification exams"
          icon={<Medal className="h-5 w-5 text-amber-500" />}
          assessments={filter === 'all' ? certifications : filteredAssessments.filter(a => a.type === 'certification')}
          variant="featured"
        />
      )}
    </div>
  );
}

function AssessmentSection({
  title,
  subtitle,
  icon,
  assessments,
  variant,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  assessments: Assessment[];
  variant: 'grid' | 'list' | 'featured';
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-1 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full" />
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#E6EDF3]">{title}</h2>
              <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-300 text-sm font-semibold rounded-full border border-slate-500/20">
                {assessments.length}
              </span>
            </div>
            <p className="text-sm text-[#8B949E]">{subtitle}</p>
          </div>
        </div>
      </div>

      {variant === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {assessments.map((assessment) => (
            <QuickPracticeCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <SkillTestCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      )}

      {variant === 'featured' && (
        <div className="space-y-5">
          {assessments.map((assessment) => (
            <CertificationCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickPracticeCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border-2 border-yellow-500/30 p-6 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all">
      {/* Accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-4 -mt-1" />
      <div className="text-4xl mb-4">{assessment.icon}</div>
      <h3 className="font-bold text-lg text-[#E6EDF3] mb-2">{assessment.title}</h3>
      <p className="text-sm text-[#8B949E] mb-4">{assessment.description}</p>

      <div className="flex items-center gap-4 text-sm text-[#8B949E] mb-4">
        {assessment.questionCount && (
          <span className="font-medium">{assessment.questionCount} questions</span>
        )}
        {assessment.caseCount && (
          <span className="font-medium">{assessment.caseCount} cases</span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          ~{assessment.duration}
        </span>
      </div>

      {assessment.bestScore !== undefined && assessment.bestScore > 0 && (
        <div className="text-sm text-[#8B949E] mb-4">
          Best: <span className="text-[#E6EDF3] font-bold">{assessment.bestScore}%</span>
        </div>
      )}

      <Button className="w-full h-11 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 hover:from-yellow-500/30 hover:to-amber-500/20 text-yellow-400 border border-yellow-500/30 text-base font-semibold">
        <Play className="h-5 w-5 mr-2" />
        Start
      </Button>
    </div>
  );
}

function SkillTestCard({ assessment }: { assessment: Assessment }) {
  const hasPassed = assessment.bestScore && assessment.passingScore && assessment.bestScore >= assessment.passingScore;
  const hasDicePassed = assessment.bestDice && assessment.passingDice && assessment.bestDice >= assessment.passingDice;

  return (
    <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border-2 border-slate-500/30 p-6 hover:border-slate-400/50 hover:shadow-xl hover:shadow-slate-500/10 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-[#E6EDF3]">{assessment.title}</h3>
            {(hasPassed || hasDicePassed) && (
              <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Passed
              </span>
            )}
          </div>
          <p className="text-base text-[#8B949E] mb-4">{assessment.description}</p>

          <div className="flex items-center gap-5 text-sm text-[#8B949E]">
            {assessment.caseCount && (
              <span className="flex items-center gap-1.5 font-medium">
                <HelpCircle className="h-4 w-4" />
                {assessment.caseCount} cases
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4" />
              {assessment.duration}
            </span>
            {assessment.passingScore && (
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="h-4 w-4" />
                Pass: {assessment.passingScore}%
              </span>
            )}
            {assessment.passingDice && (
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="h-4 w-4" />
                Dice {'>'} {assessment.passingDice}
              </span>
            )}
          </div>

          {(assessment.bestScore !== undefined && assessment.bestScore > 0) || assessment.bestDice ? (
            <div className="mt-4 pt-4 border-t border-slate-500/20">
              <div className="flex items-center gap-5 text-sm">
                {assessment.bestScore !== undefined && assessment.bestScore > 0 && (
                  <span className="text-[#8B949E]">
                    Your best: <span className="text-[#E6EDF3] font-bold">{assessment.bestScore}%</span>
                  </span>
                )}
                {assessment.bestDice && (
                  <span className="text-[#8B949E]">
                    Your best: <span className="text-[#E6EDF3] font-bold">{assessment.bestDice}</span>
                  </span>
                )}
                <span className="text-[#6E7681]">
                  Attempts: {assessment.attempts}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 ml-6">
          {assessment.attempts > 0 && (
            <Button variant="outline" size="default" className="border-slate-500/30 text-slate-300 hover:text-slate-200 hover:bg-slate-500/10">
              View Results
            </Button>
          )}
          <Button size="default" className="bg-teal-600 hover:bg-teal-500 text-white font-semibold">
            {assessment.attempts > 0 ? 'Retake' : 'Start'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CertificationCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border-2 border-amber-500/30 p-7 hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all">
      <div className="flex items-start gap-5">
        <div className="p-4 bg-gradient-to-br from-amber-500/30 to-orange-500/20 rounded-2xl border border-amber-500/40 shadow-lg">
          <Award className="h-10 w-10 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#E6EDF3] mb-2">{assessment.title}</h3>
          <p className="text-base text-[#8B949E] mb-5">{assessment.description}</p>

          <div className="flex items-center gap-6 text-base text-[#8B949E] mb-5">
            {assessment.questionCount && (
              <span className="font-medium">{assessment.questionCount} questions</span>
            )}
            {assessment.caseCount && (
              <span className="font-medium">{assessment.caseCount} annotation cases</span>
            )}
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-5 w-5" />
              {assessment.duration}
            </span>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-amber-500/20">
            <div className="text-base">
              {assessment.prerequisitesMet ? (
                <span className="text-green-400 flex items-center gap-2 font-medium">
                  <Award className="h-5 w-5" />
                  Prerequisites met
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-2 font-medium">
                  <HelpCircle className="h-5 w-5" />
                  Complete 3 skill assessments first
                </span>
              )}
            </div>
            <Button
              size="lg"
              className={cn(
                "font-bold px-6",
                assessment.prerequisitesMet
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20"
                  : "bg-[#21262D] text-[#6E7681] cursor-not-allowed"
              )}
              disabled={!assessment.prerequisitesMet}
            >
              Begin Certification Exam
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Assessment Center Page
 * Track progress and take skill assessments
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Trophy,
  Flame,
  Target,
  Clock,
  ChevronRight,
  Lightbulb,
  Award,
  Zap,
  ClipboardCheck,
  Medal,
  ArrowRight,
  HelpCircle,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  mockAssessments,
  mockUserStats,
  type Assessment,
} from '@/lib/mock/learningData';

type AssessmentFilter = 'all' | 'quick-practice' | 'skill-test' | 'certification';

export default function AssessmentsPage() {
  const [filter, setFilter] = useState<AssessmentFilter>('all');

  const filteredAssessments = filter === 'all'
    ? mockAssessments
    : mockAssessments.filter(a => a.type === filter);

  const quickPractice = mockAssessments.filter(a => a.type === 'quick-practice');
  const skillTests = mockAssessments.filter(a => a.type === 'skill-test');
  const certifications = mockAssessments.filter(a => a.type === 'certification');

  // Find the recommended assessment
  const recommendedAssessment = mockAssessments.find(a => a.id === mockUserStats.recommendedAssessment) ||
    mockAssessments.find(a => a.bestScore && a.bestScore < 80 && !a.isCompleted);

  // Find skill that needs work
  const weakestSkill = [...mockUserStats.skills].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="min-h-screen bg-[#0D1117] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E6EDF3]">Assessment Center</h1>
            <p className="text-sm text-[#8B949E]">
              Track your progress and certify your skills
            </p>
          </div>
        </div>
      </div>

      {/* Skill Overview */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Overall Score */}
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#21262D"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${mockUserStats.overallProficiency * 3.52} 352`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#58A6FF" />
                    <stop offset="100%" stopColor="#A371F7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#E6EDF3]">{mockUserStats.overallProficiency}%</span>
                <span className="text-xs text-[#8B949E]">{mockUserStats.level}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#E6EDF3] mb-3">Overall Proficiency</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Rank: {mockUserStats.rank}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {mockUserStats.streak} day streak
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <ClipboardCheck className="h-4 w-4 text-green-500" />
                  {mockUserStats.completedCount}/{mockUserStats.totalCount} assessments
                </div>
              </div>
            </div>
          </div>

          {/* Right: Skill Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-[#E6EDF3] mb-4">Skill Breakdown</h3>
            <div className="space-y-3">
              {mockUserStats.skills.map((skill) => (
                <div key={skill.skill} className="flex items-center gap-3">
                  <span className="text-sm text-[#8B949E] w-32 truncate">{skill.skill}</span>
                  <div className="flex-1 h-2 bg-[#21262D] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        skill.score >= 90 ? "bg-green-500" :
                        skill.score >= 75 ? "bg-primary" :
                        skill.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                  <span className="text-sm text-[#E6EDF3] font-mono w-10">{skill.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended For You */}
      {recommendedAssessment && weakestSkill && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/30 p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#E6EDF3] mb-1">Recommended for You</h3>
              <p className="text-sm text-[#8B949E] mb-3">
                Based on your performance, we recommend improving your {weakestSkill.skill.toLowerCase()} skills.
              </p>
              <div className="flex items-center gap-4">
                <div className="bg-[#0D1117] rounded-lg border border-[#30363D] p-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-medium text-[#E6EDF3]">{weakestSkill.skill} Practice</span>
                      </div>
                      <p className="text-xs text-[#8B949E]">
                        Your score: {weakestSkill.score}% &bull; Target: 85%
                      </p>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
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
      <div className="flex items-center gap-2 mb-6">
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
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              filter === tab.value
                ? "bg-primary text-white"
                : "bg-[#21262D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
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
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h2 className="text-lg font-semibold text-[#E6EDF3]">{title}</h2>
          <p className="text-xs text-[#8B949E]">{subtitle}</p>
        </div>
      </div>

      {variant === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessments.map((assessment) => (
            <QuickPracticeCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <SkillTestCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      )}

      {variant === 'featured' && (
        <div className="space-y-4">
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
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-5 hover:border-[#58A6FF]/50 transition-colors">
      <div className="text-3xl mb-3">{assessment.icon}</div>
      <h3 className="font-semibold text-[#E6EDF3] mb-1">{assessment.title}</h3>
      <p className="text-xs text-[#8B949E] mb-3">{assessment.description}</p>

      <div className="flex items-center gap-3 text-xs text-[#8B949E] mb-4">
        {assessment.questionCount && (
          <span>{assessment.questionCount} questions</span>
        )}
        {assessment.caseCount && (
          <span>{assessment.caseCount} cases</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ~{assessment.duration}
        </span>
      </div>

      {assessment.bestScore !== undefined && assessment.bestScore > 0 && (
        <div className="text-xs text-[#8B949E] mb-3">
          Best: <span className="text-[#E6EDF3] font-medium">{assessment.bestScore}%</span>
        </div>
      )}

      <Button className="w-full bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3]">
        <Play className="h-4 w-4 mr-2" />
        Start
      </Button>
    </div>
  );
}

function SkillTestCard({ assessment }: { assessment: Assessment }) {
  const hasPassed = assessment.bestScore && assessment.passingScore && assessment.bestScore >= assessment.passingScore;
  const hasDicePassed = assessment.bestDice && assessment.passingDice && assessment.bestDice >= assessment.passingDice;

  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-[#E6EDF3]">{assessment.title}</h3>
            {(hasPassed || hasDicePassed) && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-500">
                Passed
              </span>
            )}
          </div>
          <p className="text-sm text-[#8B949E] mb-3">{assessment.description}</p>

          <div className="flex items-center gap-4 text-xs text-[#8B949E]">
            {assessment.caseCount && (
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                {assessment.caseCount} cases
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {assessment.duration}
            </span>
            {assessment.passingScore && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                Pass: {assessment.passingScore}%
              </span>
            )}
            {assessment.passingDice && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                Dice {'>'} {assessment.passingDice}
              </span>
            )}
          </div>

          {(assessment.bestScore !== undefined && assessment.bestScore > 0) || assessment.bestDice ? (
            <div className="mt-3 pt-3 border-t border-[#30363D]">
              <div className="flex items-center gap-4 text-xs">
                {assessment.bestScore !== undefined && assessment.bestScore > 0 && (
                  <span className="text-[#8B949E]">
                    Your best: <span className="text-[#E6EDF3] font-medium">{assessment.bestScore}%</span>
                  </span>
                )}
                {assessment.bestDice && (
                  <span className="text-[#8B949E]">
                    Your best: <span className="text-[#E6EDF3] font-medium">{assessment.bestDice}</span>
                  </span>
                )}
                <span className="text-[#6E7681]">
                  Attempts: {assessment.attempts}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {assessment.attempts > 0 && (
            <Button variant="outline" size="sm" className="border-[#30363D] text-[#8B949E] hover:text-white">
              View Results
            </Button>
          )}
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            {assessment.attempts > 0 ? 'Retake' : 'Start'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CertificationCard({ assessment }: { assessment: Assessment }) {
  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
          <Award className="h-8 w-8 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#E6EDF3] mb-1">{assessment.title}</h3>
          <p className="text-sm text-[#8B949E] mb-4">{assessment.description}</p>

          <div className="flex items-center gap-6 text-sm text-[#8B949E] mb-4">
            {assessment.questionCount && (
              <span>{assessment.questionCount} questions</span>
            )}
            {assessment.caseCount && (
              <span>{assessment.caseCount} annotation cases</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {assessment.duration}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#30363D]">
            <div className="text-sm">
              {assessment.prerequisitesMet ? (
                <span className="text-green-500 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Prerequisites met
                </span>
              ) : (
                <span className="text-yellow-500 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Complete 3 skill assessments first
                </span>
              )}
            </div>
            <Button
              className={cn(
                assessment.prerequisitesMet
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  : "bg-[#21262D] text-[#6E7681] cursor-not-allowed"
              )}
              disabled={!assessment.prerequisitesMet}
            >
              Begin Certification Exam
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

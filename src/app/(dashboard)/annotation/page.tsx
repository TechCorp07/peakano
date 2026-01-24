'use client';

/**
 * Annotation Workflow Hub
 * Manage annotation tasks and track work progress
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Clock,
  Calendar,
  AlertCircle,
  ChevronRight,
  Play,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  Filter,
  User,
  FileText,
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  useGetAnnotationTasksQuery,
  useGetAnnotationStatsQuery,
  type AnnotationTask,
} from '@/features/annotationTasks';
import {
  mockAnnotationTasks,
  mockAnnotationStats,
} from '@/lib/mock/learningData';

type StatusFilter = 'all' | 'pending' | 'in-progress' | 'submitted' | 'approved' | 'rejected';
type PriorityFilter = 'all' | 'urgent' | 'normal' | 'low';

export default function AnnotationPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  // Fetch annotation tasks and stats from API
  const { 
    data: tasksData, 
    isLoading: tasksLoading, 
    error: tasksError,
    refetch: refetchTasks 
  } = useGetAnnotationTasksQuery({});
  
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetAnnotationStatsQuery();

  // Check if using mock data (API not available)
  const isUsingMockData = !!tasksError || !!statsError;

  // Use API data with fallback to mock data
  const allTasks = useMemo(() => {
    if (tasksData?.items) {
      return tasksData.items;
    }
    return mockAnnotationTasks;
  }, [tasksData]);

  const annotationStats = useMemo(() => {
    if (statsData) {
      return statsData;
    }
    return mockAnnotationStats;
  }, [statsData]);

  // Derived data
  const continueTask = useMemo(() => {
    return allTasks.find(task => task.status === 'in-progress');
  }, [allTasks]);

  const urgentTasks = useMemo(() => {
    return allTasks.filter(task => task.priority === 'urgent' && task.status === 'pending');
  }, [allTasks]);

  const tasksNeedingAttention = useMemo(() => {
    return allTasks.filter(task => task.status === 'rejected');
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [allTasks, statusFilter, priorityFilter]);

  const isLoading = tasksLoading || statsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-[#8B949E] text-lg">Loading annotation tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] p-6 lg:p-8">
      {/* Demo Mode Notice */}
      {isUsingMockData && (
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200 flex items-center justify-between">
            <span>Running in demo mode with sample data. Connect the backend for live data.</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetchTasks()}
              className="text-amber-500 hover:text-amber-400"
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
            <Pencil className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Workflow
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#E6EDF3] tracking-tight">Annotation Workspace</h1>
            <p className="text-base text-[#8B949E] mt-1">
              Your assigned cases and annotation tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-500/30 text-slate-300 hover:text-slate-200 hover:bg-slate-500/10 hover:border-slate-400/50">
            <BarChart3 className="h-4 w-4 mr-2" />
            My Stats
          </Button>
          <Button variant="outline" className="border-slate-500/30 text-slate-300 hover:text-slate-200 hover:bg-slate-500/10 hover:border-slate-400/50">
            Team View
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Pending"
          value={annotationStats.pending}
          sublabel="cases awaiting"
          color="text-amber-400"
          bgColor="bg-gradient-to-br from-amber-500/20 to-amber-600/10"
          borderColor="border-2 border-amber-500/40"
          glowColor="hover:shadow-amber-500/30"
        />
        <StatCard
          label="In Progress"
          value={annotationStats.inProgress}
          sublabel="active cases"
          color="text-blue-400"
          bgColor="bg-gradient-to-br from-blue-500/20 to-blue-600/10"
          borderColor="border-2 border-blue-500/40"
          glowColor="hover:shadow-blue-500/30"
        />
        <StatCard
          label="Submitted"
          value={annotationStats.submitted}
          sublabel="awaiting review"
          color="text-teal-400"
          bgColor="bg-gradient-to-br from-teal-500/20 to-teal-600/10"
          borderColor="border-2 border-teal-500/40"
          glowColor="hover:shadow-teal-500/30"
        />
        <StatCard
          label="Approved"
          value={annotationStats.approved}
          sublabel="this month"
          color="text-emerald-400"
          bgColor="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10"
          borderColor="border-2 border-emerald-500/40"
          glowColor="hover:shadow-emerald-500/30"
        />
      </div>

      {/* Continue Where You Left Off */}
      {continueTask && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-blue-400 rounded-full" />
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-[#E6EDF3] tracking-tight">Continue Where You Left Off</h2>
          </div>
          <div className="bg-gradient-to-r from-primary/15 via-blue-500/10 to-transparent rounded-2xl border-2 border-primary/40 p-6 shadow-xl shadow-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-[#21262D] flex items-center justify-center">
                  <FileText className="h-8 w-8 text-[#8B949E]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-[#8B949E]">{continueTask.caseId}</span>
                    <span className="text-[#6E7681]">&bull;</span>
                    <span className="text-sm text-[#E6EDF3]">{continueTask.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#8B949E]">
                    <span>Progress: {continueTask.progress}%</span>
                    <span>({Math.round((continueTask.progress || 0) / 100 * (continueTask.sliceCount || 0))}/{continueTask.sliceCount} slices)</span>
                    <span className="text-[#6E7681]">&bull;</span>
                    <span>Last edited: {continueTask.lastEdited}</span>
                  </div>
                  <div className="w-48 h-1.5 bg-[#21262D] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${continueTask.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <Link href={`/viewer/${continueTask.studyInstanceUID || continueTask.caseId}`}>
                <Button className="bg-primary hover:bg-primary/90">
                  Resume Annotation
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-rose-500 rounded-full" />
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-bold text-red-400 tracking-tight">Urgent Tasks</h2>
            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-sm font-semibold rounded-full border border-red-500/30">{urgentTasks.length} urgent</span>
          </div>
          <div className="space-y-4">
            {urgentTasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="urgent" />
            ))}
          </div>
        </div>
      )}

      {/* Needs Attention (Rejected) */}
      {tasksNeedingAttention.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-400 tracking-tight">Needs Attention</h2>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-semibold rounded-full border border-amber-500/30">{tasksNeedingAttention.length} returned</span>
          </div>
          <div className="space-y-4">
            {tasksNeedingAttention.map((task) => (
              <TaskCard key={task.id} task={task} variant="rejected" showFeedback />
            ))}
          </div>
        </div>
      )}

      {/* Task Queue */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full" />
            <h2 className="text-2xl font-bold text-[#E6EDF3] tracking-tight">My Task Queue</h2>
            <span className="px-3 py-1 bg-slate-500/10 text-slate-300 text-sm font-semibold rounded-full border border-slate-500/20">{filteredTasks.length} tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 px-3 rounded-lg border border-slate-500/30 bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-400/50 hover:border-slate-400/40 transition-all cursor-pointer"
            >
              <option value="all" className="bg-[#161B22]">All Status</option>
              <option value="pending" className="bg-[#161B22]">Pending</option>
              <option value="in-progress" className="bg-[#161B22]">In Progress</option>
              <option value="submitted" className="bg-[#161B22]">Submitted</option>
              <option value="approved" className="bg-[#161B22]">Approved</option>
              <option value="rejected" className="bg-[#161B22]">Rejected</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="h-10 px-3 rounded-lg border border-slate-500/30 bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-400/50 hover:border-slate-400/40 transition-all cursor-pointer"
            >
              <option value="all" className="bg-[#161B22]">All Priority</option>
              <option value="urgent" className="bg-[#161B22]">Urgent</option>
              <option value="normal" className="bg-[#161B22]">Normal</option>
              <option value="low" className="bg-[#161B22]">Low</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-xl border border-slate-500/20 overflow-hidden shadow-lg shadow-slate-500/5">
          {filteredTasks.length > 0 ? (
            <div className="divide-y divide-[#30363D]">
              {filteredTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-[#30363D] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#E6EDF3]">No tasks found</h3>
              <p className="text-sm text-[#8B949E] mt-1">
                {statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No annotation tasks assigned yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  color,
  bgColor,
  borderColor,
  glowColor,
}: {
  label: string;
  value: number;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
      bgColor,
      borderColor,
      glowColor
    )}>
      {/* Colored accent line at top */}
      <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", color.replace('text-', 'from-').replace('400', '500'), color.replace('text-', 'to-').replace('400', '600'))} />
      <p className="text-sm text-[#E6EDF3] font-bold uppercase tracking-wider mb-2">{label}</p>
      <p className={cn("text-5xl font-black tracking-tight", color)}>{value}</p>
      <p className="text-base text-[#8B949E] mt-2 font-medium">{sublabel}</p>
    </div>
  );
}

function TaskCard({
  task,
  variant = 'default',
  showFeedback = false,
}: {
  task: AnnotationTask;
  variant?: 'default' | 'urgent' | 'rejected';
  showFeedback?: boolean;
}) {
  const borderColor = variant === 'urgent' ? 'border-red-500/50' : variant === 'rejected' ? 'border-yellow-500/50' : 'border-[#30363D]';
  const bgGradient = variant === 'urgent' ? 'from-red-500/5' : variant === 'rejected' ? 'from-yellow-500/5' : 'from-transparent';

  return (
    <div className={cn(
      "bg-gradient-to-r to-[#161B22] rounded-lg border p-5",
      bgGradient,
      borderColor
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-[#21262D] flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-[#8B949E]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-[#8B949E]">{task.caseId}</span>
              <PriorityBadge priority={task.priority} />
            </div>
            <h3 className="font-medium text-[#E6EDF3] mb-2">{task.title}</h3>
            <div className="flex items-center gap-4 text-xs text-[#8B949E]">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Est: {task.estimatedTime}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due: {formatDeadline(task.deadline)}
              </span>
              {task.assignedBy && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {task.assignedBy}
                </span>
              )}
            </div>
            {showFeedback && task.feedback && (
              <div className="mt-3 p-3 bg-[#21262D] rounded-lg border border-yellow-500/30">
                <p className="text-xs text-yellow-500 font-medium mb-1">Reviewer Feedback:</p>
                <p className="text-sm text-[#E6EDF3]">{task.feedback}</p>
              </div>
            )}
          </div>
        </div>
        <Link href={`/viewer/${task.studyInstanceUID || task.caseId}`}>
          <Button className={cn(
            variant === 'urgent'
              ? "bg-red-500 hover:bg-red-600"
              : variant === 'rejected'
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-primary hover:bg-primary/90"
          )}>
            {variant === 'rejected' ? 'View Feedback & Revise' : 'Start Annotation'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: AnnotationTask }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between hover:bg-[#21262D]/50 transition-colors">
      <div className="flex items-center gap-4">
        <StatusIcon status={task.status} />
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs text-[#6E7681]">{task.caseId}</span>
            <PriorityBadge priority={task.priority} size="sm" />
            <StatusBadge status={task.status} />
          </div>
          <p className="text-sm text-[#E6EDF3]">{task.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right text-xs">
          <p className="text-[#8B949E]">
            <Clock className="h-3 w-3 inline mr-1" />
            {task.estimatedTime}
          </p>
          <p className="text-[#6E7681]">
            Due: {formatDeadline(task.deadline)}
          </p>
        </div>
        <Link href={`/viewer/${task.studyInstanceUID || task.caseId}`}>
          <Button size="sm" variant="outline" className="border-[#30363D] text-[#8B949E] hover:text-white">
            {task.status === 'pending' ? 'Start' :
             task.status === 'in-progress' ? 'Continue' :
             task.status === 'rejected' ? 'Revise' : 'View'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: AnnotationTask['status'] }) {
  switch (status) {
    case 'pending':
      return <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <Clock className="h-4 w-4 text-yellow-500" />
      </div>;
    case 'in-progress':
      return <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
        <Play className="h-4 w-4 text-blue-500" />
      </div>;
    case 'submitted':
      return <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
        <Send className="h-4 w-4 text-purple-500" />
      </div>;
    case 'under-review':
      return <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
        <Eye className="h-4 w-4 text-purple-500" />
      </div>;
    case 'approved':
      return <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </div>;
    case 'rejected':
      return <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
        <XCircle className="h-4 w-4 text-red-500" />
      </div>;
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: AnnotationTask['status'] }) {
  const config = {
    'pending': { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-500/20 text-blue-500' },
    'submitted': { label: 'Submitted', color: 'bg-purple-500/20 text-purple-500' },
    'under-review': { label: 'Under Review', color: 'bg-purple-500/20 text-purple-500' },
    'approved': { label: 'Approved', color: 'bg-green-500/20 text-green-500' },
    'rejected': { label: 'Needs Revision', color: 'bg-red-500/20 text-red-500' },
  };

  const { label, color } = config[status];

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", color)}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority, size = 'default' }: { priority: AnnotationTask['priority']; size?: 'sm' | 'default' }) {
  const config = {
    'urgent': { label: 'Urgent', color: 'bg-red-500/20 text-red-500' },
    'normal': { label: 'Normal', color: 'bg-[#21262D] text-[#8B949E]' },
    'low': { label: 'Low', color: 'bg-green-500/20 text-green-500' },
  };

  const { label, color } = config[priority];

  if (priority === 'normal' && size === 'sm') return null;

  return (
    <span className={cn(
      "rounded font-medium",
      size === 'sm' ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
      color
    )}>
      {priority === 'urgent' ? '!!' : ''} {label}
    </span>
  );
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours || minutes) {
      return `Today, ${hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    }
    return 'Today';
  }
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  mockAnnotationTasks,
  mockAnnotationStats,
  getContinueTask,
  getUrgentTasks,
  getTasksNeedingAttention,
  type AnnotationTask,
} from '@/lib/mock/learningData';

type StatusFilter = 'all' | 'pending' | 'in-progress' | 'submitted' | 'approved' | 'rejected';
type PriorityFilter = 'all' | 'urgent' | 'normal' | 'low';

export default function AnnotationPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const continueTask = getContinueTask();
  const urgentTasks = getUrgentTasks();
  const tasksNeedingAttention = getTasksNeedingAttention();

  const filteredTasks = useMemo(() => {
    return mockAnnotationTasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [statusFilter, priorityFilter]);

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');

  return (
    <div className="min-h-screen bg-[#0D1117] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Pencil className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E6EDF3]">Annotation Workspace</h1>
            <p className="text-sm text-[#8B949E]">
              Your assigned cases and annotation tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-[#30363D] text-[#8B949E] hover:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            My Stats
          </Button>
          <Button variant="outline" className="border-[#30363D] text-[#8B949E] hover:text-white">
            Team View
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pending"
          value={mockAnnotationStats.pending}
          sublabel="cases"
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          label="In Progress"
          value={mockAnnotationStats.inProgress}
          sublabel="cases"
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          label="Submitted"
          value={mockAnnotationStats.submitted}
          sublabel="awaiting review"
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          label="Approved"
          value={mockAnnotationStats.approved}
          sublabel="this month"
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
      </div>

      {/* Continue Where You Left Off */}
      {continueTask && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Continue Where You Left Off
          </h2>
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg border border-primary/30 p-5">
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
              <Link href={`/viewer/${continueTask.caseId}`}>
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
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Urgent
          </h2>
          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <TaskCard key={task.id} task={task} variant="urgent" />
            ))}
          </div>
        </div>
      )}

      {/* Needs Attention (Rejected) */}
      {tasksNeedingAttention.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-yellow-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Needs Attention ({tasksNeedingAttention.length} returned for revision)
          </h2>
          <div className="space-y-3">
            {tasksNeedingAttention.map((task) => (
              <TaskCard key={task.id} task={task} variant="rejected" showFeedback />
            ))}
          </div>
        </div>
      )}

      {/* Task Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#E6EDF3]">My Task Queue</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#8B949E]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-[#21262D] border border-[#30363D] rounded-md px-3 py-1.5 text-sm text-[#E6EDF3] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="bg-[#21262D] border border-[#30363D] rounded-md px-3 py-1.5 text-sm text-[#E6EDF3] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-[#161B22] rounded-lg border border-[#30363D] overflow-hidden">
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
}: {
  label: string;
  value: number;
  sublabel: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={cn("rounded-lg p-4", bgColor)}>
      <p className="text-xs text-[#8B949E] mb-1">{label}</p>
      <p className={cn("text-3xl font-bold", color)}>{value}</p>
      <p className="text-xs text-[#8B949E]">{sublabel}</p>
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
        <Link href={`/viewer/${task.caseId}`}>
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
        <Link href={`/viewer/${task.caseId}`}>
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

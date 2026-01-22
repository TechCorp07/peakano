"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  User,
  Calendar,
  Image,
  Filter,
  Search,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useGetReviewQueueQuery,
  useGetReviewStatsQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
  useRequestRevisionMutation,
  type ReviewItem,
} from "@/features/annotationTasks";

// Mock data for fallback when API is unavailable
const mockReviewQueue: ReviewItem[] = [
  {
    id: "1",
    studyId: "MRI-2024-001",
    annotator: "Dr. Sarah Chen",
    submittedAt: "2024-01-18T14:30:00",
    modality: "MR",
    bodyPart: "Cervical Spine",
    annotationCount: 12,
    status: "pending",
    priority: "high",
    estimatedTime: "15 min",
  },
  {
    id: "2",
    studyId: "MRI-2024-002",
    annotator: "Dr. James Wilson",
    submittedAt: "2024-01-18T12:15:00",
    modality: "MR",
    bodyPart: "Lumbar Spine",
    annotationCount: 8,
    status: "pending",
    priority: "normal",
    estimatedTime: "10 min",
  },
  {
    id: "3",
    studyId: "MRI-2024-003",
    annotator: "Dr. Emily Park",
    submittedAt: "2024-01-18T10:00:00",
    modality: "MR",
    bodyPart: "Uterus",
    annotationCount: 15,
    status: "in_review",
    priority: "high",
    estimatedTime: "20 min",
  },
  {
    id: "4",
    studyId: "CT-2024-001",
    annotator: "Dr. Michael Brown",
    submittedAt: "2024-01-17T16:45:00",
    modality: "CT",
    bodyPart: "Abdomen",
    annotationCount: 6,
    status: "pending",
    priority: "low",
    estimatedTime: "8 min",
  },
];

const mockStats = {
  pendingReviews: 12,
  inReview: 3,
  approvedToday: 28,
  rejectedToday: 4,
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

export default function InstructorReviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "normal" | "low">("all");

  // Fetch data from API
  const { 
    data: queueData, 
    isLoading: queueLoading, 
    error: queueError,
    refetch: refetchQueue 
  } = useGetReviewQueueQuery({});
  
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetReviewStatsQuery();

  // Mutations
  const [approveReview] = useApproveReviewMutation();
  const [rejectReview] = useRejectReviewMutation();
  const [requestRevision] = useRequestRevisionMutation();

  // Check if using mock data
  const isUsingMockData = !!queueError || !!statsError;

  // Use API data with fallback to mock data
  const reviewQueue = useMemo(() => {
    if (queueData?.items) {
      return queueData.items;
    }
    return mockReviewQueue;
  }, [queueData]);

  const stats = useMemo(() => {
    if (statsData) {
      return statsData;
    }
    return mockStats;
  }, [statsData]);

  const filteredQueue = useMemo(() => {
    return reviewQueue.filter((item) => {
      const matchesSearch =
        item.studyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.annotator.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [reviewQueue, searchQuery, priorityFilter]);

  const isLoading = queueLoading || statsLoading;

  // Action handlers
  const handleApprove = async (reviewId: string) => {
    try {
      await approveReview({ reviewId }).unwrap();
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await rejectReview({ reviewId, reason: 'Needs improvement' }).unwrap();
    } catch (error) {
      console.error('Failed to reject review:', error);
    }
  };

  const handleRequestRevision = async (reviewId: string) => {
    try {
      await requestRevision({ reviewId, feedback: 'Please review and revise' }).unwrap();
    } catch (error) {
      console.error('Failed to request revision:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-teal-400 animate-spin" />
          <p className="text-[#8B949E] text-lg">Loading review queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      {/* Demo Mode Notice */}
      {isUsingMockData && (
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200 flex items-center justify-between">
            <span>Running in demo mode with sample data. Connect the backend for live data.</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetchQueue()}
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
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border border-teal-500/30">
              <ClipboardCheck className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="text-4xl font-black text-[#E6EDF3] tracking-tight">Annotation Review</h1>
          </div>
          <p className="text-lg text-[#8B949E] font-medium">Review and approve submitted annotations</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={stats.pendingReviews}
          subtext="Awaiting your review"
          iconColor="from-amber-500/40 to-amber-600/30"
          accentColor="bg-gradient-to-b from-amber-400 to-amber-600"
        />
        <StatCard
          icon={Eye}
          label="In Review"
          value={stats.inReview}
          subtext="Currently reviewing"
          iconColor="from-blue-500/40 to-blue-600/30"
          accentColor="bg-gradient-to-b from-blue-400 to-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved Today"
          value={stats.approvedToday}
          subtext="Successfully approved"
          iconColor="from-emerald-500/40 to-emerald-600/30"
          accentColor="bg-gradient-to-b from-emerald-400 to-emerald-600"
        />
        <StatCard
          icon={XCircle}
          label="Rejected Today"
          value={stats.rejectedToday}
          subtext="Needs revision"
          iconColor="from-rose-500/40 to-rose-600/30"
          accentColor="bg-gradient-to-b from-rose-400 to-rose-600"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E7681]" />
          <input
            type="text"
            placeholder="Search by study ID or annotator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#161B22] border-2 border-slate-700/50 rounded-xl text-[#E6EDF3] placeholder-[#6E7681] focus:border-teal-500/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#6E7681]" />
          {["all", "high", "normal", "low"].map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority as typeof priorityFilter)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all text-sm capitalize",
                priorityFilter === priority
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : "bg-[#161B22] text-[#8B949E] border border-slate-700/50 hover:border-slate-600/60"
              )}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Review Queue */}
      <div className="space-y-4">
        {filteredQueue.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl group"
          >
            {/* Left accent bar - color based on priority */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl",
                item.priority === "high"
                  ? "bg-gradient-to-b from-rose-400 to-rose-600"
                  : item.priority === "normal"
                  ? "bg-gradient-to-b from-blue-400 to-blue-600"
                  : "bg-gradient-to-b from-slate-400 to-slate-600"
              )}
            />

            <div className="flex items-center justify-between pl-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[#E6EDF3] group-hover:text-teal-400 transition-colors">
                    {item.studyId}
                  </h3>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold uppercase",
                      item.status === "pending"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    )}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold uppercase",
                      item.priority === "high"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : item.priority === "normal"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                    )}
                  >
                    {item.priority} priority
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-[#6E7681] mb-3">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {item.annotator}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(item.submittedAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Image className="h-4 w-4" />
                    {item.modality} - {item.bodyPart}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ClipboardCheck className="h-4 w-4" />
                    {item.annotationCount} annotations
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    ~{item.estimatedTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-emerald-400 hover:bg-emerald-500/10"
                  title="Approve"
                  onClick={() => handleApprove(item.id)}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-rose-400 hover:bg-rose-500/10"
                  title="Reject"
                  onClick={() => handleReject(item.id)}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-amber-400 hover:bg-amber-500/10"
                  title="Request Revision"
                  onClick={() => handleRequestRevision(item.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8B949E] hover:text-blue-400 hover:bg-blue-500/10"
                  title="Add Comment"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Link href={`/viewer?study=${item.studyId}&review=true`}>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-teal-500/25"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQueue.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#E6EDF3] mb-2">All caught up!</h3>
          <p className="text-[#8B949E]">No pending reviews match your criteria</p>
        </div>
      )}
    </div>
  );
}

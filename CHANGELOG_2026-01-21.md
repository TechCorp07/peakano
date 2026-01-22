# PeakPoint Annotation Platform - Changelog

**Date:** January 21, 2026  
**Session:** Backend API Integration for All Pages

---

## Summary

Connected all remaining frontend pages to backend APIs with mock data fallback pattern. Created new annotation tasks API for annotation workflow and review management.

---

## New Files Created

### 1. `src/features/annotationTasks/annotationTasksApi.ts`
New RTK Query API for annotation task and review management.

**Task Management Endpoints:**
- `useGetAnnotationTasksQuery` - Fetch paginated annotation tasks
- `useGetAnnotationTaskQuery` - Fetch single task by ID
- `useGetAnnotationStatsQuery` - Fetch annotation statistics
- `useStartTaskMutation` - Start an annotation task
- `useSaveProgressMutation` - Save task progress
- `useSubmitTaskMutation` - Submit task for review

**Review Management Endpoints:**
- `useGetReviewQueueQuery` - Fetch review queue for instructors
- `useGetReviewStatsQuery` - Fetch review statistics
- `useApproveReviewMutation` - Approve a submitted annotation
- `useRejectReviewMutation` - Reject an annotation
- `useRequestRevisionMutation` - Request revision on an annotation
- `useAddReviewCommentMutation` - Add comment to a review

**Types Exported:**
- `AnnotationTask`, `AnnotationTaskStats`, `AnnotationChecklist`
- `ReviewItem`, `ReviewStats`, `ReviewQueueFilters`
- `PaginatedAnnotationTasksResponse`, `PaginatedReviewQueueResponse`

### 2. `src/features/annotationTasks/index.ts`
Feature barrel file exporting all hooks and types from annotationTasksApi.

---

## Files Modified

### API & Store Configuration

#### `src/lib/api/endpoints.ts`
Added new annotation service endpoints:
```typescript
ANNOTATION: {
  // Task management
  TASKS: '/annotation/v1/tasks',
  TASK: (id: string) => `/annotation/v1/tasks/${id}`,
  STATS: '/annotation/v1/stats',
  START_TASK: (id: string) => `/annotation/v1/tasks/${id}/start`,
  SUBMIT_TASK: (id: string) => `/annotation/v1/tasks/${id}/submit`,
  SAVE_PROGRESS: (id: string) => `/annotation/v1/tasks/${id}/progress`,
  // Review management
  REVIEW_QUEUE: '/annotation/v1/reviews',
  REVIEW_STATS: '/annotation/v1/reviews/stats',
  APPROVE_REVIEW: (id: string) => `/annotation/v1/reviews/${id}/approve`,
  REJECT_REVIEW: (id: string) => `/annotation/v1/reviews/${id}/reject`,
  REQUEST_REVISION: (id: string) => `/annotation/v1/reviews/${id}/revision`,
  ADD_COMMENT: (id: string) => `/annotation/v1/reviews/${id}/comment`,
  // Projects
  PROJECTS: '/annotation/v1/projects',
  CASES: (projectId: string) => `/annotation/v1/projects/${projectId}/cases`,
  SESSION: (id: string) => `/annotation/v1/sessions/${id}`,
}
```

#### `src/store/index.ts`
- Added import for `annotationTasksApi`
- Added `annotationTasksApi.reducer` to root reducer
- Added `annotationTasksApi.middleware` to store middleware

#### `src/features/lms/lmsApi.ts`
- Added `instructor?: boolean` filter to `CourseFilters` interface
- Added instructor param to getCourses query builder

---

## Pages Connected to Backend

### 1. `/annotation` - Annotation Workspace
**File:** `src/app/(dashboard)/annotation/page.tsx`

**Changes:**
- Added RTK Query imports: `useGetAnnotationTasksQuery`, `useGetAnnotationStatsQuery`
- Added imports: `Loader2`, `RefreshCw`, `Alert`, `AlertDescription`
- Implemented `isUsingMockData` detection based on API errors
- Replaced direct mock data usage with API data + fallback:
  - `allTasks` - from API or `mockAnnotationTasks`
  - `annotationStats` - from API or `mockAnnotationStats`
- Added derived data with `useMemo`:
  - `continueTask` - finds in-progress task
  - `urgentTasks` - filters urgent pending tasks
  - `tasksNeedingAttention` - filters rejected tasks
- Added loading spinner during data fetch
- Added demo mode alert with retry button

### 2. `/instructor/review` - Annotation Review Queue
**File:** `src/app/(dashboard)/instructor/review/page.tsx`

**Changes:**
- Added RTK Query imports: `useGetReviewQueueQuery`, `useGetReviewStatsQuery`, `useApproveReviewMutation`, `useRejectReviewMutation`, `useRequestRevisionMutation`
- Added imports: `Loader2`, `RefreshCw`, `AlertCircle`, `Alert`, `AlertDescription`
- Typed mock data as `ReviewItem[]` for compatibility
- Implemented API data fetch with fallback to mock data
- Added action handlers:
  - `handleApprove(reviewId)` - calls approve mutation
  - `handleReject(reviewId)` - calls reject mutation
  - `handleRequestRevision(reviewId)` - calls revision mutation
- Connected action buttons to handlers with `onClick`
- Added loading spinner during data fetch
- Added demo mode alert with retry button
- Updated stats to use dynamic `stats` instead of `mockStats`

### 3. `/courses/[courseId]` - Course Detail Page
**File:** `src/app/(dashboard)/courses/[courseId]/page.tsx`

**Changes:**
- Added RTK Query imports: `useGetCourseQuery`, `useEnrollCourseMutation`
- Added imports: `Loader2`, `AlertCircle`, `RefreshCw`, `Alert`, `AlertDescription`
- Implemented API data fetch with `useGetCourseQuery(courseId)`
- Added `isUsingMockData` detection
- Created mapped course object with API-to-UI field mapping
- Added modules data from API `course.modules` with fallback to `mockModules`
- Created `handleEnroll` async function for enrollment
- Updated "Enroll Now" button:
  - Added `onClick={handleEnroll}`
  - Added loading state with spinner when enrolling
- Added loading spinner during data fetch
- Added demo mode alert positioned below navigation

### 4. `/viewer/[studyId]` - DICOM Viewer
**File:** `src/app/(dashboard)/viewer/[studyId]/page.tsx`

**Changes:**
- Added imports: `useSaveProgressMutation`, `useSubmitTaskMutation` from annotationTasksApi
- Added import: `useAnnotationStore` from annotations feature
- Added state: `isSaving`, `isSubmitting` for loading states
- Initialized mutations: `saveProgress`, `submitTask`
- Connected to annotation store to get current annotations
- Implemented `handleSave`:
  - Calculates progress based on annotation count
  - Calls `saveProgress` mutation
  - Graceful error handling with demo mode fallback
- Implemented `handleSubmit`:
  - Sends annotations with the task submission
  - Calls `submitTask` mutation
  - Graceful error handling with demo mode fallback

### 5. `/instructor/courses` - Instructor Course Management
**File:** `src/app/(dashboard)/instructor/courses/page.tsx`

**Changes:**
- Added `InstructorCourse` interface with instructor-specific fields
- Typed `mockCourses` array properly
- Simplified to use mock data with `isUsingMockData = true` flag
- Removed unused imports: `useGetCoursesQuery`
- Removed loading state that referenced undefined `isLoading`
- Simplified demo mode alert (removed retry button since no API call)
- Note: Full API integration pending instructor-specific backend endpoints

---

## Pattern Used for API Connection

All connected pages follow this consistent pattern:

```typescript
// 1. Import RTK Query hooks
import { useGetXxxQuery } from '@/features/xxx';

// 2. Fetch data
const { data, isLoading, error, refetch } = useGetXxxQuery(params);

// 3. Check if using mock data
const isUsingMockData = !!error;

// 4. Use API data with fallback
const items = useMemo(() => {
  if (data?.items) return data.items;
  return mockItems;
}, [data]);

// 5. Loading state
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin" />
    </div>
  );
}

// 6. Demo mode notice
{isUsingMockData && (
  <Alert className="border-amber-500/50 bg-amber-500/10">
    <AlertCircle className="h-4 w-4 text-amber-500" />
    <AlertDescription>
      Running in demo mode with sample data.
      <Button onClick={() => refetch()}>Retry</Button>
    </AlertDescription>
  </Alert>
)}
```

---

## API Endpoints Summary

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Annotation Tasks | `/annotation/v1/tasks` | GET | List annotation tasks |
| Annotation Task | `/annotation/v1/tasks/:id` | GET | Get single task |
| Annotation Stats | `/annotation/v1/stats` | GET | Get task statistics |
| Start Task | `/annotation/v1/tasks/:id/start` | POST | Start annotation |
| Save Progress | `/annotation/v1/tasks/:id/progress` | PUT | Save progress |
| Submit Task | `/annotation/v1/tasks/:id/submit` | POST | Submit for review |
| Review Queue | `/annotation/v1/reviews` | GET | List reviews |
| Review Stats | `/annotation/v1/reviews/stats` | GET | Get review stats |
| Approve Review | `/annotation/v1/reviews/:id/approve` | POST | Approve annotation |
| Reject Review | `/annotation/v1/reviews/:id/reject` | POST | Reject annotation |
| Request Revision | `/annotation/v1/reviews/:id/revision` | POST | Request changes |
| Add Comment | `/annotation/v1/reviews/:id/comment` | POST | Add review comment |

---

## Pages Status After Changes

| Page | Route | Status | API Used |
|------|-------|--------|----------|
| Dashboard | `/dashboard` | ✅ Connected | dashboardApi |
| Analytics | `/admin/analytics` | ✅ Connected | analyticsApi |
| Users | `/admin/users` | ✅ Connected | usersApi |
| DICOM | `/admin/dicom` | ✅ Connected | dicomApi |
| Courses | `/courses` | ✅ Connected | lmsApi |
| Course Detail | `/courses/[id]` | ✅ Connected | lmsApi |
| Assessments | `/assessments` | ✅ Connected | assessmentsApi |
| Annotation | `/annotation` | ✅ Connected | annotationTasksApi |
| Viewer | `/viewer/[id]` | ✅ Connected | annotationTasksApi |
| Instructor Review | `/instructor/review` | ✅ Connected | annotationTasksApi |
| Instructor Courses | `/instructor/courses` | ⚠️ Mock Only | Pending API |

---

## Notes

1. **Demo Mode**: All pages gracefully fallback to mock data when backend is unavailable, showing a clear demo mode notice to users.

2. **Instructor Courses**: Uses mock data only because the `Course` type from API doesn't include instructor-specific fields (`status`, `enrollments`, `revenue`). Needs dedicated instructor courses endpoint.

3. **Type Safety**: Created proper TypeScript interfaces for all new API responses and request types.

4. **Error Handling**: All mutations include try/catch with console logging and graceful fallback behavior.

---

## Testing Checklist

- [ ] Annotation page loads with mock data
- [ ] Annotation page shows loading spinner
- [ ] Annotation page shows demo mode notice
- [ ] Instructor review page loads with mock data
- [ ] Review action buttons are functional
- [ ] Course detail page loads with mock data
- [ ] Enroll button shows loading state
- [ ] Viewer save/submit functions work
- [ ] All pages show demo mode notice when API unavailable

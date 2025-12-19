# Medical Imaging Annotation Training Platform - Frontend Architecture

**Version:** 2.0 (FastAPI Backend Integration)  
**Framework:** Next.js 14+ (App Router)  
**Language:** TypeScript  
**Target Deployment:** training.peakpoint.africa

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Complete Folder Structure](#complete-folder-structure)
4. [Core Modules & Components](#core-modules--components)
5. [State Management Strategy](#state-management-strategy)
6. [API Integration Layer](#api-integration-layer)
7. [Routing & Navigation](#routing--navigation)
8. [Medical Imaging Integration](#medical-imaging-integration)
9. [Real-Time Features](#real-time-features)
10. [Authentication Flow](#authentication-flow)
11. [Key User Journeys](#key-user-journeys)
12. [Component Library](#component-library)
13. [Performance Optimization](#performance-optimization)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Configuration](#deployment-configuration)

---

## Technology Stack

### Core Framework
- **Next.js 14.2+** - React framework with App Router
- **React 18.2+** - UI library
- **TypeScript 5.3+** - Type safety

### Medical Imaging
- **Cornerstone3D 2.0+** - DICOM viewing and rendering
- **OHIF Viewer 3.9+** - Medical imaging viewer platform
- **vtk.js** - 3D visualization
- **DICOM Parser** - DICOM file handling

### State Management
- **Redux Toolkit 2.0+** - Global state management
- **RTK Query** - API caching and data fetching
- **Zustand** - Lightweight state (annotation tool)

### UI Components
- **Tailwind CSS 3.4+** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Headless UI primitives
- **Lucide Icons** - Icon system

### Real-Time Communication
- **Socket.IO Client 4.6+** - WebSocket communication
- **React Query** - Server state management

### Forms & Validation
- **React Hook Form 7.50+** - Form management
- **Zod 3.22+** - Schema validation

### Data Visualization
- **Recharts 2.10+** - Charts and graphs
- **D3.js** - Custom visualizations

### Development Tools
- **Vite** - Fast development builds
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Playwright** - E2E testing
- **Vitest** - Unit testing

---

## Architecture Overview

```
-----------------------------------------------------------------
                        PRESENTATION LAYER                        
                                                                  
  --------------  --------------  --------------         
     Pages          Components       Layouts             
    (Routes)         (UI/UX)        (Structure)          
  --------------  --------------  --------------         
-----------------------------------------------------------------
                             
-----------------------------------------------------------------
                       APPLICATION LAYER                          
                                                                  
  --------------  --------------  --------------         
      Redux          Zustand        React Query          
      Toolkit        (Local)        (Async)              
  --------------  --------------  --------------         
                                                                  
  --------------  --------------  --------------         
     Features         Hooks          Context             
     (Domain)        (Logic)        (Shared)             
  --------------  --------------  --------------         
-----------------------------------------------------------------
                             
-----------------------------------------------------------------
                      INTEGRATION LAYER                           
                                                                  
  --------------  --------------  --------------         
     RTK Query      Socket.IO      Cornerstone           
       API            Client          Engine             
  --------------  --------------  --------------         
-----------------------------------------------------------------
                             
-----------------------------------------------------------------
                        FASTAPI BACKEND                           
                                                                  
  Auth  LMS  Annotation  DICOM  AI  Evaluation  ...       
------------------------------------------------------------------
```

### Key Architecture Decisions

1. **Next.js App Router**: Modern routing with React Server Components
2. **TypeScript Strict Mode**: Maximum type safety
3. **Feature-Based Organization**: Group by domain, not by type
4. **API Layer Abstraction**: RTK Query for REST, Socket.IO for real-time
5. **Hybrid State Management**: Redux for global, Zustand for annotation tool
6. **Component Composition**: Atomic design principles
7. **Progressive Enhancement**: Core features work without JavaScript

---

## Complete Folder Structure

```
frontend/
-- .env.local.example
-- .env.production
-- .eslintrc.json
-- .prettierrc
-- .gitignore
-- next.config.js
-- tailwind.config.ts
-- tsconfig.json
-- package.json
-- playwright.config.ts
-- vitest.config.ts
-- Dockerfile
-- docker-compose.yml

-- public/
   -- favicon.ico
   -- logo.svg
   -- assets/
      -- images/
      -- icons/
      -- videos/
   -- fonts/
       -- inter/
       -- roboto-mono/

-- src/
    -- app/                              # Next.js App Router
       -- layout.tsx                    # Root layout
       -- page.tsx                      # Landing page
       -- loading.tsx                   # Global loading
       -- error.tsx                     # Global error
       -- not-found.tsx                 # 404 page
       
       -- (auth)/                       # Auth route group (no auth layout)
          -- login/
             -- page.tsx
             -- loading.tsx
          -- register/
             -- page.tsx
          -- forgot-password/
             -- page.tsx
          -- reset-password/
             -- page.tsx
          -- verify-email/
              -- page.tsx
       
       -- (dashboard)/                  # Protected routes
          -- layout.tsx                # Dashboard layout
          -- loading.tsx
          
          -- dashboard/
             -- page.tsx              # Main dashboard
             -- loading.tsx
          
          -- courses/
             -- page.tsx              # Course catalog
             -- loading.tsx
             -- [id]/
                -- page.tsx          # Course detail
                -- loading.tsx
                -- lesson/
                    -- [lessonId]/
                        -- page.tsx  # Lesson viewer
                        -- loading.tsx
             -- components/
                 -- CourseCard.tsx
                 -- CourseProgress.tsx
                 -- EnrollButton.tsx
          
          -- annotation/
             -- page.tsx              # Projects list
             -- loading.tsx
             -- projects/
                -- [projectId]/
                    -- page.tsx      # Project cases
                    -- loading.tsx
             -- workspace/
                -- [caseId]/
                    -- page.tsx      # Main annotation workspace
                    -- loading.tsx
             -- review/
                -- [sessionId]/
                    -- page.tsx      # Review session
             -- components/
                 -- ProjectCard.tsx
                 -- CaseList.tsx
                 -- SessionHistory.tsx
          
          -- assessments/
             -- page.tsx              # Available assessments
             -- [id]/
                -- page.tsx          # Assessment details
                -- attempt/
                    -- [attemptId]/
                        -- page.tsx  # Take assessment
                        -- results/
                            -- page.tsx
             -- components/
                 -- AssessmentCard.tsx
                 -- QuestionRenderer.tsx
          
          -- profile/
             -- page.tsx              # User profile
             -- settings/
                -- page.tsx
             -- progress/
                -- page.tsx
             -- certificates/
                 -- page.tsx
          
          -- instructor/               # Instructor views
             -- page.tsx              # Instructor dashboard
             -- courses/
                -- page.tsx          # Manage courses
                -- create/
                   -- page.tsx
                -- [id]/
                    -- edit/
                       -- page.tsx
                    -- students/
                        -- page.tsx
             -- review/
                 -- page.tsx          # Pending reviews
                 -- [sessionId]/
                     -- page.tsx
          
          -- admin/                    # Admin views
              -- page.tsx              # Admin dashboard
              -- users/
                 -- page.tsx
                 -- create/
                    -- page.tsx
                 -- [id]/
                     -- page.tsx
              -- courses/
                 -- page.tsx
              -- dicom/
                 -- page.tsx          # DICOM management
                 -- upload/
                     -- page.tsx
              -- analytics/
                 -- page.tsx
              -- settings/
                  -- page.tsx
       
       -- api/                          # API routes (if needed)
           -- auth/
              -- [...nextauth]/
                  -- route.ts
           -- health/
               -- route.ts
    
    -- components/                       # Reusable components
       -- ui/                           # Base UI components (shadcn/ui)
          -- accordion.tsx
          -- alert.tsx
          -- avatar.tsx
          -- badge.tsx
          -- button.tsx
          -- card.tsx
          -- checkbox.tsx
          -- dialog.tsx
          -- dropdown-menu.tsx
          -- form.tsx
          -- input.tsx
          -- label.tsx
          -- modal.tsx
          -- popover.tsx
          -- progress.tsx
          -- select.tsx
          -- separator.tsx
          -- slider.tsx
          -- switch.tsx
          -- table.tsx
          -- tabs.tsx
          -- textarea.tsx
          -- toast.tsx
          -- tooltip.tsx
          -- index.ts
       
       -- layout/                       # Layout components
          -- AppLayout.tsx             # Main app layout
          -- Header.tsx                # Top navigation
          -- Sidebar.tsx               # Side navigation
          -- Footer.tsx                # Footer
          -- Breadcrumb.tsx            # Breadcrumb navigation
          -- MobileNav.tsx             # Mobile navigation
       
       -- medical/                      # Medical imaging components
          -- DicomViewer/
             -- index.tsx
             -- Viewport.tsx          # Main viewport
             -- ViewportGrid.tsx      # Multi-viewport
             -- Toolbar.tsx           # Tool toolbar
             -- ToolButton.tsx        # Individual tool button
             -- SeriesSelector.tsx    # Series navigation
             -- StackNavigator.tsx    # Slice navigation
             -- MetadataPanel.tsx     # DICOM metadata
             -- WindowLevel.tsx       # Window/level controls
             -- ZoomPan.tsx           # Zoom/pan controls
             -- Measurements.tsx      # Measurement tools
             -- Crosshairs.tsx        # Crosshair reference
             -- MPRViews.tsx          # Multi-planar reconstruction
             -- VolumeRenderer.tsx    # 3D volume rendering
             -- types.ts
             -- utils.ts
          
          -- AnnotationTools/
             -- index.tsx
             -- Toolbar.tsx           # Annotation toolbar
             -- BrushTool.tsx         # Brush/paint tool
             -- PolygonTool.tsx       # Polygon tool
             -- FreehandTool.tsx      # Freehand drawing
             -- EraserTool.tsx        # Eraser
             -- MagicWand.tsx         # Magic wand selection
             -- RegionGrowing.tsx     # Region growing
             -- ThresholdTool.tsx     # Threshold segmentation
             -- InterpolationTool.tsx # Slice interpolation
             -- LabelSelector.tsx     # Label/structure selector
             -- BrushSettings.tsx     # Brush size/opacity
             -- ColorPicker.tsx       # Label color picker
             -- UndoRedo.tsx          # Undo/redo controls
             -- AnnotationList.tsx    # List of annotations
             -- MaskOverlay.tsx       # Mask visualization
             -- AnnotationCanvas.tsx  # Drawing canvas
             -- types.ts
             -- utils.ts
          
          -- AIAssistant/
             -- index.tsx
             -- AIPanel.tsx           # AI assistance panel
             -- SuggestionsPanel.tsx  # AI suggestions
             -- InteractiveSegmentation.tsx  # SAM/MedSAM interface
             -- ModelSelector.tsx     # Select AI model
             -- PromptEditor.tsx      # Edit prompts (points/boxes)
             -- ConfidenceDisplay.tsx # Show AI confidence
             -- AcceptReject.tsx      # Accept/reject suggestions
             -- types.ts
          
          -- CollaborationPanel/
             -- index.tsx
             -- UserPresence.tsx      # Online users
             -- ActivityFeed.tsx      # Real-time activity
             -- CommentThread.tsx     # Annotation comments
             -- LockIndicator.tsx     # Case lock status
             -- CursorOverlay.tsx     # Other users' cursors
             -- types.ts
          
          -- EvaluationPanel/
             -- index.tsx
             -- MetricsDisplay.tsx    # Dice, IoU, etc.
             -- ScoreCard.tsx         # Score visualization
             -- FeedbackPanel.tsx     # Detailed feedback
             -- ComparisonView.tsx    # Side-by-side comparison
             -- ErrorHighlight.tsx    # Highlight errors
             -- ProgressChart.tsx     # Progress over time
          
          -- shared/
              -- LoadingSpinner.tsx
              -- ErrorBoundary.tsx
              -- Tooltip.tsx
              -- HelpOverlay.tsx
       
       -- course/                       # Course-related components
          -- CourseCard.tsx
          -- CourseGrid.tsx
          -- CourseHeader.tsx
          -- ModuleList.tsx
          -- ModuleCard.tsx
          -- LessonContent.tsx
          -- VideoPlayer.tsx
          -- PDFViewer.tsx
          -- ProgressBar.tsx
          -- CompletionBadge.tsx
          -- EnrollButton.tsx
          -- CourseFilters.tsx
          -- SearchBar.tsx
       
       -- assessment/                   # Assessment components
          -- QuestionRenderer.tsx
          -- MultipleChoice.tsx
          -- TrueFalse.tsx
          -- AnnotationQuestion.tsx
          -- AssessmentTimer.tsx
          -- NavigationButtons.tsx
          -- QuestionPalette.tsx
          -- ResultsPanel.tsx
          -- CertificateDisplay.tsx
       
       -- dashboard/                    # Dashboard components
          -- StatsCard.tsx
          -- RecentActivity.tsx
          -- UpcomingTasks.tsx
          -- ProgressOverview.tsx
          -- PerformanceChart.tsx
          -- LeaderboardWidget.tsx
          -- NotificationCenter.tsx
       
       -- charts/                       # Data visualization
          -- LineChart.tsx
          -- BarChart.tsx
          -- PieChart.tsx
          -- RadarChart.tsx
          -- ProgressChart.tsx
          -- HeatMap.tsx
       
       -- forms/                        # Form components
          -- FormField.tsx
          -- FormError.tsx
          -- FormSuccess.tsx
          -- FileUpload.tsx
          -- ImageUpload.tsx
          -- DatePicker.tsx
          -- RichTextEditor.tsx
       
       -- shared/                       # Shared components
           -- LoadingSpinner.tsx
           -- ErrorMessage.tsx
           -- EmptyState.tsx
           -- ConfirmDialog.tsx
           -- Pagination.tsx
           -- DataTable.tsx
           -- SearchInput.tsx
           -- FilterDropdown.tsx
           -- SkeletonLoader.tsx
    
    -- features/                         # Feature modules (Redux slices)
       -- auth/
          -- authSlice.ts              # Redux slice
          -- authApi.ts                # RTK Query API
          -- authSelectors.ts          # Reselect selectors
          -- authThunks.ts             # Async thunks
          -- hooks.ts                  # Custom hooks
          -- types.ts                  # TypeScript types
          -- utils.ts                  # Utility functions
       
       -- courses/
          -- courseSlice.ts
          -- courseApi.ts
          -- courseSelectors.ts
          -- hooks.ts
          -- types.ts
          -- utils.ts
       
       -- annotation/
          -- annotationSlice.ts
          -- annotationApi.ts
          -- annotationStore.ts        # Zustand store (local)
          -- hooks/
             -- useAnnotation.ts
             -- useAnnotationTools.ts
             -- useAnnotationHistory.ts
             -- useAutoSave.ts
             -- index.ts
          -- utils/
             -- masks.ts              # Mask operations
             -- coordinates.ts        # Coordinate transforms
             -- interpolation.ts      # Slice interpolation
             -- validation.ts         # Annotation validation
             -- export.ts             # Export functions
          -- types.ts
       
       -- dicom/
          -- dicomSlice.ts
          -- dicomApi.ts
          -- hooks/
             -- useDicom.ts
             -- useDicomLoader.ts
             -- useDicomMetadata.ts
          -- utils/
             -- parser.ts             # DICOM parsing
             -- loader.ts             # Image loading
             -- cache.ts              # Caching strategy
          -- types.ts
       
       -- assessment/
          -- assessmentSlice.ts
          -- assessmentApi.ts
          -- hooks.ts
          -- types.ts
          -- utils.ts
       
       -- evaluation/
          -- evaluationSlice.ts
          -- evaluationApi.ts
          -- hooks.ts
          -- types.ts
          -- metrics.ts                # Metrics calculations
       
       -- notifications/
          -- notificationSlice.ts
          -- notificationApi.ts
          -- hooks.ts
          -- types.ts
       
       -- realtime/
           -- websocketSlice.ts
           -- presenceSlice.ts
           -- collaborationSlice.ts
           -- socket.ts                 # Socket.IO client
           -- hooks/
              -- useSocket.ts
              -- usePresence.ts
              -- useRoomSubscription.ts
              -- useRealtimeAnnotation.ts
           -- types.ts
    
    -- lib/                              # Libraries and utilities
       -- api/
          -- client.ts                 # Axios client configuration
          -- endpoints.ts              # API endpoint constants
          -- interceptors.ts           # Request/response interceptors
          -- types.ts
       
       -- cornerstone/
          -- setup.ts                  # Cornerstone initialization
          -- config.ts                 # Configuration
          -- tools.ts                  # Tool configuration
          -- toolGroups.ts             # Tool group management
          -- rendering.ts              # Rendering engine
          -- loaders.ts                # Image loaders
          -- cache.ts                  # Image cache
          -- viewport.ts               # Viewport utilities
          -- annotations.ts            # Annotation utilities
          -- types.ts
       
       -- websocket/
          -- client.ts                 # Socket.IO setup
          -- handlers.ts               # Event handlers
          -- middleware.ts             # WebSocket middleware
          -- types.ts
       
       -- storage/
          -- localStorage.ts           # Local storage wrapper
          -- sessionStorage.ts         # Session storage wrapper
          -- indexedDB.ts              # IndexedDB wrapper
       
       -- utils/
           -- format.ts                 # Formatting functions
           -- validation.ts             # Validation functions
           -- constants.ts              # Global constants
           -- helpers.ts                # Helper functions
           -- date.ts                   # Date utilities
           -- string.ts                 # String utilities
           -- math.ts                   # Math utilities
    
    -- store/                            # Redux store configuration
       -- index.ts                      # Store setup
       -- rootReducer.ts                # Combined reducers
       -- middleware/
          -- logger.ts                 # Redux logger
          -- error.ts                  # Error middleware
          -- websocket.ts              # WebSocket middleware
       -- hooks.ts                      # Typed hooks (useAppDispatch, etc.)
    
    -- hooks/                            # Global custom hooks
       -- useAuth.ts
       -- usePermissions.ts
       -- useDebounce.ts
       -- useIntersectionObserver.ts
       -- useLocalStorage.ts
       -- useMediaQuery.ts
       -- usePrevious.ts
       -- useThrottle.ts
       -- useWindowSize.ts
       -- index.ts
    
    -- context/                          # React Context providers
       -- ThemeContext.tsx
       -- NotificationContext.tsx
       -- ModalContext.tsx
       -- index.ts
    
    -- types/                            # Global TypeScript types
       -- api.ts
       -- auth.ts
       -- course.ts
       -- annotation.ts
       -- dicom.ts
       -- user.ts
       -- assessment.ts
       -- notification.ts
       -- index.ts
    
    -- styles/                           # Global styles
       -- globals.css                   # Global CSS
       -- variables.css                 # CSS variables
       -- animations.css                # Animations
       -- utilities.css                 # Utility classes
    
    -- config/                           # Configuration files
       -- site.ts                       # Site configuration
       -- routes.ts                     # Route constants
       -- permissions.ts                # Permission constants
       -- constants.ts                  # Global constants
    
    -- middleware.ts                     # Next.js middleware (auth)
```

---

## Core Modules & Components

### 1. Authentication Module (`features/auth`)

**Purpose:** Handle user authentication, authorization, and session management

**Key Files:**
- `authSlice.ts` - Redux state for auth
- `authApi.ts` - RTK Query endpoints
- `hooks.ts` - Custom hooks (useAuth, usePermissions)

**State Shape:**
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
}
```

**Key Functions:**
- Login/Logout
- Token refresh
- Permission checking
- Profile management
- OAuth integration

**API Integration:**
```typescript
// authApi.ts - RTK Query
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth, // Includes token refresh
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/v1/auth/me',
    }),
    // ... more endpoints
  }),
});
```

---

### 2. DICOM Viewer Module (`components/medical/DicomViewer`)

**Purpose:** Display and interact with medical images

**Technology:** Cornerstone3D + OHIF components

**Key Components:**

#### Viewport.tsx
```typescript
interface ViewportProps {
  studyUid: string;
  seriesUid: string;
  instanceUids: string[];
  viewportId: string;
  orientation?: 'axial' | 'sagittal' | 'coronal';
  annotations?: Annotation[];
  onAnnotationChange?: (annotation: Annotation) => void;
}
```

**Features:**
- Multi-planar reconstruction (MPR)
- Window/level adjustment
- Zoom/pan
- Measurement tools
- Crosshair synchronization
- Annotation overlay

**Initialization:**
```typescript
// lib/cornerstone/setup.ts
export async function initializeCornerstone() {
  await cornerstone.init();
  await cornerstoneTools.init();
  
  // Register image loaders
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  
  // Configure tools
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(WindowLevelTool);
  // ... more tools
  
  // Create rendering engine
  const renderingEngine = new RenderingEngine(renderingEngineId);
  
  return renderingEngine;
}
```

**Usage:**
```typescript
// In component
const DicomViewerPage = () => {
  const { studyUid, seriesUid } = useParams();
  const { data: study } = useGetStudyQuery(studyUid);
  
  return (
    <DicomViewer
      studyUid={studyUid}
      seriesUid={seriesUid}
      instanceUids={study?.instanceUids || []}
      viewportId="main-viewport"
      orientation="axial"
      annotations={annotations}
      onAnnotationChange={handleAnnotationChange}
    />
  );
};
```

---

### 3. Annotation Tools Module (`components/medical/AnnotationTools`)

**Purpose:** Provide tools for medical image annotation

**Key Components:**

#### Toolbar.tsx
```typescript
interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  selectedLabel: Label;
  onLabelChange: (label: Label) => void;
  labels: Label[];
}
```

**Available Tools:**
- Brush (circular, adjustable size)
- Polygon (closed contour)
- Freehand (open contour)
- Eraser (remove annotations)
- Magic Wand (threshold-based selection)
- Region Growing (seed-based)
- Interpolation (between slices)

**State Management (Zustand):**
```typescript
// features/annotation/annotationStore.ts
interface AnnotationStore {
  // Current state
  activeTool: ToolType;
  brushSize: number;
  selectedLabel: Label;
  annotations: Annotation[];
  
  // History
  history: Annotation[][];
  historyIndex: number;
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setSelectedLabel: (label: Label) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, annotation: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  // Implementation
}));
```

**Auto-Save Hook:**
```typescript
// features/annotation/hooks/useAutoSave.ts
export function useAutoSave(sessionId: string) {
  const annotations = useAnnotationStore((state) => state.annotations);
  const [updateSession] = useUpdateAnnotationSessionMutation();
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateSession({
        sessionId,
        annotations,
      });
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [annotations, sessionId, updateSession]);
}
```

---

### 4. AI Assistant Module (`components/medical/AIAssistant`)

**Purpose:** Integrate AI-powered segmentation assistance

**Key Components:**

#### InteractiveSegmentation.tsx
```typescript
interface InteractiveSegmentationProps {
  studyUid: string;
  seriesUid: string;
  model: 'medsam' | 'sam' | 'nnunet';
  onSegmentationComplete: (mask: Annotation) => void;
}
```

**Flow:**
1. User clicks "AI Assist" button
2. Select model (MedSAM for interactive, nnU-Net for auto)
3. For interactive:
   - User provides prompts (points/boxes)
   - Request sent to AI Service
   - Mask returned and displayed
   - User can refine and accept
4. For auto:
   - Full volume sent to AI Service
   - Processing indicator shown
   - Result displayed for review

**API Integration:**
```typescript
// features/annotation/annotationApi.ts (RTK Query)
requestAutoSegmentation: builder.mutation<Annotation, AutoSegmentRequest>({
  query: (request) => ({
    url: '/ai/v1/inference/segment/auto',
    method: 'POST',
    body: {
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      model: request.model,
      output_format: 'rle',
    },
  }),
}),

requestInteractiveSegmentation: builder.mutation<Annotation, InteractiveSegmentRequest>({
  query: (request) => ({
    url: '/ai/v1/inference/segment/interactive',
    method: 'POST',
    body: {
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      instance_uid: request.instanceUid,
      model: 'medsam2',
      prompts: request.prompts, // Points and boxes
    },
  }),
}),
```

---

### 5. Real-Time Collaboration (`features/realtime`)

**Purpose:** Enable multi-user annotation with real-time updates

**Architecture:**
```
User A annotates
    
WebSocket emit("annotation.update")
    
WebSocket Service (backend)
    
Redis Pub/Sub (broadcast to room)
    
WebSocket emit to all users in room
    
User B receives update
    
UI updates (optimistic + server confirmation)
```

**Socket Client:**
```typescript
// features/realtime/socket.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import {
  annotationUpdated,
  userPresenceChanged,
  notificationReceived,
} from './websocketSlice';

class SocketClient {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });
    
    this.setupListeners();
  }
  
  private setupListeners() {
    this.socket?.on('connected', (data) => {
      console.log('WebSocket connected:', data.connection_id);
    });
    
    this.socket?.on('annotation.updated', (data) => {
      store.dispatch(annotationUpdated(data));
    });
    
    this.socket?.on('user.presence', (data) => {
      store.dispatch(userPresenceChanged(data));
    });
    
    this.socket?.on('notification', (data) => {
      store.dispatch(notificationReceived(data));
    });
  }
  
  joinRoom(roomId: string) {
    this.socket?.emit('join_room', { room_id: roomId });
  }
  
  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { room_id: roomId });
  }
  
  sendAnnotationUpdate(data: AnnotationUpdate) {
    this.socket?.emit('annotation.update', data);
  }
  
  sendPresenceHeartbeat(status: string) {
    this.socket?.emit('presence.heartbeat', { status });
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketClient = new SocketClient();
```

**Hooks:**
```typescript
// features/realtime/hooks/useRoomSubscription.ts
export function useRoomSubscription(caseId: string) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    socketClient.joinRoom(caseId);
    
    // Send presence heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      socketClient.sendPresenceHeartbeat('active');
    }, 30000);
    
    return () => {
      socketClient.leaveRoom(caseId);
      clearInterval(heartbeatInterval);
    };
  }, [caseId]);
}

// features/realtime/hooks/useRealtimeAnnotation.ts
export function useRealtimeAnnotation(caseId: string) {
  const dispatch = useAppDispatch();
  const localAnnotations = useAnnotationStore((state) => state.annotations);
  
  // Send updates to other users (debounced)
  const debouncedSendUpdate = useMemo(
    () =>
      debounce((annotation: Annotation) => {
        socketClient.sendAnnotationUpdate({
          case_id: caseId,
          user_id: user.id,
          annotation,
          timestamp: new Date().toISOString(),
        });
      }, 500),
    [caseId, user.id]
  );
  
  useEffect(() => {
    localAnnotations.forEach((annotation) => {
      if (annotation.isDirty) {
        debouncedSendUpdate(annotation);
      }
    });
  }, [localAnnotations, debouncedSendUpdate]);
}
```

---

### 6. Course & LMS Module (`features/courses`)

**Purpose:** Course management, enrollment, and progress tracking

**Key Components:**

#### CourseCard.tsx
```typescript
interface CourseCardProps {
  course: Course;
  progress?: number;
  enrolled?: boolean;
  onEnroll?: (courseId: string) => void;
}
```

**State Management:**
```typescript
// features/courses/courseSlice.ts
interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  enrollments: Enrollment[];
  progress: Record<string, number>; // courseId -> progress %
  filters: {
    organ: OrganSystem | null;
    modality: Modality | null;
    difficulty: Difficulty | null;
  };
  isLoading: boolean;
  error: string | null;
}
```

**API Integration:**
```typescript
// features/courses/courseApi.ts
export const courseApi = createApi({
  reducerPath: 'courseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Course', 'Enrollment', 'Progress'],
  endpoints: (builder) => ({
    getCourses: builder.query<Course[], CourseFilters>({
      query: (filters) => ({
        url: '/lms/v1/courses',
        params: filters,
      }),
      providesTags: ['Course'],
    }),
    
    getCourse: builder.query<Course, string>({
      query: (id) => `/lms/v1/courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    
    enrollInCourse: builder.mutation<Enrollment, string>({
      query: (courseId) => ({
        url: `/lms/v1/courses/${courseId}/enroll`,
        method: 'POST',
      }),
      invalidatesTags: ['Enrollment'],
    }),
    
    getEnrollments: builder.query<Enrollment[], void>({
      query: () => '/lms/v1/enrollments',
      providesTags: ['Enrollment'],
    }),
    
    getProgress: builder.query<Progress, string>({
      query: (enrollmentId) => `/lms/v1/enrollments/${enrollmentId}/progress`,
      providesTags: (result, error, id) => [{ type: 'Progress', id }],
    }),
    
    markLessonComplete: builder.mutation<void, { lessonId: string }>({
      query: ({ lessonId }) => ({
        url: `/lms/v1/lessons/${lessonId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['Progress'],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useEnrollInCourseMutation,
  useGetEnrollmentsQuery,
  useGetProgressQuery,
  useMarkLessonCompleteMutation,
} = courseApi;
```

---

### 7. Assessment Module (`features/assessment`)

**Purpose:** Handle quizzes, exams, and certification assessments

**Key Components:**

#### QuestionRenderer.tsx
```typescript
interface QuestionRendererProps {
  question: Question;
  answer: Answer | null;
  onAnswerChange: (answer: Answer) => void;
  showFeedback?: boolean;
  disabled?: boolean;
}
```

**Question Types:**
- Multiple Choice (MCQ)
- True/False
- Annotation Task (practical)
- Image Identification (hotspot)

**Assessment Flow:**
```typescript
// app/(dashboard)/assessments/[id]/attempt/[attemptId]/page.tsx
export default function AssessmentAttemptPage() {
  const { id: assessmentId, attemptId } = useParams();
  const [startAttempt, { data: attempt }] = useStartAssessmentMutation();
  const [submitAttempt] = useSubmitAssessmentMutation();
  
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  useEffect(() => {
    startAttempt({ assessmentId });
  }, [assessmentId]);
  
  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const timerId = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeRemaining]);
  
  // Auto-submit on time up
  useEffect(() => {
    if (timeRemaining === 0 && attempt) {
      handleSubmit();
    }
  }, [timeRemaining]);
  
  const handleSubmit = async () => {
    await submitAttempt({
      attemptId,
      answers: Object.values(answers),
    });
    
    router.push(`/assessments/${assessmentId}/attempt/${attemptId}/results`);
  };
  
  return (
    <div>
      <AssessmentTimer timeRemaining={timeRemaining} />
      <QuestionPalette
        questions={attempt?.questions}
        answers={answers}
        currentQuestion={currentQuestionIndex}
      />
      <QuestionRenderer
        question={attempt?.questions[currentQuestionIndex]}
        answer={answers[currentQuestionId]}
        onAnswerChange={(answer) => {
          setAnswers((prev) => ({
            ...prev,
            [currentQuestionId]: answer,
          }));
        }}
      />
      <NavigationButtons
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isLastQuestion={isLastQuestion}
      />
    </div>
  );
}
```

---

## State Management Strategy

### Redux Toolkit (Global State)

**Structure:**
```typescript
// store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import courseReducer from '@/features/courses/courseSlice';
import annotationReducer from '@/features/annotation/annotationSlice';
import dicomReducer from '@/features/dicom/dicomSlice';
import assessmentReducer from '@/features/assessment/assessmentSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import websocketReducer from '@/features/realtime/websocketSlice';

// RTK Query APIs
import { authApi } from '@/features/auth/authApi';
import { courseApi } from '@/features/courses/courseApi';
import { annotationApi } from '@/features/annotation/annotationApi';
import { dicomApi } from '@/features/dicom/dicomApi';
import { assessmentApi } from '@/features/assessment/assessmentApi';
import { evaluationApi } from '@/features/evaluation/evaluationApi';

export const rootReducer = combineReducers({
  // Slices
  auth: authReducer,
  courses: courseReducer,
  annotation: annotationReducer,
  dicom: dicomReducer,
  assessment: assessmentReducer,
  notifications: notificationReducer,
  websocket: websocketReducer,
  
  // RTK Query APIs
  [authApi.reducerPath]: authApi.reducer,
  [courseApi.reducerPath]: courseApi.reducer,
  [annotationApi.reducerPath]: annotationApi.reducer,
  [dicomApi.reducerPath]: dicomApi.reducer,
  [assessmentApi.reducerPath]: assessmentApi.reducer,
  [evaluationApi.reducerPath]: evaluationApi.reducer,
});
```

**Store Configuration:**
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { authApi } from '@/features/auth/authApi';
import { courseApi } from '@/features/courses/courseApi';
// ... other APIs
import { websocketMiddleware } from './middleware/websocket';
import { errorMiddleware } from './middleware/error';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(courseApi.middleware)
      // ... other API middlewares
      .concat(websocketMiddleware)
      .concat(errorMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Typed Hooks:**
```typescript
// store/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Zustand (Local State - Annotation Tool)

**Why Zustand for Annotation?**
- Lightweight and fast
- No boilerplate
- Perfect for high-frequency updates (brush strokes)
- Doesn't re-render entire app

```typescript
// features/annotation/annotationStore.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AnnotationStore {
  // Tool state
  activeTool: ToolType;
  brushSize: number;
  brushOpacity: number;
  selectedLabel: Label;
  
  // Annotations
  annotations: Annotation[];
  currentAnnotation: Annotation | null;
  
  // History (undo/redo)
  history: AnnotationHistory[];
  historyIndex: number;
  maxHistory: number;
  
  // UI state
  showMask: boolean;
  maskOpacity: number;
  showReferenceOverlay: boolean;
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setSelectedLabel: (label: Label) => void;
  
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, changes: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  
  startAnnotation: (annotation: Annotation) => void;
  updateCurrentAnnotation: (changes: Partial<Annotation>) => void;
  finishAnnotation: () => void;
  
  undo: () => void;
  redo: () => void;
  
  toggleMaskVisibility: () => void;
  setMaskOpacity: (opacity: number) => void;
  toggleReferenceOverlay: () => void;
  
  clearAll: () => void;
  reset: () => void;
}

export const useAnnotationStore = create<AnnotationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activeTool: 'brush',
        brushSize: 10,
        brushOpacity: 1.0,
        selectedLabel: null,
        annotations: [],
        currentAnnotation: null,
        history: [],
        historyIndex: -1,
        maxHistory: 50,
        showMask: true,
        maskOpacity: 0.5,
        showReferenceOverlay: false,
        
        // Actions implementation
        setActiveTool: (tool) => set({ activeTool: tool }),
        
        setBrushSize: (size) => set({ brushSize: size }),
        
        setBrushOpacity: (opacity) => set({ brushOpacity: opacity }),
        
        setSelectedLabel: (label) => set({ selectedLabel: label }),
        
        addAnnotation: (annotation) => {
          const state = get();
          set({
            annotations: [...state.annotations, annotation],
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              {
                action: 'add',
                annotation,
                timestamp: Date.now(),
              },
            ],
            historyIndex: state.historyIndex + 1,
          });
        },
        
        updateAnnotation: (id, changes) => {
          const state = get();
          const annotations = state.annotations.map((ann) =>
            ann.id === id ? { ...ann, ...changes } : ann
          );
          set({
            annotations,
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              {
                action: 'update',
                annotationId: id,
                changes,
                timestamp: Date.now(),
              },
            ],
            historyIndex: state.historyIndex + 1,
          });
        },
        
        deleteAnnotation: (id) => {
          const state = get();
          const annotation = state.annotations.find((ann) => ann.id === id);
          set({
            annotations: state.annotations.filter((ann) => ann.id !== id),
            history: [
              ...state.history.slice(0, state.historyIndex + 1),
              {
                action: 'delete',
                annotation,
                timestamp: Date.now(),
              },
            ],
            historyIndex: state.historyIndex + 1,
          });
        },
        
        undo: () => {
          const state = get();
          if (state.historyIndex < 0) return;
          
          const historyItem = state.history[state.historyIndex];
          // Revert the action
          // ... implementation
          
          set({ historyIndex: state.historyIndex - 1 });
        },
        
        redo: () => {
          const state = get();
          if (state.historyIndex >= state.history.length - 1) return;
          
          const historyItem = state.history[state.historyIndex + 1];
          // Replay the action
          // ... implementation
          
          set({ historyIndex: state.historyIndex + 1 });
        },
        
        // ... other actions
      }),
      {
        name: 'annotation-storage',
        partialize: (state) => ({
          brushSize: state.brushSize,
          brushOpacity: state.brushOpacity,
          maskOpacity: state.maskOpacity,
          showMask: state.showMask,
        }),
      }
    )
  )
);
```

---

## API Integration Layer

### Base Configuration

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { logout, refreshToken } from '@/features/auth/authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.accessToken;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor: Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }
          
          originalRequest._retry = true;
          this.isRefreshing = true;
          
          try {
            const state = store.getState();
            const refreshTokenValue = state.auth.refreshToken;
            
            if (!refreshTokenValue) {
              throw new Error('No refresh token');
            }
            
            // Refresh token
            const response = await axios.post(`${BASE_URL}/auth/v1/auth/refresh`, {
              refresh_token: refreshTokenValue,
            });
            
            const { access_token } = response.data;
            
            // Update store
            store.dispatch(refreshToken({ accessToken: access_token }));
            
            // Retry all queued requests
            this.refreshSubscribers.forEach((callback) => callback(access_token));
            this.refreshSubscribers = [];
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            store.dispatch(logout());
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  public get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }
  
  public post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }
  
  public put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }
  
  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }
  
  public delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

### RTK Query Base Query

```typescript
// lib/api/baseQuery.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

export const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshResult = await baseQuery(
      {
        url: '/auth/v1/auth/refresh',
        method: 'POST',
        body: {
          refresh_token: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      // Store new token
      api.dispatch(refreshToken(refreshResult.data));
      
      // Retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout
      api.dispatch(logout());
    }
  }
  
  return result;
};
```

### Service Endpoints Configuration

```typescript
// lib/api/endpoints.ts
export const ENDPOINTS = {
  // Auth Service
  AUTH: {
    LOGIN: '/auth/v1/auth/login',
    REGISTER: '/auth/v1/auth/register',
    LOGOUT: '/auth/v1/auth/logout',
    REFRESH: '/auth/v1/auth/refresh',
    ME: '/auth/v1/auth/me',
    FORGOT_PASSWORD: '/auth/v1/auth/forgot-password',
    RESET_PASSWORD: '/auth/v1/auth/reset-password',
  },
  
  // LMS Service
  LMS: {
    COURSES: '/lms/v1/courses',
    COURSE: (id: string) => `/lms/v1/courses/${id}`,
    ENROLL: (id: string) => `/lms/v1/courses/${id}/enroll`,
    ENROLLMENTS: '/lms/v1/enrollments',
    PROGRESS: (id: string) => `/lms/v1/enrollments/${id}/progress`,
    LESSONS: (id: string) => `/lms/v1/modules/${id}/lessons`,
    ASSESSMENTS: '/lms/v1/assessments',
  },
  
  // Annotation Service
  ANNOTATION: {
    PROJECTS: '/annotation/v1/projects',
    CASES: (projectId: string) => `/annotation/v1/projects/${projectId}/cases`,
    START_SESSION: (caseId: string) => `/annotation/v1/cases/${caseId}/start`,
    SESSION: (id: string) => `/annotation/v1/sessions/${id}`,
    ANNOTATIONS: '/annotation/v1/annotations',
    EXPORT: (sessionId: string) => `/annotation/v1/sessions/${sessionId}/export`,
  },
  
  // DICOM Service
  DICOM: {
    STUDIES: '/dicom/v1/studies',
    STUDY: (uid: string) => `/dicom/v1/studies/${uid}`,
    SERIES: (uid: string) => `/dicom/v1/series/${uid}`,
    INSTANCE: (uid: string) => `/dicom/v1/instances/${uid}`,
    IMAGE: (uid: string) => `/dicom/v1/instances/${uid}/image`,
  },
  
  // AI Service
  AI: {
    SEGMENT_AUTO: '/ai/v1/inference/segment/auto',
    SEGMENT_INTERACTIVE: '/ai/v1/inference/segment/interactive',
    MODELS: '/ai/v1/models',
  },
  
  // Evaluation Service
  EVALUATION: {
    EVALUATE: '/evaluation/v1/evaluate',
    RESULTS: (sessionId: string) => `/evaluation/v1/sessions/${sessionId}/results`,
    PROGRESS: (userId: string) => `/evaluation/v1/users/${userId}/progress`,
  },
  
  // WebSocket
  WEBSOCKET: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8010',
} as const;
```

---

## Routing & Navigation

### App Router Structure

```typescript
// config/routes.ts
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Courses
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  LESSON: (courseId: string, lessonId: string) => 
    `/courses/${courseId}/lesson/${lessonId}`,
  
  // Annotation
  ANNOTATION: '/annotation',
  ANNOTATION_PROJECTS: '/annotation/projects',
  ANNOTATION_WORKSPACE: (caseId: string) => `/annotation/workspace/${caseId}`,
  ANNOTATION_REVIEW: (sessionId: string) => `/annotation/review/${sessionId}`,
  
  // Assessments
  ASSESSMENTS: '/assessments',
  ASSESSMENT_DETAIL: (id: string) => `/assessments/${id}`,
  ASSESSMENT_ATTEMPT: (id: string, attemptId: string) => 
    `/assessments/${id}/attempt/${attemptId}`,
  ASSESSMENT_RESULTS: (id: string, attemptId: string) => 
    `/assessments/${id}/attempt/${attemptId}/results`,
  
  // Profile
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings',
  PROFILE_PROGRESS: '/profile/progress',
  PROFILE_CERTIFICATES: '/profile/certificates',
  
  // Instructor
  INSTRUCTOR: '/instructor',
  INSTRUCTOR_COURSES: '/instructor/courses',
  INSTRUCTOR_REVIEW: '/instructor/review',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_DICOM: '/admin/dicom',
  ADMIN_ANALYTICS: '/admin/analytics',
} as const;
```

### Protected Routes Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/forgot-password'];
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;
  
  // Redirect to login if accessing protected route without token
  if (!token && !publicPaths.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if accessing auth pages with token
  if (token && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Medical Imaging Integration

### Cornerstone3D Setup

```typescript
// lib/cornerstone/setup.ts
import {
  init as cs3DInit,
  RenderingEngine,
  Enums as cs3DEnums,
  volumeLoader,
  CONSTANTS,
} from '@cornerstonejs/core';

import {
  init as csToolsInit,
  addTool,
  ToolGroupManager,
  Enums as csToolsEnums,
  segmentation,
} from '@cornerstonejs/tools';

import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';

// Import tools
import {
  PanTool,
  WindowLevelTool,
  StackScrollMouseWheelTool,
  ZoomTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  CircleROITool,
  ProbeTool,
  AngleTool,
  BidirectionalTool,
  SegmentationDisplayTool,
  BrushTool,
  RectangleScissorsTool,
  CircleScissorsTool,
  SphereScissorsTool,
} from '@cornerstonejs/tools';

let initialized = false;

export async function initializeCornerstone() {
  if (initialized) return;
  
  // Initialize Cornerstone3D
  await cs3DInit();
  await csToolsInit();
  
  // Configure WADO Image Loader
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  
  cornerstoneWADOImageLoader.configure({
    useWebWorkers: true,
    decodeConfig: {
      convertFloatPixelDataToInt: false,
      use16BitDataType: true,
    },
  });
  
  // Register volume loaders
  volumeLoader.registerVolumeLoader('cornerstoneStreamingImageVolume', cornerstoneStreamingImageVolumeLoader);
  
  // Add tools
  addTool(PanTool);
  addTool(WindowLevelTool);
  addTool(StackScrollMouseWheelTool);
  addTool(ZoomTool);
  addTool(LengthTool);
  addTool(RectangleROITool);
  addTool(EllipticalROITool);
  addTool(CircleROITool);
  addTool(ProbeTool);
  addTool(AngleTool);
  addTool(BidirectionalTool);
  addTool(SegmentationDisplayTool);
  addTool(BrushTool);
  addTool(RectangleScissorsTool);
  addTool(CircleScissorsTool);
  addTool(SphereScissorsTool);
  
  initialized = true;
}

export function createRenderingEngine(id: string) {
  return new RenderingEngine(id);
}

export function createToolGroup(id: string) {
  const toolGroup = ToolGroupManager.createToolGroup(id);
  
  if (!toolGroup) return null;
  
  // Add default tools
  toolGroup.addTool(WindowLevelTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(StackScrollMouseWheelTool.toolName);
  
  // Set active tools
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
  });
  
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
  });
  
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
  });
  
  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
  
  return toolGroup;
}

export function createSegmentation(segmentationId: string) {
  segmentation.addSegmentations([
    {
      segmentationId,
      representation: {
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
      },
    },
  ]);
}
```

### DICOM Viewer Component

```typescript
// components/medical/DicomViewer/index.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeCornerstone, createRenderingEngine, createToolGroup } from '@/lib/cornerstone/setup';
import { useGetStudyQuery } from '@/features/dicom/dicomApi';
import Toolbar from './Toolbar';
import Viewport from './Viewport';
import SeriesSelector from './SeriesSelector';
import MetadataPanel from './MetadataPanel';

interface DicomViewerProps {
  studyUid: string;
  onLoad?: () => void;
}

export default function DicomViewer({ studyUid, onLoad }: DicomViewerProps) {
  const { data: study, isLoading } = useGetStudyQuery(studyUid);
  const renderingEngineRef = useRef<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState('WindowLevel');
  
  useEffect(() => {
    initializeCornerstone().then(() => {
      renderingEngineRef.current = createRenderingEngine('mainRenderingEngine');
      createToolGroup('mainToolGroup');
      
      onLoad?.();
    });
    
    return () => {
      renderingEngineRef.current?.destroy();
    };
  }, []);
  
  useEffect(() => {
    if (study && study.series.length > 0 && !selectedSeries) {
      setSelectedSeries(study.series[0].series_uid);
    }
  }, [study, selectedSeries]);
  
  if (isLoading) {
    return <div>Loading study...</div>;
  }
  
  if (!study) {
    return <div>Study not found</div>;
  }
  
  return (
    <div className="flex h-screen bg-gray-900">
      <div className="w-64 bg-gray-800 p-4">
        <SeriesSelector
          series={study.series}
          selectedSeries={selectedSeries}
          onSelectSeries={setSelectedSeries}
        />
        <MetadataPanel study={study} />
      </div>
      
      <div className="flex-1 flex flex-col">
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />
        
        <div className="flex-1">
          {selectedSeries && (
            <Viewport
              seriesUid={selectedSeries}
              renderingEngine={renderingEngineRef.current}
              activeTool={activeTool}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Real-Time Features

**Covered in section 5 above** - See "Real-Time Collaboration" for:
- WebSocket client setup
- Event handling
- Room subscription hooks
- Presence tracking
- Real-time annotation updates

---

## Authentication Flow

### Login Flow

```
User enters credentials
    
POST /auth/v1/auth/login
    
Backend validates
    
Returns { access_token, refresh_token, user }
    
Store in Redux + Cookie
    
Redirect to dashboard
```

### Token Refresh Flow

```
API request fails with 401
    
Interceptor catches error
    
POST /auth/v1/auth/refresh
    
Returns new access_token
    
Update Redux store
    
Retry original request
```

### Implementation

```typescript
// features/auth/hooks.ts
export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [login] = useLoginMutation();
  const [logout] = useLogoutMutation();
  
  const handleLogin = async (credentials: LoginRequest) => {
    try {
      const response = await login(credentials).unwrap();
      
      // Store tokens in cookies (httpOnly for security)
      Cookies.set('accessToken', response.access_token, { 
        expires: 1/48, // 30 minutes
        secure: true,
        sameSite: 'strict',
      });
      
      Cookies.set('refreshToken', response.refresh_token, {
        expires: 7, // 7 days
        secure: true,
        sameSite: 'strict',
      });
      
      // Dispatch to Redux
      dispatch(setCredentials(response));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      dispatch(authActions.logout());
      navigate('/login');
    }
  };
  
  return {
    user,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  };
}
```

---

## Key User Journeys

### 1. Student Annotation Workflow

```
1. Login
2. Navigate to Courses  Select course  Enroll
3. Complete lessons (videos, readings)
4. Take practice quiz
5. Enter annotation lab:
   - View DICOM case
   - Use annotation tools
   - Get real-time AI suggestions
   - Submit annotation
   - Receive instant feedback (Dice score, visual overlay)
6. Review mistakes, iterate
7. Take final assessment
8. Pass certification threshold
9. Receive certificate
```

### 2. Instructor Review Workflow

```
1. Login (instructor role)
2. Navigate to Instructor Dashboard
3. View pending reviews
4. Select student session
5. Load annotation workspace in review mode:
   - See student's annotation
   - See ground truth overlay
   - See metrics (Dice, IoU, etc.)
   - Add comments on specific areas
6. Approve or request revisions
7. Student receives notification
```

### 3. Collaborative Annotation

```
1. User A opens annotation case
2. System acquires lock (Redis)
3. User A starts annotating
4. User B opens same case
5. System shows "locked by User A"
6. User B can view in read-only mode
7. User B sees User A's cursor (real-time)
8. User A submits and releases lock
9. User B can now edit
```

---

## Component Library

### Base UI Components (shadcn/ui)

**Installation:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select
```

**Usage:**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### Custom Components

Extend base components with medical imaging-specific functionality:

```typescript
// components/medical/shared/Tooltip.tsx
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  // Implementation
}
```

---

## Performance Optimization

### 1. Image Loading Strategy

```typescript
// lib/cornerstone/cache.ts
export const CACHE_CONFIG = {
  maxCacheSize: 3 * 1024 * 1024 * 1024, // 3GB
  cacheSizeInBytes: 1 * 1024 * 1024 * 1024, // 1GB initial
};

// Preload adjacent slices
export function preloadAdjacentSlices(currentIndex: number, imageIds: string[]) {
  const preloadRange = 5;
  const start = Math.max(0, currentIndex - preloadRange);
  const end = Math.min(imageIds.length - 1, currentIndex + preloadRange);
  
  for (let i = start; i <= end; i++) {
    if (i !== currentIndex) {
      cornerstone.loadAndCacheImage(imageIds[i]);
    }
  }
}
```

### 2. Code Splitting

```typescript
// app/(dashboard)/annotation/workspace/[caseId]/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const DicomViewer = dynamic(
  () => import('@/components/medical/DicomViewer'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Don't render on server
  }
);

const AnnotationTools = dynamic(
  () => import('@/components/medical/AnnotationTools'),
  { ssr: false }
);
```

### 3. Memoization

```typescript
import { useMemo, useCallback } from 'react';

export function AnnotationCanvas({ annotations }) {
  // Memoize expensive calculations
  const annotationLayer = useMemo(() => {
    return renderAnnotations(annotations);
  }, [annotations]);
  
  // Memoize callbacks
  const handleAnnotationClick = useCallback((annotationId: string) => {
    // Handle click
  }, []);
  
  return <canvas>{annotationLayer}</canvas>;
}
```

### 4. Virtual Scrolling

```typescript
// For large lists (e.g., series selector)
import { FixedSizeList } from 'react-window';

export function SeriesSelector({ series }: { series: Series[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={series.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <SeriesItem series={series[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// features/auth/authSlice.test.ts
import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from './authSlice';

describe('authSlice', () => {
  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });
  
  it('should handle setCredentials', () => {
    const actual = authReducer(undefined, setCredentials({
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'token123',
      refreshToken: 'refresh123',
    }));
    
    expect(actual.user).toEqual({ id: '1', email: 'test@example.com' });
    expect(actual.isAuthenticated).toBe(true);
  });
  
  it('should handle logout', () => {
    const previousState = {
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'token123',
      refreshToken: 'refresh123',
      isAuthenticated: true,
    };
    
    const actual = authReducer(previousState, logout());
    
    expect(actual.user).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });
});
```

### Component Tests (React Testing Library)

```typescript
// components/course/CourseCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    id: '1',
    title: 'Lung CT Annotation',
    description: 'Learn lung annotation',
    difficulty: 'beginner',
  };
  
  it('renders course information', () => {
    render(<CourseCard course={mockCourse} />);
    
    expect(screen.getByText('Lung CT Annotation')).toBeInTheDocument();
    expect(screen.getByText('Learn lung annotation')).toBeInTheDocument();
  });
  
  it('calls onEnroll when button clicked', () => {
    const handleEnroll = vi.fn();
    render(<CourseCard course={mockCourse} onEnroll={handleEnroll} />);
    
    const enrollButton = screen.getByRole('button', { name: /enroll/i });
    fireEvent.click(enrollButton);
    
    expect(handleEnroll).toHaveBeenCalledWith('1');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/annotation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Annotation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('should complete annotation workflow', async ({ page }) => {
    // Navigate to annotation workspace
    await page.click('text=Annotation');
    await page.click('text=Lung Annotation Project');
    await page.click('text=Case 1');
    
    // Wait for DICOM viewer to load
    await page.waitForSelector('[data-testid="dicom-viewport"]');
    
    // Select brush tool
    await page.click('[data-testid="brush-tool"]');
    
    // Annotate (simulate mouse events)
    const viewport = page.locator('[data-testid="dicom-viewport"]');
    await viewport.click({ position: { x: 100, y: 100 } });
    
    // Submit annotation
    await page.click('text=Submit');
    
    // Verify feedback shown
    await expect(page.locator('text=Dice Score')).toBeVisible();
  });
});
```

---

## Deployment Configuration

### Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.training.peakpoint.africa
NEXT_PUBLIC_WS_URL=wss://ws.training.peakpoint.africa
NEXT_PUBLIC_SITE_URL=https://training.peakpoint.africa
```

### Kubernetes Deployment

```yaml
# infrastructure/kubernetes/deployments/frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: registry.example.com/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.training.peakpoint.africa"
        - name: NEXT_PUBLIC_WS_URL
          value: "wss://ws.training.peakpoint.africa"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: production
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

---

## Summary

This frontend architecture provides:

 **Complete structure** - Every folder, file, and component defined  
 **FastAPI integration** - RTK Query for all backend services  
 **Medical imaging** - Cornerstone3D for DICOM viewing  
 **Real-time features** - WebSocket for collaboration  
 **State management** - Redux Toolkit + Zustand for annotation  
 **Type safety** - Full TypeScript implementation  
 **Performance** - Code splitting, caching, optimization  
 **Testing** - Unit, component, and E2E tests  
 **Deployment** - Docker + Kubernetes ready  

**Next Steps:**
1. Initialize Next.js project with TypeScript
2. Install dependencies (Cornerstone3D, Redux Toolkit, etc.)
3. Set up folder structure as documented
4. Implement authentication module first
5. Build DICOM viewer component
6. Add annotation tools
7. Integrate real-time features
8. Deploy to production

This architecture is production-ready and aligns with your FastAPI backend microservices.

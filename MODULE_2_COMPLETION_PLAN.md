# Module 2: DICOM Viewer - Completion Plan

## Overview

This document outlines the implementation steps needed to complete Module 2 (DICOM Viewer) before proceeding to Module 3.

---

## Phase 1: Viewport Interface Alignment

### 1.1 Update Viewport Props Interface
**Priority:** High
**Estimated Complexity:** Medium

Update `Viewport.tsx` to match the spec interface while maintaining backward compatibility:

```typescript
interface ViewportProps {
  // New spec-compliant props
  studyUid?: string;
  seriesUid?: string;
  instanceUids?: string[];
  orientation?: 'axial' | 'sagittal' | 'coronal';
  annotations?: Annotation[];
  onAnnotationChange?: (annotation: Annotation) => void;

  // Existing props (keep for backward compatibility)
  viewportId: string;
  imageIds?: string[];  // Alternative to instanceUids
  className?: string;
  onImageRendered?: (imageIndex: number) => void;
}
```

**Tasks:**
- [ ] Create `Annotation` type definition in `types/dicom.ts`
- [ ] Update `ViewportProps` interface
- [ ] Implement prop conversion logic (studyUid/seriesUid → imageIds)
- [ ] Add `onAnnotationChange` callback support

---

### 1.2 Create Annotation Type Definitions
**Priority:** High
**Estimated Complexity:** Low

**File:** `src/types/annotation.ts`

```typescript
export interface Annotation {
  id: string;
  type: 'length' | 'rectangle' | 'ellipse' | 'polygon' | 'freehand' | 'angle' | 'probe';
  data: AnnotationData;
  labelId?: string;
  imageIndex: number;
  sopInstanceUID: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationData {
  handles: { x: number; y: number }[];
  textBox?: { x: number; y: number };
  cachedStats?: Record<string, number>;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  shortcut?: string;
}
```

**Tasks:**
- [ ] Create `src/types/annotation.ts`
- [ ] Export from `src/types/index.ts`

---

## Phase 2: Multi-Viewport Layout Support

### 2.1 Create ViewportGrid Component
**Priority:** High
**Estimated Complexity:** Medium

**File:** `src/components/medical/DicomViewer/ViewportGrid.tsx`

Support layout configurations: 1x1, 1x2, 2x1, 2x2, 2x3, 3x3

**Tasks:**
- [ ] Create `ViewportGrid.tsx` component
- [ ] Implement grid layout logic based on layout string (e.g., "2x2")
- [ ] Handle viewport synchronization (optional crosshairs)
- [ ] Integrate with `AnnotationWorkspace.tsx`
- [ ] Update `ViewerToolbar.tsx` layout selection to actually work

---

### 2.2 Implement Viewport State Management
**Priority:** Medium
**Estimated Complexity:** Low

Update Redux state to track multiple viewports:

**Tasks:**
- [ ] Add `viewports: Record<string, ViewportConfig>` to dicomSlice
- [ ] Add actions: `addViewport`, `removeViewport`, `setViewportSeries`
- [ ] Sync viewport states across grid

---

## Phase 3: Crosshair Synchronization

### 3.1 Implement Crosshairs Tool Integration
**Priority:** Medium
**Estimated Complexity:** High

**Tasks:**
- [ ] Enable `CrosshairsTool` in multi-viewport mode
- [ ] Implement synchronizer between viewports using Cornerstone's `Synchronizer` API
- [ ] Add UI toggle for crosshair sync on/off
- [ ] Handle crosshair position updates across viewports

---

## Phase 4: Flip/Rotate/Invert Controls

### 4.1 Implement Viewport Manipulation Functions
**Priority:** Medium
**Estimated Complexity:** Low

**File:** Update `src/lib/cornerstone/setup.ts`

**Tasks:**
- [ ] Add `flipViewportHorizontal(viewportId)` function
- [ ] Add `flipViewportVertical(viewportId)` function
- [ ] Add `rotateViewport(viewportId, degrees)` function
- [ ] Add `invertViewport(viewportId)` function
- [ ] Add `resetViewport(viewportId)` function

---

### 4.2 Connect Toolbar Buttons to Functions
**Priority:** Medium
**Estimated Complexity:** Low

**File:** Update `src/components/medical/DicomViewer/Toolbar.tsx`

**Tasks:**
- [ ] Replace stub handlers with actual function calls
- [ ] Add visual feedback for active states (flipped, inverted, etc.)
- [ ] Store viewport manipulation state in Redux

---

## Phase 5: Annotation System Foundation

### 5.1 Create Annotation Store (Zustand)
**Priority:** High
**Estimated Complexity:** Medium

**File:** `src/features/annotation/annotationStore.ts`

**Tasks:**
- [ ] Create Zustand store with annotation state
- [ ] Implement undo/redo history
- [ ] Add annotation CRUD actions
- [ ] Implement auto-save hook

---

### 5.2 Integrate Cornerstone Annotations
**Priority:** High
**Estimated Complexity:** High

**Tasks:**
- [ ] Listen to Cornerstone annotation events (`ANNOTATION_ADDED`, `ANNOTATION_MODIFIED`, `ANNOTATION_REMOVED`)
- [ ] Sync Cornerstone annotations with Zustand store
- [ ] Implement annotation rendering on viewport
- [ ] Add annotation serialization/deserialization for save/load

---

### 5.3 Create Annotation Toolbar
**Priority:** Medium
**Estimated Complexity:** Medium

**File:** `src/components/medical/AnnotationTools/AnnotationToolbar.tsx`

**Tasks:**
- [ ] Create toolbar with measurement tools (Length, Angle, Area)
- [ ] Add segmentation tools (Brush, Polygon, Freehand)
- [ ] Implement brush size slider
- [ ] Add label selector dropdown
- [ ] Connect to annotation store

---

## Phase 6: MPR (Multi-Planar Reconstruction) - Optional

### 6.1 Volume Viewport Support
**Priority:** Low (can be deferred)
**Estimated Complexity:** Very High

This requires significant changes and can be implemented in a future phase:

**Tasks:**
- [ ] Add volume loader initialization
- [ ] Create `VolumeViewport` component
- [ ] Implement MPR controls (slice position, orientation)
- [ ] Add oblique slicing support

**Note:** This feature requires volume data support from the backend and is complex. Recommend deferring to Module 4 or later.

---

## Phase 7: Smart Tools (AI-Assisted) - Deferred

### 7.1 Smart Tool Stubs
**Priority:** Low (placeholder only)
**Estimated Complexity:** Backend-dependent

**Tasks:**
- [ ] Create placeholder API endpoints structure
- [ ] Add "Coming Soon" UI indicators for:
  - Magic Wand
  - Region Growing
  - Interpolation
- [ ] Implement when backend AI services are available

---

## Implementation Order

### Sprint 1: Core Alignment (Recommended First)
1. ✅ Phase 1.2: Annotation Type Definitions
2. ✅ Phase 1.1: Viewport Props Interface Update
3. ✅ Phase 4.1: Viewport Manipulation Functions
4. ✅ Phase 4.2: Toolbar Button Connections

### Sprint 2: Multi-Viewport
5. Phase 2.1: ViewportGrid Component
6. Phase 2.2: Viewport State Management
7. Phase 3.1: Crosshair Synchronization

### Sprint 3: Annotation System
8. Phase 5.1: Annotation Store
9. Phase 5.2: Cornerstone Integration
10. Phase 5.3: Annotation Toolbar

### Deferred (Future Modules)
- Phase 6: MPR Support
- Phase 7: Smart Tools

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/annotation.ts` | Annotation type definitions |
| `src/features/annotation/annotationStore.ts` | Zustand store for annotations |
| `src/features/annotation/hooks/useAutoSave.ts` | Auto-save hook |
| `src/components/medical/DicomViewer/ViewportGrid.tsx` | Multi-viewport grid |
| `src/components/medical/AnnotationTools/AnnotationToolbar.tsx` | Annotation toolbar |
| `src/components/medical/AnnotationTools/BrushSizeSlider.tsx` | Brush size control |
| `src/components/medical/AnnotationTools/LabelSelector.tsx` | Label selection dropdown |

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/medical/DicomViewer/Viewport.tsx` | Add new props, annotation support |
| `src/components/medical/DicomViewer/Toolbar.tsx` | Connect flip/rotate/invert handlers |
| `src/components/medical/DicomViewer/AnnotationWorkspace.tsx` | Integrate ViewportGrid |
| `src/lib/cornerstone/setup.ts` | Add viewport manipulation functions |
| `src/lib/cornerstone/types.ts` | Add annotation-related types |
| `src/features/dicom/dicomSlice.ts` | Add multi-viewport state |
| `src/types/index.ts` | Export new types |

---

## Success Criteria

Module 2 is complete when:

1. ✅ Viewport displays DICOM images correctly
2. ✅ Window/level, zoom, pan tools work
3. ✅ All measurement tools work (Length, Angle, Area, Probe)
4. ⬜ Multi-viewport layouts work (1x1, 2x2, etc.)
5. ⬜ Flip/rotate/invert controls work
6. ⬜ Crosshair synchronization works in multi-viewport
7. ⬜ Annotations can be created, edited, and deleted
8. ⬜ Annotations persist across page navigation
9. ⬜ Viewport interface matches spec

---

## Approval Required

Please confirm:
1. Should we proceed with Sprint 1 (Core Alignment) first?
2. Should MPR (Phase 6) be deferred to a later module?
3. Should Smart Tools (Phase 7) wait for backend AI services?

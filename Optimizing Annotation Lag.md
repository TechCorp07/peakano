# Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

### User Input

Problem:

Great, I have another issue. After cloning my GitHub repository for the tool onto my server and setting up Nginx and PM2 to make it accessible to any PCs connected to the local network, I encountered a significant problem.

Previously, we resolved the issue where segmentations/annotations were not staying connected to the annotated image. However, now that the tool is accessible across the local network, I notice a lag when using the pan and zoom functions. The annotations appear to lag behind the image for a few seconds, creating a disconnection before they properly align again.

Could you suggest potential approaches to address this issue without making code modifications just yet?


Thinking process to identify the problem:

This is a common issue with Cornerstone.js when running on a network with latency. Here are potential approaches to address the annotation lag:

Root Causes
Annotation rendering is tied to viewport events - When you pan/zoom, the viewport updates immediately, but annotations need to recalculate their screen coordinates from world coordinates, which can lag behind.

Network latency affects synchronization - Even small delays (50-100ms) become noticeable when dragging/zooming continuously.

Rendering pipeline mismatch - The image renders on the GPU canvas, but annotations may be rendered on a separate overlay canvas with different update timing.

Potential Solutions
1. Optimize Annotation Rendering Mode
Cornerstone Tools has different rendering modes for annotations during interaction
During active manipulation (pan/zoom), annotations can be temporarily hidden or rendered in a simplified "draft" mode
After interaction ends, full annotation rendering resumes
2. Use Hardware-Accelerated Annotation Rendering
Ensure annotations are rendered using WebGL/GPU rather than Canvas 2D
This keeps both image and annotations on the same rendering pipeline
3. Throttle/Debounce Viewport Events
Reduce the frequency of annotation position recalculations during rapid pan/zoom
Only update annotation positions every N milliseconds during interaction
4. Batch Annotation Updates
Instead of updating each annotation individually, batch all annotation position updates into a single render pass
5. Server-Side Optimizations
PM2 Cluster Mode: Run multiple instances to handle concurrent requests
Nginx Caching: Cache static assets (DICOM files, JS bundles) aggressively
Compression: Enable gzip/brotli for faster asset delivery
6. Client-Side Caching
Pre-cache DICOM images and annotation data in IndexedDB
Reduce round-trips to the server during interaction
Recommended Investigation Steps
Profile the browser - Use Chrome DevTools Performance tab to see where time is spent during pan/zoom
Check network waterfall - See if any requests are being made during pan/zoom
Measure frame rate - Confirm if the issue is rendering lag vs. network lag
Test locally - Compare behavior on localhost vs. network to isolate the cause
Would you like me to investigate the current annotation rendering implementation to identify specific optimization opportunities?

you can investigate
I'll investigate the current annotation rendering implementation to identify optimization opportunities for the pan/zoom lag issue.

Update Todos

Investigate annotation rendering implementation for pan/zoom lag

Identify optimization opportunities for network deployment
This session is being continued from a previous conversation that ran out of context. The conversation is summarized below:
Analysis:
Let me chronologically analyze the conversation:

1. **Initial Context**: The conversation started with context about an MRI Scan Reading Tool project. Previous work had been done on logo/branding and Cornerstone.js module warnings.

2. **Logo Size Issue**: User asked to work with new logo dimensions (394x263 pixels). I updated AppHeader.tsx multiple times to adjust logo size. User kept saying logo was too small.

3. **Logo Dimensions Check**: User asked about current logo dimensions. I checked and found it was 394x112 (wide landscape, 3.5:1 ratio). Updated header accordingly.

4. **Multi-Slice DICOM Issue**: User reported that ITK-SNAP shows liver.dcm with 100+ slices but their annotation tool only shows 1 slice. I analyzed the root cause - the tool was treating each DICOM file as single-frame without parsing NumberOfFrames tag.

5. **Solution Discussion**: User provided detailed solutions document. I recommended Solution 1 (Frame-aware ImageId pipeline) and user approved implementation.

6. **Implementation of Frame Detection**:
   - Created `src/lib/dicom/frameDetection.ts` - DICOM metadata parser
   - Created `src/lib/dicom/useFrameAwareImageIds.ts` - React hook for frame-aware loading
   - Created `src/lib/dicom/index.ts` - Barrel exports
   - Modified `AnnotationWorkspace.tsx` to use frame-aware imageIds

7. **Lung.dcm Addition**: Added lung.dcm support to dicomData.ts (STATIC_DICOM_FILES, studies, series, instances).

8. **Debugging**: Added console.log statements to frameDetection.ts, useFrameAwareImageIds.ts, and AnnotationWorkspace.tsx to debug why slices weren't showing.

9. **Debug Results**: Console logs revealed liver.dcm only has NumberOfFrames=3 (it's a SEG modality file, ~100KB) - not the multi-slice CT the user expected. The frame detection was working correctly.

10. **Logo Cache Clear**: User replaced logo with transparent background version, I cleared .next cache.

11. **Network Deployment Issue**: User deployed to server with Nginx/PM2, noticed annotation lag during pan/zoom on network. I provided potential solutions without code changes.

12. **Current**: User asked me to investigate the annotation rendering implementation for optimization opportunities.

Key files created/modified:
- `src/lib/dicom/frameDetection.ts` (new)
- `src/lib/dicom/useFrameAwareImageIds.ts` (new)
- `src/lib/dicom/index.ts` (new)
- `src/components/medical/DicomViewer/AnnotationWorkspace.tsx` (modified)
- `src/lib/mock/dicomData.ts` (modified - added LUNG)
- `src/components/layout/AppHeader.tsx` (modified - logo sizing)

Summary:
1. Primary Request and Intent:
   - Fix logo sizing in header to work with new dimensions (394x112 pixels, wide landscape)
   - Implement multi-frame DICOM support so images with multiple slices (like ITK-SNAP displays) show all slices in the annotation tool
   - Implement "Solution 1: Frame-aware ImageId pipeline" to detect NumberOfFrames and generate per-frame imageIds
   - Debug why liver.dcm only showed 3 slices instead of 100+
   - Clear Next.js cache after logo replacement
   - Investigate annotation rendering lag during pan/zoom on network deployment

2. Key Technical Concepts:
   - DICOM NumberOfFrames tag (0028,0008) for multi-frame detection
   - Cornerstone.js frame-aware imageIds (`wadouri:url?frame=N`)
   - dicom-parser library for parsing DICOM headers
   - Next.js Image component with aspect ratio handling
   - StackViewport for slice navigation
   - PM2 and Nginx for production deployment
   - Annotation rendering synchronization with viewport transforms

3. Files and Code Sections:

   - **`src/lib/dicom/frameDetection.ts`** (NEW)
     - Core DICOM parsing utility to detect multi-frame files
     - Parses NumberOfFrames, Rows, Columns, Modality, etc.
     - Generates frame-aware imageIds
     ```typescript
     export function parseDicomFrameInfo(arrayBuffer: ArrayBuffer): DicomFrameInfo {
       console.log('[FrameDetection] parseDicomFrameInfo called, buffer size:', arrayBuffer.byteLength);
       const byteArray = new Uint8Array(arrayBuffer);
       const dataSet = dicomParser.parseDicom(byteArray);
       const numberOfFramesStr = dataSet.string('x00280008');
       const numberOfFrames = numberOfFramesStr ? parseInt(numberOfFramesStr, 10) : 1;
       // ... extracts rows, columns, modality, etc.
     }

     export function generateFrameImageIds(baseUrl: string, numberOfFrames: number): string[] {
       if (numberOfFrames <= 1) {
         return [`wadouri:${baseUrl}`];
       }
       const imageIds: string[] = [];
       for (let frame = 1; frame <= numberOfFrames; frame++) {
         imageIds.push(`wadouri:${baseUrl}?frame=${frame}`);
       }
       return imageIds;
     }
     ```

   - **`src/lib/dicom/useFrameAwareImageIds.ts`** (NEW)
     - React hook that uses frameDetection to generate imageIds
     - Handles caching, loading states, URL deduplication
     ```typescript
     export function useFrameAwareImageIds(fileUrls: string[], enabled: boolean = true): FrameAwareImageIdsResult {
       // Deduplicates URLs, fetches DICOM headers, generates frame-aware imageIds
       const uniqueUrls = [...new Set(fileUrls)];
       for (const url of uniqueUrls) {
         const ids = await generateImageIdsFromDicom(url);
         allImageIds.push(...ids);
       }
     }
     ```

   - **`src/lib/dicom/index.ts`** (NEW)
     - Barrel exports for the dicom utilities

   - **`src/components/medical/DicomViewer/AnnotationWorkspace.tsx`** (MODIFIED)
     - Integrated useFrameAwareImageIds hook
     - Added fileUrls extraction from instances
     - Updated stack navigation to use actual frame count
     ```typescript
     import { useFrameAwareImageIds } from '@/lib/dicom';
     
     // Extract file URLs from instances for frame-aware loading
     const fileUrls = useMemo(() => {
       // ... extracts _staticUrl or _localUrl from instances
     }, [instances, selectedSeriesUID, needsLocalImageIds]);

     // Use frame-aware imageIds hook
     const { imageIds: frameAwareImageIds, isLoading: frameDetectionLoading } = 
       useFrameAwareImageIds(fileUrls, needsLocalImageIds && fileUrls.length > 0);

     // Update total images count when imageIds change
     useEffect(() => {
       if (imageIds.length > 0) {
         setActualTotalImages(imageIds.length);
       }
     }, [imageIds.length]);
     ```

   - **`src/lib/mock/dicomData.ts`** (MODIFIED)
     - Added LUNG to STATIC_DICOM_FILES
     - Added lung study, series, and instance entries
     ```typescript
     export const STATIC_DICOM_FILES = {
       CT_SMALL: '/dicom/CT_small.dcm',
       LIVER: '/dicom/liver.dcm',
       LUNG: '/dicom/lung.dcm',  // Added
       // ...
     }
     ```

   - **`src/components/layout/AppHeader.tsx`** (MODIFIED)
     - Updated logo dimensions for 394x112 aspect ratio
     ```typescript
     <Image
       src={siteConfig.logo}
       alt={siteConfig.name}
       width={394}
       height={112}
       className="h-12 w-auto object-contain"
       priority
     />
     ```

4. Errors and Fixes:
   - **Liver.dcm only showing 3 slices instead of 100+**:
     - Debug logs revealed NumberOfFrames tag = 3, Modality = 'SEG', file size ~100KB
     - Root cause: The liver.dcm file in public/dicom/ is a small segmentation file, NOT the multi-slice CT volume ITK-SNAP was showing
     - Not a code bug - user needs to replace with actual multi-slice DICOM file
   
   - **Logo appearing too small**:
     - Multiple iterations adjusting width/height/className
     - Final fix: Used actual image dimensions (394x112) with h-12 class

   - **Frame detection not triggering**:
     - Added extensive console.log debugging
     - Confirmed frame detection IS working - file just has 3 frames

5. Problem Solving:
   - Implemented complete frame-aware DICOM loading pipeline
   - Frame detection working correctly (verified via debug logs)
   - Identified that test DICOM files don't have many frames - user needs proper multi-frame DICOM files to test
   - Network deployment annotation lag identified as potential issue with annotation rendering synchronization during pan/zoom

6. All User Messages:
   - "can you try working with the new dimensions again"
   - "The logo still looks quite small"
   - "What are the current dimensions of my logo image"
   - "So, is it possible for us to incorporate the same functionality as ITK-snap to have multiple slices or its not possble. Answer donot modify anything"
   - "Can you please implement this: [Solution 1 details]"
   - "These are the proposed solutions. Look at them and find the best solution you can implement."
   - "i want you to implement solution 1"
   - "What is our Tech stack"
   - "When i used ITKsnap the lung.dcm image had more than a 100 slices but after the updates, when i open the lung.dcm image, it only has three slices. What could be causing this?"
   - "My console errors: [detailed debug output]"
   - "Lets focus on other issues till i have more images i can test. I replaced the PeakPoint Services Logo design.png..."
   - "Great, I have another issue. After cloning my GitHub repository for the tool onto my server and setting up Nginx and PM2... I notice a lag when using the pan and zoom functions."
   - "you can investigate"

7. Pending Tasks:
   - Investigate annotation rendering implementation for pan/zoom lag optimization
   - Test multi-frame DICOM loading when user provides proper multi-frame files

8. Current Work:
   User reported annotation lag during pan/zoom on network deployment and asked me to investigate the annotation rendering implementation. I had just started the investigation by creating a todo item when the summary was requested.

   User's exact request: "you can investigate" (in response to my offer to investigate the current annotation rendering implementation to identify specific optimization opportunities for the pan/zoom lag issue).

9. Optional Next Step:
   Investigate the Cornerstone.js annotation rendering code in the codebase, specifically:
   - How annotations are rendered during viewport transforms
   - The relationship between viewport canvas and annotation overlay
   - Event handlers for pan/zoom that trigger annotation updates
   
   Direct quote from conversation:
   - User: "you can investigate"
   - Prior context: "Would you like me to investigate the current annotation rendering implementation to identify specific optimization opportunities?".

If you need specific details from before compaction (like exact code snippets, error messages, or content you generated), read the full transcript at: C:\Users\Claire Makuyana\.claude\projects\c--Users-Claire-Makuyana-PeakPoint-Projects-MRI-Scan-Reading-Tool\0f6bc7be-5429-4154-9ab8-999467762b01.jsonl
Please continue the conversation from where we left it off without asking the user any further questions. Continue with the last task that you were asked to work on.
Show less
I'll continue investigating the annotation rendering implementation for pan/zoom lag optimization. Let me examine the key components that handle annotation rendering during viewport transforms.

Read c:\Users\Claire Makuyana\PeakPoint Projects\MRI_Scan_Reading_Tool\src\components\medical\DicomViewer\AnnotationWorkspace.tsx
Read c:\Users\Claire Makuyana\PeakPoint Projects\MRI_Scan_Reading_Tool\src\components\medical\DicomViewer\Viewport.tsx
Now let me examine the AnnotationCanvas component which handles the actual annotation rendering and is likely a key source of the pan/zoom lag.

Read c:\Users\Claire Makuyana\PeakPoint Projects\MRI_Scan_Reading_Tool\src\components\medical\DicomViewer\AnnotationCanvas.tsx
Grep "CAMERA_MODIFIED|IMAGE_RENDERED|viewport.*transform|canvas.*transform" (in c:\Users\Claire Makuyana\PeakPoint Projects\MRI_Scan_Reading_Tool\src)
1 line of output
Update Todos

Investigate annotation rendering implementation for pan/zoom lag

Identify optimization opportunities for network deployment

Potential Solutions:

I've completed my investigation of the annotation rendering implementation. Here's my analysis of the pan/zoom lag issue and potential optimization opportunities:

Analysis: Pan/Zoom Lag in AnnotationCanvas
Current Architecture
The AnnotationCanvas component uses a hybrid rendering approach:

Two-canvas system (AnnotationCanvas.tsx:177-179):

staticCanvasRef: Renders finalized annotations
activeCanvasRef: Renders current stroke, cursor, and previews
Event-driven rendering (AnnotationCanvas.tsx:1048-1083):

IMAGE_RENDERED: Triggers full redraw synchronized with Cornerstone
CAMERA_MODIFIED / CAMERA_RESET: Sets dirty flags only (doesn't draw immediately)
RAF (requestAnimationFrame) fallback for cursor updates during mouse movement
Identified Performance Issues for Network Deployment
World-to-Canvas Coordinate Conversion (AnnotationCanvas.tsx:344-353):

Every annotation point requires a viewport.worldToCanvas() call during rendering
On pan/zoom, all annotations need re-conversion (potentially hundreds of points)
Over network with latency, this synchronous work compounds
Full Canvas Redraw on Every Frame (AnnotationCanvas.tsx:476-625):

drawStatic() clears and redraws ALL annotations every time
No incremental rendering or caching of transformed paths
Complex annotations (brush strokes with many points) are expensive
Synchronous CAMERA_MODIFIED Handling (AnnotationCanvas.tsx:1059-1065):

Sets dirty flags but doesn't debounce/throttle
During rapid pan/zoom, many IMAGE_RENDERED events trigger full redraws
No Path Caching (AnnotationCanvas.tsx:486-520):

Brush strokes iterate through every point on each render
Could cache pre-computed canvas paths and only regenerate on camera change
Recommended Optimizations
Throttle Camera Events: Limit IMAGE_RENDERED handling during active pan/zoom to 16-30ms intervals

Path Caching: Cache world-to-canvas conversions; only recalculate when camera changes

Canvas Layer Optimization: Use OffscreenCanvas or pre-rendered bitmap caching for static annotations

Debounce Static Redraws: During pan/zoom, only redraw the active canvas (cursor) frequently; defer static canvas updates

Point Decimation: For large brush strokes, use Douglas-Peucker or similar algorithm to reduce point count during pan/zoom

The current implementation is well-architected for local use but could benefit from these optimizations for network deployment where latency affects frame timing.

To do:

Please look at the problem, the investigations and provide feedback on the best approach to fix the lag issue.





### Planner Response

Based on the investigation findings, here's my analysis and recommendation for the **best approach** to fix the pan/zoom annotation lag:

## Recommended Solution: **Throttled Camera Events + Path Caching**

This is a two-part optimization that addresses the root causes with minimal code changes and maximum impact:

### Priority 1: Throttle Camera Event Handling (Quick Win)

**Why this first:**
- The current implementation triggers a full canvas redraw on *every* `IMAGE_RENDERED` event during pan/zoom
- On a network with even 50-100ms latency, these events pile up and create visible lag
- This is the fastest fix with immediate impact

**Implementation approach:**
```typescript
// In AnnotationCanvas.tsx - throttle redraws to ~30fps during interaction
const throttledRedraw = useRef(throttle(() => {
  if (staticCanvasRef.current && viewportRef.current) {
    drawStatic();
  }
}, 33)); // ~30fps
```

### Priority 2: Cache World-to-Canvas Transformations

**Why this matters:**
- Currently, `worldToCanvas()` is called for every annotation point on every frame
- Brush strokes with hundreds of points cause exponential slowdown
- Caching the conversion matrix and only recalculating on actual camera changes eliminates redundant work

**Implementation approach:**
- Store the last camera position/zoom
- Only regenerate canvas paths when camera actually changes
- Reuse cached canvas coordinates for static redraws

---

## Why NOT the Other Options?

| Optimization | Verdict | Reason |
|-------------|---------|--------|
| OffscreenCanvas | Overkill | Adds complexity; browser support varies |
| Point Decimation | Risky | May affect annotation accuracy |
| Debounce Static Redraws | Partial | Helps, but doesn't fix the core coordinate conversion cost |
| Full Canvas Layer Rewrite | Too invasive | The current architecture is sound; just needs tuning |

---

## Recommended Implementation Order

1. **Throttle `IMAGE_RENDERED` handler** → Immediate lag reduction
2. **Add camera change detection** → Skip redraws if nothing changed
3. **Cache Path2D objects** → Avoid rebuilding brush stroke paths
4. **Optional: Disable annotations during drag** → Last resort if still laggy

Would you like me to implement these optimizations? I can start with the throttling solution first, which should provide the most noticeable improvement with the least risk.

### User Input

Feel free to start implementing. Can you provide the steps/ phases to follow for accountability before we start implementation.

*Searched filesystem*

*Searched filesystem*

*Grep searched codebase*

*Edited relevant file*

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

*Edited relevant file*

### User Input

can you follow the phases you listed in the implementation_plan.md file to fix the lag issue

*Edited relevant file*

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I have a clear picture of where to add the throttle utility and where `redrawOnRender` is called. Let me implement Phase 1:

*Edited relevant file*

### Planner Response

Now I need to add the throttled version of drawStatic and modify the `redrawOnRender` function. Let me view the current state of the file around where these functions are defined:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I can see the `redrawOnRender` function (lines 1081-1094). I need to add:
1. A ref to store the throttled functions
2. Modify `redrawOnRender` to use the throttled `drawStatic`

Let me also add the camera change tracking ref for Phase 2. I'll implement both Phase 1 and Phase 2 together since they work in the same area:

*Edited relevant file*

### Planner Response

Now I need to update the `redrawOnRender` function to use the throttled drawing and camera change detection. Let me view the current state:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I'll update the `redrawOnRender` function to implement the throttling and camera change detection. I'll also add the helper function for camera change detection:

*Edited relevant file*

### Planner Response

Now I need to ensure that when `redrawAll` is called (for initial render, slice changes, etc.), it flushes the throttle and does an immediate redraw. Let me also update the `redrawAll` function:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

I need to update `redrawAll` to flush the throttle before doing immediate redraws (for slice changes, initial render, etc.):

*Edited relevant file*

### Planner Response

Now let me update the task.md to reflect progress and run the build to verify no TypeScript errors:

*Edited relevant file*

*User accepted the command `npm run build 2>&1 | Select-Object -First 50`*

*Checked command status*

*Checked command status*

*Checked command status*

*Checked command status*

### Planner Response

The build succeeded with no TypeScript errors. Now let me switch to VERIFICATION mode and create a walkthrough documenting the changes:

*Edited relevant file*

*Edited relevant file*

### User Input

forward-logs-shared.ts:95 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
forward-logs-shared.ts:95 [HMR] connected
Fetch finished loading: GET "<URL>".
Fetch finished loading: GET "<URL>".
Fetch finished loading: GET "<URL>".
Fetch finished loading: GET "<URL>".
Fetch finished loading: GET "<URL>".
Fetch finished loading: GET "<URL>".
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
[Violation] 'message' handler took <N>ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 1549ms
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 1, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:140 [AnnotationWorkspace] sortedInstances: [{…}]
AnnotationWorkspace.tsx:162 [AnnotationWorkspace] fileUrls result: ['http://localhost:3000/dicom/liver.dcm']
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 1, selectedSeriesUID: 'static-liver-series-1', needsLocalImageIds: true, isLocalStudy: false, isStaticStudy: true}
AnnotationWorkspace.tsx:140 [AnnotationWorkspace] sortedInstances: [{…}]
AnnotationWorkspace.tsx:162 [AnnotationWorkspace] fileUrls result: ['http://localhost:3000/dicom/liver.dcm']
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: true fileUrls: ['http://localhost:3000/dicom/liver.dcm']
useFrameAwareImageIds.ts:68 [useFrameAwareImageIds] Starting to load imageIds for 1 URLs
useFrameAwareImageIds.ts:77 [useFrameAwareImageIds] Unique URLs: ['http://localhost:3000/dicom/liver.dcm']
frameDetection.ts:197 [FrameDetection] generateImageIdsFromDicom called for URL: http://localhost:3000/dicom/liver.dcm
frameDetection.ts:129 [FrameDetection] fetchDicomFrameInfo called for URL: http://localhost:3000/dicom/liver.dcm
frameDetection.ts:137 [FrameDetection] Fetch successful, arrayBuffer size: 102630
frameDetection.ts:48 [FrameDetection] parseDicomFrameInfo called, buffer size: 102630
frameDetection.ts:57 [FrameDetection] NumberOfFrames tag (0028,0008): 3 -> parsed: 3
frameDetection.ts:62 [FrameDetection] PixelData element found, length: 98304
frameDetection.ts:96 [FrameDetection] Extracted metadata: {numberOfFrames: 3, rows: 512, columns: 512, modality: 'SEG', bitsAllocated: 1, …}
frameDetection.ts:201 [FrameDetection] Frame info retrieved, numberOfFrames: 3
frameDetection.ts:204 [FrameDetection] Generated imageIds count: 3
frameDetection.ts:206 [FrameDetection] Generated imageIds: (3) ['wadouri:http://localhost:3000/dicom/liver.dcm?frame=1', 'wadouri:http://localhost:3000/dicom/liver.dcm?frame=2', 'wadouri:http://localhost:3000/dicom/liver.dcm?frame=3']
useFrameAwareImageIds.ts:93 [useFrameAwareImageIds] Successfully generated 3 imageIds
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 1344ms
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: true fileUrls: ['http://localhost:3000/dicom/liver.dcm']
useFrameAwareImageIds.ts:59 [useFrameAwareImageIds] Skipping - already loaded these URLs
setup.ts:50 CornerstoneRender: using GPU rendering
Viewport.tsx:267 XHR finished loading: GET "http://localhost:3000/dicom/liver.dcm".
(anonymous) @ xhrRequest.js:103
await in (anonymous)
xhrRequest @ xhrRequest.js:15
load @ dataSetCacheManager.js:50
loadImage @ loadImage.js:104
loadImageFromImageLoader @ imageLoader.js:25
loadAndCacheImage @ imageLoader.js:67
(anonymous) @ StackViewport.js:1474
loadImages @ StackViewport.js:1472
_loadAndDisplayImageGPU @ StackViewport.js:1504
_loadAndDisplayImage @ StackViewport.js:1324
_setImageIdIndex @ StackViewport.js:1658
setStack @ StackViewport.js:1262
Viewport.useEffect.initViewport @ Viewport.tsx:267
await in Viewport.useEffect.initViewport
Viewport.useEffect @ Viewport.tsx:306
react_stack_bottom_frame @ react-dom-client.development.js:28101
runWithFiberInDEV @ react-dom-client.development.js:984
commitHookEffectListMount @ react-dom-client.development.js:13690
commitHookPassiveMountEffects @ react-dom-client.development.js:13777
commitPassiveMountOnFiber @ react-dom-client.development.js:16731
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16937
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16896
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
<Viewport>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AnnotationWorkspace @ AnnotationWorkspace.tsx:472
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<...>
exports.jsx @ react-jsx-runtime.development.js:342
LoadableComponent @ loadable.tsx:65
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LoadableComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
ViewerPage @ page.tsx:53
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<ViewerPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromReadableStream @ react-server-dom-turbopack-client.browser.development.js:5032
module evaluation @ app-index.tsx:211
(anonymous) @ dev-base.ts:244
runModuleExecutionHooks @ dev-base.ts:278
instantiateModule @ dev-base.ts:238
getOrInstantiateModuleFromParent @ dev-base.ts:162
commonJsRequire @ runtime-utils.ts:389
(anonymous) @ app-next-turbopack.ts:11
(anonymous) @ app-bootstrap.ts:79
loadScriptsInSequence @ app-bootstrap.ts:23
appBootstrap @ app-bootstrap.ts:61
module evaluation @ app-next-turbopack.ts:10
(anonymous) @ dev-base.ts:244
runModuleExecutionHooks @ dev-base.ts:278
instantiateModule @ dev-base.ts:238
getOrInstantiateRuntimeModule @ dev-base.ts:128
registerChunk @ runtime-backend-dom.ts:57
await in registerChunk
registerChunk @ dev-base.ts:1149
(anonymous) @ dev-backend-dom.ts:126
(anonymous) @ dev-backend-dom.ts:126
ContextPoolRenderingEngine.js:15 [Violation] 'requestAnimationFrame' handler took 631ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 8066ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
page.tsx:115 [AdminDicom] Loaded 1 studies from IndexedDB
page.tsx:115 [AdminDicom] Loaded 1 studies from IndexedDB
forward-logs-shared.ts:95 [Fast Refresh] done in 1362ms
baseQuery.ts:43   GET http://localhost:8000/dicom/v1/studies?limit=10&page=1 net::ERR_CONNECTION_REFUSED
defaultFetchFn @ fetchBaseQuery.ts:27
(anonymous) @ fetchBaseQuery.ts:254
await in (anonymous)
baseQueryWithReauth @ baseQuery.ts:43
executeRequest @ buildThunks.ts:311
executeEndpoint @ buildThunks.ts:430
(anonymous) @ createAsyncThunk.ts:363
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:282
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
buildHooks.useQuerySubscriptionCommonImpl.usePossiblyImmediateEffect @ buildHooks.ts:1094
react_stack_bottom_frame @ react-dom-client.development.js:28101
runWithFiberInDEV @ react-dom-client.development.js:984
commitHookEffectListMount @ react-dom-client.development.js:13690
commitHookPassiveMountEffects @ react-dom-client.development.js:13777
commitPassiveMountOnFiber @ react-dom-client.development.js:16731
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
<AdminDicomPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromFetch @ react-server-dom-turbopack-client.browser.development.js:4999
createFromNextFetch @ fetch-server-response.ts:487
createFetch @ fetch-server-response.ts:373
fetchServerResponse @ fetch-server-response.ts:195
navigateDynamicallyWithNoPrefetch @ navigation.ts:473
navigate @ navigation.ts:206
navigateReducer @ navigate-reducer.ts:165
clientReducer @ router-reducer.ts:30
action @ app-router-instance.ts:227
runAction @ app-router-instance.ts:107
dispatchAction @ app-router-instance.ts:184
dispatch @ app-router-instance.ts:225
(anonymous) @ use-action-queue.ts:51
startTransition @ react-dom-client.development.js:9208
dispatch @ use-action-queue.ts:50
dispatchAppRouterAction @ use-action-queue.ts:22
dispatchNavigateAction @ app-router-instance.ts:296
(anonymous) @ link.tsx:293
startTransition @ react.development.js:554
linkClicked @ link.tsx:292
onClick @ link.tsx:642
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<a>
exports.jsx @ react-jsx-runtime.development.js:342
LinkComponent @ link.tsx:725
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LinkComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
(anonymous) @ AppSidebar.tsx:107
(anonymous) @ AppSidebar.tsx:106
AppSidebar @ AppSidebar.tsx:94
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<AppSidebar>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AppLayout @ AppLayout.tsx:28
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<AppLayout>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
DashboardLayout @ layout.tsx:47
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<DashboardLayout>
exports.jsx @ react-jsx-runtime.development.js:342
ClientSegmentRoot @ client-segment.tsx:63
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromReadableStream @ react-server-dom-turbopack-client.browser.development.js:5032
module evaluation @ app-index.tsx:211
(anonymous) @ dev-base.ts:244
runModuleExecutionHooks @ dev-base.ts:278
instantiateModule @ dev-base.ts:238
getOrInstantiateModuleFromParent @ dev-base.ts:162
commonJsRequire @ runtime-utils.ts:389
(anonymous) @ app-next-turbopack.ts:11
(anonymous) @ app-bootstrap.ts:79
loadScriptsInSequence @ app-bootstrap.ts:23
appBootstrap @ app-bootstrap.ts:61
module evaluation @ app-next-turbopack.ts:10
(anonymous) @ dev-base.ts:244
runModuleExecutionHooks @ dev-base.ts:278
instantiateModule @ dev-base.ts:238
getOrInstantiateRuntimeModule @ dev-base.ts:128
registerChunk @ runtime-backend-dom.ts:57
await in registerChunk
registerChunk @ dev-base.ts:1149
(anonymous) @ dev-backend-dom.ts:126
(anonymous) @ dev-backend-dom.ts:126
baseQuery.ts:43 Fetch failed loading: GET "http://localhost:8000/dicom/v1/studies?limit=10&page=1".
defaultFetchFn @ fetchBaseQuery.ts:27
(anonymous) @ fetchBaseQuery.ts:254
await in (anonymous)
baseQueryWithReauth @ baseQuery.ts:43
executeRequest @ buildThunks.ts:311
executeEndpoint @ buildThunks.ts:430
(anonymous) @ createAsyncThunk.ts:363
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:282
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
buildHooks.useQuerySubscriptionCommonImpl.usePossiblyImmediateEffect @ buildHooks.ts:1094
react_stack_bottom_frame @ react-dom-client.development.js:28101
runWithFiberInDEV @ react-dom-client.development.js:984
commitHookEffectListMount @ react-dom-client.development.js:13690
commitHookPassiveMountEffects @ react-dom-client.development.js:13777
commitPassiveMountOnFiber @ react-dom-client.development.js:16731
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
<AdminDicomPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromFetch @ react-server-dom-turbopack-client.browser.development.js:4999
createFromNextFetch @ fetch-server-response.ts:487
createFetch @ fetch-server-response.ts:373
fetchServerResponse @ fetch-server-response.ts:195
navigateDynamicallyWithNoPrefetch @ navigation.ts:473
navigate @ navigation.ts:206
navigateReducer @ navigate-reducer.ts:165
clientReducer @ router-reducer.ts:30
action @ app-router-instance.ts:227
runAction @ app-router-instance.ts:107
dispatchAction @ app-router-instance.ts:184
dispatch @ app-router-instance.ts:225
(anonymous) @ use-action-queue.ts:51
startTransition @ react-dom-client.development.js:9208
dispatch @ use-action-queue.ts:50
dispatchAppRouterAction @ use-action-queue.ts:22
dispatchNavigateAction @ app-router-instance.ts:296
(anonymous) @ link.tsx:293
startTransition @ react.development.js:554
linkClicked @ link.tsx:292
onClick @ link.tsx:642
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<a>
exports.jsx @ react-jsx-runtime.development.js:342
LinkComponent @ link.tsx:725
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LinkComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
(anonymous) @ AppSidebar.tsx:107
(anonymous) @ AppSidebar.tsx:106
AppSidebar @ AppSidebar.tsx:94
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<AppSidebar>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AppLayout @ AppLayout.tsx:28
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<AppLayout>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
DashboardLayout @ layout.tsx:47
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<DashboardLayout>
exports.jsx @ react-jsx-runtime.development.js:342
ClientSegmentRoot @ client-segment.tsx:63
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromReadableStream @ react-server-dom-turbopack-client.browser.development.js:5032
module evaluation @ app-index.tsx:211
(anonymous) @ dev-base.ts:244
runModuleExecutionHooks @ dev-base.ts:278
instantiateModule @ dev-base.ts:238
getOrInstantiateModuleFromParent @ dev-base.ts:162
commonJsRequire @ runtime-utils.ts:389
(anonymous) @ app-next-turbopack.ts:11
(anonymous) @ app-bootstrap.ts:79
loadScriptsInSequence @ app-bootstrap.ts:23
appBootstrap @ app-bootstrap.ts:61
module evaluation @ app-next-turbopack.ts:10
(anonymous) @ dev-base.ts:244
runModuleExecutionHooks @ dev-base.ts:278
instantiateModule @ dev-base.ts:238
getOrInstantiateRuntimeModule @ dev-base.ts:128
registerChunk @ runtime-backend-dom.ts:57
await in registerChunk
registerChunk @ dev-base.ts:1149
(anonymous) @ dev-backend-dom.ts:126
(anonymous) @ dev-backend-dom.ts:126
react-dom-client.development.js:20409 [Violation] 'requestAnimationFrame' handler took 277ms
[Violation] 'click' handler took 2552ms
react-dom-client.development.js:20409 [Violation] 'click' handler took 158ms
page.tsx:388 [AdminDicom] Deleted study local-1768165208316-gfyruyf3g from IndexedDB
[Violation] 'change' handler took 245ms
react-dom-client.development.js:20409 [Violation] 'click' handler took 153ms
page.tsx:333 [AdminDicom] Stored study local-1768231320825-wgjjw8ze4 with 1 files in IndexedDB
baseQuery.ts:43   POST http://localhost:8000/dicom/v1/studies/upload net::ERR_CONNECTION_REFUSED
defaultFetchFn @ fetchBaseQuery.ts:27
(anonymous) @ fetchBaseQuery.ts:254
await in (anonymous)
baseQueryWithReauth @ baseQuery.ts:43
executeRequest @ buildThunks.ts:311
executeEndpoint @ buildThunks.ts:430
(anonymous) @ createAsyncThunk.ts:363
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:366
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
buildHooks.buildMutationHook.useCallback[triggerMutation] @ buildHooks.ts:1370
AdminDicomPage.useCallback[handleUpload] @ page.tsx:357
await in AdminDicomPage.useCallback[handleUpload]
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
_c @ button.tsx:57
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateForwardRef @ react-dom-client.development.js:10057
beginWork @ react-dom-client.development.js:12473
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AdminDicomPage @ page.tsx:552
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<AdminDicomPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
baseQuery.ts:43 Fetch failed loading: POST "http://localhost:8000/dicom/v1/studies/upload".
defaultFetchFn @ fetchBaseQuery.ts:27
(anonymous) @ fetchBaseQuery.ts:254
await in (anonymous)
baseQueryWithReauth @ baseQuery.ts:43
executeRequest @ buildThunks.ts:311
executeEndpoint @ buildThunks.ts:430
(anonymous) @ createAsyncThunk.ts:363
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:366
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
buildHooks.buildMutationHook.useCallback[triggerMutation] @ buildHooks.ts:1370
AdminDicomPage.useCallback[handleUpload] @ page.tsx:357
await in AdminDicomPage.useCallback[handleUpload]
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
_c @ button.tsx:57
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateForwardRef @ react-dom-client.development.js:10057
beginWork @ react-dom-client.development.js:12473
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AdminDicomPage @ page.tsx:552
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<AdminDicomPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
page.tsx:361 Backend upload failed, using IndexedDB storage only
baseQuery.ts:43   GET http://localhost:8000/dicom/v1/studies?limit=10&page=1 net::ERR_CONNECTION_REFUSED
defaultFetchFn @ fetchBaseQuery.ts:27
(anonymous) @ fetchBaseQuery.ts:254
await in (anonymous)
baseQueryWithReauth @ baseQuery.ts:43
executeRequest @ buildThunks.ts:311
executeEndpoint @ buildThunks.ts:430
(anonymous) @ createAsyncThunk.ts:363
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:282
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ invalidationByTags.ts:72
defaultNoopBatch @ batch.ts:3
invalidateTags @ invalidationByTags.ts:59
handler @ invalidationByTags.ts:38
(anonymous) @ index.ts:80
(anonymous) @ index.ts:67
(anonymous) @ serializableStateInvariantMiddleware.ts:169
(anonymous) @ redux-thunk.mjs:7
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ createAsyncThunk.ts:399
await in (anonymous)
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:366
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
buildHooks.buildMutationHook.useCallback[triggerMutation] @ buildHooks.ts:1370
AdminDicomPage.useCallback[handleUpload] @ page.tsx:357
await in AdminDicomPage.useCallback[handleUpload]
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
_c @ button.tsx:57
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateForwardRef @ react-dom-client.development.js:10057
beginWork @ react-dom-client.development.js:12473
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AdminDicomPage @ page.tsx:552
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<AdminDicomPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
baseQuery.ts:43 Fetch failed loading: GET "http://localhost:8000/dicom/v1/studies?limit=10&page=1".
defaultFetchFn @ fetchBaseQuery.ts:27
(anonymous) @ fetchBaseQuery.ts:254
await in (anonymous)
baseQueryWithReauth @ baseQuery.ts:43
executeRequest @ buildThunks.ts:311
executeEndpoint @ buildThunks.ts:430
(anonymous) @ createAsyncThunk.ts:363
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:282
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ invalidationByTags.ts:72
defaultNoopBatch @ batch.ts:3
invalidateTags @ invalidationByTags.ts:59
handler @ invalidationByTags.ts:38
(anonymous) @ index.ts:80
(anonymous) @ index.ts:67
(anonymous) @ serializableStateInvariantMiddleware.ts:169
(anonymous) @ redux-thunk.mjs:7
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ createAsyncThunk.ts:399
await in (anonymous)
(anonymous) @ createAsyncThunk.ts:402
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
dispatch @ applyMiddleware.ts:52
(anonymous) @ buildInitiate.ts:366
(anonymous) @ redux-thunk.mjs:5
(anonymous) @ immutableStateInvariantMiddleware.ts:183
(anonymous) @ actionCreatorInvariantMiddleware.ts:29
buildHooks.buildMutationHook.useCallback[triggerMutation] @ buildHooks.ts:1370
AdminDicomPage.useCallback[handleUpload] @ page.tsx:357
await in AdminDicomPage.useCallback[handleUpload]
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
_c @ button.tsx:57
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateForwardRef @ react-dom-client.development.js:10057
beginWork @ react-dom-client.development.js:12473
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AdminDicomPage @ page.tsx:552
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performSyncWorkOnRoot @ react-dom-client.development.js:20397
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:20239
flushSyncWork$1 @ react-dom-client.development.js:18250
batchedUpdates$1 @ react-dom-client.development.js:3383
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<AdminDicomPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
react-dom-client.development.js:20409 [Violation] 'requestAnimationFrame' handler took 289ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 182ms
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: null, needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 0, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:132 [AnnotationWorkspace] fileUrls returning empty array
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: false fileUrls: []
useFrameAwareImageIds.ts:50 [useFrameAwareImageIds] Skipping - not enabled or no URLs
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 1, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:140 [AnnotationWorkspace] sortedInstances: [{…}]
AnnotationWorkspace.tsx:162 [AnnotationWorkspace] fileUrls result: ['blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db']
AnnotationWorkspace.tsx:123 [AnnotationWorkspace] fileUrls useMemo: {instancesLength: 1, selectedSeriesUID: 'local-1768231320825-wgjjw8ze4.1', needsLocalImageIds: true, isLocalStudy: true, isStaticStudy: false}
AnnotationWorkspace.tsx:140 [AnnotationWorkspace] sortedInstances: [{…}]
AnnotationWorkspace.tsx:162 [AnnotationWorkspace] fileUrls result: ['blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db']
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: true fileUrls: ['blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db']
useFrameAwareImageIds.ts:68 [useFrameAwareImageIds] Starting to load imageIds for 1 URLs
useFrameAwareImageIds.ts:77 [useFrameAwareImageIds] Unique URLs: ['blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db']
frameDetection.ts:197 [FrameDetection] generateImageIdsFromDicom called for URL: blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db
frameDetection.ts:129 [FrameDetection] fetchDicomFrameInfo called for URL: blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db
frameDetection.ts:137 [FrameDetection] Fetch successful, arrayBuffer size: 133278
frameDetection.ts:48 [FrameDetection] parseDicomFrameInfo called, buffer size: 133278
frameDetection.ts:57 [FrameDetection] NumberOfFrames tag (0028,0008): undefined -> parsed: 1
frameDetection.ts:62 [FrameDetection] PixelData element found, length: 131072
frameDetection.ts:96 [FrameDetection] Extracted metadata: {numberOfFrames: 1, rows: 256, columns: 256, modality: 'MR', bitsAllocated: 16, …}
frameDetection.ts:201 [FrameDetection] Frame info retrieved, numberOfFrames: 1
frameDetection.ts:204 [FrameDetection] Generated imageIds count: 1
frameDetection.ts:206 [FrameDetection] Generated imageIds: ['wadouri:blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db']
useFrameAwareImageIds.ts:93 [useFrameAwareImageIds] Successfully generated 1 imageIds
frameDetection.ts:131 Fetch finished loading: GET "blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db".
fetchDicomFrameInfo @ frameDetection.ts:131
getCachedFrameInfo @ frameDetection.ts:178
generateImageIdsFromDicom @ frameDetection.ts:200
useFrameAwareImageIds.useCallback[loadImageIds] @ useFrameAwareImageIds.ts:84
useFrameAwareImageIds.useEffect @ useFrameAwareImageIds.ts:113
react_stack_bottom_frame @ react-dom-client.development.js:28101
runWithFiberInDEV @ react-dom-client.development.js:984
commitHookEffectListMount @ react-dom-client.development.js:13690
commitHookPassiveMountEffects @ react-dom-client.development.js:13777
commitPassiveMountOnFiber @ react-dom-client.development.js:16731
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16937
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16896
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
<...>
exports.jsx @ react-jsx-runtime.development.js:342
LoadableComponent @ loadable.tsx:65
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LoadableComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
ViewerPage @ page.tsx:53
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
replayFunctionComponent @ react-dom-client.development.js:10531
replayBeginWork @ react-dom-client.development.js:19027
runWithFiberInDEV @ react-dom-client.development.js:984
replaySuspendedUnitOfWork @ react-dom-client.development.js:19016
renderRootConcurrent @ react-dom-client.development.js:18899
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<ViewerPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
(anonymous) @ react-server-dom-turbopack-client.browser.development.js:4592
initializeModelChunk @ react-server-dom-turbopack-client.browser.development.js:1820
resolveModelChunk @ react-server-dom-turbopack-client.browser.development.js:1664
processFullStringRow @ react-server-dom-turbopack-client.browser.development.js:4422
processFullBinaryRow @ react-server-dom-turbopack-client.browser.development.js:4282
processBinaryChunk @ react-server-dom-turbopack-client.browser.development.js:4495
progress @ react-server-dom-turbopack-client.browser.development.js:4767
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromFetch @ react-server-dom-turbopack-client.browser.development.js:4999
createFromNextFetch @ fetch-server-response.ts:487
createFetch @ fetch-server-response.ts:373
fetchServerResponse @ fetch-server-response.ts:195
navigateDynamicallyWithNoPrefetch @ navigation.ts:473
navigate @ navigation.ts:206
navigateReducer @ navigate-reducer.ts:165
clientReducer @ router-reducer.ts:30
action @ app-router-instance.ts:227
runAction @ app-router-instance.ts:107
dispatchAction @ app-router-instance.ts:184
dispatch @ app-router-instance.ts:225
(anonymous) @ use-action-queue.ts:51
startTransition @ react-dom-client.development.js:9208
dispatch @ use-action-queue.ts:50
dispatchAppRouterAction @ use-action-queue.ts:22
dispatchNavigateAction @ app-router-instance.ts:296
(anonymous) @ link.tsx:293
startTransition @ react.development.js:554
linkClicked @ link.tsx:292
onClick @ link.tsx:642
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<a>
exports.jsx @ react-jsx-runtime.development.js:342
LinkComponent @ link.tsx:725
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LinkComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
(anonymous) @ page.tsx:658
AdminDicomPage @ page.tsx:625
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
useFrameAwareImageIds.ts:47 [useFrameAwareImageIds] loadImageIds called, enabled: true fileUrls: ['blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db']
useFrameAwareImageIds.ts:59 [useFrameAwareImageIds] Skipping - already loaded these URLs
setup.ts:614 [Cornerstone] Using DICOM-embedded W/L: {windowWidth: 502, windowCenter: 211}
AnnotationWorkspace.tsx:247 [AnnotationWorkspace] Setting initial W/L from image: {windowWidth: 502, windowCenter: 211}
Viewport.tsx:267 XHR finished loading: GET "blob:http://localhost:3000/df9cff42-9841-432c-8fa9-94df73c057db".
(anonymous) @ xhrRequest.js:103
await in (anonymous)
xhrRequest @ xhrRequest.js:15
load @ dataSetCacheManager.js:50
loadImage @ loadImage.js:104
loadImageFromImageLoader @ imageLoader.js:25
loadAndCacheImage @ imageLoader.js:67
(anonymous) @ StackViewport.js:1474
loadImages @ StackViewport.js:1472
_loadAndDisplayImageGPU @ StackViewport.js:1504
_loadAndDisplayImage @ StackViewport.js:1324
_setImageIdIndex @ StackViewport.js:1658
setStack @ StackViewport.js:1262
Viewport.useEffect.initViewport @ Viewport.tsx:267
await in Viewport.useEffect.initViewport
Viewport.useEffect @ Viewport.tsx:306
react_stack_bottom_frame @ react-dom-client.development.js:28101
runWithFiberInDEV @ react-dom-client.development.js:984
commitHookEffectListMount @ react-dom-client.development.js:13690
commitHookPassiveMountEffects @ react-dom-client.development.js:13777
commitPassiveMountOnFiber @ react-dom-client.development.js:16731
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16937
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16896
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:17008
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16723
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
commitPassiveMountOnFiber @ react-dom-client.development.js:16751
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:16676
<Viewport>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
AnnotationWorkspace @ AnnotationWorkspace.tsx:472
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<...>
exports.jsx @ react-jsx-runtime.development.js:342
LoadableComponent @ loadable.tsx:65
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LoadableComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
ViewerPage @ page.tsx:53
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
replayFunctionComponent @ react-dom-client.development.js:10531
replayBeginWork @ react-dom-client.development.js:19027
runWithFiberInDEV @ react-dom-client.development.js:984
replaySuspendedUnitOfWork @ react-dom-client.development.js:19016
renderRootConcurrent @ react-dom-client.development.js:18899
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<ViewerPage>
exports.jsx @ react-jsx-runtime.development.js:342
ClientPageRoot @ client-page.tsx:83
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12083
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopConcurrentByScheduler @ react-dom-client.development.js:18989
renderRootConcurrent @ react-dom-client.development.js:18971
performWorkOnRoot @ react-dom-client.development.js:17832
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM581 <anonymous>:1
Function.all @ VM581 <anonymous>:1
initializeElement @ react-server-dom-turbopack-client.browser.development.js:1932
(anonymous) @ react-server-dom-turbopack-client.browser.development.js:4592
initializeModelChunk @ react-server-dom-turbopack-client.browser.development.js:1820
resolveModelChunk @ react-server-dom-turbopack-client.browser.development.js:1664
processFullStringRow @ react-server-dom-turbopack-client.browser.development.js:4422
processFullBinaryRow @ react-server-dom-turbopack-client.browser.development.js:4282
processBinaryChunk @ react-server-dom-turbopack-client.browser.development.js:4495
progress @ react-server-dom-turbopack-client.browser.development.js:4767
"use server"
ResponseInstance @ react-server-dom-turbopack-client.browser.development.js:2767
createResponseFromOptions @ react-server-dom-turbopack-client.browser.development.js:4628
exports.createFromFetch @ react-server-dom-turbopack-client.browser.development.js:4999
createFromNextFetch @ fetch-server-response.ts:487
createFetch @ fetch-server-response.ts:373
fetchServerResponse @ fetch-server-response.ts:195
navigateDynamicallyWithNoPrefetch @ navigation.ts:473
navigate @ navigation.ts:206
navigateReducer @ navigate-reducer.ts:165
clientReducer @ router-reducer.ts:30
action @ app-router-instance.ts:227
runAction @ app-router-instance.ts:107
dispatchAction @ app-router-instance.ts:184
dispatch @ app-router-instance.ts:225
(anonymous) @ use-action-queue.ts:51
startTransition @ react-dom-client.development.js:9208
dispatch @ use-action-queue.ts:50
dispatchAppRouterAction @ use-action-queue.ts:22
dispatchNavigateAction @ app-router-instance.ts:296
(anonymous) @ link.tsx:293
startTransition @ react.development.js:554
linkClicked @ link.tsx:292
onClick @ link.tsx:642
executeDispatch @ react-dom-client.development.js:20541
runWithFiberInDEV @ react-dom-client.development.js:984
processDispatchQueue @ react-dom-client.development.js:20591
(anonymous) @ react-dom-client.development.js:21162
batchedUpdates$1 @ react-dom-client.development.js:3375
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20745
dispatchEvent @ react-dom-client.development.js:25671
dispatchDiscreteEvent @ react-dom-client.development.js:25639
<a>
exports.jsx @ react-jsx-runtime.development.js:342
LinkComponent @ link.tsx:725
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45
<LinkComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:342
(anonymous) @ page.tsx:658
AdminDicomPage @ page.tsx:625
react_stack_bottom_frame @ react-dom-client.development.js:28016
renderWithHooksAgain @ react-dom-client.development.js:8082
renderWithHooks @ react-dom-client.development.js:7994
updateFunctionComponent @ react-dom-client.development.js:10499
beginWork @ react-dom-client.development.js:12134
runWithFiberInDEV @ react-dom-client.development.js:984
performUnitOfWork @ react-dom-client.development.js:18995
workLoopSync @ react-dom-client.development.js:18823
renderRootSync @ react-dom-client.development.js:18804
performWorkOnRoot @ react-dom-client.development.js:17833
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:20382
performWorkUntilDeadline @ scheduler.development.js:45


### Planner Response

Thanks for sharing the console output! I can see the application is running locally and the optimization code is now deployed (confirmed by the `[Fast Refresh] done` messages).

**Key Observations from the logs:**

1. ✅ **DICOM loading working** - Both static and local studies are loading correctly
2. ✅ **Frame detection working** - The liver.dcm shows 3 frames, your uploaded MR image shows 1 frame
3. ⚠️ **Violation warnings** - The `'requestAnimationFrame' handler took Xms` and `'message' handler took Xms` warnings are normal browser performance hints in development mode, not errors

**Were you able to test pan/zoom with annotations?**

The real test for the lag fix is:
1. Draw some brush annotations on the image
2. Pan/zoom around
3. Observe if annotations now stay synchronized with the image better than before

If you tested on your network deployment and the lag is still present, let me know and I can implement **Phase 3 (path caching)** for additional optimization.

Also note: The `ERR_CONNECTION_REFUSED` errors for `localhost:8000` are expected since the backend API isn't running - the tool correctly falls back to IndexedDB storage for local studies.

### User Input

There is still a lag.

*Edited relevant file*

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now let me view the `drawStatic` function to understand how to add path caching:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I understand the `drawStatic` function (lines 537-686). The key insight is that we're calling `worldToCanvas()` for every point of every annotation on every redraw. For a brush stroke with 100 points, that's 100 conversions per redraw.

The solution is to use an **OffscreenCanvas** to pre-render the annotations at world coordinates, then use a single transform to position it correctly during pan/zoom. This is a more efficient approach than caching individual path points.

Let me implement an alternative approach that's simpler and more effective: **maintaining a bitmap cache** of the static annotations and only applying CSS transforms during pan/zoom, then re-rendering the bitmap when pan/zoom ends.

*Edited relevant file*

### Planner Response

Now I need to implement the core optimization. The key strategy is:
1. During interaction (pan/zoom), use CSS transforms on the canvas instead of re-rendering
2. When interaction stops, do a full re-render with correct positions

Let me view the redrawOnRender function to modify it:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

I see the current implementation. The issue is that even with throttling, we're still doing full world-to-canvas conversions on every redraw. Let me implement a more aggressive optimization: **during rapid pan/zoom, use a pre-rendered bitmap and apply CSS transforms, then re-render when interaction stops**.

*Edited relevant file*

### Planner Response

Now I need to update the `redrawOnRender` function to skip drawing during active interaction (the actual rendering will happen when interaction ends):

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I'll update the `redrawOnRender` function to skip the static canvas during active interaction (since we'll do a full redraw when interaction ends):

*Edited relevant file*

### Planner Response

Now let me run the build to verify the changes compile correctly, and update the task:

*Edited relevant file*

*User accepted the command `npm run build 2>&1 | Select-Object -First 50`*

*Checked command status*

*Checked command status*

*Checked command status*

### Planner Response

Build succeeded! Let me update the walkthrough and notify the user:

*Edited relevant file*

### User Input

The lag issue is still not resolved

### Planner Response

The issue persists - let me investigate more deeply. The problem likely isn't just about reducing redraws, but about the fundamental synchronization between Cornerstone's WebGL canvas and our annotation overlay.

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

*Viewed [Viewport.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/Viewport.tsx) *

### Planner Response

Now I see the issue. Looking at the Viewport.tsx, the [AnnotationCanvas](cci:2://file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx:207:0-214:1) is rendered as a child inside the same div as the Cornerstone canvas (elementRef). Let me look at how AnnotationCanvas is positioned:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I understand the full picture. The fundamental issue is:

1. **Cornerstone's canvas** uses WebGL and updates transforms instantly via GPU
2. **Our annotation canvas** is a separate HTML5 Canvas that re-renders by recalculating all world-to-canvas coordinates
3. Even with throttling, the coordinate recalculation happens AFTER the image has moved, creating visible lag

**The solution**: Apply CSS transforms to the static canvas during pan/zoom to move it in sync with the image, then do a full re-render when interaction ends to "bake" the correct positions.

*Viewed [task.md](file:///C:/Users/Claire%20Makuyana/.gemini/antigravity/brain/183adca2-7c5b-4a57-9bf1-30187589795e/task.md) *

### Planner Response

Now let me implement the CSS transform approach. The key is to:
1. Capture the camera state when we first render annotations
2. During pan/zoom, calculate the camera delta and apply CSS transform to move the canvas
3. When interaction ends, do a full re-render and reset the transform

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I need to implement CSS transforms on the static canvas. I'll add a state for tracking the transform and apply it during interaction:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Let me add a state to track the CSS transform for the static canvas, and then update the canvas to use that transform during interaction:

*Edited relevant file*

### Planner Response

Now I need to:
1. Update `drawStatic` to store the baseline camera state
2. Update [handleCameraModified](cci:1://file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx:1176:6-1202:8) to calculate the CSS transform delta
3. Apply the transform to the static canvas, and reset when interaction ends

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now let me update the handleCameraModified to calculate the CSS transform, and also update drawStatic to store the baseline. Let me replace the handleCameraModified logic:

*Edited relevant file*

### Planner Response

Now I need to:
1. Apply the CSS transform to the static canvas element in the render
2. Update drawStatic to store the baseline camera state after rendering

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

I see drawStatic ends at line 697. I need to add baseline camera capture at the end of drawStatic. Let me do that and apply the transform to the canvas:

*Edited relevant file*

### Planner Response

Now I need to apply the CSS transform to the static canvas JSX. Let me find and update the canvas element:

*Viewed [AnnotationCanvas.tsx](file:///c:/Users/Claire%20Makuyana/PeakPoint%20Projects/MRI_Scan_Reading_Tool/src/components/medical/DicomViewer/AnnotationCanvas.tsx) *

### Planner Response

Now I can see the static canvas at lines 2074-2078. Let me apply the CSS transform:

*Edited relevant file*

*Edited relevant file*

### Planner Response

Now let me run the build to verify the changes compile correctly:

*User accepted the command `npm run build 2>&1 | Select-Object -First 60`*

*Checked command status*
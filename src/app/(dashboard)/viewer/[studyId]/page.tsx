'use client';

/**
 * DICOM Viewer Page (RedBrick AI-Inspired)
 * Full annotation workspace with 4-zone layout
 */

import { use } from 'react';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import {
  useSaveProgressMutation,
  useSubmitTaskMutation,
} from '@/features/annotationTasks';
import { useAnnotationStore } from '@/features/annotations';

// Dynamically import AnnotationWorkspace to avoid SSR issues with Cornerstone
const AnnotationWorkspace = dynamic(
  () => import('@/components/medical/DicomViewer/AnnotationWorkspace'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-[#0D1117]" data-theme="app">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-[#8B949E]">Loading viewer...</p>
        </div>
      </div>
    ),
  }
);

interface ViewerPageProps {
  params: Promise<{ studyId: string }>;
}

export default function ViewerPage({ params }: ViewerPageProps) {
  const { studyId } = use(params);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API mutations
  const [saveProgress] = useSaveProgressMutation();
  const [submitTask] = useSubmitTaskMutation();

  // Get annotations from store
  const annotations = useAnnotationStore((state) => state.annotations);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Calculate progress based on annotations or other metrics
      const progress = annotations.length > 0 ? Math.min(annotations.length * 10, 100) : 0;
      
      await saveProgress({
        taskId: studyId,
        progress,
      }).unwrap();
      
      console.log('Annotations saved successfully');
    } catch (error) {
      console.error('Failed to save annotations:', error);
      // In demo mode, just log success
      console.log('Demo mode: Save simulated');
    } finally {
      setIsSaving(false);
    }
  }, [studyId, annotations, saveProgress, isSaving]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitTask({
        taskId: studyId,
        annotations: annotations,
        notes: 'Submitted for review',
      }).unwrap();
      
      console.log('Annotations submitted successfully');
      // Could redirect to annotation page here
    } catch (error) {
      console.error('Failed to submit annotations:', error);
      // In demo mode, just log success
      console.log('Demo mode: Submit simulated');
    } finally {
      setIsSubmitting(false);
    }
  }, [studyId, annotations, submitTask, isSubmitting]);

  return (
    <div className="h-screen overflow-hidden" data-theme="app">
      <AnnotationWorkspace
        studyInstanceUID={studyId}
        onLoad={handleLoad}
        onSave={handleSave}
        onSubmit={handleSubmit}
        className="h-full"
      />
    </div>
  );
}

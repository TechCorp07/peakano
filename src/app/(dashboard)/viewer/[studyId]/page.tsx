'use client';

/**
 * DICOM Viewer Page (RedBrick AI-Inspired)
 * Full annotation workspace with 4-zone layout
 */

import { use } from 'react';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

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

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleSave = useCallback(() => {
    console.log('Saving annotations...');
    // TODO: Implement save functionality
  }, []);

  const handleSubmit = useCallback(() => {
    console.log('Submitting annotations...');
    // TODO: Implement submit functionality
  }, []);

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

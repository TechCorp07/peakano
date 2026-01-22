'use client';

/**
 * Admin DICOM Management Page (Dark Theme)
 * Upload and manage DICOM studies with local file processing
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Upload,
  FileUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  File,
  HardDrive,
  ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUploadDicomMutation, useGetStudiesQuery, useDeleteStudyMutation } from '@/features/dicom/dicomApi';
import { mockStudies } from '@/lib/mock/dicomData';
import { cn } from '@/lib/utils';
import type { Study, Modality } from '@/types/dicom';
import {
  storeStudyWithFiles,
  getAllStudies,
  getStudyFilesAsBlobUrls,
  deleteStudy as deleteStoredStudy,
  clearAllData as clearAllStoredData,
  type StoredStudy,
} from '@/lib/storage/dicomStorage';

// Valid modality values
const VALID_MODALITIES: Modality[] = ['CT', 'MR', 'XR', 'US', 'NM', 'PT', 'CR', 'DX', 'MG', 'OT'];

function parseModality(value: string | undefined): Modality {
  const upper = (value || 'OT').toUpperCase();
  if (VALID_MODALITIES.includes(upper as Modality)) {
    return upper as Modality;
  }
  return 'OT';
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  studyUID?: string;
}

interface LocalStudy extends Study {
  isLocal: true;
  objectUrls: string[];
  // Note: files are now stored in IndexedDB, not in memory
}

// Note: Studies are now stored in IndexedDB via dicomStorage.ts
// This key is kept for backwards compatibility/migration
const LOCAL_STUDIES_KEY = 'mri-platform-local-studies';

export default function AdminDicomPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localStudies, setLocalStudies] = useState<LocalStudy[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  const [uploadDicom, { isLoading: isUploading }] = useUploadDicomMutation();
  const { data: studiesData, isLoading: studiesLoading, error: studiesError, refetch } = useGetStudiesQuery({ limit: 10 });
  const [deleteStudy] = useDeleteStudyMutation();

  // Load local studies from IndexedDB on mount
  useEffect(() => {
    async function loadStudies() {
      try {
        setIsLoadingLocal(true);
        const storedStudies = await getAllStudies();

        // Convert stored studies to LocalStudy format and create fresh blob URLs
        const localStudiesWithUrls: LocalStudy[] = await Promise.all(
          storedStudies.map(async (stored: StoredStudy) => {
            // Create fresh blob URLs from IndexedDB data
            const objectUrls = await getStudyFilesAsBlobUrls(stored.studyInstanceUID);

            return {
              id: `local-${stored.studyInstanceUID}`,
              studyInstanceUID: stored.studyInstanceUID,
              studyDate: stored.studyDate || '',
              studyTime: '',
              studyDescription: stored.studyDescription || 'Uploaded Study',
              accessionNumber: '',
              patientId: stored.patientId || 'LOCAL',
              patientName: stored.patientName || 'Uploaded Patient',
              patientBirthDate: '',
              patientSex: '',
              modality: parseModality(stored.modality),
              numberOfSeries: 1,
              numberOfInstances: stored.numberOfInstances,
              createdAt: stored.createdAt,
              updatedAt: stored.updatedAt,
              isLocal: true as const,
              objectUrls,
            };
          })
        );

        setLocalStudies(localStudiesWithUrls);
        console.log(`[AdminDicom] Loaded ${localStudiesWithUrls.length} studies from IndexedDB`);

        // Clean up old localStorage data if exists (migration)
        if (localStorage.getItem(LOCAL_STUDIES_KEY)) {
          localStorage.removeItem(LOCAL_STUDIES_KEY);
          console.log('[AdminDicom] Cleared deprecated localStorage data');
        }
      } catch (e) {
        console.error('Failed to load local studies from IndexedDB:', e);
      } finally {
        setIsLoadingLocal(false);
      }
    }

    loadStudies();
  }, []);

  // Note: Studies are now persisted to IndexedDB during upload, not here
  // This effect is no longer needed for persistence
  // Blob URLs are created fresh on each page load from IndexedDB data

  // Combine API studies, mock studies, and local studies
  const displayStudies = useMemo(() => {
    const apiStudies = studiesData?.items || [];

    // If we have API studies, use them
    if (apiStudies.length > 0) {
      return [...localStudies, ...apiStudies];
    }

    // Otherwise use mock + local studies
    return [...localStudies, ...mockStudies.slice(0, 10)];
  }, [studiesData, localStudies]);

  const isUsingMockData = studiesError || (!studiesLoading && (!studiesData?.items || studiesData.items.length === 0));

  // Parse DICOM file to extract metadata
  const parseDicomFile = async (file: File): Promise<Partial<Study> | null> => {
    try {
      // Try to use dicom-parser if available
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);

      // Check for DICOM magic number "DICM" at offset 128
      const isDicom = byteArray.length > 132 &&
        byteArray[128] === 68 && // D
        byteArray[129] === 73 && // I
        byteArray[130] === 67 && // C
        byteArray[131] === 77;   // M

      if (!isDicom) {
        // Try to load dynamically
        try {
          const dicomParser = await import('dicom-parser');
          const dataSet = dicomParser.parseDicom(byteArray);

          return {
            studyInstanceUID: dataSet.string('x0020000d') || `local-${Date.now()}`,
            patientName: dataSet.string('x00100010') || 'Unknown Patient',
            patientId: dataSet.string('x00100020') || 'Unknown',
            studyDate: dataSet.string('x00080020') || new Date().toISOString().split('T')[0].replace(/-/g, ''),
            studyDescription: dataSet.string('x00081030') || file.name,
            modality: parseModality(dataSet.string('x00080060')),
            numberOfSeries: 1,
            numberOfInstances: 1,
          };
        } catch {
          // dicom-parser not available, use fallback
        }
      }

      // Fallback: create study from filename
      return {
        studyInstanceUID: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientName: 'Uploaded Study',
        patientId: 'LOCAL',
        studyDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        studyDescription: file.name.replace('.dcm', ''),
        modality: 'OT' as Modality,
        numberOfSeries: 1,
        numberOfInstances: 1,
      };
    } catch (error) {
      console.error('Failed to parse DICOM file:', error);
      return null;
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validExtensions = ['.dcm', '.dicom', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.nii', '.nii.gz'];
    const validMimeTypes = ['application/dicom', 'image/png', 'image/jpeg', 'image/tiff'];

    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter((file) => {
        const name = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => name.endsWith(ext));
        const hasValidMimeType = validMimeTypes.includes(file.type);
        const hasNoExtension = !name.includes('.'); // DICOM files often have no extension
        return hasValidExtension || hasValidMimeType || hasNoExtension;
      })
      .map((file) => ({
        file,
        status: 'pending' as const,
      }));

    if (newFiles.length === 0 && selectedFiles.length > 0) {
      // Show error if no valid files
      alert('Please select valid image files (DICOM, PNG, JPG, JPEG, TIFF, or NIfTI)');
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // Remove file from list
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Process and upload files
  const handleUpload = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Update status to processing
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'processing' as const } : f))
    );

    setProcessingStatus('Processing DICOM files...');

    // Group files by potential study
    const processedStudies: Map<string, { metadata: Partial<Study>; files: File[] }> = new Map();

    for (const uploadedFile of pendingFiles) {
      try {
        setProcessingStatus(`Processing: ${uploadedFile.file.name}`);

        const metadata = await parseDicomFile(uploadedFile.file);

        if (metadata && metadata.studyInstanceUID) {
          const existing = processedStudies.get(metadata.studyInstanceUID);
          if (existing) {
            existing.files.push(uploadedFile.file);
            existing.metadata.numberOfInstances = (existing.metadata.numberOfInstances || 0) + 1;
          } else {
            processedStudies.set(metadata.studyInstanceUID, {
              metadata,
              files: [uploadedFile.file],
            });
          }
        }
      } catch (error) {
        console.error('Error processing file:', uploadedFile.file.name, error);
      }
    }

    // Store in IndexedDB and create local studies
    const newLocalStudies: LocalStudy[] = [];

    for (const [studyUID, { metadata, files: studyFiles }] of processedStudies) {
      try {
        setProcessingStatus(`Storing study: ${metadata.patientName || studyUID}...`);

        // Store files in IndexedDB
        await storeStudyWithFiles(studyUID, studyFiles, {
          patientName: metadata.patientName || 'Uploaded Patient',
          patientId: metadata.patientId || 'LOCAL',
          studyDate: metadata.studyDate || null,
          studyDescription: metadata.studyDescription || 'Uploaded Study',
          modality: metadata.modality || 'OT',
          numberOfInstances: studyFiles.length,
        });

        // Create blob URLs for immediate display
        const objectUrls = studyFiles.map(f => URL.createObjectURL(f));

        const localStudy: LocalStudy = {
          id: `local-${studyUID}`,
          studyInstanceUID: studyUID,
          studyDate: metadata.studyDate || '',
          studyTime: '',
          studyDescription: metadata.studyDescription || 'Uploaded Study',
          accessionNumber: '',
          patientId: metadata.patientId || 'LOCAL',
          patientName: metadata.patientName || 'Uploaded Patient',
          patientBirthDate: '',
          patientSex: '',
          modality: metadata.modality || ('OT' as Modality),
          numberOfSeries: 1,
          numberOfInstances: studyFiles.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLocal: true,
          objectUrls,
        };

        newLocalStudies.push(localStudy);
        console.log(`[AdminDicom] Stored study ${studyUID} with ${studyFiles.length} files in IndexedDB`);
      } catch (error) {
        console.error('Error storing study in IndexedDB:', error);
      }
    }

    // Add to local studies
    setLocalStudies((prev) => [...newLocalStudies, ...prev]);

    // Update file status
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'processing' ? { ...f, status: 'success' as const } : f
      )
    );

    setProcessingStatus(`Successfully processed ${newLocalStudies.length} study(ies) with ${pendingFiles.length} file(s). Files are stored in browser and will persist across page refreshes.`);

    // Also try to upload to backend if available
    try {
      const formData = new FormData();
      pendingFiles.forEach((f) => {
        formData.append('files', f.file);
      });
      await uploadDicom(formData).unwrap();
      refetch();
    } catch {
      // Backend not available, that's okay - we have IndexedDB storage
      console.log('Backend upload failed, using IndexedDB storage only');
    }
  }, [files, uploadDicom, refetch]);

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
    setProcessingStatus('');
  }, []);

  // Handle study deletion
  const handleDeleteStudy = useCallback(
    async (studyUID: string, isLocal?: boolean) => {
      if (!confirm('Are you sure you want to delete this study?')) return;

      if (isLocal) {
        // Remove from local studies state
        setLocalStudies((prev) => {
          const study = prev.find(s => s.studyInstanceUID === studyUID);
          // Revoke object URLs to free memory
          study?.objectUrls.forEach(url => URL.revokeObjectURL(url));
          return prev.filter((s) => s.studyInstanceUID !== studyUID);
        });

        // Delete from IndexedDB
        try {
          await deleteStoredStudy(studyUID);
          console.log(`[AdminDicom] Deleted study ${studyUID} from IndexedDB`);
        } catch (error) {
          console.error('Failed to delete study from IndexedDB:', error);
        }
      } else {
        try {
          await deleteStudy(studyUID).unwrap();
          refetch();
        } catch (error) {
          console.error('Failed to delete study:', error);
        }
      }
    },
    [deleteStudy, refetch]
  );

  // Clear all local studies
  const clearAllLocalStudies = useCallback(async () => {
    if (!confirm('Are you sure you want to delete all locally uploaded studies?')) return;

    // Revoke all blob URLs
    localStudies.forEach(study => {
      study.objectUrls.forEach(url => URL.revokeObjectURL(url));
    });

    // Clear state
    setLocalStudies([]);

    // Clear IndexedDB
    try {
      await clearAllStoredData();
      console.log('[AdminDicom] Cleared all data from IndexedDB');
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  }, [localStudies]);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const processingCount = files.filter((f) => f.status === 'processing').length;

  return (
    <div className="min-h-screen bg-[#0D1117] p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/30">
            <ImageIcon className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              Administration
            </p>
            <h1 className="text-4xl font-black text-[#E6EDF3] tracking-tight">Image Management</h1>
          </div>
        </div>
        <p className="text-lg text-[#8B949E] font-medium mt-2">
          Upload, organize, and manage medical imaging studies (DICOM, PNG, JPG, TIFF)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-emerald-500/30 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b-2 border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent">
            <h2 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-3 tracking-tight">
              <Upload className="h-6 w-6 text-emerald-400" />
              Upload Medical Images
            </h2>
          </div>
          <div className="p-6">
            {/* Drop zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
                isDragOver
                  ? 'border-emerald-400 bg-emerald-500/15 shadow-inner shadow-emerald-500/20'
                  : 'border-emerald-500/40 hover:border-emerald-400/60 hover:bg-emerald-500/5'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 w-fit mx-auto mb-5">
                <FileUp className="h-12 w-12 text-emerald-400" />
              </div>
              <p className="text-base text-[#E6EDF3] font-medium mb-2">
                Drag and drop files here, or{' '}
                <span className="text-emerald-400 font-semibold">browse</span>
              </p>
              <p className="text-sm text-[#6E7681]">
                Supports DICOM (.dcm), PNG, JPG, JPEG, TIFF, and NIfTI files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.dicom,.png,.jpg,.jpeg,.tiff,.tif,.nii,.nii.gz,application/dicom,image/png,image/jpeg,image/tiff"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Processing status */}
            {processingStatus && (
              <Alert className="mt-5 border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-transparent rounded-xl">
                <ImageIcon className="h-5 w-5 text-emerald-400" />
                <AlertDescription className="text-emerald-400 text-sm font-medium">
                  {processingStatus}
                </AlertDescription>
              </Alert>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold text-[#E6EDF3]">
                    Files ({files.length})
                  </span>
                  {successCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCompleted}
                      className="text-[#8B949E] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                    >
                      Clear completed
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {files.map((f, index) => (
                    <div
                      key={`${f.file.name}-${index}`}
                      className="flex items-center gap-3 p-3 bg-[#0D1117] rounded-xl border-2 border-slate-700/40 hover:border-slate-600/50 transition-colors"
                    >
                      {f.status === 'pending' && (
                        <File className="w-5 h-5 text-[#6E7681]" />
                      )}
                      {(f.status === 'uploading' || f.status === 'processing') && (
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      )}
                      {f.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      {f.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}

                      <span className="flex-1 text-sm font-medium text-[#E6EDF3] truncate">
                        {f.file.name}
                      </span>

                      <span className="text-xs text-[#6E7681] font-mono bg-slate-800/50 px-2 py-1 rounded">
                        {(f.file.size / 1024).toFixed(1)} KB
                      </span>

                      {f.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-[#6E7681] hover:text-rose-400 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            {pendingCount > 0 && (
              <Button
                className="w-full mt-5 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/25 rounded-xl text-base"
                onClick={handleUpload}
                disabled={isUploading || processingCount > 0}
              >
                {processingCount > 0 ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Process {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Recent Studies */}
        <div className="bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b-2 border-slate-700/50 flex items-center justify-between bg-[#0D1117]/30">
            <h2 className="text-xl font-bold text-[#E6EDF3]">Studies</h2>
            <div className="flex items-center gap-2">
              {localStudies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllLocalStudies}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                >
                  Clear Local
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-[#8B949E] hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            {/* Local storage notice */}
            {localStudies.length > 0 && (
              <Alert className="mb-5 border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-transparent rounded-xl">
                <HardDrive className="h-5 w-5 text-emerald-400" />
                <AlertDescription className="text-emerald-400 text-sm font-medium">
                  {localStudies.length} study(ies) stored locally. Click &quot;View&quot; to open in viewer.
                </AlertDescription>
              </Alert>
            )}

            {/* Mock data notice */}
            {isUsingMockData && localStudies.length === 0 && (
              <Alert className="mb-5 border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-transparent rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <AlertDescription className="text-amber-400 text-sm font-medium">
                  Showing demo data. Upload medical images to see your own studies.
                </AlertDescription>
              </Alert>
            )}

            {studiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              </div>
            ) : displayStudies.length > 0 ? (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {displayStudies.map((study) => {
                  const isLocalStudy = 'isLocal' in study && (study as LocalStudy).isLocal === true;
                  return (
                    <div
                      key={study.studyInstanceUID}
                      className="relative overflow-hidden flex items-center justify-between p-4 bg-[#0D1117] rounded-xl border-2 border-slate-700/40 hover:border-slate-600/50 transition-all group"
                    >
                      {/* Left accent bar */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl",
                        study.modality === 'CT' && 'bg-gradient-to-b from-blue-400 to-blue-600',
                        study.modality === 'MR' && 'bg-gradient-to-b from-teal-400 to-teal-600',
                        study.modality === 'XR' && 'bg-gradient-to-b from-amber-400 to-amber-600',
                        !['CT', 'MR', 'XR'].includes(study.modality) && 'bg-gradient-to-b from-slate-400 to-slate-600'
                      )} />
                      
                      <div className="flex-1 min-w-0 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          {isLocalStudy ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              LOCAL
                            </span>
                          ) : null}
                          <span className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-md border',
                            study.modality === 'CT' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                            study.modality === 'MR' && 'bg-teal-500/20 text-teal-400 border-teal-500/30',
                            study.modality === 'XR' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                            !['CT', 'MR', 'XR'].includes(study.modality) && 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          )}>
                            {study.modality}
                          </span>
                          <span className="text-base font-semibold text-[#E6EDF3] truncate group-hover:text-cyan-400 transition-colors">
                            {study.patientName || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-[#6E7681]">
                          {study.studyDescription || 'No description'} - {study.numberOfInstances} image{study.numberOfInstances !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/viewer/${study.studyInstanceUID}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-[#8B949E] hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                          onClick={() => handleDeleteStudy(study.studyInstanceUID, isLocalStudy)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-[#30363D] mx-auto mb-4" />
                <p className="text-lg font-semibold text-[#E6EDF3]">No studies found</p>
                <p className="text-sm text-[#6E7681] mt-2">Upload medical images to get started</p>
              </div>
            )}

            {studiesData?.total && studiesData.total > 10 && (
              <div className="mt-5 pt-5 border-t-2 border-slate-700/50">
                <Link href="/studies">
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-[#0D1117] border-2 border-slate-700/50 text-[#8B949E] hover:text-cyan-400 hover:border-cyan-500/50 rounded-xl font-medium"
                    size="sm"
                  >
                    View All Studies ({studiesData.total})
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gradient-to-br from-[#161B22] via-[#1a2035] to-[#161B22] rounded-2xl border-2 border-slate-700/50 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-[#E6EDF3] mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-cyan-400" />
          How to use
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0D1117] rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm font-semibold text-[#E6EDF3]">Upload Files</span>
            </div>
            <p className="text-xs text-[#6E7681]">Drag and drop or browse for medical images (DICOM, PNG, JPG, TIFF)</p>
          </div>
          <div className="p-4 bg-[#0D1117] rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm font-semibold text-[#E6EDF3]">Process & Store</span>
            </div>
            <p className="text-xs text-[#6E7681]">Files are processed and stored locally in your browser</p>
          </div>
          <div className="p-4 bg-[#0D1117] rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">3</span>
              <span className="text-sm font-semibold text-[#E6EDF3]">View & Annotate</span>
            </div>
            <p className="text-xs text-[#6E7681]">Click the view button to open studies in the image viewer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

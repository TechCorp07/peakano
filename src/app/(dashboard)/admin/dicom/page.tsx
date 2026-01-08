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

    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter((file) => {
        const name = file.name.toLowerCase();
        return name.endsWith('.dcm') ||
          name.endsWith('.dicom') ||
          file.type === 'application/dicom' ||
          !name.includes('.'); // DICOM files often have no extension
      })
      .map((file) => ({
        file,
        status: 'pending' as const,
      }));

    if (newFiles.length === 0 && selectedFiles.length > 0) {
      // Show error if no valid files
      alert('Please select valid DICOM files (.dcm extension or DICOM format)');
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E6EDF3]">DICOM Management</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Upload and manage DICOM studies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-[#161B22] rounded-lg border border-[#30363D]">
          <div className="px-4 py-3 border-b border-[#30363D]">
            <h2 className="text-base font-semibold text-[#E6EDF3] flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload DICOM Files
            </h2>
          </div>
          <div className="p-4">
            {/* Drop zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-[#30363D] hover:border-[#58A6FF]/50'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-10 w-10 text-[#6E7681] mx-auto mb-4" />
              <p className="text-sm text-[#8B949E]">
                Drag and drop DICOM files here, or{' '}
                <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-[#6E7681] mt-2">
                Supports .dcm files and DICOM folders
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.dicom,application/dicom"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Processing status */}
            {processingStatus && (
              <Alert className="mt-4 border-primary/50 bg-primary/10">
                <ImageIcon className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary text-sm">
                  {processingStatus}
                </AlertDescription>
              </Alert>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#E6EDF3]">
                    Files ({files.length})
                  </span>
                  {successCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCompleted}
                      className="text-[#8B949E] hover:text-white hover:bg-white/5"
                    >
                      Clear completed
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {files.map((f, index) => (
                    <div
                      key={`${f.file.name}-${index}`}
                      className="flex items-center gap-2 p-2 bg-[#0D1117] rounded-md border border-[#21262D]"
                    >
                      {f.status === 'pending' && (
                        <File className="w-4 h-4 text-[#6E7681]" />
                      )}
                      {(f.status === 'uploading' || f.status === 'processing') && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      )}
                      {f.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {f.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}

                      <span className="flex-1 text-sm text-[#E6EDF3] truncate">
                        {f.file.name}
                      </span>

                      <span className="text-xs text-[#6E7681] font-mono">
                        {(f.file.size / 1024).toFixed(1)} KB
                      </span>

                      {f.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-[#6E7681] hover:text-destructive transition-colors"
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
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                onClick={handleUpload}
                disabled={isUploading || processingCount > 0}
              >
                {processingCount > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Recent Studies */}
        <div className="bg-[#161B22] rounded-lg border border-[#30363D]">
          <div className="px-4 py-3 border-b border-[#30363D] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#E6EDF3]">Studies</h2>
            <div className="flex items-center gap-2">
              {localStudies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllLocalStudies}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Clear Local
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-[#8B949E] hover:text-white hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            {/* Local storage notice */}
            {localStudies.length > 0 && (
              <Alert className="mb-4 border-green-500/50 bg-green-500/10">
                <HardDrive className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400 text-xs">
                  {localStudies.length} study(ies) stored locally. Click &quot;View&quot; to open in viewer.
                </AlertDescription>
              </Alert>
            )}

            {/* Mock data notice */}
            {isUsingMockData && localStudies.length === 0 && (
              <Alert className="mb-4 border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning text-xs">
                  Showing demo data. Upload DICOM files to see your own studies.
                </AlertDescription>
              </Alert>
            )}

            {studiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : displayStudies.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {displayStudies.map((study) => {
                  const isLocalStudy = 'isLocal' in study && (study as LocalStudy).isLocal === true;
                  return (
                    <div
                      key={study.studyInstanceUID}
                      className="flex items-center justify-between p-3 bg-[#0D1117] rounded-lg border border-[#21262D] hover:border-[#30363D] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isLocalStudy ? (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                              LOCAL
                            </span>
                          ) : null}
                          <span className={cn(
                            'text-xs font-medium px-1.5 py-0.5 rounded',
                            study.modality === 'CT' && 'bg-blue-500/20 text-blue-400',
                            study.modality === 'MR' && 'bg-purple-500/20 text-purple-400',
                            study.modality === 'XR' && 'bg-amber-500/20 text-amber-400',
                            !['CT', 'MR', 'XR'].includes(study.modality) && 'bg-[#30363D] text-[#8B949E]'
                          )}>
                            {study.modality}
                          </span>
                          <span className="text-sm font-medium text-[#E6EDF3] truncate">
                            {study.patientName || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E7681] mt-1">
                          {study.studyDescription || 'No description'} - {study.numberOfInstances} image{study.numberOfInstances !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href={`/viewer/${study.studyInstanceUID}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#8B949E] hover:text-white hover:bg-white/5"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteStudy(study.studyInstanceUID, isLocalStudy)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#8B949E]">No studies found</p>
                <p className="text-xs text-[#6E7681] mt-1">Upload DICOM files to get started</p>
              </div>
            )}

            {studiesData?.total && studiesData.total > 10 && (
              <div className="mt-4 pt-4 border-t border-[#30363D]">
                <Link href="/studies">
                  <Button
                    variant="outline"
                    className="w-full bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
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
      <div className="mt-6 bg-[#161B22] rounded-lg border border-[#30363D] p-4">
        <h3 className="text-sm font-semibold text-[#E6EDF3] mb-2">How to use:</h3>
        <ol className="text-xs text-[#8B949E] space-y-1 list-decimal list-inside">
          <li>Upload DICOM files (.dcm) using drag-and-drop or the file browser</li>
          <li>Files will be processed and stored locally in your browser</li>
          <li>Click the &quot;View&quot; button (eye icon) to open a study in the DICOM viewer</li>
          <li>Local studies persist across page refreshes until you clear them</li>
          <li>For production use, connect to a DICOM backend server (PACS)</li>
        </ol>
      </div>
    </div>
  );
}

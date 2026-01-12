'use client';

/**
 * Studies List Page (Dark Theme)
 * Browse and search DICOM studies
 */

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Image,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Scan,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudyList } from '@/features/dicom/hooks';
import { staticStudies } from '@/lib/mock/dicomData';
import { cn } from '@/lib/utils';
import type { Modality, Study } from '@/types/dicom';

const MODALITIES: { value: Modality | ''; label: string }[] = [
  { value: '', label: 'All Modalities' },
  { value: 'CT', label: 'CT' },
  { value: 'MR', label: 'MRI' },
  { value: 'XR', label: 'X-Ray' },
  { value: 'US', label: 'Ultrasound' },
  { value: 'NM', label: 'Nuclear Medicine' },
  { value: 'PT', label: 'PET' },
];

export default function StudiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<Modality | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    studies: apiStudies,
    total: apiTotal,
    totalPages: apiTotalPages,
    currentPage,
    isLoading,
    error,
    setFilter,
    resetFilters,
    goToPage,
    refetch,
  } = useStudyList();

  // Use mock data if API returns empty or errors (development fallback)
  const studies: Study[] = useMemo(() => {
    if (apiStudies && apiStudies.length > 0) return apiStudies;
    if (error || (!isLoading && apiStudies.length === 0)) {
      // Filter static DICOM files based on search/modality
      let filtered = staticStudies;
      if (searchTerm) {
        filtered = filtered.filter((s) =>
          s.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (selectedModality) {
        filtered = filtered.filter((s) => s.modality === selectedModality);
      }
      return filtered;
    }
    return apiStudies;
  }, [apiStudies, error, isLoading, searchTerm, selectedModality]);

  const total = apiTotal > 0 ? apiTotal : studies.length;
  const totalPages = apiTotalPages > 0 ? apiTotalPages : 1;

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setFilter('patientName', value || undefined);
    },
    [setFilter]
  );

  // Handle modality filter
  const handleModalityChange = useCallback(
    (modality: Modality | '') => {
      setSelectedModality(modality);
      setFilter('modality', modality || undefined);
    },
    [setFilter]
  );

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedModality('');
    resetFilters();
  }, [resetFilters]);

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      if (dateStr.length === 8) {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        return `${month}/${day}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">DICOM Studies</h1>
          <p className="text-sm text-[#8B949E] mt-1">
            Browse and view medical imaging studies
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E7681]" />
            <Input
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3] placeholder:text-[#6E7681] focus:border-primary"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              showFilters
                ? 'bg-primary text-primary-foreground'
                : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D]'
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#30363D]">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Modality filter */}
              <div>
                <label className="text-xs text-[#8B949E] mb-1 block">Modality</label>
                <select
                  value={selectedModality}
                  onChange={(e) => handleModalityChange(e.target.value as Modality | '')}
                  className="h-9 px-3 rounded-md border border-[#30363D] bg-[#0D1117] text-sm text-[#E6EDF3] focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {MODALITIES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button */}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-[#8B949E] hover:text-white hover:bg-white/5"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error state - only show if not using mock data fallback */}
      {error && studies.length === 0 && (
        <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load studies. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Static data notice */}
      {error && studies.length > 0 && (
        <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-400">
            Showing pre-loaded sample DICOM files. Connect backend to see uploaded studies.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && studies.length === 0 && (
        <div className="text-center py-12">
          <Image className="h-12 w-12 text-[#30363D] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#E6EDF3]">No studies found</h3>
          <p className="text-sm text-[#8B949E] mt-1">
            {searchTerm || selectedModality
              ? 'Try adjusting your search or filters'
              : 'Upload DICOM files to get started'}
          </p>
        </div>
      )}

      {/* Studies grid */}
      {!isLoading && studies.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {studies.map((study) => (
              <div
                key={study.studyInstanceUID}
                className="bg-[#161B22] rounded-lg border border-[#30363D] p-4 hover:border-[#58A6FF]/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        study.modality === 'CT' && 'bg-blue-500/20 text-blue-400',
                        study.modality === 'MR' && 'bg-purple-500/20 text-purple-400',
                        study.modality === 'XR' && 'bg-amber-500/20 text-amber-400',
                        !['CT', 'MR', 'XR'].includes(study.modality) &&
                          'bg-[#30363D] text-[#8B949E]'
                      )}
                    >
                      {study.modality}
                    </span>
                    <span className="text-xs text-[#6E7681]">
                      {study.numberOfSeries} series, {study.numberOfInstances} images
                    </span>
                  </div>
                </div>

                {/* Patient info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-[#6E7681]" />
                    <span className="text-[#E6EDF3] font-medium truncate">
                      {study.patientName || 'Unknown Patient'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-[#6E7681]" />
                    <span className="text-[#8B949E]">
                      {formatDate(study.studyDate)}
                    </span>
                  </div>

                  {study.studyDescription && (
                    <div className="flex items-center gap-2 text-sm">
                      <Scan className="h-4 w-4 text-[#6E7681]" />
                      <p className="text-xs text-[#6E7681] truncate">
                        {study.studyDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <Link href={`/viewer/${study.studyInstanceUID}`}>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Study
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#8B949E]">
                Showing {(currentPage - 1) * 20 + 1} to{' '}
                {Math.min(currentPage * 20, total)} of {total} studies
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-[#8B949E]">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:bg-[#30363D] disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

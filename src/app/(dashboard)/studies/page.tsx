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
    <div className="min-h-screen bg-[#0D1117] p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <Scan className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">
              Medical Imaging
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#E6EDF3] tracking-tight">DICOM Studies</h1>
            <p className="text-base text-[#8B949E] mt-1">
              Browse, search, and view medical imaging studies for annotation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-2">
            <p className="text-sm text-[#8B949E]">Total Studies</p>
            <p className="text-2xl font-bold text-blue-400">{total}</p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="default"
            className="border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50 transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-[#161B22] to-[#1a1f29] rounded-2xl border-2 border-blue-500/30 p-6 mb-8 shadow-xl shadow-blue-500/10">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
            <Input
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-[#0D1117] border-blue-500/30 text-[#E6EDF3] placeholder:text-[#6E7681] focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              showFilters
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : 'border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50'
            )}
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-5 pt-5 border-t border-blue-500/20">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Modality filter */}
              <div>
                <label className="text-sm text-blue-400 mb-2 block font-bold uppercase tracking-wide">Modality</label>
                <select
                  value={selectedModality}
                  onChange={(e) => handleModalityChange(e.target.value as Modality | '')}
                  className="h-11 px-4 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] text-base text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 hover:border-blue-400/40 transition-all cursor-pointer"
                >
                  {MODALITIES.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#161B22]">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button */}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleResetFilters}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <X className="h-5 w-5 mr-2" />
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
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full" />
            <h2 className="text-2xl font-bold text-[#E6EDF3] tracking-tight">Available Studies</h2>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm font-semibold rounded-full border border-blue-500/20">{studies.length} studies</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {studies.map((study) => (
              <div
                key={study.studyInstanceUID}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
                  "bg-gradient-to-br from-[#161B22] via-[#161B22] to-[#1a1f29]",
                  study.modality === 'CT' && 'border-blue-500/40 hover:shadow-blue-500/30 hover:border-blue-400/60',
                  study.modality === 'MR' && 'border-teal-500/40 hover:shadow-teal-500/30 hover:border-teal-400/60',
                  study.modality === 'XR' && 'border-amber-500/40 hover:shadow-amber-500/30 hover:border-amber-400/60',
                  !['CT', 'MR', 'XR'].includes(study.modality) && 'border-[#30363D] hover:border-primary/50'
                )}
              >
                {/* Colored accent bar */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5",
                  study.modality === 'CT' && 'bg-gradient-to-r from-blue-500 to-blue-600',
                  study.modality === 'MR' && 'bg-gradient-to-r from-teal-500 to-teal-600',
                  study.modality === 'XR' && 'bg-gradient-to-r from-amber-500 to-orange-600',
                  !['CT', 'MR', 'XR'].includes(study.modality) && 'bg-gradient-to-r from-gray-500 to-gray-600'
                )} />
                {/* Header */}
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm',
                        study.modality === 'CT' && 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-400 border border-blue-500/40',
                        study.modality === 'MR' && 'bg-gradient-to-r from-teal-500/30 to-teal-600/20 text-teal-400 border border-teal-500/40',
                        study.modality === 'XR' && 'bg-gradient-to-r from-amber-500/30 to-orange-600/20 text-amber-400 border border-amber-500/40',
                        !['CT', 'MR', 'XR'].includes(study.modality) &&
                          'bg-[#30363D] text-[#8B949E]'
                      )}
                    >
                      {study.modality}
                    </span>
                    <span className="text-sm text-[#8B949E] font-medium">
                      {study.numberOfSeries} series, {study.numberOfInstances} images
                    </span>
                  </div>
                </div>

                {/* Patient info */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-base">
                    <User className="h-5 w-5 text-[#6E7681]" />
                    <span className="text-[#E6EDF3] font-semibold truncate">
                      {study.patientName || 'Unknown Patient'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-base">
                    <Calendar className="h-5 w-5 text-[#6E7681]" />
                    <span className="text-[#8B949E] font-medium">
                      {formatDate(study.studyDate)}
                    </span>
                  </div>

                  {study.studyDescription && (
                    <div className="flex items-center gap-3 text-sm">
                      <Scan className="h-5 w-5 text-[#6E7681]" />
                      <p className="text-[#6E7681] truncate">
                        {study.studyDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <Link href={`/viewer/${study.studyInstanceUID}`}>
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold"
                    size="default"
                  >
                    <Eye className="h-5 w-5 mr-2" />
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

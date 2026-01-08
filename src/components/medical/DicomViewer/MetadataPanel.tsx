'use client';

/**
 * MetadataPanel Component
 * Displays DICOM study and patient metadata
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, User, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Study } from '@/types/dicom';

interface MetadataPanelProps {
  study: Study | null;
  className?: string;
}

interface MetadataSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function MetadataSection({
  title,
  icon,
  children,
  defaultExpanded = true,
}: MetadataSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-slate-700 last:border-b-0">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isExpanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

interface MetadataRowProps {
  label: string;
  value: string | null | undefined;
}

function MetadataRow({ label, value }: MetadataRowProps) {
  return (
    <div className="flex justify-between items-start py-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs text-slate-200 text-right max-w-[60%] truncate">
        {value || '—'}
      </span>
    </div>
  );
}

export default function MetadataPanel({ study, className }: MetadataPanelProps) {
  if (!study) {
    return (
      <div className={cn('bg-slate-800 rounded-lg p-4', className)}>
        <p className="text-sm text-slate-400 text-center">No study loaded</p>
      </div>
    );
  }

  // Format date string
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      // DICOM date format: YYYYMMDD
      if (dateStr.length === 8) {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn('bg-slate-800 rounded-lg overflow-hidden', className)}>
      {/* Patient Information */}
      <MetadataSection
        title="Patient"
        icon={<User className="h-4 w-4 text-green-400" />}
      >
        <MetadataRow label="Name" value={study.patientName} />
        <MetadataRow label="ID" value={study.patientId} />
        <MetadataRow label="Birth Date" value={formatDate(study.patientBirthDate)} />
        <MetadataRow label="Sex" value={study.patientSex} />
      </MetadataSection>

      {/* Study Information */}
      <MetadataSection
        title="Study"
        icon={<FileText className="h-4 w-4 text-blue-400" />}
      >
        <MetadataRow label="Date" value={formatDate(study.studyDate)} />
        <MetadataRow label="Description" value={study.studyDescription} />
        <MetadataRow label="Accession #" value={study.accessionNumber} />
        <MetadataRow label="Modality" value={study.modality} />
      </MetadataSection>

      {/* Technical Information */}
      <MetadataSection
        title="Technical"
        icon={<Info className="h-4 w-4 text-amber-400" />}
        defaultExpanded={false}
      >
        <MetadataRow label="Study UID" value={study.studyInstanceUID} />
        <MetadataRow label="Series" value={String(study.numberOfSeries)} />
        <MetadataRow label="Instances" value={String(study.numberOfInstances)} />
      </MetadataSection>
    </div>
  );
}

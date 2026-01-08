'use client';

/**
 * StackNavigator Component
 * Slider and controls for navigating through image slices
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StackNavigatorProps {
  currentIndex: number;
  totalImages: number;
  onNavigate: (index: number) => void;
  className?: string;
}

export default function StackNavigator({
  currentIndex,
  totalImages,
  onNavigate,
  className,
}: StackNavigatorProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNavigate(parseInt(e.target.value, 10));
  };

  const goToFirst = () => onNavigate(0);
  const goToPrevious = () => onNavigate(Math.max(0, currentIndex - 1));
  const goToNext = () => onNavigate(Math.min(totalImages - 1, currentIndex + 1));
  const goToLast = () => onNavigate(totalImages - 1);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalImages - 1;

  if (totalImages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 bg-slate-800 border-t border-slate-700',
        className
      )}
    >
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white disabled:opacity-50"
          onClick={goToFirst}
          disabled={isFirst}
          title="Go to first"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white disabled:opacity-50"
          onClick={goToPrevious}
          disabled={isFirst}
          title="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Slider */}
      <div className="flex-1 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={totalImages - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-green-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:bg-green-400
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-green-500
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Current position indicator */}
        <div className="text-sm text-slate-300 min-w-[80px] text-center">
          <span className="text-green-400 font-medium">{currentIndex + 1}</span>
          <span className="text-slate-500"> / </span>
          <span>{totalImages}</span>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white disabled:opacity-50"
          onClick={goToNext}
          disabled={isLast}
          title="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white disabled:opacity-50"
          onClick={goToLast}
          disabled={isLast}
          title="Go to last"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';

/**
 * ThresholdToolPanel Component
 * UI for configuring threshold-based segmentation
 */

import { useState, useCallback, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, RotateCcw, Check, X } from 'lucide-react';
import { useAnnotationToolsStore } from '@/lib/annotation';

interface ThresholdToolPanelProps {
  /** Min intensity value in the image */
  minIntensity?: number;
  /** Max intensity value in the image */
  maxIntensity?: number;
  /** Histogram data for visualization */
  histogram?: number[];
  /** Callback when threshold is applied */
  onApply?: (lowerThreshold: number, upperThreshold: number, invert: boolean) => void;
  /** Callback for live preview */
  onPreview?: (lowerThreshold: number, upperThreshold: number, invert: boolean) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Whether currently processing */
  isProcessing?: boolean;
  className?: string;
}

export default function ThresholdToolPanel({
  minIntensity = 0,
  maxIntensity = 255,
  histogram,
  onApply,
  onPreview,
  onCancel,
  isProcessing = false,
  className,
}: ThresholdToolPanelProps) {
  const { thresholdConfig, setThresholdConfig } = useAnnotationToolsStore();
  const [livePreview, setLivePreview] = useState(true);
  const [mode, setMode] = useState<'manual' | 'otsu' | 'adaptive'>('manual');
  
  // Local state for range slider (since it returns [lower, upper])
  const [range, setRange] = useState<[number, number]>([
    thresholdConfig.lowerThreshold,
    thresholdConfig.upperThreshold,
  ]);
  
  // Sync range with config
  useEffect(() => {
    setRange([thresholdConfig.lowerThreshold, thresholdConfig.upperThreshold]);
  }, [thresholdConfig.lowerThreshold, thresholdConfig.upperThreshold]);
  
  // Handle range change
  const handleRangeChange = useCallback((values: number[]) => {
    const [lower, upper] = values;
    setRange([lower, upper]);
    setThresholdConfig({ lowerThreshold: lower, upperThreshold: upper });
    
    if (livePreview && onPreview) {
      onPreview(lower, upper, thresholdConfig.invert);
    }
  }, [livePreview, onPreview, setThresholdConfig, thresholdConfig.invert]);
  
  // Handle invert toggle
  const handleInvertChange = useCallback((checked: boolean) => {
    setThresholdConfig({ invert: checked });
    
    if (livePreview && onPreview) {
      onPreview(range[0], range[1], checked);
    }
  }, [livePreview, onPreview, range, setThresholdConfig]);
  
  // Apply threshold
  const handleApply = useCallback(() => {
    if (onApply) {
      onApply(range[0], range[1], thresholdConfig.invert);
    }
  }, [onApply, range, thresholdConfig.invert]);
  
  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaultLower = minIntensity;
    const defaultUpper = maxIntensity;
    setRange([defaultLower, defaultUpper]);
    setThresholdConfig({
      lowerThreshold: defaultLower,
      upperThreshold: defaultUpper,
      invert: false,
    });
  }, [minIntensity, maxIntensity, setThresholdConfig]);
  
  // Render histogram
  const renderHistogram = () => {
    if (!histogram || histogram.length === 0) return null;
    
    const maxCount = Math.max(...histogram);
    const normalizedHistogram = histogram.map((count) => count / maxCount);
    
    // Calculate which bars are in the selected range
    const binWidth = (maxIntensity - minIntensity) / histogram.length;
    
    return (
      <div className="relative h-16 bg-slate-800 rounded overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-end">
          {normalizedHistogram.map((height, i) => {
            const binStart = minIntensity + i * binWidth;
            const binEnd = binStart + binWidth;
            const inRange = binStart >= range[0] && binEnd <= range[1];
            
            return (
              <div
                key={i}
                className="flex-1"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: inRange 
                    ? (thresholdConfig.invert ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)')
                    : 'rgba(100, 116, 139, 0.4)',
                }}
              />
            );
          })}
        </div>
        
        {/* Range indicators */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-green-500"
          style={{
            left: `${((range[0] - minIntensity) / (maxIntensity - minIntensity)) * 100}%`,
          }}
        />
        <div
          className="absolute top-0 bottom-0 border-l-2 border-green-500"
          style={{
            left: `${((range[1] - minIntensity) / (maxIntensity - minIntensity)) * 100}%`,
          }}
        />
      </div>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Threshold Segmentation</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v: string) => setMode(v as typeof mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1 text-xs">Manual</TabsTrigger>
            <TabsTrigger value="otsu" className="flex-1 text-xs">Otsu</TabsTrigger>
            <TabsTrigger value="adaptive" className="flex-1 text-xs">Adaptive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 mt-3">
            {/* Histogram */}
            {renderHistogram()}
            
            {/* Range slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Lower: {range[0].toFixed(0)}</span>
                <span>Upper: {range[1].toFixed(0)}</span>
              </div>
              <Slider
                value={range}
                min={minIntensity}
                max={maxIntensity}
                step={1}
                onValueChange={handleRangeChange}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{minIntensity.toFixed(0)}</span>
                <span>{maxIntensity.toFixed(0)}</span>
              </div>
            </div>
            
            {/* Invert toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="invert" className="text-xs">Invert Selection</Label>
              <Switch
                id="invert"
                checked={thresholdConfig.invert}
                onCheckedChange={handleInvertChange}
              />
            </div>
            
            {/* Live preview toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="preview" className="text-xs">Live Preview</Label>
              <Switch
                id="preview"
                checked={livePreview}
                onCheckedChange={setLivePreview}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="otsu" className="space-y-4 mt-3">
            <p className="text-xs text-slate-400">
              Otsu&apos;s method automatically finds the optimal threshold by 
              maximizing between-class variance.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={isProcessing}
            >
              <Play className="h-3.5 w-3.5 mr-2" />
              Calculate Otsu Threshold
            </Button>
          </TabsContent>
          
          <TabsContent value="adaptive" className="space-y-4 mt-3">
            <p className="text-xs text-slate-400">
              Adaptive thresholding uses local pixel neighborhoods for 
              varying illumination conditions.
            </p>
            
            <div className="space-y-2">
              <Label className="text-xs">Window Size</Label>
              <Slider
                defaultValue={[15]}
                min={3}
                max={51}
                step={2}
                className="py-2"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Constant (C)</Label>
              <Slider
                defaultValue={[5]}
                min={-20}
                max={20}
                step={1}
                className="py-2"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleApply}
            disabled={isProcessing}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

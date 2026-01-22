'use client';

/**
 * BrushSettingsPanel Component
 * UI for configuring brush tools including size, shape, and presets
 */

import { useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, Square, Hexagon, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnnotationToolsStore, DEFAULT_BRUSH_PRESETS, type BrushConfig } from '@/lib/annotation';

interface BrushSettingsPanelProps {
  /** Current brush mode */
  mode?: 'standard' | '3d' | 'adaptive';
  onModeChange?: (mode: 'standard' | '3d' | 'adaptive') => void;
  className?: string;
}

const shapeOptions: Array<{
  shape: BrushConfig['shape'];
  icon: React.ReactNode;
  label: string;
}> = [
  { shape: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
  { shape: 'square', icon: <Square className="h-4 w-4" />, label: 'Square' },
  { shape: 'diamond', icon: <Hexagon className="h-4 w-4" />, label: 'Diamond' },
];

export default function BrushSettingsPanel({
  mode = 'standard',
  onModeChange,
  className,
}: BrushSettingsPanelProps) {
  const {
    brushConfig,
    brush3DConfig,
    adaptiveBrushConfig,
    activeBrushPreset,
    setBrushConfig,
    setBrush3DConfig,
    setAdaptiveBrushConfig,
    setBrushRadius,
    applyBrushPreset,
  } = useAnnotationToolsStore();
  
  const currentConfig = mode === 'standard' ? brushConfig :
                        mode === '3d' ? brush3DConfig :
                        adaptiveBrushConfig;
  
  const handleRadiusChange = useCallback((values: number[]) => {
    setBrushRadius(values[0]);
  }, [setBrushRadius]);
  
  const handleShapeChange = useCallback((shape: BrushConfig['shape']) => {
    setBrushConfig({ shape });
    setBrush3DConfig({ shape });
    setAdaptiveBrushConfig({ shape });
  }, [setBrushConfig, setBrush3DConfig, setAdaptiveBrushConfig]);
  
  const handleHardnessChange = useCallback((values: number[]) => {
    setBrushConfig({ hardness: values[0] });
    setBrush3DConfig({ hardness: values[0] });
    setAdaptiveBrushConfig({ hardness: values[0] });
  }, [setBrushConfig, setBrush3DConfig, setAdaptiveBrushConfig]);
  
  const handleOpacityChange = useCallback((values: number[]) => {
    setBrushConfig({ opacity: values[0] });
    setBrush3DConfig({ opacity: values[0] });
    setAdaptiveBrushConfig({ opacity: values[0] });
  }, [setBrushConfig, setBrush3DConfig, setAdaptiveBrushConfig]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Brush Settings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v: string) => onModeChange?.(v as typeof mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="standard" className="flex-1 text-xs">Standard</TabsTrigger>
            <TabsTrigger value="3d" className="flex-1 text-xs">3D</TabsTrigger>
            <TabsTrigger value="adaptive" className="flex-1 text-xs">Adaptive</TabsTrigger>
          </TabsList>
          
          {/* Standard Brush */}
          <TabsContent value="standard" className="space-y-4 mt-3">
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs">Quick Presets</Label>
              <div className="grid grid-cols-6 gap-1">
                {DEFAULT_BRUSH_PRESETS.map((preset: typeof DEFAULT_BRUSH_PRESETS[number]) => (
                  <TooltipProvider key={preset.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 px-2 text-xs',
                            activeBrushPreset === preset.id && 'bg-green-500/20 border border-green-500/50'
                          )}
                          onClick={() => applyBrushPreset(preset.id)}
                        >
                          {preset.shortcut}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{preset.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            {/* Size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Size</Label>
                <span className="text-xs text-slate-400">{currentConfig.radius}px</span>
              </div>
              <Slider
                value={[currentConfig.radius]}
                min={1}
                max={100}
                step={1}
                onValueChange={handleRadiusChange}
              />
            </div>
            
            {/* Shape */}
            <div className="space-y-2">
              <Label className="text-xs">Shape</Label>
              <div className="flex gap-2">
                {shapeOptions.map(({ shape, icon, label }) => (
                  <TooltipProvider key={shape}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'flex-1',
                            currentConfig.shape === shape && 'bg-green-500/20 border border-green-500/50'
                          )}
                          onClick={() => handleShapeChange(shape)}
                        >
                          {icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            {/* Hardness */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Hardness</Label>
                <span className="text-xs text-slate-400">{Math.round(currentConfig.hardness * 100)}%</span>
              </div>
              <Slider
                value={[currentConfig.hardness]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={handleHardnessChange}
              />
            </div>
            
            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs text-slate-400">{Math.round(currentConfig.opacity * 100)}%</span>
              </div>
              <Slider
                value={[currentConfig.opacity]}
                min={0.1}
                max={1}
                step={0.05}
                onValueChange={handleOpacityChange}
              />
            </div>
          </TabsContent>
          
          {/* 3D Brush */}
          <TabsContent value="3d" className="space-y-4 mt-3">
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded border border-blue-500/30">
              <Layers className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-blue-300">
                3D brush paints across multiple slices
              </p>
            </div>
            
            {/* Size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Size</Label>
                <span className="text-xs text-slate-400">{brush3DConfig.radius}px</span>
              </div>
              <Slider
                value={[brush3DConfig.radius]}
                min={1}
                max={100}
                step={1}
                onValueChange={handleRadiusChange}
              />
            </div>
            
            {/* Depth */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Depth (Slices)</Label>
                <span className="text-xs text-slate-400">{brush3DConfig.depth}</span>
              </div>
              <Slider
                value={[brush3DConfig.depth]}
                min={1}
                max={11}
                step={2}
                onValueChange={(v: number[]) => setBrush3DConfig({ depth: v[0] })}
              />
            </div>
            
            {/* Depth Falloff */}
            <div className="space-y-2">
              <Label className="text-xs">Depth Falloff</Label>
              <div className="flex gap-2">
                {(['none', 'linear', 'gaussian'] as const).map((falloff) => (
                  <Button
                    key={falloff}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'flex-1 text-xs capitalize',
                      brush3DConfig.depthFalloff === falloff && 'bg-green-500/20 border border-green-500/50'
                    )}
                    onClick={() => setBrush3DConfig({ depthFalloff: falloff })}
                  >
                    {falloff}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Adaptive Brush */}
          <TabsContent value="adaptive" className="space-y-4 mt-3">
            <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded border border-purple-500/30">
              <Circle className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-purple-300">
                Adaptive brush respects image edges
              </p>
            </div>
            
            {/* Size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Size</Label>
                <span className="text-xs text-slate-400">{adaptiveBrushConfig.radius}px</span>
              </div>
              <Slider
                value={[adaptiveBrushConfig.radius]}
                min={1}
                max={100}
                step={1}
                onValueChange={handleRadiusChange}
              />
            </div>
            
            {/* Intensity Tolerance */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Intensity Tolerance</Label>
                <span className="text-xs text-slate-400">{adaptiveBrushConfig.intensityTolerance}</span>
              </div>
              <Slider
                value={[adaptiveBrushConfig.intensityTolerance]}
                min={5}
                max={100}
                step={5}
                onValueChange={(v: number[]) => setAdaptiveBrushConfig({ intensityTolerance: v[0] })}
              />
            </div>
            
            {/* Edge Strength */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Edge Strength</Label>
                <span className="text-xs text-slate-400">{Math.round(adaptiveBrushConfig.edgeStrength * 100)}%</span>
              </div>
              <Slider
                value={[adaptiveBrushConfig.edgeStrength]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(v: number[]) => setAdaptiveBrushConfig({ edgeStrength: v[0] })}
              />
            </div>
            
            {/* Edge Snapping */}
            <div className="flex items-center justify-between">
              <Label htmlFor="edge-snap" className="text-xs">Edge Snapping</Label>
              <Switch
                id="edge-snap"
                checked={adaptiveBrushConfig.edgeSnapping}
                onCheckedChange={(checked: boolean) => setAdaptiveBrushConfig({ edgeSnapping: checked })}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Keyboard hints */}
        <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-700/50">
          <p><kbd className="px-1 py-0.5 bg-slate-700 rounded">[</kbd> / <kbd className="px-1 py-0.5 bg-slate-700 rounded">]</kbd> = Decrease/Increase size</p>
          <p><kbd className="px-1 py-0.5 bg-slate-700 rounded">Right-click</kbd> = Erase mode</p>
        </div>
      </CardContent>
    </Card>
  );
}

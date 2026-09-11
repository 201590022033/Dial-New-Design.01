import React from 'react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { cn } from '@/utils/cn';

const FINISH_PRESETS = [
  { id: 'matte', name: 'Matte Finish', texture: 'matte', description: 'Non-reflective micro-bead blasted surface' },
  { id: 'sunburst', name: 'Sunburst Satin', texture: 'sunburst', description: 'Radial optical brushed rays from centre' },
  { id: 'brushed', name: 'Vertical Brushed', texture: 'brushed', description: 'Directional horological graining' },
  { id: 'polished', name: 'Mirror Polished', texture: 'polished', description: 'High-gloss optical reflection' },
  { id: 'guilloche', name: 'Guilloché Clous de Paris', texture: 'guilloche', description: 'Traditional geometric engine-turned hobnail' }
];

const COLOR_PALETTES = [
  { name: 'Deep Sea Navy', primary: '#0f172a', secondary: '#1e293b', accent: '#38bdf8' },
  { name: 'Emerald Sunburst', primary: '#064e3b', secondary: '#047857', accent: '#34d399' },
  { name: 'Onyx Black', primary: '#020617', secondary: '#0f172a', accent: '#f59e0b' },
  { name: 'Arctic Silver', primary: '#e2e8f0', secondary: '#cbd5e1', accent: '#0284c7' },
  { name: 'Vintage Gilt', primary: '#1c1917', secondary: '#292524', accent: '#d97706' }
];

export const StyleTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const setPreview = useConfiguratorUIStore((s) => s.setPreview);
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const updateDialFaceConfig = useDesignEngineStore((s) => s.updateDialFaceConfig);

  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;

  const handleApplyFinish = (finishTexture: string) => {
    if (!activePartInstanceId) return;

    // Create preview assembly
    const preview: WatchAssembly = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;
    if (preview.parts[activePartInstanceId]) {
      preview.parts[activePartInstanceId].texture = finishTexture;
    }

    setPreview(preview, activePartInstanceId, {
      id: `style-${finishTexture}`,
      displayName: `${finishTexture.toUpperCase()} Finish`,
      kind: 'style-finish',
      category: activePart?.category ?? 'dial',
      defaultMaterial: activePart?.material ?? 'steel',
      defaultTexture: finishTexture,
      linkedBandKind: null,
      nominalDimensions: { diameterMm: 28.5, thicknessMm: 0.4, widthMm: 0 },
      manufacturing: {
        processProfile: 'laser',
        minimumFeatureMm: 0.1,
        minimumGapMm: 0.1,
        minimumStrokeWidthMm: 0.1,
        recommendations: []
      },
      softStyles: [],
      status: 'verified',
      metadata: { tags: [], revision: '1.0', notes: '' },
      exportEnabled: true
    });
  };

  const handleApplyPalette = (palette: (typeof COLOR_PALETTES)[number]) => {
    updateDialFaceConfig({
      color: palette.primary,
      secondaryColor: palette.secondary
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-4" data-testid="style-tab">
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-200">Material & Surface Finishes</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Live previews update SVG gradient & texture shaders without mutating geometry.
        </p>
      </div>

      {/* Surface Textures */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Surface Finish Presets
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {FINISH_PRESETS.map((preset) => {
            const isCurrent = activePart?.texture === preset.texture;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyFinish(preset.texture)}
                className={cn(
                  'flex flex-col text-left p-2.5 rounded-lg border transition-all duration-150',
                  isCurrent
                    ? 'bg-slate-800/80 border-teal-400'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{preset.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-teal-400 font-mono">Current</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palettes for Dial Face */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Dial Color Schemes
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {COLOR_PALETTES.map((pal) => (
            <button
              key={pal.name}
              type="button"
              onClick={() => handleApplyPalette(pal)}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-slate-700"
                  style={{ backgroundColor: pal.primary }}
                />
                <span className="text-xs text-slate-200">{pal.name}</span>
              </div>
              <div className="flex gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.secondary }} />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.accent }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

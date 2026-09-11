import React, { useState } from 'react';
import {
  Sliders,
  Ruler,
  Layers,
  XCircle,
  Sparkles
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useGlobalSettingsStore } from '@/stores/globalSettingsStore';
import { useScaleStore } from '@/stores/scaleStore';
import type { ScaleKind } from '@/domain/scales/types';

export const AdvancedModePanel: React.FC = () => {
  const overlays = useConfiguratorUIStore((s) => s.overlays);
  const toggleOverlay = useConfiguratorUIStore((s) => s.toggleOverlay);
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);

  // Global settings
  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);
  const manufacturingToleranceMm = useGlobalSettingsStore((s) => s.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((s) => s.laserKerfMm);

  // Scale store
  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);
  const setSelectedScaleKind = useScaleStore((s) => s.setSelectedScaleKind);
  const scalePreviewEnabled = useScaleStore((s) => s.previewEnabled);
  const setScalePreviewEnabled = useScaleStore((s) => s.setPreviewEnabled);

  // Parametric adjustment state for active component
  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;
  const [paramDiameter, setParamDiameter] = useState<number>(
    activePart?.dimensions.diameterMm ?? 28.5
  );

  // Calculate valid limits for dial/case (e.g. dial diameter must be within 27.0mm - 29.5mm for standard 38-42mm case)
  const isDial = activePart?.category === 'dial' || activePartInstanceId === 'inst-dial';
  const minValidDial = 27.5;
  const maxValidDial = 29.0;
  const isDiameterInvalid = isDial && (paramDiameter < minValidDial || paramDiameter > maxValidDial);

  const handleSetNearestValid = () => {
    if (paramDiameter < minValidDial) setParamDiameter(minValidDial);
    else if (paramDiameter > maxValidDial) setParamDiameter(maxValidDial);
  };

  return (
    <div
      data-testid="advanced-mode-panel"
      className="flex flex-col h-full overflow-y-auto p-3 gap-4 text-xs text-slate-200"
    >
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
          <Sliders className="h-4 w-4 text-teal-400" />
          Advanced Engineering CAD
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Full parametric dimensions, scale generators, and deterministic clearance controls.
        </p>
      </div>

      {/* Engineering Overlays Toggles */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-teal-400" /> CAD Inspection Overlays
        </h4>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
          {(
            [
              ['datums', 'Datum Planes'],
              ['radii', 'Radii / Diameters'],
              ['fitBoundaries', 'Fit Boundaries'],
              ['clearances', 'Axial Clearances'],
              ['handStack', 'Hand Stack Height'],
              ['collisionZones', 'Interference Zones'],
              ['tolerances', 'Tolerances (±mm)']
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={overlays[key]}
                onChange={() => toggleOverlay(key)}
                className="rounded border-slate-700 text-teal-500 bg-slate-950 focus:ring-0"
              />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Component Parametric Dimensions */}
      {activePart && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-teal-400" /> Parametric Dimension Editor
          </h4>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">{activePart.name} Diameter:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={paramDiameter}
                  onChange={(e) => setParamDiameter(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-slate-100 focus:outline-none focus:border-teal-400"
                />
                <span className="text-slate-400 font-mono">mm</span>
              </div>
            </div>

            {/* Error correction warning if out of bounds */}
            {isDiameterInvalid && (
              <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 space-y-1">
                <div className="flex items-center gap-1 font-semibold">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Exceeds case dial seat boundary ({minValidDial}mm - {maxValidDial}mm)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSetNearestValid}
                  className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white font-medium text-[10px]"
                >
                  Set to nearest valid value ({paramDiameter < minValidDial ? minValidDial : maxValidDial}mm)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Engineering Geometry */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5 text-teal-400" /> Global Engineering Context
        </h4>
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Case Diameter:</span>
            <span className="font-mono text-slate-200">{caseDiameterMm} mm</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Manufacturing Tolerance:</span>
            <span className="font-mono text-slate-200">±{manufacturingToleranceMm} mm</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Laser Kerf:</span>
            <span className="font-mono text-slate-200">{laserKerfMm} mm</span>
          </div>
        </div>
      </div>

      {/* Slide Rule & Scale Generation Engine Links */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" /> Slide-Rule & Scales Engine
        </h4>
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Scale Type:</span>
            <select
              value={selectedScaleKind}
              onChange={(e) => setSelectedScaleKind(e.target.value as ScaleKind)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-400"
            >
              <option value="tachymeter">Tachymeter</option>
              <option value="slide-rule">E6B Slide Rule</option>
              <option value="telemetre">Telemeter</option>
              <option value="pulsometer">Pulsometer</option>
              <option value="decimal">Decimal Hours</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={scalePreviewEnabled}
              onChange={(e) => setScalePreviewEnabled(e.target.checked)}
              className="rounded border-slate-700 text-teal-500 bg-slate-950 focus:ring-0"
            />
            <span className="text-slate-300 text-xs">Enable Live Scale Dial Projection</span>
          </label>
        </div>
      </div>
    </div>
  );
};

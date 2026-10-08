import React from 'react';
import {
  Sliders,
  Ruler,
  Layers,
  Sparkles
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useGlobalSettingsStore } from '@/stores/globalSettingsStore';
import { useScaleStore } from '@/stores/scaleStore';
import { AviationSlideRulePanel } from '@/components/configurator/AviationSlideRulePanel';
import { ReferenceSlideRulePanel } from './ReferenceSlideRulePanel';

export const AdvancedModePanel: React.FC = () => {
  const overlays = useConfiguratorUIStore((s) => s.overlays);
  const toggleOverlay = useConfiguratorUIStore((s) => s.toggleOverlay);
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);

  // Global settings
  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);
  const setCaseDiameter = useGlobalSettingsStore((s) => s.setCaseDiameter);
  const manufacturingToleranceMm = useGlobalSettingsStore((s) => s.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((s) => s.laserKerfMm);

  // Scale store
  const scalePreviewEnabled = useScaleStore((s) => s.previewEnabled);
  const setScalePreviewEnabled = useScaleStore((s) => s.setPreviewEnabled);
  const referenceDesign = useScaleStore((s) => s.pluginConfig.referenceDesign);

  // Parametric adjustment state for active component
  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;
  const paramDiameter = activePart?.dimensions.diameterMm ?? 28.5;
  const setParamDiameter = (diameterMm: number) => {
    if (!activePart || !Number.isFinite(diameterMm) || diameterMm <= 0) return;
    useWatchAssemblyStore.getState().updatePart(activePart.instanceId, {
      dimensions: { ...activePart.dimensions, diameterMm },
      parametricGeometry: undefined,
      geometryProvenance: undefined
    });
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
                disabled={key !== 'datums' && key !== 'radii'}
                checked={overlays[key]}
                onChange={() => toggleOverlay(key)}
                className="rounded border-slate-700 text-teal-500 bg-slate-950 focus:ring-0"
              />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-amber-200">Datum and radius guides are schematic, not measured fit evidence. Disabled inspection layers are not implemented yet.</p>
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
                  aria-label={`${activePart.name} diameter in millimetres`}
                  min="0.1"
                  step="0.1"
                  value={paramDiameter}
                  onChange={(e) => setParamDiameter(Number(e.target.value))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-slate-100 focus:outline-none focus:border-teal-400"
                />
                <span className="text-slate-400 font-mono">mm</span>
              </div>
            </div>

            {/* Error correction warning if out of bounds */}
            <p className="text-[10px] text-amber-200">Edits the physical component. Check Details for interface compatibility; no universal dial-size limit or automatic fit approval is assumed.</p>
          </div>
        </div>
      )}

      {/* Global Engineering Geometry */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5 text-teal-400" /> Global Engineering Context
        </h4>
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
          <label className="flex items-center justify-between gap-3 text-slate-300">
            <span>Case Diameter:</span>
            <span className="flex items-center gap-1 font-mono text-slate-200">
              <input
                type="number"
                min="20"
                max="60"
                step="0.1"
                aria-label="Case diameter in millimetres"
                className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right font-mono text-slate-100 focus:border-teal-400 focus:outline-none"
                value={caseDiameterMm}
                onChange={(event) => setCaseDiameter(Number(event.target.value))}
              />
              mm
            </span>
          </label>
          <p className="text-[10px] leading-relaxed text-slate-400">
            This is the master case size. Fixed-size HD GLBs are used only at their authored diameter; other sizes switch to the scalable procedural preview.
          </p>
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
          <AviationSlideRulePanel />
          <ReferenceSlideRulePanel />
          {(!referenceDesign || referenceDesign === 'simplified') && <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={scalePreviewEnabled}
              onChange={(e) => setScalePreviewEnabled(e.target.checked)}
              className="rounded border-slate-700 text-teal-500 bg-slate-950 focus:ring-0"
            />
            <span className="text-slate-300 text-xs">Enable Live Scale Dial Projection</span>
          </label>}
        </div>
      </div>
    </div>
  );
};

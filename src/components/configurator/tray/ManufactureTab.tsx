import React from 'react';
import { Factory, Scissors } from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useGlobalSettingsStore } from '@/stores/globalSettingsStore';

export const ManufactureTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);

  const manufacturingToleranceMm = useGlobalSettingsStore((s) => s.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((s) => s.laserKerfMm);
  const minimumLineWidthMm = useGlobalSettingsStore((s) => s.minimumLineWidthMm);

  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-4" data-testid="manufacture-tab">
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-200">
          Manufacturing & Tolerances: {activePart?.name ?? 'Part'}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Tolerances and toolpath offsets for CNC milling, laser cutting, and electro-plating.
        </p>
      </div>

      {/* Fabrication Settings */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Factory className="h-3.5 w-3.5 text-teal-400" /> Precision Constraints
        </h4>
        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">CNC Machining Tolerance:</span>
            <span className="font-mono text-slate-200">±{manufacturingToleranceMm} mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Laser Spot / Kerf Width:</span>
            <span className="font-mono text-slate-200">{laserKerfMm} mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Minimum Line Width:</span>
            <span className="font-mono text-slate-200">{minimumLineWidthMm} mm</span>
          </div>
        </div>
      </div>

      {/* Production Routes */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Scissors className="h-3.5 w-3.5 text-teal-400" /> Fabrication Methods
        </h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <h5 className="font-semibold text-slate-200">Bespoke CNC Milling</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              5-axis precision milling for 316L / Titanium case bodies and dials.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <h5 className="font-semibold text-slate-200">Pad Printing & Lume Application</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              Cliché plate transfer with Super-LumiNova BGW9 / C3 horological compounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

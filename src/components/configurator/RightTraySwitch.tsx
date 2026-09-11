import React, { useState } from 'react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { RightTray } from './RightTray';
import { AdvancedModePanel } from './AdvancedModePanel';
import { StarterBuildPanel } from './StarterBuildPanel';
import { RightInspector } from '@/components/layout/RightInspector';
import { Sliders, Layers } from 'lucide-react';

export const RightTraySwitch: React.FC = () => {
  const workMode = useConfiguratorUIStore((s) => s.workMode);
  const [showLegacyInspector, setShowLegacyInspector] = useState(false);

  if (workMode === 'build') {
    return (
      <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
        <StarterBuildPanel />
      </div>
    );
  }

  if (workMode === 'advanced') {
    return (
      <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
        {/* Toggle between Modern Advanced CAD and Full Legacy Inspector */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px]">
          <span className="font-mono text-teal-400 uppercase font-semibold">
            {showLegacyInspector ? 'Legacy CAD Inspector' : 'Advanced Engineering'}
          </span>
          <button
            type="button"
            onClick={() => setShowLegacyInspector(!showLegacyInspector)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            {showLegacyInspector ? <Sliders className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
            <span>{showLegacyInspector ? 'Modern CAD' : 'Full Legacy Bands'}</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {showLegacyInspector ? <RightInspector /> : <AdvancedModePanel />}
        </div>
      </div>
    );
  }

  // For 'parts', 'style', 'research', 'bom', 'manufacture', 'review'
  return <RightTray />;
};

import React, { useState } from 'react';
import { Hammer, ChevronDown, ChevronUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { createStarterBuild, type StarterBuildType } from '@/domain/configurator/defaultBuilds';

export const StarterBuildPanel: React.FC = () => {
  const [selectedType, setSelectedType] = useState<StarterBuildType>('diver');
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);

  const setWorkMode = useConfiguratorUIStore((s) => s.setWorkMode);
  const saveVersion = useConfiguratorUIStore((s) => s.saveVersion);
  const starter = createStarterBuild(selectedType);

  const handleApplyStarter = () => {
    // Snapshot current before loading
    saveVersion(`Pre-starter backup`);
    useWatchAssemblyStore.getState().setAssembly(starter.assembly);
    setWorkMode('parts');
  };

  return (
    <div
      data-testid="starter-build-panel"
      className="flex flex-col h-full overflow-y-auto p-4 gap-4 text-xs text-slate-200"
    >
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
          <Hammer className="h-4 w-4 text-teal-400" />
          Starter Build Configurations
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Practical baseline builds emphasizing broad physical compatibility and high supplier availability.
        </p>
      </div>

      {/* Watch Type Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
          Select Watch Archetype
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(['diver', 'pilot', 'dress', 'field', 'chronograph'] as StarterBuildType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`p-2 rounded-lg border capitalize text-xs font-medium transition-all ${
                selectedType === type
                  ? 'bg-teal-950/80 border-teal-400 text-teal-300 ring-1 ring-teal-400/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Best-Value Starter Description */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <h4 className="font-semibold text-slate-100">{starter.title}</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            VERIFIED SPEC
          </span>
        </div>
        <p className="text-[11px] text-slate-400">{starter.description}</p>

        {/* Why this part? Explanations */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-300 block">
            Component Breakdown & Reasoning:
          </span>
          {starter.partExplanations.map((exp) => {
            const isExpanded = expandedPartId === exp.partInstanceId;

            return (
              <div
                key={exp.partInstanceId}
                className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
              >
                <div
                  onClick={() => setExpandedPartId(isExpanded ? null : exp.partInstanceId)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold text-slate-200">{exp.componentName}</span>
                  <div className="flex items-center gap-1 text-[10px] text-teal-400 font-mono">
                    <span>Why this part?</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </div>

                {isExpanded && (
                  <ul className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 list-disc list-inside space-y-1">
                    {exp.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleApplyStarter}
          className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md mt-2"
        >
          <span>Load {starter.title} into Configurator</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

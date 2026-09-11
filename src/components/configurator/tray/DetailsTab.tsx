import React, { useMemo } from 'react';
import { Ruler, ShieldCheck, FileText } from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { evaluateCandidate } from '@/domain/compatibility/compatibilityEngine';

export const DetailsTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const catalogueItems = useCatalogueStore((s) => s.items);

  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;
  const catItem = catalogueItems.find((c) => c.id === activePart?.catalogueItemId);

  const candidateEvaluation = useMemo(() => {
    if (!activePartInstanceId || !catItem) return null;
    return evaluateCandidate({
      assembly,
      targetPartInstanceId: activePartInstanceId,
      candidateCatalogueItemId: catItem.id,
      candidateItem: catItem
    });
  }, [assembly, activePartInstanceId, catItem]);

  if (!activePart) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        Select a component to inspect engineering specifications and tolerance data.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-4 font-sans" data-testid="details-tab">
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-200">{activePart.name}</h3>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          Instance: {activePart.instanceId} · Catalogue: {activePart.catalogueItemId}
        </p>
      </div>

      {/* Engineering Dimensions */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5 text-teal-400" /> Nominal Geometry
        </h4>
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Diameter:</span>
            <span className="font-mono text-slate-200">{activePart.dimensions.diameterMm} mm</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Thickness:</span>
            <span className="font-mono text-slate-200">{activePart.dimensions.thicknessMm} mm</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Radial Width:</span>
            <span className="font-mono text-slate-200">{activePart.dimensions.widthMm} mm</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Material:</span>
            <span className="capitalize text-slate-200">{activePart.material}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Texture/Finish:</span>
            <span className="capitalize text-slate-200">{activePart.texture}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Category:</span>
            <span className="capitalize text-slate-200">{activePart.category}</span>
          </div>
        </div>
      </div>

      {/* Engineering Specs */}
      {catItem?.engineeringSpecs && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-teal-400" /> Calibre & Mating Specs
          </h4>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
            {Object.entries(catItem.engineeringSpecs).map(([specKey, specVal]) => (
              <div key={specKey} className="border-b border-slate-800/60 pb-1 last:border-0 last:pb-0">
                <span className="text-[10px] text-teal-400 uppercase block">{specKey}:</span>
                <pre className="text-[10px] text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(specVal, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Diagnostics & Evidence */}
      {candidateEvaluation && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" /> Physical Compatibility Diagnostics
          </h4>
          <div className="space-y-1.5">
            {candidateEvaluation.checks.map((check, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-slate-900 border border-slate-800 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">{check.code}</span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      check.status === 'green'
                        ? 'text-emerald-400'
                        : check.status === 'yellow'
                          ? 'text-amber-400'
                          : check.status === 'red'
                            ? 'text-rose-400'
                            : 'text-amber-300'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
                <p className="text-slate-200 text-[11px]">{check.summary}</p>
                {check.evidence && check.evidence.length > 0 && (
                  <ul className="text-[10px] text-slate-400 list-disc list-inside">
                    {check.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
